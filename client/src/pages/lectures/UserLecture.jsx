import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { server } from '../../config';

const UserLecture = () => {
  const { id } = useParams();
  const [lecture, setLecture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lectureId, setLectureId] = useState(null);
  const [timestamp, setTimestamp] = useState(0);
  const playerRef = useRef(null);
  const saveProgressTimeoutRef = useRef(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const lectureIdParam = searchParams.get('lectureId');
    const timestampParam = searchParams.get('timestamp');
    
    if (lectureIdParam) {
      setLectureId(lectureIdParam);
      setTimestamp(parseInt(timestampParam) || 0);
    }
  }, []);

  useEffect(() => {
    const fetchLecture = async () => {
      if (!lectureId) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `${server}/api/lecture/${lectureId}`,
          {
            headers: { token }
          }
        );
        setLecture(data.lecture);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load lecture');
        console.error('Error fetching lecture:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLecture();
  }, [lectureId]);

  useEffect(() => {
    if (playerRef.current && timestamp > 0) {
      playerRef.current.seekTo(timestamp);
    }
  }, [timestamp, lecture]);

  const handleTimeUpdate = (event) => {
    if (saveProgressTimeoutRef.current) {
      clearTimeout(saveProgressTimeoutRef.current);
    }

    saveProgressTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          `${server}/api/user/progress/update`,
          {
            courseId: id,
            lectureId: lectureId,
            timestamp: Math.floor(event.target.getCurrentTime())
          },
          {
            headers: { token }
          }
        );
      } catch (error) {
        console.error('Error saving video progress:', error);
      }
    }, 30000); // Save every 30 seconds
  };

  // ... rest of the component code ...
};

export default UserLecture; 