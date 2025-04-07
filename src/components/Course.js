import React, { useState, useEffect } from 'react';
import { getCourseData, updateCompletionStatus } from '../services/userService';
import { useNavigate } from 'react-router-dom';
import './Course.css';
import { toast } from 'react-hot-toast';

const Course = () => {
  const [courseData, setCourseData] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [userName, setUserName] = useState('User');
  const [completedVideos, setCompletedVideos] = useState(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('googleAccessToken');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        navigate('/login');
        return false;
      }

      try {
        const user = JSON.parse(userData);
        if (!user || !user.email || !user.name) {
          navigate('/login');
          return false;
        }
        setUserName(user.name);
        return true;
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
        return false;
      }
    };

    const initializeData = async () => {
      if (!checkAuth()) {
        return;
      }

      try {
        await fetchCourseData();
      } catch (error) {
        console.error('Error initializing data:', error);
        if (error.message?.includes('No access token') || error.message?.includes('401')) {
          navigate('/login');
        }
      }
    };

    initializeData();
  }, [navigate]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('googleAccessToken');
      if (!token) {
        throw new Error('No access token available');
      }

      const data = await getCourseData();
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid course data received');
      }

      if (data.length === 0) {
        setError('No course content available');
        return;
      }

      setCourseData(data);
      
      // Set the first topic and video as selected by default
      if (data.length > 0 && data[0].subtitles?.length > 0) {
        setSelectedTopic(data[0].mainTopic);
        setSelectedVideo(data[0].subtitles[0]);
        
        // Initialize completed videos from the data
        const completed = new Set();
        data.forEach(course => {
          course.subtitles.forEach(subtitle => {
            if (subtitle.isCompleted) {
              completed.add(subtitle.videoId);
            }
          });
        });
        setCompletedVideos(completed);
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      if (err.message?.includes('No access token') || err.message?.includes('401')) {
        navigate('/login');
        return;
      }
      setError(err.message || 'Failed to load course data');
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchCourseData();
        }, 2000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchCourseData();
  };

  const handleTopicSelect = (topic) => {
    setSelectedTopic(topic);
    const topicData = courseData.find(item => item.mainTopic === topic);
    if (topicData && topicData.subtitles.length > 0) {
      setSelectedVideo(topicData.subtitles[0]);
    }
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('googleAccessToken');
    navigate('/login');
  };

  const getVideoUrl = (videoId) => {
    if (!videoId) return '';
    if (videoId.startsWith('http')) {
      const url = new URL(videoId);
      if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
        const videoId = url.searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return videoId;
    }
    return `https://www.youtube.com/embed/${videoId}`;
  };

  const toggleVideoCompletion = async (mainTopic, videoId) => {
    try {
      const newCompleted = !completedVideos.has(videoId);
      
      // Update the sheet
      await updateCompletionStatus(mainTopic, videoId, newCompleted);
      
      // Update local state
      setCompletedVideos(prev => {
        const newSet = new Set(prev);
        if (newCompleted) {
          newSet.add(videoId);
        } else {
          newSet.delete(videoId);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Error updating completion status:', error);
      toast.error('Failed to update completion status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Course</h2>
        <p>{error}</p>
        <button onClick={fetchCourseData}>Retry</button>
        <button onClick={handleLogout}>Return to Login</button>
      </div>
    );
  }

  if (!courseData.length) {
    return (
      <div className="error-container">
        <div className="error">No course data found</div>
        <button className="retry-button" onClick={handleRetry}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="course-container">
      <div className="top-bar">
        <div className="course-title">
          <span>📚</span> Course Content
        </div>
        <div className="user-section">
          <span className="welcome-text">
            Welcome, {userName}
          </span>
          <button className="logout-button" onClick={handleLogout}>
            <span className="logout-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>

      <div className="main-layout">
        <div className="course-list">
          {courseData.map((course, index) => (
            <div key={index} className="course-section">
              <div 
                className={`course-title ${selectedTopic === course.mainTopic ? 'active' : ''}`}
                onClick={() => handleTopicSelect(course.mainTopic)}
              >
                <span className="topic-icon">📚</span>
                {course.mainTopic}
              </div>
              <div className="subtitle-list">
                {course.subtitles?.map((subtitle, subIndex) => (
                  <div 
                    key={subIndex}
                    className={`subtitle-item ${selectedVideo?.videoId === subtitle.videoId ? 'active' : ''}`}
                    onClick={() => handleVideoSelect(subtitle)}
                  >
                    <div className="subtitle-content">
                      <span className="video-icon">▶️</span>
                      {subtitle.subtitle}
                    </div>
                    {course.accessStatus === 'Access Given' && (
                      <button 
                        className={`mark-done-button ${completedVideos.has(subtitle.videoId) ? 'completed' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVideoCompletion(course.mainTopic, subtitle.videoId);
                        }}
                      >
                        {completedVideos.has(subtitle.videoId) ? '✅' : '☐'}
                      </button>
                    )}
                    {course.accessStatus === 'Finish' && (
                      <div className="mark-done-button completed">
                        ✅
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selectedVideo && (
          <div className="video-section">
            <div className="video-container">
              <iframe
                src={getVideoUrl(selectedVideo.videoId)}
                title={selectedVideo.subtitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="video-description">
              <h3>{selectedVideo.subtitle}</h3>
              <p>{selectedVideo.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Course; 