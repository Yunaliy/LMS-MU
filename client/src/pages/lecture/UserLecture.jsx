import React, { useEffect, useState } from "react";
import "./lecture.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { server } from "../../config";
import Loading from "../../components/Loading";
import toast from "react-hot-toast";
import { TiTick } from "react-icons/ti";
import { FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileAudio, FaPlay, FaDownload, FaExpand, FaGraduationCap, FaArrowLeft, FaTimes, FaBars, FaCheck } from "react-icons/fa";
import YouTube from 'react-youtube';
import LectureHeader from "../../components/header/LectureHeader";
import confetti from 'canvas-confetti';
import { UserData } from "../../context/UserContext";

const UserLecture = ({ initialLectureId, isAdmin }) => {
  const { user } = UserData();
  const [lectures, setLectures] = useState([]);
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lecLoading, setLecLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [courseTitle, setCourseTitle] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [completedLec, setCompletedLec] = useState(0);
  const [lectLength, setLectLength] = useState(0);
  const [progress, setProgress] = useState([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const params = useParams();
  const navigate = useNavigate();

  const triggerCelebration = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    let timeoutId;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff0000', '#00ff00', '#0000ff'],
      });

      if (Date.now() < animationEnd) {
        timeoutId = setTimeout(frame, 250);
      }
    };

    frame();
    toast.success("Congratulations! You've completed all lectures! 🎉");

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  };

  useEffect(() => {
    if (!params.id) {
      toast.error("Course ID is missing");
      navigate("/dashboard");
      return;
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [lecturesResponse, courseResponse] = await Promise.all([
          axios.get(`${server}/api/lectures/${params.id}`, {
            headers: {
              token: localStorage.getItem("token"),
            },
          }),
          axios.get(`${server}/api/course/${params.id}`, {
            headers: {
              token: localStorage.getItem("token"),
            },
          })
        ]);

        setLectures(lecturesResponse.data.lectures);
        setLectLength(lecturesResponse.data.lectures.length);
        setCourseTitle(courseResponse.data.course.title);

        if (initialLectureId) {
          await fetchLecture(initialLectureId);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load course data");
        setLoading(false);
        navigate("/dashboard");
      }
    };

    fetchInitialData();
  }, [params.id, navigate]);

  useEffect(() => {
    if (lectures.length > 0) {
      fetchProgress();
    }
  }, [lectures]);

  useEffect(() => {
    if (lecture?._id && progress[0]?.completedLectures) {
      setIsCompleted(progress[0].completedLectures.includes(lecture._id));
    } else {
      setIsCompleted(false);
    }
  }, [lecture, progress]);

  const fetchProgress = async () => {
    try {
      const { data } = await axios.get(
        `${server}/api/user/progress?course=${params.id}`,
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );

      const totalLectures = lectures.length;
      setLectLength(totalLectures);

      if (data.message === "null" || !data.progress || !data.progress[0]) {
        setCompleted(0);
        setCompletedLec(0);
        setProgress([]);
        setProgressPercentage(0);
        setIsCompleted(false);
        return;
      }

      const progressData = data.progress[0];
      const completedLecturesList = progressData.completedLectures || [];
      const completedCount = completedLecturesList.length;

      setCompletedLec(completedCount);
      setProgress(data.progress);

      if (lecture?._id) {
        setIsCompleted(completedLecturesList.includes(lecture._id));
      } else {
        setIsCompleted(false);
      }

      let percentage = 0;
      if (totalLectures > 0) {
        percentage = Math.min(Math.round((completedCount / totalLectures) * 100), 100);
      }

      setCompleted(percentage);
      setProgressPercentage(percentage);

      // Check if all lectures are completed and trigger celebration
      if (completedCount === totalLectures && totalLectures > 0 && completedCount > completedLec) {
        triggerCelebration();
      }

    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error("Failed to load progress");
      setCompleted(0);
      setCompletedLec(0);
      setProgress([]);
      setProgressPercentage(0);
      setIsCompleted(false);
    }
  };

  const fetchLecture = async (id) => {
    setLecLoading(true);
    try {
      const { data } = await axios.get(`${server}/api/lecture/${id}`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      setLecture(data.lecture);
      setLecLoading(false);
    } catch (error) {
      console.error("Error fetching lecture:", error);
      toast.error("Failed to load lecture details");
      setLecLoading(false);
    }
  };

  const handleLectureCompletion = async (lectureId) => {
    try {
      const response = await axios.post(
        `${server}/api/user/progress?course=${params.id}&lectureId=${lectureId}`,
        {},
        {
          headers: {
            token: localStorage.getItem("token")
          }
        }
        );

      if (response.data.success) {
        setIsCompleted(true);
        toast.success('Lecture marked as complete!');
        await fetchProgress(); // Refresh progress data
      } else {
        throw new Error(response.data.message || 'Failed to update progress');
      }
      } catch (error) {
      console.error('Error updating progress:', error);
      toast.error(error.response?.data?.message || 'Failed to update progress. Please try again.');
    }
  };

  const handleBack = () => {
    navigate(`/course/study/${params.id}`);
  };

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const handleLectureClick = async (selectedLectureId) => {
    if (selectedLectureId === lecture?._id) return; // Prevent reloading if same lecture
    
    try {
      setLecLoading(true);
      await fetchLecture(selectedLectureId);
      setLecLoading(false);
    } catch (error) {
      console.error("Error loading lecture:", error);
      toast.error("Failed to load lecture");
      setLecLoading(false);
    }
  };

  const renderFilePreview = () => {
    if (!lecture) return null;

    if (lecture.videoSource === 'youtube' && lecture.youtubeVideoId) {
      return (
        <div className="video-container">
          <YouTube
            videoId={lecture.youtubeVideoId}
            className="preview-video"
            opts={{
              playerVars: {
                autoplay: 0,
                controls: 1,
                modestbranding: 1,
                rel: 0
              }
            }}
            onEnd={() => handleLectureCompletion(lecture._id)}
          />
        </div>
      );
    } else if (lecture.fileUrl) {
      return (
        <div className="video-container">
            <video
            className="preview-video"
              controls
            src={`${server}/uploads/${lecture.fileUrl}`}
                onEnded={() => handleLectureCompletion(lecture._id)}
          />
        </div>
      );
    }

    return null;
  };

  if (loading) return <Loading />;

  return (
    <div className="lecture-container">
      <LectureHeader 
        title={courseTitle} 
        progressPercentage={progressPercentage} 
        onBack={handleBack}
      />
      
      <div className="lecture-content">
        <button 
          className={`toggle-panel-btn ${isPanelOpen ? 'open' : ''}`} 
          onClick={togglePanel}
        >
          {isPanelOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`lecture-panel ${isPanelOpen ? 'open' : ''}`}>
          <div className="panel-header">
            <h3>Course Content</h3>
          </div>

          <div className="lecture-list">
            {lectures.map((item, index) => (
              <div
                key={item._id}
                className={`lecture-item ${item._id === lecture?._id ? 'active' : ''}`}
                onClick={() => handleLectureClick(item._id)}
              >
                <div className="lecture-item-content">
                  <span className="lecture-number">{index + 1}</span>
                  <div className="lecture-details">
                    <h4>{item.title}</h4>
                    {item.duration && (
                      <span className="lecture-duration">
                        {item.duration}
                      </span>
                    )}
                  </div>
                </div>
                {progress[0]?.completedLectures?.includes(item._id) && (
                  <div className="completion-status">
                    <TiTick className="completed-icon" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`lecture-main ${isPanelOpen ? 'with-panel' : ''}`}>
          {lecLoading ? (
            <Loading />
          ) : lecture ? (
            <>
              {renderFilePreview()}
              <div className="lecture-title-container">
                <h2 className="lecture-title">{lecture.title}</h2>
                <div className="completion-checkbox">
                  <input
                    type="checkbox"
                    id="lecture-complete"
                    checked={isCompleted}
                    onChange={() => handleLectureCompletion(lecture._id)}
                  />
                  <label htmlFor="lecture-complete">Mark as complete</label>
                  </div>
              </div>
            </>
          ) : (
            <div className="no-lecture-selected">
              <h3>Select a lecture to begin</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserLecture; 