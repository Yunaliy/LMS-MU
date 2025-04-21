import React, { useEffect, useState, useRef } from "react";
import "./lecture.css";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { server } from "../../config";
import Loading from "../../components/Loading";
import toast from "react-hot-toast";
import { TiTick } from "react-icons/ti";
import { FaFilePdf, FaFileWord, FaFilePowerpoint, FaFileAudio, FaPlay, FaDownload, FaExpand, FaEdit, FaTrash } from "react-icons/fa";
import EditLectureModal from '../../components/EditLectureModal';
import YouTube from 'react-youtube';

const Lecture = ({ user }) => {
  const [lectures, setLectures] = useState([]);
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lecLoading, setLecLoading] = useState(false);
  const [show, setShow] = useState(false);
  const params = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState("");
  const [filePrev, setFilePrev] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [completedLec, setCompletedLec] = useState(0);
  const [lectLength, setLectLength] = useState(0);
  const [progress, setProgress] = useState([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [currentLecture, setCurrentLecture] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [videoSource, setVideoSource] = useState("local");
  const [youtubeVideoId, setYoutubeVideoId] = useState("");

  useEffect(() => {
    if (!params.id) {
      toast.error("Course ID is missing");
      navigate("/dashboard");
      return;
    }
    if (user && user.role !== "admin" && !user.subscription.includes(params.id)) {
      toast.error("You need to enroll in this course to access lectures");
      navigate("/");
      return;
    }
    fetchLectures();
  }, [user, params.id, navigate]);

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

  useEffect(() => {
    if (lecture?.file && lecture.fileType === 'video') {
      const cleanPath = lecture.file
        .split('\\')
        .join('/')
        .replace(/^\/+/, '')
        .replace(/^uploads\//, '');
      const fileUrl = `${server}/uploads/${cleanPath}`;
      
      checkVideoUrl(fileUrl).then(isValid => {
        if (!isValid) {
          console.error('Video URL is not accessible:', fileUrl);
          toast.error('Video file is not accessible');
        }
      });
    }
  }, [lecture]);

  async function fetchLectures() {
    try {
      setLoading(true);
      const { data } = await axios.get(`${server}/api/lectures/${params.id}`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      setLectures(data.lectures);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching lectures:", error);
      toast.error("Failed to load lectures");
      setLoading(false);
    }
  }

  async function fetchLecture(id) {
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
  }

  const changeFileHandler = (e) => {
    const file = e.target.files[0];
    
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File is too large. Maximum size is 100MB");
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = () => {
      setFilePrev(reader.result);
      setFile(file);
    };
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setBtnLoading(true);

    try {
      if (!params.id) {
        toast.error("Course ID is missing");
        return;
      }

      if (!title.trim() || !description.trim()) {
        toast.error("Title and description are required");
        return;
      }

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("videoSource", videoSource);

      if (videoSource === 'youtube') {
        if (!youtubeVideoId) {
          toast.error("YouTube Video ID is required");
          return;
        }
        formData.append("youtubeVideoId", youtubeVideoId);
      } else {
        if (!file) {
          toast.error("File is required for local upload");
          return;
        }
        formData.append("file", file);
      }

      const { data } = await axios.post(
        `${server}/api/course/${params.id}`,
        formData,
        {
          headers: {
            token: localStorage.getItem("token"),
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        setShow(false);
        
        // Reset form
        setTitle("");
        setDescription("");
        setFile("");
        setFilePrev("");
        setVideoSource("local");
        setYoutubeVideoId("");
        
        await fetchLectures();
      } else {
        throw new Error(data.message || "Failed to add lecture");
      }
    } catch (error) {
      console.error("Error adding lecture:", error);
      toast.error(error.response?.data?.message || "Failed to add lecture");
    } finally {
      setBtnLoading(false);
    }
  };

  const deleteHandler = async (id) => {
    if (window.confirm("Are you sure you want to delete this lecture?")) {
      try {
        const { data } = await axios.delete(`${server}/api/lecture/${id}`, {
          headers: {
            token: localStorage.getItem("token"),
          },
        });

        toast.success(data.message);
        if (lecture?._id === id) {
          setLecture(null);
          setCurrentLecture(null);
        }
        await fetchLectures();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(error.response?.data?.message || "Error deleting lecture");
      }
    }
  };

  async function fetchProgress() {
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
        document.documentElement.style.setProperty('--progress-percentage', '0');
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
      document.documentElement.style.setProperty('--progress-percentage', `${percentage}%`);

      console.log('Progress Update:', {
        completedLectures: completedCount,
        totalLectures,
        percentage,
        progressData: progressData
      });

    } catch (error) {
      console.error('Error fetching progress:', error);
      toast.error("Failed to load progress");
      setCompleted(0);
      setCompletedLec(0);
      setLectLength(lectures.length);
      setProgressPercentage(0);
      setProgress([]);
      document.documentElement.style.setProperty('--progress-percentage', '0');
      setIsCompleted(false);
    }
  }

  const updateBackendProgress = async (id) => {
    try {
      const { data } = await axios.post(
        `${server}/api/user/progress?course=${params.id}&lectureId=${id}`,
        {},
        { headers: { token: localStorage.getItem("token") } }
      );

      if (data.success) {
        await fetchProgress();
      } else {
         throw new Error(data.message || "Backend reported failure");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error(error.response?.data?.message || "Failed to update progress");
    }
  };

  const handleLectureCompletion = (lectureId) => {
    if (!lectureId) {
      console.warn("Cannot mark completion: Missing lecture ID.");
      return;
    }

    const alreadyCompleted = progress[0]?.completedLectures?.includes(lectureId) || false;

    if (!alreadyCompleted) {
      console.log(`Marking lecture ${lectureId} as complete.`);
      updateBackendProgress(lectureId);
    } else {
      console.log(`Lecture ${lectureId} already marked as complete.`);
    }
  };

  const renderFilePreview = () => {
    if (!lecture) return null;

    const getFileUrl = (filePath) => {
      const cleanPath = filePath
        .replace(/^.*[\/\\]uploads[\/\\]/, '')
        .replace(/\\/g, '/')
        .replace(/^\/+/, '')
        .replace(/^uploads\//, '');
      return `${server}/uploads/${cleanPath}`;
    };

    if (lecture.fileType === 'video') {
      if (lecture.videoSource === 'youtube') {
        return (
          <div className="video-container">
            <YouTube
              videoId={lecture.youtubeVideoId}
              opts={{
                height: '390',
                width: '100%',
                playerVars: {
                  autoplay: 0,
                  controls: 1,
                  rel: 0,
                  modestbranding: 1,
                },
              }}
              onEnd={() => {
                if (!isCompleted) {
                  handleLectureCompletion(lecture._id);
                }
              }}
            />
          </div>
        );
      } else {
        const fileUrl = getFileUrl(lecture.file);
        return (
          <div className="video-player">
            <div className="file-header">
              <FaPlay className="file-icon" />
              <div className="file-info">
                <h3>{lecture.title}</h3>
                <p>Video Lecture</p>
              </div>
            </div>
            <div className="video-content">
              <video
                key={fileUrl}
                controls
                controlsList="nodownload"
                className="lecture-video"
                onEnded={() => {
                  if (!isCompleted) {
                    handleLectureCompletion(lecture._id);
                  }
                }}
                onError={(e) => {
                  console.error("Video loading error:", {
                    error: e,
                    src: fileUrl,
                    event: e.nativeEvent
                  });
                  toast.error("Failed to load video. Please try again or contact support.");
                }}
              >
                <source src={fileUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="video-actions">
              {!isCompleted && (
                <button
                  className="btn btn-success"
                  onClick={() => handleLectureCompletion(lecture._id)}
                >
                  <TiTick /> Mark as Complete
                </button>
              )}
              {isCompleted && <div className="completion-message"><TiTick /> Completed</div>}
              <button className="btn btn-fullscreen" onClick={() => window.open(fileUrl, '_blank')}>
                <FaExpand /> Fullscreen
              </button>
            </div>
          </div>
        );
      }
    }

    const currentLectureId = lecture._id;
    const fileUrl = getFileUrl(lecture.file);

    switch (lecture.fileType) {
      case 'audio':
        console.log('Audio file details:', {
          originalPath: lecture.file,
          cleanedPath: getFileUrl(lecture.file),
          lecture: lecture
        });
        return (
          <div className="audio-player">
            <div className="file-header">
              <FaFileAudio className="file-icon" />
              <div className="file-info">
                <h3>{lecture.title}</h3>
                <p>Audio File</p>
              </div>
            </div>
            <div className="audio-content">
              <audio
                key={fileUrl}
                src={fileUrl}
                controls
                preload="metadata"
                onEnded={() => handleLectureCompletion(currentLectureId)}
                onError={(e) => {
                  console.error("Audio loading error:", {
                    error: e,
                    src: fileUrl,
                    event: e.nativeEvent
                  });
                  toast.error("Failed to load audio file. Please try again or contact support.");
                }}
              />
            </div>
            <div className="audio-actions">
              <a href={fileUrl} className="btn btn-download" download>
                <FaDownload /> Download
              </a>
              <button className="btn btn-fullscreen" onClick={() => window.open(fileUrl, '_blank')}>
                <FaExpand /> Fullscreen
              </button>
            </div>
            {isCompleted && <div className="completion-message"><TiTick /> Completed</div>}
          </div>
        );
      case 'pdf':
      case 'ppt':
      case 'doc':
        const ViewerType = lecture.fileType === 'pdf' ? 'pdf-viewer' : (lecture.fileType === 'ppt' ? 'ppt-viewer' : 'doc-viewer');
        const IconComponent = lecture.fileType === 'pdf' ? FaFilePdf : (lecture.fileType === 'ppt' ? FaFilePowerpoint : FaFileWord);
        const fileTypeTitle = lecture.fileType === 'pdf' ? 'PDF Document' : (lecture.fileType === 'ppt' ? 'PowerPoint Presentation' : 'Word Document');
        const embedUrl = lecture.fileType === 'pdf' ? `${fileUrl}#toolbar=0&navpanes=0&scrollbar=0` : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}&wdAllowInteractivity=False&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=False&wdToolbar=False&wdHeader=False&wdMenubar=False`;
        const fullScreenUrl = lecture.fileType === 'pdf' ? fileUrl : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`;

        return (
          <div className={ViewerType}>
            <div className="file-header">
              <IconComponent className="file-icon" />
              <div className="file-info">
                <h3>{lecture.title}</h3>
                <p>{fileTypeTitle}</p>
              </div>
            </div>
            <div className="file-content">
               {lecture.fileType === 'pdf' ? (
                 <embed src={embedUrl} type="application/pdf" width="100%" height="100%" />
               ) : (
                 <iframe src={embedUrl} title={`${fileTypeTitle} Viewer`} width="100%" height="100%" style={{ border: 'none' }} />
               )}
            </div>
            <div className="file-actions">
               {!isCompleted && (
                 <button
                   className="btn btn-success"
                   onClick={() => handleLectureCompletion(currentLectureId)}
                 >
                   <TiTick /> Mark as Complete
                 </button>
               )}
               {isCompleted && <div className="completion-message"><TiTick /> Completed</div>}
              <a href={fileUrl} className="btn btn-download" download>
                <FaDownload /> Download
              </a>
              <button className="btn btn-fullscreen" onClick={() => window.open(fullScreenUrl, '_blank')}>
                <FaExpand /> View Fullscreen
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleEditClick = (lectureToEdit) => {
    setEditingLecture(lectureToEdit);
  };

  const handleEditClose = () => {
    setEditingLecture(null);
  };

  const handleEditUpdate = () => {
    fetchLectures();
    if (editingLecture && lecture && editingLecture._id === lecture._id) {
       fetchLecture(lecture._id);
    }
    setEditingLecture(null);
  };

  const checkVideoUrl = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      console.log('Video URL check:', {
        url,
        status: response.status,
        contentType: response.headers.get('content-type')
      });
      return response.ok && response.headers.get('content-type')?.startsWith('video/');
    } catch (error) {
      console.error('Error checking video URL:', error);
      return false;
    }
  };

  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <>
          <div className={`progress-circle ${progressPercentage > 0 ? 'updating' : ''}`}>
            <div className="progress-value">{progressPercentage}%</div>
          </div>
          <div className="lecture-page">
            <div className="left">
              {lecLoading ? (
                <Loading />
              ) : (
                <>
                  {lecture ? (
                    <>
                      {renderFilePreview()}
                      <h1>{lecture.title}</h1>
                      <h3>{lecture.description}</h3>
                    </>
                  ) : (
                    <div className="no-lecture-message">
                      <h1>Welcome to the Course</h1>
                      <p>Please select a lecture from the list on the right to begin learning.</p>
                      {lectures.length === 0 && (
                        <div className="no-content-message">
                          <i className="fas fa-book"></i>
                          <h2>No Lectures Available Yet</h2>
                          <p>This course is currently being prepared. Please check back later for content.</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="right">
              {user && user.role === "admin" && (
                <button className="common-btn" onClick={() => setShow(!show)}>
                  {show ? "Close" : "Add Lecture +"}
                </button>
              )}

              {show && (
                <div className="lecture-form">
                  <h2>Add Lecture</h2>
                  <form onSubmit={submitHandler}>
                    <label htmlFor="text">Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />

                    <label htmlFor="text">Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />

                    <div className="form-group">
                      <label>Video Source</label>
                      <select
                        value={videoSource}
                        onChange={(e) => setVideoSource(e.target.value)}
                        className="form-control"
                      >
                        <option value="local">Local Upload</option>
                        <option value="youtube">YouTube Video</option>
                      </select>
                    </div>

                    {videoSource === 'youtube' ? (
                      <div className="form-group">
                        <label>YouTube Video ID</label>
                        <input
                          type="text"
                          value={youtubeVideoId}
                          onChange={(e) => setYoutubeVideoId(e.target.value)}
                          placeholder="e.g., dQw4w9WgXcQ"
                          className="form-control"
                          required
                        />
                        <small className="help-text">
                          Enter the 11-character video ID from the YouTube URL
                        </small>
                      </div>
                    ) : (
                      <div className="form-group">
                        <label>Choose File</label>
                        <input
                          type="file"
                          onChange={changeFileHandler}
                          className="form-control"
                          accept="video/*,audio/*,.pdf,.ppt,.pptx,.doc,.docx"
                          required
                        />
                      </div>
                    )}

                    {filePrev && (
                      <div className="file-preview">
                        {file.type.startsWith('video/') ? (
                          <video src={filePrev} controls width={300} />
                        ) : file.type.startsWith('audio/') ? (
                          <audio src={filePrev} controls />
                        ) : file.type === 'application/pdf' ? (
                          <iframe src={filePrev} width={300} height={200} />
                        ) : null}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="common-btn"
                      disabled={btnLoading}
                    >
                      {btnLoading ? "Adding..." : "Add Lecture"}
                    </button>
                  </form>
                </div>
              )}

              <div className="lecture-list">
                {lectures.length === 0 ? (
                  <div className="no-lectures-message">
                    <i className="fas fa-book"></i>
                    <h3>No Lectures Available</h3>
                    <p>This course is currently being prepared. Please check back later for content.</p>
                  </div>
                ) : (
                  lectures.map((item) => (
                    <div
                      key={item._id}
                      className={`lecture-item ${
                        currentLecture?._id === item._id ? "active" : ""
                      } ${progress[0]?.completedLectures.includes(item._id) ? "completed" : ""}`}
                      onClick={async () => {
                        if (currentLecture?._id !== item._id) {
                          setCurrentLecture(item);
                          await fetchLecture(item._id);
                        }
                      }}
                    >
                      <div className="lecture-info">
                        <span className="lecture-title">{item.title}</span>
                        <span className="lecture-duration">{item.duration}</span>
                      </div>
                      {progress[0]?.completedLectures.includes(item._id) && (
                        <span className="completion-icon">✓</span>
                      )}
                      {user && user.role === "admin" && (
                        <div className="lecture-actions">
                          <button
                            className="edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(item);
                            }}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHandler(item._id);
                            }}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {editingLecture && (
            <EditLectureModal
              lecture={editingLecture}
              onClose={handleEditClose}
              onUpdate={handleEditUpdate}
            />
          )}
        </>
      )}
    </>
  );
};

export default Lecture;