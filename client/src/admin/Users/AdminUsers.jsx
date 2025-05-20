import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../config";
import Layout from "../Utils/Layout";
import toast from "react-hot-toast";
import { FaUserCog, FaSyncAlt, FaEye, FaDownload, FaTrash, FaUserShield, FaUser } from "react-icons/fa";
import "./users.css";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminUsers = ({ user }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  const [deletingCourseId, setDeletingCourseId] = useState(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data } = await axios.get(`${server}/api/users`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      setUsers(data.users);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleViewDetails = async (userId) => {
    try {
      const { data } = await axios.get(`${server}/api/user/${userId}/details`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });
      
      if (data.success && data.user) {
        const userWithFormattedDates = {
          ...data.user,
          createdAt: new Date(data.user.createdAt).toLocaleDateString(),
          subscription: data.user.subscription.map(course => ({
            ...course,
            enrolledDate: course.enrolledDate ? new Date(course.enrolledDate).toLocaleDateString() : 'N/A'
          }))
        };
        setSelectedUser(userWithFormattedDates);
        setShowModal(true);
      } else {
        throw new Error(data.message || 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error(error.response?.data?.message || "Failed to fetch user details");
    }
  };

  const handleDownload = useCallback(() => {
    if (!selectedUser) return;

    const doc = new jsPDF();
    
    // Load and add the logo
    const img = new Image();
    img.src = '/logo3.png';
    
    img.onload = function() {
      try {
        // Add logo - calculate dimensions to maintain aspect ratio
        const imgWidth = 40;  // Set desired width
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(img, 'PNG', 20, 10, imgWidth, imgHeight);

        // Add title with larger font
        doc.setFontSize(24);
        doc.setTextColor(0, 102, 204); // Set a professional blue color
        doc.text('Medinetul Uloom', 70, 25);
        
        // Add subtitle
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.text('User Details Report', 70, 35);
        
        // Add horizontal line
        doc.setDrawColor(0, 102, 204);
        doc.setLineWidth(0.5);
        doc.line(20, 40, 190, 40);
        
        // Add user information
        doc.setFontSize(12);
        doc.text(`Name: ${selectedUser.name}`, 20, 60);
        doc.text(`Email: ${selectedUser.email}`, 20, 70);
        doc.text(`Role: ${selectedUser.role}`, 20, 80);
        doc.text(`Registered: ${selectedUser.createdAt}`, 20, 90);
        
        // Add enrolled courses section
        doc.setFontSize(14);
        doc.setTextColor(0, 102, 204);
        doc.text('Enrolled Courses:', 20, 110);
        doc.setTextColor(0, 0, 0);
        
        if (selectedUser.subscription && selectedUser.subscription.length > 0) {
          const tableData = selectedUser.subscription.map(course => [
            course.title,
            `${course.progress}%`,
            course.completed ? 'Completed' : 'In Progress',
            course.enrolledDate
          ]);
          
          autoTable(doc, {
            startY: 120,
            head: [['Course', 'Progress', 'Status', 'Enrolled Date']],
            body: tableData,
            theme: 'grid',
            headStyles: { 
              fillColor: [0, 102, 204],
              fontSize: 12,
              halign: 'center'
            },
            bodyStyles: {
              fontSize: 11,
              halign: 'center'
            },
            alternateRowStyles: {
              fillColor: [240, 245, 255]
            }
          });
        } else {
          doc.text('No courses enrolled', 20, 130);
        }

        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()}`,
          20,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Page ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );

        // Save the PDF
        const filename = `${selectedUser.name.replace(/\s+/g, '_')}_details.pdf`;
        doc.save(filename);
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error generating PDF. Please try again.');
      }
    };

    img.onerror = function() {
      console.error('Error loading logo');
      toast.error('Error loading logo. Generating PDF without logo.');
      
      // Generate PDF without logo
      try {
        // Add title
        doc.setFontSize(24);
        doc.setTextColor(0, 102, 204);
        doc.text('Medinetul Uloom', 20, 25);
        
        // Rest of the PDF generation code...
        // (Copy the same code from above, starting from subtitle)
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('User Details Report', 20, 35);
        
        // Add horizontal line
        doc.setDrawColor(0, 102, 204);
        doc.setLineWidth(0.5);
        doc.line(20, 40, 190, 40);
        
        // Add user information
        doc.setFontSize(12);
        doc.text(`Name: ${selectedUser.name}`, 20, 60);
        doc.text(`Email: ${selectedUser.email}`, 20, 70);
        doc.text(`Role: ${selectedUser.role}`, 20, 80);
        doc.text(`Registered: ${selectedUser.createdAt}`, 20, 90);
        
        // Add enrolled courses section
        doc.setFontSize(14);
        doc.setTextColor(0, 102, 204);
        doc.text('Enrolled Courses:', 20, 110);
        doc.setTextColor(0, 0, 0);
        
        if (selectedUser.subscription && selectedUser.subscription.length > 0) {
          const tableData = selectedUser.subscription.map(course => [
            course.title,
            `${course.progress}%`,
            course.completed ? 'Completed' : 'In Progress',
            course.enrolledDate
          ]);
          
          autoTable(doc, {
            startY: 120,
            head: [['Course', 'Progress', 'Status', 'Enrolled Date']],
            body: tableData,
            theme: 'grid',
            headStyles: { 
              fillColor: [0, 102, 204],
              fontSize: 12,
              halign: 'center'
            },
            bodyStyles: {
              fontSize: 11,
              halign: 'center'
            },
            alternateRowStyles: {
              fillColor: [240, 245, 255]
            }
          });
        } else {
          doc.text('No courses enrolled', 20, 130);
        }

        // Add footer
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()}`,
          20,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Page ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10
        );

        // Save the PDF
        const filename = `${selectedUser.name.replace(/\s+/g, '_')}_details.pdf`;
        doc.save(filename);
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Error generating PDF. Please try again.');
      }
    };
  }, [selectedUser]);

  const handleDelete = (user) => {
    setSelectedUserForAction(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedUserForAction) return;
    
    setDeletingCourseId(selectedUserForAction._id);
    setShowDeleteDialog(false);

    try {
      const { data } = await axios.delete(`${server}/api/users/${selectedUserForAction._id}`, {
        headers: {
          token: localStorage.getItem("token"),
        },
      });

      toast.success(data.message);
      fetchUsers(); // Refresh users list after deletion
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting user');
    } finally {
      setDeletingCourseId(null);
      setSelectedUserForAction(null);
    }
  };

  const handleRoleUpdate = (user) => {
    setSelectedUserForAction(user);
    setShowRoleDialog(true);
  };

  const confirmRoleUpdate = async () => {
    try {
      const newRole = selectedUserForAction.role === 'admin' ? 'user' : 'admin';
      const response = await axios.put(
        `${server}/api/user/${selectedUserForAction._id}/role`,
        { role: newRole },
          {
            headers: {
              token: localStorage.getItem("token"),
            },
          }
        );
      if (response.status === 200) {
        toast.success('User role updated successfully');
        fetchUsers();
        if (selectedUser?._id === selectedUserForAction._id) {
          setSelectedUser(prev => ({...prev, role: newRole}));
        }
      }
    } catch (error) {
      toast.error('Error updating user role');
      console.error('Error:', error);
    }
    setShowRoleDialog(false);
    setSelectedUserForAction(null);
  };

  const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm, userName }) => {
    if (!isOpen) return null;
    
    return (
      <div className="dialog-overlay">
        <div className="dialog-content">
          <h3>Delete User</h3>
          <p>Are you sure you want to delete {userName}? This action cannot be undone.</p>
          <div className="dialog-buttons">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-delete" onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    );
  };

  const RoleUpdateDialog = ({ isOpen, onClose, onConfirm, userName, newRole }) => {
    if (!isOpen) return null;
    
    return (
      <div className="dialog-overlay">
        <div className="dialog-content">
          <h3>Update User Role</h3>
          <p>Are you sure you want to make {userName} an {newRole}?</p>
          <div className="dialog-buttons">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-upgrade" onClick={onConfirm}>Confirm</button>
          </div>
        </div>
      </div>
    );
  };

  const UserDetailsModal = ({ user, onClose }) => {
    if (!user) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>User Details</h3>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          
          <div className="modal-body">
            <div id="user-details-print">
              <div className="user-info">
                <h4>{user.name}</h4>
                <p>Email: {user.email}</p>
                <p>Role: {user.role}</p>
                <p>Registered: {user.createdAt}</p>
                
                <div className="enrolled-courses">
                  <h5>Enrolled Courses</h5>
                  {user.subscription && user.subscription.length > 0 ? (
                    user.subscription.map((course, index) => (
                      <div key={index} className="course-item">
                        <p>Course: {course.title}</p>
                        <p>Progress: {course.progress}%</p>
                        <p>Status: {course.completed ? 'Completed' : 'In Progress'}</p>
                        <p>Enrolled: {course.enrolledDate}</p>
                      </div>
                    ))
                  ) : (
                    <p>No courses enrolled</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              className="btn btn-download" 
              onClick={handleDownload}
            >
              <FaDownload /> Download PDF
            </button>
            <button 
              className="btn btn-delete" 
              onClick={() => {
                handleDelete(user);
              }}
            >
              <FaTrash /> Delete User
            </button>
            <button 
              className={`btn ${user.role === 'admin' ? 'btn-downgrade' : 'btn-upgrade'}`}
              onClick={() => {
                handleRoleUpdate(user);
              }}
            >
              {user.role === 'admin' ? (
                <><FaUser /> Downgrade to User</>
              ) : (
                <><FaUserShield /> Upgrade to Admin</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container-fluid py-4">
        <div className="card shadow">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <FaUserCog className="me-2" />
              Students Management
            </h3>
            <button 
              onClick={fetchUsers} 
              className="btn btn-light btn-sm"
              disabled={loading}
            >
              <FaSyncAlt className={loading ? "fa-spin" : ""} />
            </button>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Role</th>
                      <th scope="col" className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr key={user._id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td className="text-center">
                            <button
                              onClick={() => handleViewDetails(user._id)}
                              className="btn btn-primary btn-sm"
                            >
                              <FaEye /> Details
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-4">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {showModal && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
        />
      )}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        userName={selectedUserForAction?.name}
      />
      <RoleUpdateDialog
        isOpen={showRoleDialog}
        onClose={() => setShowRoleDialog(false)}
        onConfirm={confirmRoleUpdate}
        userName={selectedUserForAction?.name}
        newRole="admin"
      />
    </Layout>
  );
};

export default AdminUsers;