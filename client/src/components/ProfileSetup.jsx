import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfileSetup.css';

const ProfileSetup = ({ onSubmit }) => {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    preferredName: '',
    dateOfBirth: '',
    location: '',
    medicalHistory: [{ condition: '', notes: '' }],
    medications: [{ name: '', dosage: '', schedule: '' }],
    allergies: [''],
    caregiverContacts: [{ name: '', phone: '', email: '' }],
    accessibility: { fontSize: 'Large', colorScheme: 'Soothing Pastels', voiceActivation: true },
    medicalReports: [] // New field for storing PDF files
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e, section, index) => {
    const { name, value } = e.target;

    if (section === 'simple') {
      setProfileData({ ...profileData, [name]: value });
    } else if (section === 'array') {
      const updatedArray = [...(profileData[name] || [])];
      updatedArray[index] = value;
      setProfileData({ ...profileData, [name]: updatedArray });
    } else if (section === 'objectArray') {
      const field = e.target.dataset.field;
      const updatedArray = [...profileData[name]];
      updatedArray[index] = { ...updatedArray[index], [field]: value };
      setProfileData({ ...profileData, [name]: updatedArray });
    } else if (section === 'accessibility') {
      setProfileData({
        ...profileData,
        accessibility: { ...profileData.accessibility, [name]: value }
      });
    }
  };

  const handleCheckboxChange = (e) => {
    setProfileData({
      ...profileData,
      accessibility: { ...profileData.accessibility, voiceActivation: e.target.checked }
    });
  };

  // Handle multiple PDF uploads
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setProfileData({ ...profileData, medicalReports: files });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);
  
  const handleSubmit = () => {
    const formData = new FormData();
    Object.entries(profileData).forEach(([key, value]) => {
      if (key === 'medicalReports') {
        value.forEach((file, index) => {
          formData.append(`medicalReports[${index}]`, file);
        });
      } else {
        formData.append(key, JSON.stringify(value));
      }
    });
    console.log('Submitting profile data:', profileData);
    setSuccess('✨ Profile set up successfully! Welcome to your journey...');
    onSubmit(formData);
    setTimeout(() => navigate('/journal'), 1000);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="setup-step">
            <h2>Let’s Get to Know You</h2>
            <div className="form-group">
              <label>Preferred Name:</label>
              <input
                name="preferredName"
                value={profileData.preferredName}
                onChange={(e) => handleChange(e, 'simple')}
                placeholder="What do you like to be called?"
              />
            </div>
            <div className="form-group">
              <label>Birthday:</label>
              <input
                type="date"
                name="dateOfBirth"
                value={profileData.dateOfBirth}
                onChange={(e) => handleChange(e, 'simple')}
              />
            </div>
            <div className="form-group">
              <label>Location:</label>
              <input
                name="location"
                value={profileData.location}
                onChange={(e) => handleChange(e, 'simple')}
                placeholder="Where do you live?"
              />
            </div>
            <button className="next-button" onClick={handleNext}>Next</button>
          </div>
        );
      case 2:
        return (
          <div className="setup-step">
            <h2>Your Health Matters</h2>
            <div className="form-group">
              <label>Medical Condition:</label>
              <input
                value={profileData.medicalHistory[0].condition}
                data-field="condition"
                name="medicalHistory"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="e.g., Diabetes"
              />
              <input
                value={profileData.medicalHistory[0].notes}
                data-field="notes"
                name="medicalHistory"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="Any notes?"
              />
            </div>
            <div className="form-group">
              <label>Medication:</label>
              <input
                value={profileData.medications[0].name}
                data-field="name"
                name="medications"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="e.g., Aspirin"
              />
              <input
                value={profileData.medications[0].schedule}
                data-field="schedule"
                name="medications"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="e.g., Daily at 8 AM"
              />
            </div>
            <div className="form-group">
              <label>Allergy:</label>
              <input
                value={profileData.allergies[0]}
                name="allergies"
                onChange={(e) => handleChange(e, 'array', 0)}
                placeholder="e.g., Peanuts"
              />
            </div>
            <div className="form-group">
              <label>Caregiver:</label>
              <input
                value={profileData.caregiverContacts[0].name}
                data-field="name"
                name="caregiverContacts"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="Name"
              />
              <input
                value={profileData.caregiverContacts[0].phone}
                data-field="phone"
                name="caregiverContacts"
                onChange={(e) => handleChange(e, 'objectArray', 0)}
                placeholder="Phone"
              />
            </div>
            <div className="form-group">
              <label>Medical Reports (PDFs):</label>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleFileChange}
              />
              {profileData.medicalReports.length > 0 && (
                <ul>
                  {profileData.medicalReports.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <button className="back-button" onClick={handleBack}>Back</button>
            <button className="next-button" onClick={handleNext}>Next</button>
          </div>
        );
      case 3:
        return (
          <div className="setup-step">
            <h2>Make It Comfortable</h2>
            <div className="form-group">
              <label>Font Size:</label>
              <select
                name="fontSize"
                value={profileData.accessibility.fontSize}
                onChange={(e) => handleChange(e, 'accessibility')}
              >
                <option value="Large">Large</option>
                <option value="Extra Large">Extra Large</option>
              </select>
            </div>
            <div className="form-group">
              <label>Color Scheme:</label>
              <select
                name="colorScheme"
                value={profileData.accessibility.colorScheme}
                onChange={(e) => handleChange(e, 'accessibility')}
              >
                <option value="Soothing Pastels">Soothing Pastels</option>
                <option value="High Contrast">High Contrast</option>
              </select>
            </div>
            <button className="back-button" onClick={handleBack}>Back</button>
            <button className="next-button" onClick={handleSubmit}>Finish</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="setup-container">
      <div className="vintage-background"></div>
      <div className="floating-shapes"></div>
      <div className="setup-card">
        <h1 className="welcome-title">Let’s Set Up Your Profile</h1>
        <p className="setup-subtitle">A few details to make this yours</p>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <div className="step-indicator">
          Step {step} of 3
        </div>
        {renderStep()}
      </div>
    </div>
  );
};

export default ProfileSetup;