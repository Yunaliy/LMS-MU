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
    image: null,
    material: null
  });
  const [previewImage, setPreviewImage] = useState('');
  const [materialName, setMaterialName] = useState('');
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
        image: null,
        material: null
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
    
    // Validate price and duration
    if (name === 'price' || name === 'duration') {
      // Remove any non-numeric characters except decimal point for price
      const sanitizedValue = name === 'price' 
        ? value.replace(/[^0-9.]/g, '')
        : value.replace(/[^0-9]/g, '');
      
      // Ensure only one decimal point for price
      if (name === 'price') {
        const parts = sanitizedValue.split('.');
        if (parts.length > 2) {
          toast.error('Invalid price format');
          return;
        }
      }

      // Convert to number and validate
      const numValue = parseFloat(sanitizedValue);
      if (isNaN(numValue)) {
        toast.error(`Please enter a valid ${name === 'price' ? 'price' : 'duration'}`);
        return;
      }
      if (numValue < 0) {
        toast.error(`${name === 'price' ? 'Price' : 'Duration'} cannot be negative`);
        return;
      }
      if (name === 'duration' && numValue < 1) {
        toast.error('Duration must be at least 1 week');
        return;
      }

      setCourse(prev => ({
        ...prev,
        [name]: sanitizedValue
      }));
      return;
    }

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

  const handleMaterialChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        e.target.value = null;
        return;
      }
      setCourse(prev => ({
        ...prev,
        material: file
      }));
      setMaterialName(file.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate price and duration before submission
    const price = parseFloat(course.price);
    const duration = parseFloat(course.duration);

    if (isNaN(price) || price < 0) {
      toast.error('Please enter a valid positive price');
      return;
    }
    if (isNaN(duration) || duration < 1 || !Number.isInteger(duration)) {
      toast.error('Please enter a valid duration (whole number, minimum 1 week)');
      return;
    }

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
                  step="1"
                  onKeyPress={(e) => {
                    if (!/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    if (!/^\d+$/.test(pastedText)) {
                      toast.error('Please paste only numbers');
                      return;
                    }
                    const numValue = parseInt(pastedText);
                    if (numValue < 1) {
                      toast.error('Duration must be at least 1 week');
                      return;
                    }
                    setCourse(prev => ({
                      ...prev,
                      duration: pastedText
                    }));
                  }}
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
                  step="0.01"
                  onKeyPress={(e) => {
                    if (!/^[0-9.]$/.test(e.key)) {
                      e.preventDefault();
                    }
                    // Prevent multiple decimal points
                    if (e.key === '.' && course.price.includes('.')) {
                      e.preventDefault();
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData('text');
                    if (!/^\d*\.?\d*$/.test(pastedText)) {
                      toast.error('Please paste only valid numbers');
                      return;
                    }
                    const numValue = parseFloat(pastedText);
                    if (isNaN(numValue) || numValue < 0) {
                      toast.error('Please enter a valid positive price');
                      return;
                    }
                    setCourse(prev => ({
                      ...prev,
                      price: pastedText
                    }));
                  }}
                  placeholder="Enter course price"
                />
              </div>

              <div className="form-group">
                <label htmlFor="material">Course Material (PDF)</label>
                <input
                  type="file"
                  id="material"
                  name="material"
                  onChange={handleMaterialChange}
                  accept=".pdf"
                  className="material-input"
                />
                {materialName && (
                  <div className="material-name">
                    Selected: {materialName}
                  </div>
                )}
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