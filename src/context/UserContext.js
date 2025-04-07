import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [watchedVideos, setWatchedVideos] = useState({});
  const [sectionProgress, setSectionProgress] = useState({});

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('userData');
    const savedWatchedVideos = localStorage.getItem('watchedVideos');
    const savedProgress = localStorage.getItem('sectionProgress');

    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedWatchedVideos) setWatchedVideos(JSON.parse(savedWatchedVideos));
    if (savedProgress) setSectionProgress(JSON.parse(savedProgress));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (user) localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('watchedVideos', JSON.stringify(watchedVideos));
    localStorage.setItem('sectionProgress', JSON.stringify(sectionProgress));
  }, [user, watchedVideos, sectionProgress]);

  const updateUser = (userData) => {
    setUser(userData);
  };

  const removeUser = () => {
    setUser(null);
    setWatchedVideos({});
    setSectionProgress({});
    localStorage.removeItem('googleCredential');
    localStorage.removeItem('userData');
    localStorage.removeItem('watchedVideos');
    localStorage.removeItem('sectionProgress');
  };

  const markVideoAsWatched = (videoUrl) => {
    setWatchedVideos(prev => ({
      ...prev,
      [videoUrl]: true
    }));
  };

  const isVideoWatched = (videoUrl) => {
    return watchedVideos[videoUrl] || false;
  };

  const updateSectionProgress = (mainTitle, totalVideos, watchedCount) => {
    setSectionProgress(prev => ({
      ...prev,
      [mainTitle]: {
        total: totalVideos,
        watched: watchedCount,
        percentage: Math.round((watchedCount / totalVideos) * 100)
      }
    }));
  };

  const getSectionProgress = (mainTitle) => {
    return sectionProgress[mainTitle] || { total: 0, watched: 0, percentage: 0 };
  };

  return (
    <UserContext.Provider
      value={{
        user,
        updateUser,
        removeUser,
        isVideoWatched,
        markVideoAsWatched,
        updateSectionProgress,
        getSectionProgress
      }}
    >
      {children}
    </UserContext.Provider>
  );
}; 