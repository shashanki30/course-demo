import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './AccountSettings.css';

const AccountSettings = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState(user?.picture || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.picture = reader.result;
        localStorage.setItem('userData', JSON.stringify(userData));
        setSuccess('Profile image updated successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSwitchAccount = () => {
    // Clear current user data
    localStorage.removeItem('userData');
    localStorage.removeItem('googleAccessToken');
    // Redirect to login
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        // Clear all user data
        localStorage.removeItem('userData');
        localStorage.removeItem('googleAccessToken');
        localStorage.removeItem('completedSubtitles');
        // Logout and redirect to login
        logout();
        navigate('/login');
      } catch (error) {
        setError('Failed to delete account. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="account-settings-container">
      <div className="account-settings-content">
        <h1>Account Settings</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="profile-section">
          <h2>Profile Picture</h2>
          <div className="profile-image-container">
            <img 
              src={profileImage} 
              alt="Profile" 
              className="profile-image"
            />
            <label className="upload-button">
              Change Picture
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        <div className="account-section">
          <h2>Account Management</h2>
          <div className="account-actions">
            <button 
              className="switch-account-button"
              onClick={handleSwitchAccount}
            >
              Switch Google Account
            </button>
            <button 
              className="delete-account-button"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </div>

        <div className="user-info">
          <h2>Account Information</h2>
          <div className="info-item">
            <label>Name:</label>
            <span>{user?.name}</span>
          </div>
          <div className="info-item">
            <label>Email:</label>
            <span>{user?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings; 