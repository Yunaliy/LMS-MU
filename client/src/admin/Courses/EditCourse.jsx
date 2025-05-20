import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../Utils/Layout';
import './editCourse.css';

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState({
    title: '',
    category: '',
    description: '',
    createdBy: '',
    duration: '',
    price: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(`/api/courses/${id}`);
        const courseData = response.data;
        setCourse({
          title: courseData.title,
          category: courseData.category,
          description: courseData.description,
          createdBy: courseData.createdBy,
          duration: courseData.duration,
          price: courseData.price,
          image: null
        });
        setPreviewImage(courseData.image ? `/uploads/${courseData.image}` : '');
      } catch (error) {
        console.error('Error fetching course:', error);
      }
    };
    fetchCourse();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourse(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCourse(prev => ({
        ...prev,
        image: file
      }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(course).forEach(key => {
        if (course[key] !== null) {
          formData.append(key, course[key]);
        }
      });

      await axios.put(`/api/courses/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      navigate('/admin/courses');
    } catch (error) {
      console.error('Error updating course:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="admin-edit-course-container">
        <div className="admin-edit-course-header">
          <h2>Edit Course</h2>
        </div>
        
        <div className="admin-edit-course-content">
          <form onSubmit={handleSubmit} className="admin-edit-course-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={course.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={course.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Programming">Programming</option>
                  <option value="Design">Design</option>
                  <option value="Business">Business</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={course.description}
                onChange={handleInputChange}
                required
                rows="6"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="createdBy">Created By</label>
                <input
                  type="text"
                  id="createdBy"
                  name="createdBy"
                  value={course.createdBy}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="duration">Duration</label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={course.duration}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="price">Price</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={course.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="image-upload-group">
              <label>Course Image</label>
              <div className="image-upload-container">
                <div className="image-input">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                {previewImage && (
                  <div className="image-preview-container">
                    <img
                      src={previewImage}
                      alt="Course preview"
                      className="image-preview"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/admin/courses')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditCourse;