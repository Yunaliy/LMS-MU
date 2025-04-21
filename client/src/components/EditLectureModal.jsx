import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { server } from '../config';
import toast from 'react-hot-toast';
import './EditLectureModal.css';

const EditLectureModal = ({ lecture, onClose, onUpdate }) => {
  const [title, setTitle] = useState(lecture.title || '');
  const [description, setDescription] = useState(lecture.description || '');
  const [videoSource, setVideoSource] = useState(lecture.videoSource || 'local');
  const [youtubeVideoId, setYoutubeVideoId] = useState(lecture.youtubeVideoId || '');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(lecture.title || '');
    setDescription(lecture.description || '');
    setVideoSource(lecture.videoSource || 'local');
    setYoutubeVideoId(lecture.youtubeVideoId || '');
    setFile(null);
  }, [lecture]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('videoSource', videoSource);

      if (videoSource === 'youtube') {
        if (!youtubeVideoId) {
          toast.error("YouTube Video ID is required");
          setLoading(false);
          return;
        }
        formData.append('youtubeVideoId', youtubeVideoId);
      } else if (file) {
        formData.append('file', file);
      } else if (videoSource === 'local' && !lecture.file) {
        toast.error("A file is required for local video source.");
        setLoading(false);
        return;
      }

      const { data } = await axios.put(
        `${server}/api/lecture/${lecture._id}`,
        formData,
        {
          headers: {
            token: localStorage.getItem('token'),
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast.success(data.message || "Lecture updated successfully");
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Error updating lecture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-lecture-modal">
      <div className="modal-content">
        <h2>Edit Lecture</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Video Source:</label>
            <select
              value={videoSource}
              onChange={(e) => {
                setVideoSource(e.target.value);
                if (e.target.value === 'youtube') setFile(null);
                if (e.target.value === 'local') setYoutubeVideoId('');
              }}
              required
            >
              <option value="local">Local File</option>
              <option value="youtube">YouTube Video</option>
            </select>
          </div>

          {videoSource === 'youtube' ? (
            <div className="form-group">
              <label>YouTube Video ID:</label>
              <input
                type="text"
                value={youtubeVideoId}
                onChange={(e) => setYoutubeVideoId(e.target.value)}
                placeholder="e.g., dQw4w9WgXcQ (11 chars)"
                required
                minLength="11"
                maxLength="11"
              />
            </div>
          ) : (
            <div className="form-group">
              <label>New File (optional - leave blank to keep existing):</label>
              <input
                type="file"
                onChange={handleFileChange}
                accept="video/*,audio/*,.pdf,.ppt,.pptx,.doc,.docx"
              />
              {lecture.file && !file && (
                <p className="current-file">Current: {lecture.file.split('/').pop()}</p>
              )}
            </div>
          )}

          <div className="button-group">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLectureModal;