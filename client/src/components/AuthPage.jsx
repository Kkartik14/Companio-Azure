import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';
import Signup from './Signup';
import ProfileSetup from './ProfileSetup';
import './AuthStyles.css';

const AuthPage = ({ onLogin }) => {
  const [currentView, setCurrentView] = useState('login');
  const [isRegistering, setIsRegistering] = useState(false);
  const [basicInfo, setBasicInfo] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const switchToLogin = () => {
    setCurrentView('login');
    setIsRegistering(false);
    setError('');
  };

  const switchToSignup = () => {
    setCurrentView('signup');
    setIsRegistering(false);
    setError('');
  };

  const handleLoginSuccess = (token) => {
    onLogin(token);
    navigate('/journal');
  };

  const handleSignupNext = (data) => {
    setBasicInfo(data);
    setIsRegistering(true);
    setError('');
  };

  const handleRegisterComplete = async (profileData) => {
    setIsLoading(true);
    setError('');
    
    try {
      const registerData = { ...basicInfo, profile: profileData };
      const response = await axios.post(
        'http://localhost:5000/api/users/register', 
        registerData,
        { timeout: 10000 }
      );
      
      const { token } = response.data;
      
      if (token) {
        onLogin(token);
        navigate('/journal');
      } else {
        throw new Error('No token received from server');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 
        'Registration failed. Please try again.'
      );
      setCurrentView('signup');
      setIsRegistering(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Animated background elements */}
      <div className="vintage-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>
      
      <div className="floating-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="error-notification">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
          <button 
            className="error-close" 
            onClick={() => setError('')}
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p className="loading-text">Creating your account...</p>
        </div>
      )}

      {/* Main content */}
      <div className="auth-content">
        {isRegistering ? (
          <ProfileSetup onSubmit={handleRegisterComplete} />
        ) : currentView === 'login' ? (
          <Login 
            switchToSignup={switchToSignup} 
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <Signup 
            switchToLogin={switchToLogin} 
            onNext={handleSignupNext}
          />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
