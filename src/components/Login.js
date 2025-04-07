import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';
import { saveUserData, updateUserEmail } from '../services/userService';
import './Login.css';

const Login = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const userData = localStorage.getItem('userData');
    const accessToken = localStorage.getItem('googleAccessToken');
    if (userData && accessToken) {
      navigate('/');
    }
  }, [navigate]);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError(null);
        
        // Get user info using the access token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            'Authorization': `Bearer ${tokenResponse.access_token}`
          }
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to get user info');
        }

        const userInfo = await userInfoResponse.json();
        
        // Create user data object
        const userData = {
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture
        };

        // Store user data and access token
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('googleAccessToken', tokenResponse.access_token);

        // Save user data to Sheet2
        await saveUserData(userData);

        // Update user email in the sheet
        await updateUserEmail(userData.email);

        toast.success('Login successful!');
        navigate('/course');
      } catch (err) {
        console.error('Login error:', err);
        setError(err.message || 'Login failed. Please try again.');
        localStorage.removeItem('user');
        localStorage.removeItem('googleAccessToken');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.');
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    flow: 'implicit'
  });

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Welcome to Course Demo</h1>
        <p className="login-subtitle">
          Sign in to access your course content and continue learning
        </p>
        <button 
          className="login-button"
          onClick={() => login()}
          disabled={loading}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google Logo" 
            className="google-logo"
          />
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default Login; 