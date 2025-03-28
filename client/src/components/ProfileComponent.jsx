import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProfileStyles.css';
import Navbar from './Navbar';
const ProfileComponent = () => {
  const [profile, setProfile] = useState({});
  const [insights, setInsights] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchInsights();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (err) {
      setError('Failed to load profile.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/profile/insights', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInsights(response.data);
    } catch (err) {
      console.error('Error fetching insights:', err);
    }
  };

  const handleUpdate = async (section, data) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/profile',
        { [section]: data },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile(response.data.profile);
      setEditMode(false);
    } catch (err) {
      setError('Failed to update profile.');
      console.error(err);
    }
  };

  if (loading) return <div className="profile-container">Loading...</div>;

  return (  
    <>
    <Navbar /> 
    <div className="profile-container">
      <div className="vintage-background"></div>
      <div className="floating-shapes"></div>

      <div className="profile-header">
        <h1 className="vintage-title">My Profile</h1>
        <div className="decorative-line"></div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Personal Information */}
      <section className="profile-section vintage-paper">
        <h2>Personal Information</h2>
        {editMode ? (
          <PersonalInfoForm profile={profile} onSave={(data) => handleUpdate('personal', data)} />
        ) : (
          <div>
            <p><strong>Name:</strong> {profile.preferredName || 'Not set'}</p>
            <p><strong>Birthday:</strong> {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not set'}</p>
            <p><strong>Location:</strong> {profile.location || 'Not set'}</p>
            <button className="edit-button" onClick={() => setEditMode(true)}>Edit</button>
          </div>
        )}
      </section>

      {/* Medical & Emergency Information */}
      <section className="profile-section vintage-paper">
        <h2>Medical & Emergency</h2>
        {editMode ? (
          <MedicalForm profile={profile} onSave={(data) => handleUpdate('medical', data)} />
        ) : (
          <div>
            <p><strong>Conditions:</strong> {profile.medicalHistory?.length ? profile.medicalHistory.map(m => m.condition).join(', ') : 'None'}</p>
            <p><strong>Medications:</strong> {profile.medications?.length ? profile.medications.map(m => `${m.name} (${m.schedule})`).join(', ') : 'None'}</p>
            <p><strong>Allergies:</strong> {profile.allergies?.length ? profile.allergies.join(', ') : 'None'}</p>
            <p><strong>Caregivers:</strong> {profile.caregiverContacts?.length ? profile.caregiverContacts.map(c => c.name).join(', ') : 'None'}</p>
            <button className="edit-button" onClick={() => setEditMode(true)}>Edit</button>
          </div>
        )}
      </section>

      {/* Accessibility Settings */}
      <section className="profile-section vintage-paper">
        <h2>Accessibility</h2>
        <div>
          <label>Font Size:</label>
          <select
            value={profile.accessibility?.fontSize || 'Large'}
            onChange={(e) => handleUpdate('accessibility', { ...profile.accessibility, fontSize: e.target.value })}
          >
            <option value="Large">Large</option>
            <option value="Extra Large">Extra Large</option>
          </select>
        </div>
        <div>
          <label>Color Scheme:</label>
          <select
            value={profile.accessibility?.colorScheme || 'Soothing Pastels'}
            onChange={(e) => handleUpdate('accessibility', { ...profile.accessibility, colorScheme: e.target.value })}
          >
            <option value="Soothing Pastels">Soothing Pastels</option>
            <option value="High Contrast">High Contrast</option>
          </select>
        </div>
      </section>
    </div>
    </>
  );
};

const PersonalInfoForm = ({ profile, onSave }) => {
  const [formData, setFormData] = useState({
    preferredName: profile.preferredName || '',
    dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '',
    location: profile.location || ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div>
      <label>Preferred Name:</label>
      <input name="preferredName" value={formData.preferredName} onChange={handleChange} />
      <label>Birthday:</label>
      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
      <label>Location:</label>
      <input name="location" value={formData.location} onChange={handleChange} />
      <button onClick={() => onSave(formData)}>Save</button>
    </div>
  );
};

const MedicalForm = ({ profile, onSave }) => {
  const [medicalHistory, setMedicalHistory] = useState(profile.medicalHistory || [{ condition: '', notes: '' }]);
  const [medications, setMedications] = useState(profile.medications || [{ name: '', dosage: '', schedule: '' }]);
  const [allergies, setAllergies] = useState(profile.allergies || ['']);
  const [caregiverContacts, setCaregiverContacts] = useState(profile.caregiverContacts || [{ name: '', phone: '', email: '' }]);

  const handleSave = () => {
    onSave({ medicalHistory, medications, allergies, caregiverContacts });
  };

  return (
    <div>
      <label>Conditions:</label>
      {medicalHistory.map((item, index) => (
        <div key={index}>
          <input
            value={item.condition}
            onChange={(e) => {
              const newHistory = [...medicalHistory];
              newHistory[index].condition = e.target.value;
              setMedicalHistory(newHistory);
            }}
            placeholder="Condition"
          />
          <input
            value={item.notes}
            onChange={(e) => {
              const newHistory = [...medicalHistory];
              newHistory[index].notes = e.target.value;
              setMedicalHistory(newHistory);
            }}
            placeholder="Notes"
          />
        </div>
      ))}
      <label>Medications:</label>
      {medications.map((item, index) => (
        <div key={index}>
          <input
            value={item.name}
            onChange={(e) => {
              const newMeds = [...medications];
              newMeds[index].name = e.target.value;
              setMedications(newMeds);
            }}
            placeholder="Name"
          />
          <input
            value={item.dosage}
            onChange={(e) => {
              const newMeds = [...medications];
              newMeds[index].dosage = e.target.value;
              setMedications(newMeds);
            }}
            placeholder="Dosage"
          />
          <input
            value={item.schedule}
            onChange={(e) => {
              const newMeds = [...medications];
              newMeds[index].schedule = e.target.value;
              setMedications(newMeds);
            }}
            placeholder="Schedule"
          />
        </div>
      ))}
      <label>Allergies:</label>
      {allergies.map((allergy, index) => (
        <input
          key={index}
          value={allergy}
          onChange={(e) => {
            const newAllergies = [...allergies];
            newAllergies[index] = e.target.value;
            setAllergies(newAllergies);
          }}
          placeholder="Allergy"
        />
      ))}
      <label>Caregivers:</label>
      {caregiverContacts.map((contact, index) => (
        <div key={index}>
          <input
            value={contact.name}
            onChange={(e) => {
              const newContacts = [...caregiverContacts];
              newContacts[index].name = e.target.value;
              setCaregiverContacts(newContacts);
            }}
            placeholder="Name"
          />
          <input
            value={contact.phone}
            onChange={(e) => {
              const newContacts = [...caregiverContacts];
              newContacts[index].phone = e.target.value;
              setCaregiverContacts(newContacts);
            }}
            placeholder="Phone"
          />
        </div>
      ))}
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default ProfileComponent;