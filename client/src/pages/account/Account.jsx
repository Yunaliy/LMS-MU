import React, { useState } from "react";
import { 
  MdDashboard, 
  MdAccountCircle, 
  MdSettings, 
  MdLibraryBooks, 
  MdEdit,
  MdClose
} from "react-icons/md";
import { IoMdLogOut } from "react-icons/io";
import { UserData } from "../../context/UserContext";
import toast from "react-hot-toast";
import { useNavigate, Link } from "react-router-dom";
import "./account.css";
import { server } from "../../config";
import axios from "axios";

const Account = ({ user }) => {
  const { setIsAuth, setUser, btnLoading } = UserData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");

  const logoutHandler = () => {
    localStorage.clear();
    setUser([]);
    setIsAuth(false);
    toast.success("Logged Out");
    navigate("/login");
  };

  const handleOpen = () => {
    setOpen(true);
    setName(user?.name || "");
    setImage(null);
    setImagePreview("");
    setError("");
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setError("");
      setImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfileHandler = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (image) {
        formData.append('image', image);
      }

      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'token': token
        }
      };

      const { data } = await axios.put(`${server}/api/user/update`, formData, config);
      
      if (data.success) {
        setUser(data.user);
        toast.success("Profile updated successfully");
        handleClose();
      }
    } catch (error) {
      console.error("Update profile error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    <div className="account-page">
      {user && (
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-4 col-md-6">
              <div className="account-card">
                {/* Profile Header */}
                <div className="profile-header">
                  <div className="avatar-container">
                    <div className="avatar-image">
                      {user?.image ? (
                        <img 
                          src={`${server}/uploads/${user.image.replace(/\\/g, '/')}`}
                          alt={user.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = null;
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="avatar-fallback"><MdAccountCircle size={80} color="#757575" /></div>';
                          }}
                        />
                      ) : (
                        <MdAccountCircle 
                          size={80} 
                          color="#757575"
                        />
                      )}
                    </div>
                  </div>
                  <h4 className="profile-name">{user.name}</h4>
                  <p className="profile-email">{user.email}</p>
                </div>

                {/* Profile Options */}
                <div className="profile-options">
                  <button 
                    onClick={handleOpen}
                    className="profile-option"
                  >
                    <MdEdit className="option-icon" />
                    <span>Edit Profile</span>
                  </button>

                  {user.role === "user" && (
                    <Link 
                      to={"/dashboard"}
                      className="profile-option"
                    >
                      <MdLibraryBooks className="option-icon" />
                      <span>My Courses</span>
                    </Link>
                  )}

                  {user.role === "admin" && (
                    <Link 
                      to="/admin/dashboard"
                      className="profile-option"
                    >
                      <MdSettings className="option-icon" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <button
                    onClick={logoutHandler}
                    className="profile-option"
                  >
                    <IoMdLogOut className="option-icon" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Dialog */}
      {open && (
        <div className="dialog-overlay">
          <div className="dialog-container">
            <div className="dialog-header">
              <h2 className="dialog-title">Edit Profile</h2>
              <button className="dialog-close-btn" onClick={handleClose}>
                <MdClose size={24} />
              </button>
            </div>
            
            <div className="dialog-content">
              <form onSubmit={updateProfileHandler}>
                <div className="avatar-preview-circle">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" />
                  ) : user?.image ? (
                    <img 
                      src={`${server}/uploads/${user.image.replace(/\\/g, '/')}`} 
                      alt="Current" 
                    />
                  ) : (
                    <MdAccountCircle size={80} color="#757575" />
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image" className="dialog-btn dialog-btn-confirm upload-btn">
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </label>
                </div>

                {error && <div className="error-message">{error}</div>}
              </form>
            </div>
            
            <div className="dialog-footer">
              <button 
                type="button" 
                className="dialog-btn dialog-btn-cancel"
                onClick={handleClose}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="dialog-btn dialog-btn-confirm"
                onClick={updateProfileHandler}
                disabled={btnLoading}
              >
                {btnLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;

// import React from "react";
// import { MdDashboard, MdAccountCircle, MdSettings, MdLibraryBooks } from "react-icons/md";
// import { IoMdLogOut } from "react-icons/io";
// import { UserData } from "../../context/UserContext";
// import toast from "react-hot-toast";
// import { useNavigate, Link } from "react-router-dom";
// import "./account.css";
// import { server } from "../../config";

// const Account = ({ user }) => {
//   const { setIsAuth, setUser } = UserData();
//   const navigate = useNavigate();

//   const logoutHandler = () => {
//     localStorage.clear();
//     setUser([]);
//     setIsAuth(false);
//     toast.success("Logged Out");
//     navigate("/login");
//   };

//   return (
//     <div className="account-page">
//       {user && (
//         <div className="container">
//           <div className="row justify-content-center">
//             <div className="col-lg-4 col-md-6">
//               <div className="account-card">
//                 {/* Profile Header */}
//                 <div className="profile-header">
//                   <div className="avatar-container">
//                     <div className="avatar-image">
//                       {user?.image ? (
//                         <img 
//                          src={`${server}/uploads/${user.image.replace(/\\/g, '/')}`}
//                           alt={user.name}
//                           onError={(e) => {
//                             e.target.onerror = null;
//                             e.target.src = null;
//                             e.target.style.display = 'none';
//                             e.target.parentElement.innerHTML = '<div class="avatar-fallback"><MdAccountCircle size={80} color="#757575" /></div>';
//                           }}
//                         />
//                       ) : (
//                         <MdAccountCircle 
//                           size={80} 
//                           color="#757575"
//                         />
//                       )}
//                     </div>
//                   </div>
//                   <h4 className="profile-name">{user.name}</h4>
//                   <p className="profile-email">{user.email}</p>
//                 </div>

//                 {/* Profile Options */}
//                 <div className="profile-options">
//                 {user.role === "user" && (
//                   <Link 
//                     to={"/dashboard"}
//                     className="profile-option"
//                   >
//                     <MdLibraryBooks className="option-icon" />
//                     <span>My Courses</span>
//                   </Link>
//                 )}

//                   {user.role === "admin" && (
//                     <Link 
//                       to="/admin/dashboard"
//                       className="profile-option"
//                     >
//                       <MdSettings className="option-icon" />
//                       <span>Admin Dashboard</span>
//                     </Link>
//                   )}

//                   <button
//                     onClick={logoutHandler}
//                     className="profile-option logout-btn"
//                   >
//                     <IoMdLogOut className="option-icon" />
//                     <span>Sign Out</span>
//                   </button>
//                 </div>

//                 {/* Subscription Info */}
//                 {user.role !== "admin" && user.subscription && user.subscription.length > 0 && (
//                   <div className="subscription-info">
//                     {/* <h6 className="subscription-title">Enrolled Courses</h6>
//                     <div className="enrolled-courses">
//                       {user.subscription.map((courseId) => (
//                         <Link 
//                           key={courseId}
//                           to={`/course/${courseId}/certificate`}
//                           className="enrolled-course"
//                         >
//                           <span className="course-name">Course #{courseId}</span>
//                           <small className="view-certificate">View Certificate</small>
//                         </Link>
//                       ))}
//                     </div> */}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Account;