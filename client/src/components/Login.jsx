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
};

const AnimatedIcon = ({ path }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="form-icon">
    <path d={path} fill="currentColor" />
  </svg>
);

const Login = ({ switchToSignup, onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '', general: '' });
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const randomIndex = Math.floor(Math.random() * comfortingQuotes.length);
    setQuote(comfortingQuotes[randomIndex]);
    const quoteInterval = setInterval(() => {
      if (isMounted) {
        const newIndex = Math.floor(Math.random() * comfortingQuotes.length);
        setQuote(comfortingQuotes[newIndex]);
      }
    }, 12000);
    return () => {
      isMounted = false;
      clearInterval(quoteInterval);
    };
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '', general: '' });

    if (name === 'email' && value && !validateEmail(value)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({ email: '', password: '', general: '' });

    if (!formData.email || !formData.password) {
      setErrors({
        email: !formData.email ? 'Email is required' : '',
        password: !formData.password ? 'Password is required' : '',
        general: '',
      });
      return;
    }

    if (!validateEmail(formData.email)) {
      setErrors({ ...errors, email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', formData, { timeout: 10000 });
      const { token } = response.data;
      onLoginSuccess(token);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrors({
        ...errors,
        general: err.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : 'Login failed. Please check your email and password.',
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    if (!showPassword) {
      setTimeout(() => setShowPassword(false), 5000);
    }
  };

  return (
    <div className="auth-container">
      <div className="vintage-background"></div>
      <div className="floating-shapes"></div>
      <div className="auth-card">
        <div className="card-decoration"></div>
        <h1 className="welcome-title">Welcome Back</h1>
        <p className="auth-subtitle">We're so happy to see you again</p>
        <div className="quote-container">
          <p className="inspirational-quote">{quote}</p>
        </div>
        {errors.general && (
          <div className="error-message" role="alert" aria-live="assertive">
            {errors.general}
          </div>
        )}
        <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="Enter your email"
                aria-label="Enter your email address"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                required
              />
              <div className="input-focus-effect"></div>
            </div>
            {errors.email && <div className="error-message">{errors.email}</div>}
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
                placeholder="Enter your password"
                aria-label="Enter your password"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                role="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
              <div className="input-focus-effect"></div>
            </div>
            {errors.password && <div className="error-message">{errors.password}</div>}
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            <span className="button-text">{loading ? 'Signing In...' : 'Sign In'}</span>
            <span className="button-shine"></span>
          </button>
        </form>
        <div className="auth-alt-option">
          <p>Don't have an account?</p>
          <button className="text-button" onClick={switchToSignup}>Create Account</button>
        </div>
        <div className="helper-text">
          <p>Need assistance? Your caregiver can help you sign in.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;