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
  const navigate = useNavigate();

  const switchToLogin = () => {
    setCurrentView('login');
    setIsRegistering(false);
  };
  const switchToSignup = () => {
    setCurrentView('signup');
    setIsRegistering(false);
  };

  const handleLoginSuccess = (token) => {
    onLogin(token);
    navigate('/journal');
  };

  const handleSignupNext = (data) => {
    setBasicInfo(data);
    setIsRegistering(true);
  };

  const handleRegisterComplete = (profileData) => {
    const registerData = { ...basicInfo, profile: profileData };
    axios.post('http://localhost:5000/api/users/register', registerData)
      .then(response => {
        const { token } = response.data;
        onLogin(token);
        navigate('/profile-setup'); // Redirect to profile setup after registration
      })
      .catch(err => {
        console.error('Registration error:', err);
        setCurrentView('signup');
        setIsRegistering(false);
      });
  };

  return (
    <div className="auth-container">
      <div className="vintage-background"></div>
      <div className="floating-shapes"></div>
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
  );
};

export default AuthPage;