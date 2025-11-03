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
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [step, setStep] = useState('signup');
  const [signupData, setSignupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate token on app load with improved error handling
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://localhost:5000/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000, // 5 second timeout
        });
        
        if (response.status === 200) {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Token validation failed:', err.message);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  // Handle login with success feedback
  const handleLogin = (token) => {
    if (!token) {
      console.error('Invalid token received');
      return;
    }
    
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  // Handle signup flow
  const handleSignupNext = (data) => {
    setSignupData(data);
    setStep('profile');
  };

  // Handle profile submission with better error handling
  const handleProfileSubmit = async (profileData) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/users/register',
        { ...signupData, profile: profileData },
        { 
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 10000, // 10 second timeout
        }
      );
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setIsAuthenticated(true);
        console.log('User registered successfully');
      }
    } catch (error) {
      console.error('Profile submission error:', error.response?.data || error.message);
      throw error; // Re-throw to let component handle it
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setSignupData(null);
    setStep('signup');
  };

  // Private route component with loading state
  const PrivateRoute = ({ element }) => {
    if (isLoading) {
      return (
        <div className="App-loading">
          <span>Loading your experience...</span>
        </div>
      );
    }
    
    return isAuthenticated ? element : <Navigate to="/login" replace />;
  };

  // Show loading screen during initial authentication check
  if (isLoading) {
    return (
      <div className="App">
        <div className="App-loading">
          <span>Initializing Companio...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                <Navigate to="/journal" replace /> : 
                <AuthPage onLogin={handleLogin} />
            } 
          />
          
          <Route 
            path="/register" 
            element={
              isAuthenticated ? 
                <Navigate to="/journal" replace /> : 
                <Signup onNext={handleSignupNext} switchToLogin={() => {}} />
            } 
          />
          
          <Route
            path="/profile-setup"
            element={
              step === 'profile' && signupData ? (
                <ProfileSetup onSubmit={handleProfileSubmit} />
              ) : (
                <Navigate to="/register" replace />
              )
            }
          />
          
          <Route 
            path="/" 
            element={
              <Navigate to={isAuthenticated ? "/journal" : "/login"} replace />
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/journal" 
            element={<PrivateRoute element={<JournalingComponent onLogout={handleLogout} />} />} 
          />
          
          <Route 
            path="/routine" 
            element={<PrivateRoute element={<RoutineManagementApp onLogout={handleLogout} />} />} 
          />
          
          <Route 
            path="/chatbot" 
            element={<PrivateRoute element={<EmpatheticChatbot onLogout={handleLogout} />} />} 
          />
          
          <Route 
            path="/profile" 
            element={<PrivateRoute element={<ProfileComponent onLogout={handleLogout} />} />} 
          />
          
          <Route 
            path="/story" 
            element={<PrivateRoute element={<InteractiveStorytellingApp onLogout={handleLogout} />} />} 
          />

          {/* 404 Route */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
