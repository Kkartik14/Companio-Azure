import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import AuthPage from './components/AuthPage';
import JournalingComponent from './components/JournalingComponent';
import RoutineManagementApp from './components/RoutineManagementApp';
import EmpatheticChatbot from './components/EmpatheticChatbot';
import ProfileComponent from './components/ProfileComponent';
import ProfileSetup from './components/ProfileSetup';
import InteractiveStorytellingApp from './components/InteractiveStorytellingApp';
import Signup from './components/Signup'; 
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null means loading
  const [step, setStep] = useState('signup'); // For signup-to-profile flow
  const [signupData, setSignupData] = useState(null);

  // Validate token on app load
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Token validation failed:', err);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    };

    validateToken();
  }, []);

  // Handle login from AuthPage
  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  // Handle signup next step (move to profile setup)
  const handleSignupNext = (data) => {
    setSignupData(data);
    setStep('profile');
  };

  // Handle profile submission (register user and authenticate)
  const handleProfileSubmit = async (profileData) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/users/register',
        { ...signupData, profile: profileData },
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      console.log('User registered with profile:', response.data);
    } catch (error) {
      console.error('Error submitting profile:', error);
    }
  };

  const PrivateRoute = ({ element }) => {
    if (isAuthenticated === null) {
      return <div>Loading...</div>;
    }
    return isAuthenticated ? element : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<AuthPage onLogin={handleLogin} />} />
          <Route path="/register" element={<Signup onNext={handleSignupNext} switchToLogin={() => {}} />} />
          <Route
            path="/profile-setup"
            element={
              step === 'profile' && signupData ? (
                <ProfileSetup onSubmit={handleProfileSubmit} />
              ) : (
                <Navigate to="/register" />
              )
            }
          />
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Protected Routes */}
          <Route path="/journal" element={<PrivateRoute element={<JournalingComponent />} />} />
          <Route path="/routine" element={<PrivateRoute element={<RoutineManagementApp />} />} />
          <Route path="/chatbot" element={<PrivateRoute element={<EmpatheticChatbot />} />} />
          <Route path="/profile" element={<PrivateRoute element={<ProfileComponent />} />} />
          <Route path="/story" element={<PrivateRoute element={<InteractiveStorytellingApp />} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;