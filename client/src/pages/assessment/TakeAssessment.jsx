import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../config";
import toast from "react-hot-toast";
import { FaClock, FaCheckCircle, FaTimesCircle, FaLock } from "react-icons/fa";
import Loading from "../../components/Loading";
import "./TakeAssessment.css";

const TakeAssessment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [lectureProgress, setLectureProgress] = useState({
    completed: 0,
    total: 0,
    isCompleted: false
  });
  const [hasAttempted, setHasAttempted] = useState(false);
  const [assessmentStatus, setAssessmentStatus] = useState({
    isPassed: false,
    score: 0
  });
  const [lastAttemptTime, setLastAttemptTime] = useState(null);
  const [canRetry, setCanRetry] = useState(true);
  const [retryTimeLeft, setRetryTimeLeft] = useState(0);

  useEffect(() => {
    checkLectureProgress();
    fetchAssessment();
    checkAssessmentStatus();
    checkRetryStatus();
  }, [courseId]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
        if (prev <= 1 && !submitted) {
          handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  useEffect(() => {
    if (retryTimeLeft > 0) {
      const timer = setInterval(() => {
        setRetryTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanRetry(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [retryTimeLeft]);

  const checkLectureProgress = async () => {
    try {
      // Get total lectures count first
      const lecturesResponse = await axios.get(
        `${server}/api/lectures/${courseId}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      const totalLectures = lecturesResponse.data.lectures.length;

      // Get user progress
      const { data } = await axios.get(
        `${server}/api/user/progress?course=${courseId}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      // Get completed lectures count, ensuring it doesn't exceed total lectures
      const completedLectures = Math.min(
        data.progress?.[0]?.completedLectures?.length || 0,
        totalLectures
      );

      setLectureProgress({
        completed: completedLectures,
        total: totalLectures,
        isCompleted: completedLectures === totalLectures && totalLectures > 0
      });
    } catch (error) {
      console.error("Error checking lecture progress:", error);
      toast.error("Failed to check lecture progress");
    }
  };

  const checkAssessmentStatus = async () => {
    try {
      const { data } = await axios.get(
        `${server}/api/assessment/status/${courseId}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      if (data.success) {
        setHasAttempted(data.message !== "Assessment not attempted yet");
        setAssessmentStatus({
          isPassed: data.isPassed,
          score: data.score || 0
        });
      }
    } catch (error) {
      console.error("Error checking assessment status:", error);
    }
  };

  const checkRetryStatus = () => {
    const lastAttempt = localStorage.getItem(`assessment_${courseId}_lastAttempt`);
    if (lastAttempt) {
      const timePassed = Date.now() - parseInt(lastAttempt);
      const waitTime = 5 * 60 * 1000; // 10 minutes in milliseconds
      
      if (timePassed < waitTime) {
        setCanRetry(false);
        setRetryTimeLeft(Math.ceil((waitTime - timePassed) / 1000));
      } else {
        setCanRetry(true);
        setRetryTimeLeft(0);
        // Clear the last attempt time if 10 minutes have passed
        localStorage.removeItem(`assessment_${courseId}_lastAttempt`);
      }
    }
  };

  const fetchAssessment = async () => {
    try {
      const { data } = await axios.get(
        `${server}/api/assessment/course/${courseId}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      if (data.success) {
        setAssessment(data.assessment);
        if (data.assessment.questions && data.assessment.questions.length > 0) {
          const initialAnswers = {};
          data.assessment.questions.forEach((_, index) => {
            initialAnswers[index] = null;
          });
          setAnswers(initialAnswers);
        }
        setTimeLeft(data.assessment.timeLimit * 60);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error("Failed to load assessment. Please try again.");
      navigate(`/course/study/${courseId}`);
    }
  };

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    const unansweredCount = Object.values(answers).filter(
      answer => answer === null
    ).length;

    if (unansweredCount > 0 && !window.confirm(
      `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit?`
    )) {
      return;
    }

    setSubmitting(true);
    try {
      const answersArray = assessment.questions.map((_, index) => answers[index]);
      
      const { data } = await axios.post(
        `${server}/api/assessment/course/${courseId}/submit`,
        { answers: answersArray },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      setSubmitted(true);
      setScore(data.score);

      if (data.passed) {
        toast.success("🎉 Congratulations! You've passed the assessment!");
        setTimeout(() => {
          navigate(`/course/study/${courseId}`);
        }, 3000);
      } else {
          localStorage.setItem(`assessment_${courseId}_lastAttempt`, Date.now().toString());
          setLastAttemptTime(Date.now());
          setCanRetry(false);
        setRetryTimeLeft(300);
        toast.error(
          "You did not pass the assessment. Please review the course material and try again in 5 minutes."
        );
      }
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast.error(error.response?.data?.message || "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (!assessment) return <div>Assessment not found</div>;

  // Only show the "Assessment Locked" message if:
  // 1. User hasn't completed all lectures AND
  // 2. User hasn't attempted the assessment yet
  if (!lectureProgress.isCompleted && !hasAttempted) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm">
          <div className="card-body text-center">
            <FaLock className="display-1 text-warning mb-3" />
            <h2 className="card-title mb-3">Assessment Locked</h2>
            <p className="card-text mb-4">
              Complete all lectures to unlock the assessment.
              <br />
              Progress: {lectureProgress.completed} of {lectureProgress.total} lectures completed
            </p>
            <div className="progress mb-4" style={{ height: "20px" }}>
              <div
                className="progress-bar bg-success"
                role="progressbar"
                style={{ width: `${(lectureProgress.completed / lectureProgress.total) * 100}%` }}
                aria-valuenow={lectureProgress.completed}
                aria-valuemin="0"
                aria-valuemax={lectureProgress.total}
              >
                {Math.round((lectureProgress.completed / lectureProgress.total) * 100)}%
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/course/study/${courseId}`)}
            >
              Return to Course
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If user has already attempted the assessment, show a message
  if (hasAttempted && !assessmentStatus.isPassed) {
    return (
      <div className="assessment-container">
        <div className="result-card failed">
          <FaTimesCircle className="result-icon" />
          <h2>Assessment Not Passed</h2>
          <p className="score">Your Score: {assessmentStatus.score}%</p>
          <p className="passing-requirement">Required to Pass: {assessment?.passingScore || 50}%</p>
          
            {!canRetry ? (
            <div className="retry-timer">
              <p className="retry-message">
                Please take some time to review the course material.
                You can retry the assessment in:
              </p>
              <div className="time-remaining">
                {Math.floor(retryTimeLeft / 60)}:{(retryTimeLeft % 60).toString().padStart(2, '0')}
              </div>
              </div>
            ) : (
              <button
              className="retry-btn"
                onClick={() => {
                  setHasAttempted(false);
                  fetchAssessment();
                }}
              >
                Retry Assessment
              </button>
            )}
          
            <button
            className="return-btn"
              onClick={() => navigate(`/course/study/${courseId}`)}
            >
              Return to Course
            </button>
        </div>
      </div>
    );
  } else if (hasAttempted && assessmentStatus.isPassed) {
    return (
      <div className="assessment-container">
        <div className="result-card passed">
          <FaCheckCircle className="result-icon" />
          <h2>Congratulations! 🎉</h2>
          <p className="score">Your Score: {assessmentStatus.score}%</p>
          <p className="success-message">
            You have successfully passed the assessment!
          </p>
          <p className="instruction-message">
            Please return to the course page to download your certificate.
            </p>
            <button
            className="return-btn"
              onClick={() => navigate(`/course/study/${courseId}`)}
            >
            Return to Get Certificate
            </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="assessment-container">
      <div className="assessment-header">
        <h1>{assessment.title}</h1>
        <div className="assessment-info">
        <div className="time-remaining">
            <FaClock />
            <span className={timeLeft < 60 ? 'time-critical' : ''}>
          Time Remaining: {formatTime(timeLeft)}
            </span>
          </div>
          <div className="question-count">
            Questions: {assessment.questions.length}
          </div>
          <div className="passing-score">
            Passing Score: {assessment.passingScore}%
          </div>
        </div>
      </div>

      <div className="questions-container">
        {assessment.questions.map((question, index) => (
          <div key={index} className="question-card">
            <div className="question-header">
              <span className="question-number">Question {index + 1}</span>
              {answers[index] !== null && (
                <FaCheckCircle className="answer-indicator answered" />
              )}
              {answers[index] === null && (
                <FaTimesCircle className="answer-indicator unanswered" />
              )}
            </div>
            <p className="question-text">{question.question}</p>
            <div className="options-grid">
              {question.options.map((option, optIndex) => (
                <label
                  key={optIndex}
                  className={`option-label ${
                    answers[index] === optIndex ? 'selected' : ''
                  }`}
                >
                    <input
                      type="radio"
                    name={`question-${index}`}
                    value={optIndex}
                    checked={answers[index] === optIndex}
                    onChange={(e) => handleAnswerChange(index, parseInt(e.target.value))}
                    disabled={submitted}
                    />
                  <span className="option-text">{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {submitted ? (
        <div className="submission-result">
          <h2>Assessment Completed</h2>
          <p>Your Score: {score}%</p>
          <p>
            {score >= assessment.passingScore
              ? 'Congratulations! You passed! 🎉'
              : 'Keep practicing and try again.'}
          </p>
        </div>
      ) : (
      <div className="assessment-footer">
        <button
            className="submit-btn"
            onClick={handleSubmit}
          disabled={submitting}
        >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
      )}
    </div>
  );
};

export default TakeAssessment; 