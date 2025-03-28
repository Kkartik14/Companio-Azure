// client/src/components/JournalingComponent.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
// --- Import Azure Speech SDK ---
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
// --- End Import ---
import '../styles/JournalingStyles.css'; // Make sure this path is correct
import Navbar from './Navbar'; // Make sure this path is correct

// Icon definitions (assuming these are correct)
const icons = {
  camera: "M12 15.2C13.8 15.2 15.2 13.8 15.2 12C15.2 10.2 13.8 8.8 12 8.8C10.2 8.8 8.8 10.2 8.8 12C8.8 13.8 10.2 15.2 12 15.2ZM9 2L7.17 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4H16.83L15 2H9Z",
  gallery: "M22 16V4C22 2.9 21.1 2 20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V6C22 4.9 21.1 4 20 4H16.83L15 2H9ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17Z",
  microphone: "M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM11 5C11 4.45 11.45 4 12 4C12.55 4 13 4.45 13 5V11C13 11.55 12.55 12 12 12C11.45 12 11 11.55 11 11V5ZM17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.9V21H13V17.9C16.39 17.43 19 14.53 19 11H17Z",
  save: "M17 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 15.66 15 15C15 13.34 13.66 12 12 12ZM6 6H15V10H6V6Z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  polaroid: "M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 14H4V7h4.05l1.83-2h4.24l1.83 2H20v12zM12 8c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  people: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  recall: "M21 8H3V6h18v2zm-2 4H5v-2h14v2zm-4 4H9v-2h6v2zm6 4H3v-2h18v2zM10 18h4v2h-4v-2zm0-12h4V12h-4v2z",
};

// Journal prompts (assuming these are correct)
const journalPrompts = [
  "What made your heart feel warm today?", "Share a memory that makes you smile...",
  "If this moment could be a scent...", "What small joy did you notice?",
  "Which song fits this memory?", "What do you want your future self to remember?",
  "Postcard to your past self?", "What colors and textures stand out?",
  "Who from your past would appreciate this?", "Title for this storybook page?",
  "What detail brings comfort?", "Childhood dream connection?",
  "What would a hug feel like now?", "If this memory were a season?"
];

// AnimatedIcon component (assuming this is correct)
const AnimatedIcon = ({ path, className = "" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`action-icon ${className}`}>
    <path d={path} fill="currentColor" />
  </svg>
);

const JournalingComponent = () => {
  // --- State Variables ---
  const [journalText, setJournalText] = useState('');
  const [withPeople, setWithPeople] = useState([]); // Array of names
  const [memories, setMemories] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [focusedField, setFocusedField] = useState(null); // For input focus styling
  const [loading, setLoading] = useState(false); // For save button state
  const [success, setSuccess] = useState(''); // Success messages
  const [error, setError] = useState(''); // General error messages
  const [filter, setFilter] = useState('none'); // Image filter (e.g., 'sepia')
  const [isFavorited, setIsFavorited] = useState(false);
  const [mood, setMood] = useState('');
  const [weatherEffect, setWeatherEffect] = useState('');
  const [capturing, setCapturing] = useState(false); // For webcam button state

  // State for Image Handling (Azure Blob Storage)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // Data URL for preview
  const [imageFile, setImageFile] = useState(null); // The actual File object for upload

  // State for Recall Feature
  const [showRecallOptions, setShowRecallOptions] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null); // Name of person being viewed
  const [personMemories, setPersonMemories] = useState([]); // Memories filtered by person
  const [peopleList, setPeopleList] = useState([]); // List of unique people from memories
  const [recalling, setRecalling] = useState(false); // For recall button state

  // State for Azure Speech-to-Text (STT)
  const [isAzureRecording, setIsAzureRecording] = useState(null); // Tracks which field is recording ('withPeople', 'journalText', or null)
  const [azureRecognizer, setAzureRecognizer] = useState(null); // Holds the SDK recognizer instance
  const [sttError, setSttError] = useState(''); // Specific errors for STT
  const targetFieldRef = useRef(null); // To track which input field STT should update

  // Refs
  const fileInputRef = useRef(null); // For triggering file selection
  const journalCardRef = useRef(null); // For parallax effect

  // Constants for UI
  const moodOptions = [
    "Joyful", "Peaceful", "Nostalgic", "Grateful", "Hopeful", "Cozy",
    "Reflective", "Content", "Dreamy", "Inspired"
  ];
  const weatherEffects = [
    { label: "None", value: "" }, { label: "Gentle Rain", value: "rain" },
    { label: "Soft Snow", value: "snow" }, { label: "Golden Sunshine", value: "sunshine" },
    { label: "Autumn Leaves", value: "leaves" }
  ];

  // --- Effects ---

  // Initial setup: Fetch memories, set prompt, play sound
  useEffect(() => {
    console.log('Initializing JournalingComponent...');
    const token = localStorage.getItem('token');
    if (token) {
      fetchMemories();
    } else {
      setError('Please log in to start preserving your memories.');
    }

    // Set initial random prompt
    const randomIndex = Math.floor(Math.random() * journalPrompts.length);
    setPrompt(journalPrompts[randomIndex]);

    // Interval to change prompt periodically
    const promptInterval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * journalPrompts.length);
      setPrompt(journalPrompts[newIndex]);
    }, 20000);

    // Play initial sound effect
    const pageTurnSound = new Audio('/sounds/page-turn.mp3');
    pageTurnSound.volume = 0.3;
    pageTurnSound.play().catch(e => console.log('Audio autoplay prevented:', e));

    // --- WebSocket Setup (Assuming this part is correct from previous code) ---
    let websocket;
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 2000;

    const connectWebSocket = () => {
        console.log('Connecting to WebSocket...');
        websocket = new WebSocket('ws://localhost:5000'); // Ensure your WebSocket server URL is correct
        websocket.onopen = () => { console.log('WebSocket connected'); retryCount = 0; };
        websocket.onmessage = handleWebSocketMessage; // Use separate handler function
        websocket.onclose = () => {
            console.log('WebSocket disconnected');
            if (retryCount < maxRetries) {
                setTimeout(() => {
                    console.log(`Retrying WebSocket connection (${retryCount + 1}/${maxRetries})...`);
                    retryCount++;
                    connectWebSocket();
                }, retryInterval);
            } else {
                setError('Failed to connect to WebSocket server after multiple attempts.');
            }
        };
        websocket.onerror = (error) => { console.error('WebSocket error:', error); websocket.close(); };
    };
    connectWebSocket();
    // --- End WebSocket Setup ---

    // Cleanup function
    return () => {
      console.log('Cleaning up JournalingComponent...');
      clearInterval(promptInterval);
      if (websocket) websocket.close();
      // Ensure Azure recognizer is stopped and closed on unmount
      if (azureRecognizer) {
          console.log("Closing Azure recognizer on component unmount.");
          stopAzureRecognition(); // Use the cleanup function
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount


  // Parallax effect for the journal card
  useEffect(() => {
    const card = journalCardRef.current;
    if (!card) return;

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const tiltX = (x - centerX) / 20; // Adjust divisor for sensitivity
      const tiltY = (y - centerY) / -20; // Adjust divisor and sign for direction
      card.style.transform = `perspective(1000px) rotateX(${tiltY}deg) rotateY(${tiltX}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []); // Run only once on mount

  // --- Helper Functions ---

  // Function to fetch memories from the backend
  const fetchMemories = async () => {
    console.log("Fetching memories...");
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to view your memories.');
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5000/api/journal', config);
      setMemories(response.data); // Assumes backend sends image URLs with SAS tokens
      // Extract unique people for recall list
      const uniquePeople = [...new Set(response.data.flatMap(memory => memory.withPeople || []).map(p => p.trim()).filter(Boolean))];
      setPeopleList(uniquePeople);
      setError(''); // Clear previous errors
      console.log("Memories fetched successfully.");
    } catch (error) {
      console.error('Error fetching memories:', error.response?.data || error.message);
      const status = error.response?.status;
      if (status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token'); // Clear invalid token
      } else {
        setError('Failed to fetch memories. Please try again later.');
      }
    }
  };

  // Function to fetch Azure Speech Token from backend
  const fetchSpeechToken = async () => {
    const backendToken = localStorage.getItem('token'); // Auth token for *your* backend
    if (!backendToken) {
      setSttError("Authentication required to use speech features.");
      return null;
    }
    try {
      console.log('Fetching speech token from backend...');
      const response = await axios.get('http://localhost:5000/api/speech/token', { // Ensure this endpoint exists
        headers: { Authorization: `Bearer ${backendToken}` }
      });
      console.log('Speech token received.');
      return { authToken: response.data.token, region: response.data.region };
    } catch (error) {
      console.error('Error fetching speech token:', error.response?.data || error.message);
      setSttError(`Could not get speech credentials: ${error.response?.data?.message || error.message}`);
      return null;
    }
  };

  // --- WebSocket Message Handler ---
  const handleWebSocketMessage = (event) => {
    console.log('WebSocket message received:', event.data);
    try {
      const data = JSON.parse(event.data);

      if (data.type === 'frameCaptured') {
        handleFrameCaptured(); // Call separate handler
      } else if (data.type === 'faceRecognition') {
        handleFaceRecognitionResult(data.result); // Call separate handler
      } else if (data.type === 'newPersonPrompt') {
        // Handle prompt for new person name (if needed, depends on Python script logic)
        console.log('Received prompt for new person name via WebSocket');
        // Potentially update UI to ask for name input
      }
       // Handle other message types if necessary

    } catch (e) {
      console.error('Error parsing WebSocket message:', e);
      setError('Error processing message from server.');
      // Reset potentially stuck loading states
      setCapturing(false);
      setRecalling(false);
    }
  };

  const handleFrameCaptured = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view captured photos.');
        setCapturing(false);
        return;
      }
      console.log('Received frameCaptured message, fetching from /api/captured-frame');
      fetch('http://localhost:5000/api/captured-frame', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        console.log('Fetch /api/captured-frame response status:', response.status);
        if (!response.ok) {
          if (response.status === 401) { throw new Error('Unauthorized: Please log in again.'); }
          else if (response.status === 404) { throw new Error('Captured frame not found on server for user.'); }
          else { throw new Error(`Failed to fetch frame, status: ${response.status}`); }
        }
        return response.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('Setting image preview URL and file state from webcam capture');
          setImagePreviewUrl(reader.result); // Set preview
          // Create a File object for potential saving
          const capturedFile = new File([blob], `webcam_${Date.now()}.jpg`, { type: blob.type || 'image/jpeg' });
          setImageFile(capturedFile); // Set file state for upload
          setCapturing(false); // Update capturing state

          // Play sound
          const shutterSound = new Audio('/sounds/camera-shutter.mp3');
          shutterSound.volume = 0.5;
          shutterSound.play().catch(e => console.log('Audio play prevented:', e));
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => {
        console.error('Error fetching/processing captured frame:', err.message);
        if (err.message.includes('Unauthorized')) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('token');
        } else {
          setError('Failed to load captured image: ' + err.message);
        }
        setCapturing(false);
      });
  };

  const handleFaceRecognitionResult = (result) => {
       console.log('Face recognition result:', result);
       if (result.status === 'success' && result.faces && result.faces.length > 0) {
           // Assuming the Python script sends back the name if recognized
           const recognizedFace = result.faces.find(face => face.recognized && face.name);
           if (recognizedFace) {
               console.log(`Recognized person: ${recognizedFace.name}, fetching their memories.`);
               fetchMemoriesByPerson(recognizedFace.name); // Trigger recall
           } else {
               console.log('No recognized person found in the capture.');
               setError('No recognized person found in the capture.');
               setRecalling(false); // Stop recall loading state
           }
       } else if (result.status === 'success') {
           console.log('No faces detected in the capture.');
           setError('No faces detected in the capture.');
           setRecalling(false);
       } else {
            // Handle potential error status from Python script result
            console.error('Face recognition script reported an error:', result.message || 'Unknown error');
            setError(result.message || 'Face recognition failed.');
            setRecalling(false);
       }
  };

  // --- Event Handlers ---

  // Handle image capture via device camera
  const handleCapturePhoto = () => {
    console.log('handleCapturePhoto triggered');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'camera'; // Trigger device camera
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file); // Store the File object
        const reader = new FileReader();
        reader.onloadend = () => setImagePreviewUrl(reader.result); // Set preview URL
        reader.readAsDataURL(file);
        // Play sound
        const shutterSound = new Audio('/sounds/camera-shutter.mp3');
        shutterSound.volume = 0.5;
        shutterSound.play().catch(err => console.log('Audio play prevented:', err));
      }
    };
    input.click();
  };

  // Trigger hidden file input for gallery selection
  const handleSelectFromGallery = () => {
    console.log('handleSelectFromGallery triggered');
    fileInputRef.current?.click();
  };

  // Handle file selection from gallery input
  const handleFileChange = (e) => {
    console.log('handleFileChange triggered');
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file); // Store the File object
      const reader = new FileReader();
      reader.onloadend = () => setImagePreviewUrl(reader.result); // Set preview URL
      reader.readAsDataURL(file);
      // Play sound
      const pageFlipSound = new Audio('/sounds/page-flip.mp3');
      pageFlipSound.volume = 0.3;
      pageFlipSound.play().catch(err => console.log('Audio play prevented:', err));
    }
  };

  // Trigger backend to start webcam capture via Python
  const handleCaptureFromWebcam = async () => {
    console.log('handleCaptureFromWebcam triggered');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to use webcam capture.');
      return;
    }
    setCapturing(true); // Set loading state
    setError(''); // Clear previous errors
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Timeout handled on the backend if necessary
      await axios.post('http://localhost:5000/api/face-recognition/capture', {}, config);
      // Response/Image update will be handled by the WebSocket message handler 'handleFrameCaptured'
      console.log("Webcam capture request sent to backend.");
    } catch (error) {
      console.error('Error triggering webcam capture:', error.response?.data || error.message);
      const status = error.response?.status;
      if (status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
      } else {
        setError('Failed to start webcam capture: ' + (error.response?.data?.error || error.message));
      }
      setCapturing(false); // Reset loading state on error
    }
    // Note: setCapturing(false) will be called in handleFrameCaptured on success
  };

  // --- Azure STT Functions ---

  const startAzureRecognition = async (field) => {
    console.log(`Attempting to start Azure STT for field: ${field}`);
    setSttError('');
    targetFieldRef.current = field;

    // Stop previous session if recording a different field
    if (isAzureRecording && isAzureRecording !== field) {
      console.log('Stopping previous recording for field:', isAzureRecording);
      await stopAzureRecognition();
      await new Promise(resolve => setTimeout(resolve, 200)); // Brief pause
    } else if (isAzureRecording === field) {
        console.log("Already recording for this field. Doing nothing.");
        return; // Avoid restarting if already recording for the same field
    }


    const tokenData = await fetchSpeechToken();
    if (!tokenData) return;

    try {
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(tokenData.authToken, tokenData.region);
      speechConfig.speechRecognitionLanguage = 'en-US';
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

      setAzureRecognizer(recognizer); // Store instance before setting callbacks

      console.log('Azure Recognizer created. Setting up callbacks...');

      recognizer.recognized = (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const transcript = e.result.text;
          console.log(`RECOGNIZED: Text=${transcript}`);
          const currentField = targetFieldRef.current;

          if (currentField === 'withPeople') {
             // Basic parsing: split by comma or 'and', trim whitespace, remove empty strings and trailing periods
             const peopleArray = transcript
                 .replace(/\.$/, '') // Remove trailing period
                 .split(/,|\band\b/i) // Split by comma or 'and' (case-insensitive)
                 .map(name => name.trim())
                 .filter(Boolean); // Remove empty strings
             console.log('Updating withPeople state with parsed array:', peopleArray);
             setWithPeople(peopleArray); // Replace current state

          } else if (currentField === 'journalText') {
            console.log('Appending to journalText state with:', transcript);
            // Append recognized text to existing text, ensuring a space if needed
            setJournalText(prev => (prev ? `${prev.trim()} ${transcript}` : transcript).trim());
          }
        } else if (e.result.reason === SpeechSDK.ResultReason.NoMatch) {
          console.log("NOMATCH: Speech could not be recognized.");
          // Optionally set a temporary error or message
        }
      };

      recognizer.canceled = (s, e) => {
        console.error(`CANCELED: Reason=${e.reason}`);
        let errorMessage = `Speech recognition canceled: ${SpeechSDK.CancellationReason[e.reason]}.`;
        if (e.reason === SpeechSDK.CancellationReason.Error) {
           errorMessage += ` ErrorDetails=${e.errorDetails}`;
           console.error(errorMessage);
           if (e.errorDetails.includes("permission") || e.errorCode === 1006 /*SPXERR_MIC_NOT_AVAILABLE maybe?*/ ) {
               errorMessage = "Microphone access denied or not found. Please check browser/system settings.";
           } else if (e.errorDetails.includes("1002") || e.errorDetails.includes("authentication")) {
               errorMessage = "Network error or invalid speech key/region. Please check connection and configuration.";
           }
        }
        setSttError(errorMessage);
        // Ensure cleanup happens on cancellation
        if (azureRecognizer === recognizer) { // Check if it's the current recognizer
            stopAzureRecognition(); // Use the cleanup function
        } else {
            recognizer.close(); // Close the specific recognizer that was cancelled
        }
      };

      recognizer.sessionStopped = (s, e) => {
        console.log("Azure STT Session stopped event.");
        // If the session stops unexpectedly (not via manual stop), clean up.
         if (isAzureRecording === targetFieldRef.current && azureRecognizer === recognizer) {
            console.log("Session stopped unexpectedly, cleaning up.");
            setIsAzureRecording(null);
            setAzureRecognizer(null);
            targetFieldRef.current = null;
         }
      };

      console.log('Starting continuous recognition...');
      // Use startContinuousRecognitionAsync for potentially longer inputs
      await recognizer.startContinuousRecognitionAsync();
      console.log("Azure STT Recognition started successfully.");
      setIsAzureRecording(field); // Update state *after* successful start

    } catch (error) {
      console.error("Error setting up or starting Azure Speech SDK:", error);
      setSttError(`Failed to initialize/start speech recognition: ${error.message || error}`);
      setIsAzureRecording(null);
      setAzureRecognizer(null); // Clean up on error
      targetFieldRef.current = null;
    }
  };

  const stopAzureRecognition = async () => {
      const currentRecognizer = azureRecognizer; // Capture current recognizer instance
      console.log('Attempting to stop Azure STT...');

      if (currentRecognizer) {
          setIsAzureRecording(null); // Update UI state immediately
          targetFieldRef.current = null;
          setAzureRecognizer(null); // Clear the state reference *before* async operations

          try {
              console.log("Calling stopContinuousRecognitionAsync...");
              await currentRecognizer.stopContinuousRecognitionAsync();
              console.log('Azure STT stopped successfully via API call.');
          } catch (error) {
              console.error("Error during stopContinuousRecognitionAsync:", error);
              // Log error, but proceed with closing
          } finally {
              console.log("Closing Azure recognizer resource.");
              currentRecognizer.close(); // Close the captured instance
          }
      } else {
          console.log("No active Azure recognizer to stop.");
          // Ensure state is consistent even if no recognizer was found
          setIsAzureRecording(null);
          targetFieldRef.current = null;
      }
  };

  // Unified handler for microphone button clicks
  const handleAzureVoiceInput = (field) => {
    if (isAzureRecording === field) {
      // If clicking the button for the field that's currently recording, stop it.
      stopAzureRecognition();
    } else {
      // Otherwise (not recording, or recording for a different field), start it for this field.
      startAzureRecognition(field);
    }
  };

  // --- Other UI Handlers ---

  const toggleFavorite = () => {
    console.log('toggleFavorite triggered');
    setIsFavorited(!isFavorited);
    const heartSound = new Audio('/sounds/heart.mp3');
    heartSound.volume = 0.3;
    heartSound.play().catch(e => console.log('Audio play prevented:', e));
  };

  const applyFilter = (selectedFilter) => {
    console.log('applyFilter triggered with filter:', selectedFilter);
    setFilter(selectedFilter);
  };

  // --- Save Memory Handler (Azure Blob Storage Upload) ---
  const handleSaveMemory = async () => {
    console.log('handleSaveMemory triggered');
    if (!imageFile || !journalText) {
      setError('Please add both a photo and some text to save your memory.');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to save your memory.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Get SAS URL from backend
      console.log('Requesting SAS URL...');
      const sasResponse = await axios.get('http://localhost:5000/api/storage/sas', {
        headers: { Authorization: `Bearer ${token}` },
        params: { fileType: imageFile.type }
      });
      const { sasUrl, blobName, storageAccountUrl } = sasResponse.data;
      if (!sasUrl || !blobName || !storageAccountUrl) throw new Error("Invalid SAS response from server.");
      console.log(`Received SAS URL for blob: ${blobName}`);

      // 2. Upload image file to Azure Blob Storage
      console.log('Uploading image to Azure Blob Storage...');
      const uploadResponse = await fetch(sasUrl, {
        method: 'PUT',
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': imageFile.type,
        },
        body: imageFile,
      });

      if (!uploadResponse.ok) {
         let errorBody = '';
         try { errorBody = await uploadResponse.text(); } catch (_) {}
        throw new Error(`Azure Blob Storage upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. Details: ${errorBody}`);
      }
      console.log('Image uploaded successfully to Azure.');

      // 3. Construct final image URL (important: use the base URL + blobName)
      const finalImageUrl = `${storageAccountUrl}/${blobName}`; // Assumes storageAccountUrl includes container
      console.log('Final Image URL:', finalImageUrl);

      // 4. Save journal metadata (with final URL) to your backend
      console.log('Saving journal metadata to backend...');
      const journalPayload = {
        imageUrl: finalImageUrl, // Use the Azure URL
        text: journalText,
        withPeople: withPeople, // Send the array of names
        mood: mood,
        filter: filter,
        isFavorited: isFavorited,
        weatherEffect: weatherEffect
      };
      await axios.post('http://localhost:5000/api/journal', journalPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 5. Handle success
      console.log('Journal metadata saved successfully.');
      setSuccess('✨ Memory beautifully preserved!');
      document.querySelector('.journal-card')?.classList.add('success-animation');
      const successSound = new Audio('/sounds/success.mp3');
      successSound.volume = 0.5;
      successSound.play().catch(e => console.log('Audio play prevented:', e));

      // 6. Reset form after delay
      setTimeout(() => {
        setImagePreviewUrl(null);
        setImageFile(null);
        setJournalText('');
        setWithPeople([]);
        setSuccess('');
        setFilter('none');
        setIsFavorited(false);
        setMood('');
        setWeatherEffect('');
        document.querySelector('.journal-card')?.classList.remove('success-animation');
        fetchMemories(); // Refresh memory list
      }, 2500);

    } catch (error) {
      console.error('Error saving memory:', error.response?.data || error.message || error);
      let errMsg = 'Unable to save your memory. Please try again.';
       if (error.message?.includes('SAS')) errMsg = `Failed to prepare image upload. ${error.message}`;
       else if (error.message?.includes('Azure Blob Storage upload failed')) errMsg = `Image upload failed. ${error.message}`;
       else if (error.response?.status === 401) { errMsg = 'Session expired. Please log in again.'; localStorage.removeItem('token');}
       else if (error.response?.data?.message) errMsg = `Failed to save memory data: ${error.response.data.message}`;
      setError(errMsg);
    } finally {
      setLoading(false); // Ensure loading state is turned off
    }
  };


  // --- Recall Functions ---

  const fetchMemoriesByPerson = async (personName) => {
    console.log(`Fetching memories for person: ${personName}`);
    setRecalling(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) { throw new Error('Log in to recall memories.'); }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('http://localhost:5000/api/journal', config);

      // Filter locally (case-insensitive)
      const filteredMemories = response.data.filter(memory =>
        memory.withPeople?.some(p => p.trim().toLowerCase() === personName.trim().toLowerCase())
      );

      console.log(`Found ${filteredMemories.length} memories for ${personName}`);
      setPersonMemories(filteredMemories);
      setSelectedPerson(personName);
      setShowRecallOptions(false); // Close modal on success

      const recallSound = new Audio('/sounds/memory-recall.mp3');
      recallSound.volume = 0.4;
      recallSound.play().catch(e => console.log('Audio play prevented:', e));

    } catch (error) {
      console.error('Error fetching person memories:', error.response?.data || error.message);
      setError(error.message || 'Failed to recall memories.');
       if (error.response?.status === 401) localStorage.removeItem('token');
    } finally {
      setRecalling(false);
    }
  };

  const handleSelectPerson = (person) => {
    console.log(`Selected person for recall: ${person}`);
    fetchMemoriesByPerson(person);
  };

  const handleRecallFromWebcam = async () => {
    console.log('handleRecallFromWebcam triggered');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to use webcam recall.');
      return;
    }
    setRecalling(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      // Trigger backend, result handled by WebSocket 'handleFaceRecognitionResult'
      await axios.post('http://localhost:5000/api/face-recognition/capture', {}, config);
      console.log("Webcam recall request sent.");
    } catch (error) {
      console.error('Error triggering webcam recall:', error.response?.data || error.message);
      setError('Failed to start webcam recall: ' + (error.response?.data?.error || error.message));
      setRecalling(false); // Reset state on error
       if (error.response?.status === 401) localStorage.removeItem('token');
    }
     // Note: setRecalling(false) will be called in handleFaceRecognitionResult on success/failure
  };

  // --- Render Functions ---

  const renderWeatherEffect = () => {
    // ... (implementation remains the same as before) ...
     if (!weatherEffect) return null;
     // Return JSX for rain, snow, etc. based on weatherEffect value
     return (
       <div className={`weather-effect ${weatherEffect}`}>
         {/* Conditional rendering for different effects */}
         {weatherEffect === 'rain' && Array.from({length: 20}).map((_, i) => <div key={i} className="raindrop" style={{ left: `${Math.random() * 100}%`, animationDuration: `${0.8 + Math.random()}s`, animationDelay: `${Math.random()}s` }}></div>)}
         {weatherEffect === 'snow' && Array.from({length: 30}).map((_, i) => <div key={i} className="snowflake" style={{ left: `${Math.random() * 100}%`, animationDuration: `${3 + Math.random() * 5}s`, animationDelay: `${Math.random()}s` }}></div>)}
         {weatherEffect === 'sunshine' && Array.from({length: 5}).map((_, i) => <div key={i} className="sunshine-ray" style={{ transform: `rotate(${i * 72}deg)` }}></div>)}
         {weatherEffect === 'leaves' && Array.from({length: 15}).map((_, i) => <div key={i} className="falling-leaf" style={{ left: `${Math.random() * 100}%`, animationDuration: `${5 + Math.random() * 8}s`, animationDelay: `${Math.random() * 5}s` }}></div>)}
       </div>
     );
  };

  // --- JSX Return ---
  return (
    <>
      <Navbar />
      <div className="journal-container">
        <div className="vintage-background"></div>
        <div className="floating-shapes"></div>
        {renderWeatherEffect()}

        {/* Header */}
        <div className="journal-header">
          <h1 className="vintage-title">Memory Keeper</h1>
          <div className="decorative-line"></div>
        </div>

        {/* Journal Card */}
        <div ref={journalCardRef} className="journal-card vintage-paper">
          <div className="card-decoration"></div>
          <div className="paper-texture"></div>
          <div className="card-corner top-left"></div>
          <div className="card-corner top-right"></div>
          <div className="card-corner bottom-left"></div>
          <div className="card-corner bottom-right"></div>

          <div className="journal-title-wrapper">
            <AnimatedIcon path={icons.polaroid} className="title-icon" />
            <h1 className="welcome-title">My Cherished Moments</h1>
            <AnimatedIcon path={icons.polaroid} className="title-icon" />
          </div>
          <p className="journal-subtitle">Capture the little things that warm your heart</p>

          {/* Prompt */}
          <div className="prompt-container">
            <div className="prompt-decoration left"></div>
            <p className="journal-prompt">{prompt}</p>
            <div className="prompt-decoration right"></div>
          </div>

          {/* Status Messages */}
          {sttError && <div className="error-message stt-error">🎤 STT Error: {sttError}</div>}
          {success && <div className="success-message"><AnimatedIcon path={icons.heart} /> {success}</div>}
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
              {error.includes('log in') && ( <button className="login-prompt-button" onClick={() => window.location.href = '/login'}>Log In</button> )}
            </div>
          )}

          {/* --- Journal Form --- */}
          <div className="journal-form">

            {/* Image Area */}
            <div className={`image-container ${filter}`}>
              {imagePreviewUrl ? (
                <>
                  <img src={imagePreviewUrl} alt="Memory Preview" className={`memory-image ${filter}`} />
                  <button
                    className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
                    onClick={toggleFavorite}
                    aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                  >
                    <AnimatedIcon path={icons.heart} />
                  </button>
                </>
              ) : (
                <div className="image-placeholder">
                  <AnimatedIcon path={icons.polaroid} className="placeholder-icon" />
                  <p>Add a photo of your special moment</p>
                </div>
              )}
            </div>

            {/* Filter Options (Show if image exists) */}
            {imagePreviewUrl && (
              <div className="filter-options">
                <p className="filter-label">Photo style:</p>
                <div className="filter-buttons">
                   {['none', 'sepia', 'polaroid', 'faded', 'blackwhite'].map(f => (
                        <button
                            key={f}
                            className={`filter-button ${filter === f ? 'active' : ''}`}
                            onClick={() => applyFilter(f)}
                        >
                           {f === 'none' ? 'Original' : f === 'sepia' ? 'Vintage' : f === 'polaroid' ? 'Polaroid' : f === 'faded' ? 'Dreamy' : 'Classic'}
                        </button>
                   ))}
                </div>
              </div>
            )}

            {/* Photo Action Buttons */}
            <div className="photo-actions">
              <button className="action-button camera-button" onClick={handleCapturePhoto}>
                <AnimatedIcon path={icons.camera} /> <span>Capture Moment</span>
              </button>
              <button className="action-button gallery-button" onClick={handleSelectFromGallery}>
                <AnimatedIcon path={icons.gallery} /> <span>My Photos</span>
              </button>
              <button className="action-button webcam-capture-button" onClick={handleCaptureFromWebcam} disabled={capturing}>
                <AnimatedIcon path={icons.camera} /> <span>{capturing ? 'Capturing...' : 'Capture from cam'}</span>
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }}/>
            </div>

            {/* 'With People' Input */}
            <div className={`form-group ${focusedField === 'withPeople' ? 'focused' : ''}`}>
              <label htmlFor="with-people"><AnimatedIcon path={icons.people} className="form-icon" /> Who was with you?</label>
              <div className="input-wrapper">
                <input
                  id="with-people" name="with-people" className="vintage-input"
                  value={withPeople.join(', ')}
                  onChange={(e) => setWithPeople(e.target.value.split(',').map(n => n.trim()).filter(Boolean))}
                  placeholder="Names (e.g., John, Mary)"
                  onFocus={() => setFocusedField('withPeople')} onBlur={() => setFocusedField(null)}
                  readOnly={isAzureRecording === 'withPeople'}
                />
                <button
                  className={`mic-button ${isAzureRecording === 'withPeople' ? 'recording' : ''}`}
                  onClick={() => handleAzureVoiceInput('withPeople')}
                  aria-label={isAzureRecording === 'withPeople' ? "Stop recording names" : "Record names"}
                  disabled={!!isAzureRecording && isAzureRecording !== 'withPeople'} // Disable if other field is recording
                >
                  <AnimatedIcon path={icons.microphone} />
                </button>
                <div className="input-focus-effect"></div> {/* For styling */}
                <div className="input-decorations"> {/* For styling */}
                   <div className="input-decoration top-left"></div><div className="input-decoration top-right"></div>
                   <div className="input-decoration bottom-left"></div><div className="input-decoration bottom-right"></div>
                </div>
              </div>
            </div>

            {/* 'Journal Text' Input */}
            <div className={`form-group ${focusedField === 'journal' ? 'focused' : ''}`}>
              <label htmlFor="journal-text"><AnimatedIcon path={icons.star} className="form-icon" /> Tell me about this memory:</label>
              <div className="input-wrapper">
                <textarea
                  id="journal-text" name="journal-text" className="vintage-input"
                  value={journalText}
                  onChange={(e) => setJournalText(e.target.value)}
                  placeholder="What makes this moment special? Sensations?"
                  rows={4}
                  onFocus={() => setFocusedField('journal')} onBlur={() => setFocusedField(null)}
                  readOnly={isAzureRecording === 'journalText'}
                />
                <button
                  className={`mic-button ${isAzureRecording === 'journalText' ? 'recording' : ''}`}
                  onClick={() => handleAzureVoiceInput('journalText')}
                  aria-label={isAzureRecording === 'journalText' ? "Stop recording description" : "Record description"}
                  disabled={!!isAzureRecording && isAzureRecording !== 'journalText'} // Disable if other field is recording
                >
                  <AnimatedIcon path={icons.microphone} />
                </button>
                 <div className="input-focus-effect"></div> {/* For styling */}
                 <div className="input-decorations"> {/* For styling */}
                   <div className="input-decoration top-left"></div><div className="input-decoration top-right"></div>
                   <div className="input-decoration bottom-left"></div><div className="input-decoration bottom-right"></div>
                 </div>
              </div>
            </div>

            {/* Mood Selector */}
            <div className="mood-selector">
              <label>How did this moment make you feel?</label>
              <div className="mood-buttons">
                {moodOptions.map(option => (
                  <button key={option} className={`mood-button ${mood === option ? 'selected' : ''}`} onClick={() => setMood(option)}>
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Ambiance Selector */}
            <div className="ambiance-selector">
              <label>Choose a mood setting:</label>
              <select value={weatherEffect} onChange={(e) => setWeatherEffect(e.target.value)} className="vintage-select">
                {weatherEffects.map(effect => (<option key={effect.value} value={effect.value}>{effect.label}</option>))}
              </select>
            </div>

            {/* Save Button */}
            <div className="form-footer">
              <button
                className="save-button" onClick={handleSaveMemory}
                disabled={loading || !!isAzureRecording} // Disable if loading or recording
              >
                <AnimatedIcon path={icons.save} />
                <span className="button-text">{loading ? 'Preserving...' : 'Save This Memory'}</span>
                <span className="button-shine"></span>
              </button>
            </div>

          </div> {/* End journal-form */}
        </div> {/* End journal-card */}


        {/* --- Recall Section --- */}

        {/* Recall Button */}
        <button className="fancy-recall-button cute-recall" onClick={() => setShowRecallOptions(true)} disabled={recalling}>
          <AnimatedIcon path={icons.recall} className="recall-icon" />
          <span>Recall With...</span>
          <span className="button-shine"></span><span className="cute-sparkle">✨</span>
        </button>

        {/* Recall Modal */}
        {showRecallOptions && (
          <div className="recall-modal-overlay">
            <div className="recall-modal">
              <div className="modal-header">
                <h3>Recall Memories</h3>
                <button className="modal-close-button" onClick={() => setShowRecallOptions(false)}>✕</button>
              </div>
              <div className="modal-content">
                <div className="people-list">
                  <h4>Choose a person:</h4>
                  {peopleList.length > 0 ? (
                    peopleList.map(person => (
                      <button key={person} className="person-button" onClick={() => handleSelectPerson(person)} disabled={recalling}>
                        {person}
                      </button>
                    ))
                  ) : (<p>No people recorded in memories yet.</p>)}
                </div>
                <hr />
                <button className="action-button webcam-recall-button" onClick={handleRecallFromWebcam} disabled={recalling}>
                  <AnimatedIcon path={icons.camera} /> <span>{recalling ? 'Scanning...' : 'Scan with Webcam'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- Memories Display Section --- */}
        <div className="memories-section">
          <div className="memories-header">
            <AnimatedIcon path={icons.heart} className="memories-icon" />
            <h2 className="memories-title">
              {selectedPerson ? `Moments with ${selectedPerson}` : 'Treasured Moments'}
            </h2>
            <AnimatedIcon path={icons.heart} className="memories-icon" />
            {/* Optional: Button to clear selected person filter */}
            {selectedPerson && <button className="clear-filter-button" onClick={() => setSelectedPerson(null)}>Show All</button>}
          </div>

           {/* Display memories (either all or filtered) */}
          <div className={`memories-grid ${selectedPerson ? 'polaroid-stack' : ''}`}>
              {(selectedPerson ? personMemories : memories).length === 0 ? (
                 <div className="no-memories">
                    <AnimatedIcon path={icons.polaroid} className="empty-icon" />
                    <p>{selectedPerson ? `No memories found with ${selectedPerson} yet...` : 'Your memory collection is waiting...'}</p>
                 </div>
              ) : (
                 (selectedPerson ? personMemories : memories).map((memory) => (
                    <div key={memory._id} className={`memory-card ${selectedPerson ? 'polaroid-card' : ''}`}>
                        <div className="memory-image-container">
                           {/* Assume memory.image has SAS token from backend */}
                           <img src={memory.image} alt="Memory" className={`memory-thumbnail ${memory.filter || ''}`} />
                           {memory.isFavorited && (<div className="memory-favorite"><AnimatedIcon path={icons.heart} /></div>)}
                        </div>
                        <div className="memory-content">
                           {memory.withPeople && memory.withPeople.length > 0 && (
                             <p className="memory-with"><AnimatedIcon path={icons.people} className="memory-icon" /> With: {memory.withPeople.join(', ')}</p>
                           )}
                           <p className="memory-text">{memory.text}</p>
                           {memory.mood && (<div className="memory-mood">{memory.mood}</div>)}
                           <div className="memory-footer">
                              <p className="memory-date">{new Date(memory.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                           </div>
                        </div>
                    </div>
                 ))
              )}
          </div>
        </div> {/* End memories-section */}

      </div> {/* End journal-container */}
    </>
  );
};

export default JournalingComponent;