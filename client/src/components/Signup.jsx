import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AuthStyles.css';

const comfortingQuotes = [
  "Today is a beautiful day to remember what matters most.",
  "You are surrounded by people who care about you.",
  "Small moments make the biggest memories.",
  "Take each day one step at a time, you're doing wonderfully.",
  "Your story is still being written, and it's a beautiful one.",
  "A garden of memories grows in the heart, even when the mind forgets.",
  "In this moment, you are exactly where you need to be.",
  "The greatest joy comes from connecting with those we love.",
  "Today's sunshine is a reminder of life's simple pleasures.",
  "Your presence brings warmth and joy to everyone around you."
];

const icons = {
  email: "M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z",
  password: "M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15 8H9V6C9 4.34 10.34 3 12 3C13.66 3 15 4.34 15 6V8Z",
  user: "M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
};

const AnimatedIcon = ({ path }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="form-icon">
    <path d={path} fill="currentColor" />
  </svg>
);

const Signup = ({ switchToLogin, onNext }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [formProgress, setFormProgress] = useState(0);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * comfortingQuotes.length);
    setQuote(comfortingQuotes[randomIndex]);
    const quoteInterval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * comfortingQuotes.length);
      setQuote(comfortingQuotes[newIndex]);
    }, 12000);
    return () => clearInterval(quoteInterval);
  }, []);

  useEffect(() => {
    const { fullName, email, password, confirmPassword } = formData;
    let progress = 0;
    if (fullName) progress += 25;
    if (email) progress += 25;
    if (password) progress += 25;
    if (confirmPassword) progress += 25;
    setFormProgress(progress);
  }, [formData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/users/register', {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('token', response.data.token);
      setSuccess('✨ Account created successfully! Let’s set up your profile...');
      document.querySelector('.auth-card').classList.add('success-animation');
      setTimeout(() => {
        onNext({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
        });
      }, 2500);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="auth-card">
      <div className="card-decoration"></div>
      <h1 className="welcome-title">Create Account</h1>
      <p className="auth-subtitle">Join our caring community</p>
      <div className="quote-container">
        <p className="inspirational-quote">{quote}</p>
      </div>
      <div className="form-progress-container">
        <div className="form-progress-bar" style={{ width: `${formProgress}%` }}></div>
        <span className="form-progress-text">{formProgress}% Complete</span>
      </div>
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className={`form-group ${focusedField === 'fullName' ? 'focused' : ''}`}>
          <label htmlFor="fullName">
            <AnimatedIcon path={icons.user} /> Full Name
          </label>
          <div className="input-wrapper">
            <input 
              type="text" 
              id="fullName" 
              name="fullName" 
              value={formData.fullName} 
              onChange={handleChange} 
              placeholder="Enter your full name"
              onFocus={() => setFocusedField('fullName')}
              onBlur={() => setFocusedField(null)}
              required 
            />
            <div className="input-focus-effect"></div>
          </div>
        </div>
        <div className={`form-group ${focusedField === 'email' ? 'focused' : ''}`}>
          <label htmlFor="email">
            <AnimatedIcon path={icons.email} /> Email Address
          </label>
          <div className="input-wrapper">
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="Enter your email address"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required 
            />
            <div className="input-focus-effect"></div>
          </div>
        </div>
        <div className={`form-group ${focusedField === 'password' ? 'focused' : ''}`}>
          <label htmlFor="password">
            <AnimatedIcon path={icons.password} /> Password
          </label>
          <div className="input-wrapper password-input">
            <input 
              type={showPassword ? "text" : "password"}
              id="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="Create a password (6+ characters)"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              required 
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            <div className="input-focus-effect"></div>
          </div>
        </div>
        <div className={`form-group ${focusedField === 'confirmPassword' ? 'focused' : ''}`}>
          <label htmlFor="confirmPassword">
            <AnimatedIcon path={icons.password} /> Confirm Password
          </label>
          <div className="input-wrapper password-input">
            <input 
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword" 
              name="confirmPassword" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
              placeholder="Enter password again"
              onFocus={() => setFocusedField('confirmPassword')}
              onBlur={() => setFocusedField(null)}
              required 
            />
            <button 
              type="button" 
              className="password-toggle"
              onClick={toggleConfirmPasswordVisibility}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
            <div className="input-focus-effect"></div>
          </div>
        </div>
        <button type="submit" className="auth-button" disabled={loading}>
          <span className="button-text">{loading ? 'Creating Account...' : 'Create Account'}</span>
          <span className="button-shine"></span>
        </button>
      </form>
      <div className="auth-alt-option">
        <p>Already have an account?</p>
        <button className="text-button" onClick={switchToLogin}>Sign In</button>
      </div>
      <div className="helper-text">
        <p>Need assistance? Your caregiver can help you create an account.</p>
      </div>
    </div>
  );
};

export default Signup;