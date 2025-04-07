import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
// import Course from './components/Course';
import Course from './components/Course';
import AccountSettings from './components/AccountSettings';
import { Toaster } from 'react-hot-toast';
import { UserProvider } from './context/UserContext';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const userData = localStorage.getItem('user');
  if (!userData) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <UserProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/course" element={
            <ProtectedRoute>
              <Course />
            </ProtectedRoute>
          } />
          <Route path="/account-settings" element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/course" replace />} />
          <Route path="*" element={<Navigate to="/course" replace />} />
        </Routes>
      </UserProvider>
    </>
  );
}

export default App;
