import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../config";
import Layout from "../Utils/Layout";
import toast from "react-hot-toast";
import { FaUserCog, FaSyncAlt } from "react-icons/fa";
import "./users.css";

const AdminUsers = ({ user }) => {
  const navigate = useNavigate();

  if (user && user.mainrole !== "superadmin") return navigate("/");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const updateRole = async (id) => {
    if (window.confirm("Are you sure you want to update this user's role?")) {
      try {
        const { data } = await axios.put(
          `${server}/api/user/${id}`,
          {},
          {
            headers: {
              token: localStorage.getItem("token"),
            },
          }
        );
        toast.success(data.message);
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.message || "Update failed");
      }
    }
  };

  return (
    <Layout>
      <div className="container-fluid py-4" style={{ paddingLeft: '0', paddingRight: '0' }}>
        <div className="card shadow" style={{
          marginLeft: 'auto',
          width: '95%', // Increased to 95% of viewport width
          maxWidth: 'none', // Removed maximum width constraint
          marginRight: '5px' // Minimal right margin
        }}>
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h3 className="mb-0">
              <FaUserCog className="me-2" />
              User Management
            </h3>
            <button 
              onClick={fetchUsers} 
              className="btn btn-light btn-sm"
              disabled={loading}
            >
              <FaSyncAlt className={loading ? "fa-spin" : ""} />
            </button>
          </div>
          <div className="card-body" style={{ padding: '1.5rem' }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped table-hover" style={{ minWidth: '1000px' }}>
                  <thead className="table-dark">
                    <tr>
                      <th scope="col" style={{ width: '5%' }}>#</th>
                      <th scope="col" style={{ width: '25%' }}>Name</th>
                      <th scope="col" style={{ width: '30%' }}>Email</th>
                      <th scope="col" style={{ width: '15%' }}>Role</th>
                      <th scope="col" style={{ width: '25%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user, index) => (
                        <tr key={user._id}>
                          <th scope="row">{index + 1}</th>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge ${
                              user.role === 'admin' ? 'bg-success' : 
                              user.role === 'user' ? 'bg-info' : 'bg-secondary'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => updateRole(user._id)}
                              className="btn btn-warning btn-sm"
                              style={{ minWidth: '120px' }}
                            >
                              Update Role
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
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
    </Layout>
  );
};

export default AdminUsers;