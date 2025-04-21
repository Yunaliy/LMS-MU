import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { server } from '../../config';
import axios from 'axios';
import toast from 'react-hot-toast';
import './editCourse.css';

// Define categories array (same as in AddCourse)
const categories = [
  "Web Development",
  "App Development",
  "Game Development",
  "Data Science",
  "Artificial Intelligence",
];

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    category: '',
    createdBy: '',
    duration: '',
    price: '',
  });
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    // Fetch course data
    const fetchCourse = async () => {
      try {
        const { data } = await axios.get(`${server}/api/course/${id}`);
        const course = data.course;
        setCourseData({
          title: course.title,
          description: course.description,
          category: course.category,
          createdBy: course.createdBy,
          duration: course.duration,
          price: course.price,
        });
        setPreviewImage(`${server}/uploads/lectures/${course.image}`);
      } catch (error) {
        toast.error('Error fetching course details');
        navigate('/admin/courses');
      }
    };
    fetchCourse();
  }, [id]);

  const handleChange = (e) => {
    setCourseData({
      ...courseData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(courseData).forEach(key => {
        formData.append(key, courseData[key]);
      });
      if (image) {
        formData.append('image', image);
      }

      // Updated endpoint to match the backend route structure
      const { data } = await axios.put(`${server}/api/course/${id}`, formData, {
        headers: {
          token: localStorage.getItem('token'),
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success(data.message || 'Course updated successfully');
      navigate('/admin/courses');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Error updating course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-course-container">
      <h2>Edit Course</h2>
      <form onSubmit={handleSubmit} className="edit-course-form">
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={courseData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea
            name="description"
            value={courseData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Category:</label>
          <select
            name="category"
            value={courseData.category}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Created By:</label>
          <input
            type="text"
            name="createdBy"
            value={courseData.createdBy}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Duration (weeks):</label>
          <input
            type="number"
            name="duration"
            value={courseData.duration}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Price:</label>
          <input
            type="number"
            name="price"
            value={courseData.price}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Course Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {previewImage && (
            <img
              src={previewImage}
              alt="Course preview"
              className="image-preview"
            />
          )}
        </div>

        <button type="submit" className="common-btn" disabled={loading}>
          {loading ? 'Updating...' : 'Update Course'}
        </button>
      </form>
    </div>
  );
};

export default EditCourse;