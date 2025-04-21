import React, { useState } from "react";
import "./addCourse.css";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "axios";
import { server } from "../../config";
import { CourseData } from "../../context/CourseContext";

const categories = [
  "Web Development",
  "App Development",
  "Game Development",
  "Data Science",
  "Artificial Intelligence",
];

const AddCourse = () => {
  const navigate = useNavigate();
  const { fetchCourses } = CourseData();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [duration, setDuration] = useState("");
  const [image, setImage] = useState("");
  const [imagePrev, setImagePrev] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  const changeImageHandler = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onloadend = () => {
      setImagePrev(reader.result);
      setImage(file);
    };
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setBtnLoading(true);

    const myForm = new FormData();

    myForm.append("title", title);
    myForm.append("description", description);
    myForm.append("category", category);
    myForm.append("price", price);
    myForm.append("createdBy", createdBy);
    myForm.append("duration", duration);
    myForm.append("image", image);

    console.log("Submitting form with image:", image);

    try {
      const { data } = await axios.post(
        `${server}/api/course/new`,
        myForm,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            token: localStorage.getItem("token"),
          },
        }
      );

      await fetchCourses(); // Fetch updated course list
      toast.success(data.message);
      navigate("/admin/courses");
    } catch (error) {
      console.error("Error creating course:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to create course");
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="add-course-page">
      <div className="add-course-form">
        <h2>Add New Course</h2>
        <form onSubmit={submitHandler}>
          <label htmlFor="title">Course Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label htmlFor="description">Course Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <label htmlFor="price">Price (ETB)</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />

          <label htmlFor="createdBy">Created By</label>
          <input
            type="text"
            id="createdBy"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
            required
          />

          <label htmlFor="duration">Duration (weeks)</label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />

          <label htmlFor="image">Course Image</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={changeImageHandler}
            required
          />

          {imagePrev && (
            <img
              src={imagePrev}
              alt="Preview"
              style={{ maxWidth: "200px", marginTop: "10px" }}
            />
          )}

          <button type="submit" disabled={btnLoading}>
            {btnLoading ? "Adding Course..." : "Add Course"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddCourse;