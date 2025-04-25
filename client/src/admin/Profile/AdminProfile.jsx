import React, { useState } from 'react';
import { UserData } from '../../context/UserContext';
import axios from 'axios';
import { server } from '../../config';
import { toast } from 'react-hot-toast';
import Layout from '../Utils/Layout';
import { MdAccountCircle } from 'react-icons/md';

const AdminProfile = () => {
  const { user, setUser } = UserData();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    image: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      if (formData.image) {
        data.append('image', formData.image);
      }

      const response = await axios.put(`${server}/api/user/update`, data, {
        headers: {
          token: localStorage.getItem('token'),
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUser(response.data.user);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '2rem', color: '#1a237e' }}>Edit Profile</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              width: '120px',
              height: '120px',
              margin: '0 auto 1rem',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #1a237e'
            }}>
              {user?.image ? (
                <img
                  src={`${server}/uploads/${user.image.replace(/\\/g, '/')}`}
                  alt={user.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : (
                <MdAccountCircle
                  size={120}
                  color="#1a237e"
                  style={{
                    width: '100%',
                    height: '100%',
                    padding: '0.5rem'
                  }}
                />
              )}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="image"
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#e8eaf6',
                  color: '#1a237e',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Choose Profile Picture
              </label>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#666'
              }}
            >
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1a237e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default AdminProfile; 