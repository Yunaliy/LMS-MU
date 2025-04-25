import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { server } from "../../config";
import { CourseData } from "../../context/CourseContext";
import Layout from "../Utils/Layout";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './addCourse.css';

const categories = [
  "Quran",
  "Hadith",
  "Tafsir",
  "Fiqhi",
  "Lugha",
  "Terbiya",
  "Aqidah",
];

// Quill editor modules configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link'
];

const CourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchCourses } = CourseData();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    createdBy: '',
    duration: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState('');
  const isEditMode = Boolean(id);

  useEffect(() => {
    if (isEditMode) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${server}/api/course/${id}`);
      const courseData = response.data.course;
      setCourse({
        title: courseData.title,
        category: courseData.category,
        description: courseData.description,
        createdBy: courseData.createdBy,
        duration: courseData.duration,
        price: courseData.price,
        image: null
      });
      if (courseData.image) {
        setPreviewImage(`${server}/uploads/${courseData.image}`);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
      navigate('/admin/courses');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourse(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDescriptionChange = (content) => {
    setCourse(prev => ({
      ...prev,
      description: content
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

      const endpoint = isEditMode 
        ? `${server}/api/course/${id}`
        : `${server}/api/admin/course/new`;
      
      const method = isEditMode ? 'put' : 'post';

      const { data } = await axios[method](endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          token: localStorage.getItem("token"),
        },
      });

      await fetchCourses();
      toast.success(data.message || `Course ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate("/admin/courses");
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} course`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/courses');
  };

  return (
    <Layout>
      <div className="admin-edit-course-container">
        <div className="admin-edit-course-header">
          <h2>{isEditMode ? 'Edit Course' : 'Add New Course'}</h2>
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
                  placeholder="Enter course title"
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
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <div className="quill-editor-container">
                <ReactQuill
                  value={course.description}
                  onChange={handleDescriptionChange}
                  modules={quillModules}
                  formats={quillFormats}
                  theme="snow"
                  placeholder="Enter course description..."
                />
              </div>
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
                  placeholder="Enter instructor name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="duration">Duration (weeks)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={course.duration}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="Enter course duration"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="price">Price (ETB)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={course.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  placeholder="Enter course price"
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
                    required={!isEditMode}
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
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading 
                  ? (isEditMode ? 'Updating...' : 'Creating...') 
                  : (isEditMode ? 'Update Course' : 'Create Course')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CourseForm;