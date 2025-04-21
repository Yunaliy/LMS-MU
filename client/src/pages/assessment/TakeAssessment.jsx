import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../config";
import toast from "react-hot-toast";
import { FaClock, FaCheckCircle, FaTimesCircle, FaLock } from "react-icons/fa";

const TakeAssessment = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            submitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft]);

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
        setAnswers(new Array(data.assessment.questions.length).fill(null));
        setTimeLeft(data.assessment.timeLimit * 60);
        setLoading(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch assessment");
      navigate(`/course/${courseId}`);
    }
  };

  const handleAnswer = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const submitAssessment = async () => {
    if (submitting) return;

    // Check if all questions are answered
    if (answers.some((answer) => answer === null)) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `${server}/api/assessment/course/${courseId}/submit`,
        { answers },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      if (data.success) {
        if (!data.passed) {
          // Store the attempt time for failed attempts
          localStorage.setItem(`assessment_${courseId}_lastAttempt`, Date.now().toString());
          setLastAttemptTime(Date.now());
          setCanRetry(false);
          setRetryTimeLeft(600); // 10 minutes in seconds
        }

        toast.success(
          `Assessment submitted! Score: ${data.score}% (${
            data.passed ? "Passed" : "Failed"
          })`
        );
        
        // Only redirect if passed
        if (data.passed) {
          setTimeout(() => {
            navigate(`/course/study/${courseId}`);
          }, 2000);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit assessment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="alert alert-warning">No assessment found</div>
      </div>
    );
  }

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
      <div className="container py-5">
        <div className="card shadow-sm">
          <div className="card-body text-center">
            <FaTimesCircle className="display-1 text-danger mb-3" />
            <h2 className="card-title mb-3">Assessment Not Passed</h2>
            <p className="card-text mb-4">
              You scored {assessmentStatus.score}%. You need to score at least 50% to pass.
            </p>
            {!canRetry ? (
              <div className="retry-timer mb-4">
                <p className="text-warning">
                  You can retry in: {Math.floor(retryTimeLeft / 60)}:
                  {(retryTimeLeft % 60).toString().padStart(2, '0')}
                </p>
              </div>
            ) : (
              <button
                className="btn btn-primary me-3"
                onClick={() => {
                  setHasAttempted(false);
                  fetchAssessment();
                }}
              >
                Retry Assessment
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/course/study/${courseId}`)}
            >
              Return to Course
            </button>
          </div>
        </div>
      </div>
    );
  } else if (hasAttempted && assessmentStatus.isPassed) {
    return (
      <div className="container py-5">
        <div className="card shadow-sm">
          <div className="card-body text-center">
            <FaCheckCircle className="display-1 text-success mb-3" />
            <h2 className="card-title mb-3">Assessment Passed!</h2>
            <p className="card-text mb-4">
              Congratulations! You have successfully passed the assessment.
            </p>
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="take-assessment">
      <div className="assessment-header">
        <h2 className="mb-3">{assessment.title}</h2>
        <p className="lead mb-4">{assessment.description}</p>
        <div className="time-remaining">
          <FaClock className="me-2" />
          Time Remaining: {formatTime(timeLeft)}
        </div>
      </div>

      <div className="questions">
        {assessment.questions.map((question, qIndex) => (
          <div key={qIndex} className="question">
            <h3 className="mb-4">
              Question {qIndex + 1} of {assessment.questions.length}
            </h3>
            <p className="lead mb-4">{question.question}</p>
            <div className="options">
              {question.options.map((option, oIndex) => (
                <div
                  key={oIndex}
                  className={`option ${
                    answers[qIndex] === oIndex ? "selected" : ""
                  }`}
                  onClick={() => handleAnswer(qIndex, oIndex)}
                >
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      name={`question-${qIndex}`}
                      checked={answers[qIndex] === oIndex}
                      onChange={() => handleAnswer(qIndex, oIndex)}
                    />
                    <label className="form-check-label">{option}</label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="assessment-footer">
        <button
          className="btn btn-primary btn-lg submit-btn"
          onClick={submitAssessment}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Submitting...
            </>
          ) : (
            "Submit Assessment"
          )}
        </button>
      </div>
    </div>
  );
};

export default TakeAssessment; 