import React, { useEffect, useState } from "react";
import "./lecture.css";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { BsChevronLeft } from "react-icons/bs";


const UserLecture = ({ initialLectureId, isAdmin }) => {
  const [searchParams] = useSearchParams();
  const urlLectureId = searchParams.get('lectureId');
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
  const [videoTimestamp, setVideoTimestamp] = useState(0);
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
        const [lecturesResponse, courseResponse, progressResponse] = await Promise.all([
          axios.get(`${server}/api/lectures/${params.id}`, {
            headers: {
              token: localStorage.getItem("token"),
            },
          }),
          axios.get(`${server}/api/course/${params.id}`, {
            headers: {
              token: localStorage.getItem("token"),
            },
          }),
          axios.get(`${server}/api/user/progress?course=${params.id}`, {
            headers: {
              token: localStorage.getItem("token"),
            },
          })
        ]);

        setLectures(lecturesResponse.data.lectures);
        setLectLength(lecturesResponse.data.lectures.length);
        setCourseTitle(courseResponse.data.course.title);

        // Determine which lecture to load
        let targetLectureId = urlLectureId || initialLectureId;
        
        if (!targetLectureId && lecturesResponse.data.lectures.length > 0) {
          // If no specific lecture is requested, use the first one
          targetLectureId = lecturesResponse.data.lectures[0]._id;
        }

        // If there's progress data and a last watched lecture, use that
        if (progressResponse.data.progress?.[0]?.lastWatchedLecture) {
          const lastWatched = progressResponse.data.progress[0].lastWatchedLecture;
          targetLectureId = lastWatched.lectureId;
          setVideoTimestamp(lastWatched.timestamp || 0);
        }

        if (targetLectureId) {
          await fetchLecture(targetLectureId);
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
  }, [params.id, navigate, urlLectureId, initialLectureId]);

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

  // Add function to save video progress
  const saveVideoProgress = async (currentTime) => {
    if (!lecture?._id) return;

    try {
      await axios.post(
        `${server}/api/user/progress/update`,
        {
          courseId: params.id,
          lectureId: lecture._id,
          timestamp: currentTime
        },
        {
          headers: {
            token: localStorage.getItem("token"),
          },
        }
      );
    } catch (error) {
      console.error("Error saving video progress:", error);
    }
  };

  // Update the video player to handle time updates
  const handleTimeUpdate = (event) => {
    const currentTime = event.target.currentTime;
    // Save progress every 30 seconds
    if (Math.floor(currentTime) % 30 === 0) {
      saveVideoProgress(currentTime);
    }
  };

  const renderFilePreview = () => {
    if (!lecture) return null;

    if (lecture.videoSource === 'youtube' && lecture.youtubeVideoId) {
      return (
        <div className="video-container">
          <div className="video-letterbox">
          <YouTube
            videoId={lecture.youtubeVideoId}
            className="preview-video"
            opts={{
              playerVars: {
                  autoplay: 1,
                controls: 1,
                modestbranding: 1,
                  rel: 0,
                  start: Math.floor(videoTimestamp)
              }
            }}
            onEnd={() => handleLectureCompletion(lecture._id)}
              onStateChange={(event) => {
                if (event.data === 1) { // Video is playing
                  const currentTime = event.target.getCurrentTime();
                  saveVideoProgress(currentTime);
                }
              }}
          />
          </div>
        </div>
      );
    } else if (lecture.file) {
      const filePath = lecture.file.startsWith('uploads/') ? lecture.file : `uploads/${lecture.file}`;
      return (
        <div className="video-container">
          <div className="video-letterbox">
            <video
            className="preview-video"
              controls
              src={`${server}/${filePath}`}
                onEnded={() => handleLectureCompletion(lecture._id)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={(e) => {
                if (videoTimestamp > 0) {
                  e.target.currentTime = videoTimestamp;
                }
              }}
          />
          </div>
        </div>
      );
    }

    return null;
  };

  if (loading) return <Loading />;

  return (
    <div className="lecture-udemy-layout d-flex" style={{ minHeight: '100vh', background: 'var(--bs-body-bg, #f5f5f5)' }}>
      {/* Sidebar (right) */}
      {isPanelOpen && (
        <div
          className={`lecture-panel-udemy open d-flex flex-column`}
          style={{
            position: 'fixed',
            right: 0,
            top: 0,
            height: '100vh',
            width: 340,
            maxWidth: '100vw',
            background: 'var(--bs-body-bg, #fff)',
            boxShadow: 'rgba(0,0,0,0.08) -2px 0 8px',
            zIndex: 1200,
            transition: 'transform 0.3s',
            transform: 'translateX(0)',
          }}
        >
          {/* Sticky Header */}
          <div className="panel-header sticky-top d-flex align-items-center justify-content-between px-3 py-2" style={{ background: 'var(--bs-body-bg, #fff)', borderBottom: '1px solid #e1e1e1', zIndex: 2 }}>
            <span className="fw-bold">Course content</span>
        <button 
              className="btn btn-link p-0 ms-2 lecture-panel-close-btn"
              style={{ fontSize: 22, color: 'var(--bs-body-color, #333)' }}
          onClick={togglePanel}
              aria-label="Close sidebar"
            >
              <FaTimes />
        </button>
          </div>
          {/* Scrollable Lecture List */}
          <div className="lecture-list flex-grow-1 overflow-auto px-2" style={{ minHeight: 0 }}>
            {lectures.map((item, index) => (
              <div
                key={item._id}
                className={`lecture-item ${item._id === lecture?._id ? 'active' : ''}`}
                onClick={() => handleLectureClick(item._id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="lecture-item-content d-flex align-items-center">
                  <span className="lecture-number">{index + 1}</span>
                  <div className="lecture-details flex-grow-1">
                    <h4>{item.title}</h4>
                    {item.duration && (
                      <span className="lecture-duration">{item.duration}</span>
                    )}
                </div>
                {progress[0]?.completedLectures?.includes(item._id) && (
                  <div className="completion-status">
                    <TiTick className="completed-icon" />
                  </div>
                )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Main Content (left) */}
      <div
        className={`flex-grow-1 lecture-main-content ${isPanelOpen ? 'with-panel' : 'no-panel'}`}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-right 0.3s',
          marginRight: isPanelOpen ? 340 : 56,
          marginLeft: 0,
        }}
      >
        <LectureHeader 
          title={courseTitle} 
          progressPercentage={progressPercentage} 
          onBack={handleBack}
        />
        <div className="flex-grow-1 d-flex flex-column" style={{ overflowY: 'auto', marginTop: 60 }}>
          {/* Right toggle button when panel is closed */}
          {!isPanelOpen && (
            <button
              className="lecture-panel-toggle-btn btn btn-light right-toggle"
              style={{
                position: 'fixed',
                right: 0,
                top: '50%',
                zIndex: 1300,
                borderTopLeftRadius: 20,
                borderBottomLeftRadius: 20,
                border: '1px solid #e1e1e1',
                boxShadow: 'rgba(0,0,0,0.08) -2px 0 8px',
                padding: '8px 12px',
                transform: 'translateY(-50%)',
                background: 'var(--bs-body-bg, #fff)',
                color: 'var(--bs-body-color, #333)'
              }}
              onClick={togglePanel}
              aria-label="Open sidebar"
            >
              <FaArrowLeft />
            </button>
          )}
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