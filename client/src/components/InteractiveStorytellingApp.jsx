// client/src/components/InteractiveStorytellingApp.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// --- Import Azure Speech SDK ---
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
// --- End Import ---
import '../styles/InteractiveStorytellingStyles.css'; // Ensure path is correct
import Navbar from './Navbar'; // Ensure path is correct

// Icon definitions (assuming these are correct)
const icons = {
  quill: "M3 17v4h4l11-11-4-4-11 11zm18-14l-3-3-1.41 1.41 3 3L21 3z",
  bookmark: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
};

// AnimatedIcon component (assuming this is correct)
const AnimatedIcon = ({ path, className = "" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`action-icon ${className}`}>
    <path d={path} fill="currentColor" />
  </svg>
);

const InteractiveStorytellingApp = () => {
  // --- State ---
  const [storyPages, setStoryPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [mood, setMood] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [savedStories, setSavedStories] = useState([]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [loading, setLoading] = useState(false); // Story generation loading
  const token = localStorage.getItem('token') || '';
  const [isSpeaking, setIsSpeaking] = useState(false); // TTS state
  const [ttsError, setTtsError] = useState('');     // TTS error state
  const synthesizerRef = useRef(null);             // TTS synthesizer instance ref

  // --- Constants ---
  const moodOptions = ["Melancholic", "Joyful", "Mysterious", "Thrilling", "Serene", "Nostalgic"];
  const backdropOptions = [
    { label: "Enchanted Forest", value: "enchanted" }, { label: "Twilight Sky", value: "twilight" },
    { label: "Misty Shores", value: "mist" }, { label: "Starry Realm", value: "stars" }
  ];

  // --- Effects ---

  // Fetch Saved Stories and Cleanup TTS on Unmount
  useEffect(() => {
    const fetchSavedStories = async () => {
        if (!token) return;
        try {
            console.log("Fetching saved stories...");
            const response = await axios.get('http://localhost:5000/api/stories', {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Saved stories response:", response.data);
            setSavedStories(response.data || []);
        } catch (error) {
            console.error('Error fetching saved stories:', error.response?.data || error.message);
        }
    };

    const bookOpenSound = new Audio('/sounds/book-open.mp3');
    bookOpenSound.volume = 0.3;
    bookOpenSound.play().catch(e => console.log('Audio autoplay prevented:', e));

    if (token) {
        fetchSavedStories();
    }

    // Cleanup function for TTS
    return () => {
      if (synthesizerRef.current) {
        console.log("Cleaning up TTS synthesizer on component unmount.");
        synthesizerRef.current.close();
        synthesizerRef.current = null;
      }
    };
  }, [token]);


  // --- Helper Functions ---

  // Fetch Azure Speech Token
  const fetchSpeechToken = async () => {
    if (!token) {
      setTtsError("Authentication required to use speech features.");
      return null;
    }
    try {
      console.log('Fetching speech token for TTS...');
      const response = await axios.get('http://localhost:5000/api/speech/token', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('TTS Speech token received.');
      return { authToken: response.data.token, region: response.data.region };
    } catch (error) {
      console.error('Error fetching speech token:', error.response?.data || error.message);
      setTtsError(`Could not get speech credentials: ${error.response?.data?.message || error.message}`);
      return null;
    }
  };

  // --- Core Application Functions ---

  // Generate Story
  const generateStory = async () => {
      console.log("--- generateStory triggered ---");
      if (!mood || !token) { /* validation */ return; }
      setLoading(true);
      setStoryPages([]);
      setTtsError('');
      if (isSpeaking) {
          await stopSpeaking();
      }
      console.log(`generateStory: Preparing GET request to: /api/story/${mood.toLowerCase()}`);
      try {
          const startTime = performance.now();
          const response = await axios.get(`/api/story/${mood.toLowerCase()}`, { headers: { Authorization: `Bearer ${token}` } });
          const endTime = performance.now();
          console.log(`generateStory: Received response (Status: ${response.status}) in ${((endTime - startTime)/1000).toFixed(2)}s.`);
          const fullStory = response.data?.story;
          if (!fullStory || typeof fullStory !== 'string' || fullStory.trim() === "") {
              throw new Error("Received an invalid story format from the server.");
          }
          const pages = fullStory.split(/(?<=[.!?])\s+/).map(sentence => sentence.trim()).filter(Boolean);
          setStoryPages(pages.length > 0 ? pages : [fullStory]);
          setCurrentPage(0);
          setIsFavorited(false);
      } catch (error) {
          console.error("generateStory: Error during story generation!");
          const status = error.response?.status;
          const errMsg = error.response?.data?.message || error.message;
          setStoryPages([`Sorry, an error occurred: ${errMsg} (Status: ${status || 'Network Error'})`]);
      } finally {
          setLoading(false);
          console.log("--- generateStory finished ---");
      }
  };

  // Speak Story using Azure TTS
   const speakStory = async () => {
    console.log("Attempting to speak story...");
    setTtsError('');
    if (isSpeaking && synthesizerRef.current) {
        console.log("Stopping previous playback first.");
        await stopSpeaking();
    }
    if (!storyPages || storyPages.length === 0 || storyPages[0].startsWith("Sorry,")) {
        setTtsError("No valid story content to speak."); return;
    }
    const tokenData = await fetchSpeechToken();
    if (!tokenData) return;

    try {
        const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(tokenData.authToken, tokenData.region);
        speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural"; // Example voice
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultSpeakerOutput();
        const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
        synthesizerRef.current = synthesizer;
        const fullStoryText = storyPages.join(' ');
        console.log(`TTS: Preparing to speak ${fullStoryText.length} characters.`);
        setIsSpeaking(true);

        synthesizer.speakTextAsync(fullStoryText,
            result => { // On completion/cancellation
                setIsSpeaking(false);
                if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) { console.log("TTS: Finished."); }
                else { console.error(`TTS: Canceled/Failed, Reason: ${SpeechSDK.ResultReason[result.reason]}, Details: ${result.errorDetails}`); setTtsError(`Could not speak: ${result.errorDetails}`); }
                console.log("TTS: Closing synthesizer post-playback.");
                synthesizer.close();
                if (synthesizerRef.current === synthesizer) { synthesizerRef.current = null; }
            },
            err => { // On error during synthesis
                console.error(`TTS: Error synthesizing: ${err}`); setTtsError(`Synthesis failed: ${err}`); setIsSpeaking(false);
                console.log("TTS: Closing synthesizer post-error.");
                synthesizer.close();
                if (synthesizerRef.current === synthesizer) { synthesizerRef.current = null; }
            }
        );
        console.log("TTS: speakTextAsync called.");
    } catch (error) {
        console.error("TTS: Error setting up SDK:", error); setTtsError(`Initialization failed: ${error.message || error}`); setIsSpeaking(false);
        if (synthesizerRef.current) { synthesizerRef.current.close(); synthesizerRef.current = null; }
    }
  };

  // Stop Speaking
  const stopSpeaking = async () => {
      console.log("Attempting to stop speaking...");
      const currentSynthesizer = synthesizerRef.current;
      if (currentSynthesizer) {
          setIsSpeaking(false);
          synthesizerRef.current = null;
          console.log("TTS: Closing synthesizer to stop speech.");
          currentSynthesizer.close(); // Close/stop
      } else {
          console.log("No active synthesizer to stop.");
          setIsSpeaking(false);
      }
  };

  // Flip page animation
  const flipPage = (direction) => {
    if (isFlipping || !storyPages.length || isSpeaking) return;
    setIsFlipping(true);
    let nextPage = currentPage;
    if (direction === 'next' && currentPage < storyPages.length - 1) { nextPage = currentPage + 1; }
    else if (direction === 'prev' && currentPage > 0) { nextPage = currentPage - 1; }
    setTimeout(() => { setCurrentPage(nextPage); setIsFlipping(false); }, 500);
  };

  // Toggle favorite / Save story
  const toggleFavorite = async () => {
      if (!token || !storyPages.length || storyPages[0].startsWith("Sorry,") || isSpeaking) {
          alert(isSpeaking ? "Please stop playback first." : (!token ? "Please log in." : "Cannot favorite an empty/error story.")); return;
      }
      const currentlyFavorited = isFavorited;
      setIsFavorited(!currentlyFavorited);
      if (!currentlyFavorited) {
          console.log("Saving story as favorite...");
          try {
              const response = await axios.post( 'http://localhost:5000/api/stories', { pages: storyPages, mood, backdrop }, { headers: { Authorization: `Bearer ${token}` } });
              console.log("Story saved:", response.data.story);
              setSavedStories(prev => [response.data.story, ...prev]);
          } catch (error) {
              console.error('Error saving story:', error.response?.data || error.message); alert(`Failed to save: ${error.response?.data?.message || error.message}`); setIsFavorited(currentlyFavorited);
          }
      } else { console.log("Unfavoriting - Deletion logic not implemented."); }
  };


  // --- JSX Return ---
  return (
    <>
      <Navbar />
      <div className="storybook-container">
        {/* Background */}
        <div className="storybook-bg">
          <div className="sparkle-layer">
            {Array(15).fill(0).map((_, i) => <div key={i} className="sparkle" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s` }}></div>)}
          </div>
        </div>

        {/* Header and Controls */}
        <div className="storybook-header">
          <h1 className="storybook-title">Enchanted Chronicles</h1>
          <div className="controls">
            <select value={mood} onChange={(e) => setMood(e.target.value)} className="story-select" disabled={loading || isSpeaking}>
              <option value="">Select Mood</option>
              {moodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <select value={backdrop} onChange={(e) => setBackdrop(e.target.value)} className="story-select" disabled={loading || isSpeaking}>
              <option value="">Select Scene</option>
              {backdropOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <button className="weave-btn" onClick={generateStory} disabled={loading || !token || isSpeaking}>
              <AnimatedIcon path={icons.quill} /> {loading ? "Weaving..." : "Weave a Tale"}
            </button>
          </div>
        </div>

        {/* TTS Error Display */}
        {ttsError && <div className="error-message tts-error" style={{maxWidth: '800px', margin: '10px auto', textAlign: 'center'}}>🔊 TTS Error: {ttsError}</div>}

        {/* Story Content Area */}
        <div className="storybook-content">
          {storyPages.length > 0 && !storyPages[0].startsWith("Sorry,") ? (
            <div className="story-book">
              <div className={`backdrop-overlay ${backdrop}`}></div>
              <h2 className="story-title">{mood || "Untitled"} Adventure</h2>

              {/* Speak/Stop Button */}
              <button
                className={`speak-story-button ${isSpeaking ? 'speaking' : ''}`}
                onClick={isSpeaking ? stopSpeaking : speakStory}
                disabled={loading}
                aria-label={isSpeaking ? "Stop reading aloud" : "Read story aloud"}
                title={isSpeaking ? "Stop reading story" : "Read story aloud"}
              >
                <span className="speak-icon">{isSpeaking ? '⏹️' : '▶️'}</span>
                {isSpeaking ? 'Stop' : 'Speak'}
              </button>

              {/* Book Pages Display */}
              <div className="book-pages">
                 <div className="page left-page active">
                    <div className="page-content"><p>{storyPages[currentPage] || '...'}</p></div>
                 </div>
                 <div className={`page right-page ${isFlipping ? 'flipping' : ''}`}>
                    <div className="page-content">
                        {currentPage + 1 < storyPages.length && <p>{storyPages[currentPage + 1]}</p>}
                    </div>
                 </div>
                 {/* Page Flip Buttons */}
                 <button className="flip-btn prev" onClick={() => flipPage('prev')} disabled={currentPage === 0 || isFlipping || isSpeaking}>
                    <AnimatedIcon path={icons.star} />
                 </button>
                 <button className="flip-btn next" onClick={() => flipPage('next')} disabled={currentPage >= storyPages.length - 1 || isFlipping || isSpeaking}>
                    <AnimatedIcon path={icons.star} />
                 </button>
                 {/* Favorite Button */}
                 <button className={`favorite-btn ${isFavorited ? 'favorited' : ''}`} onClick={toggleFavorite} disabled={isSpeaking}>
                    <AnimatedIcon path={icons.bookmark} />
                 </button>
              </div>
            </div>
          ) : (
            // Display when no story or only error message exists
            <div className="empty-story">
              <p>{loading ? "Weaving your tale..." : (token ? "Select a mood and scene, then weave a tale..." : "Please log in to start weaving tales!")}</p>
              {storyPages.length > 0 && storyPages[0].startsWith("Sorry,") && (
                  <p style={{color: 'red', marginTop: '10px'}}>{storyPages[0]}</p>
              )}
            </div>
          )}
        </div>

        {/* Story Library */}
        <div className="storybook-library">
          <h2 className="library-title">Your Enchanted Library</h2>
          {savedStories.length === 0 ? (
            <div className="story-shelf">
              <p className="library-empty">{token ? "Bookmark your tales to fill this library!" : "Log in to view your library!"}</p>
            </div>
          ) : (
            <div className="story-shelf">
              {/* Map through saved stories */}
              {savedStories.map((story, index) => (
                <div
                  key={story._id || index} // Prefer backend ID if available
                  // Add class to visually indicate disabled state and prevent pointer events
                  className={`story-book-item ${isSpeaking ? 'interaction-disabled' : ''}`}
                  onClick={() => {
                    // Prevent loading a new story from the library if TTS is active
                    if (isSpeaking) {
                        console.log("Cannot load story from library while speaking.");
                        return; // Exit the handler early
                    }
                    // Proceed with loading the story if not speaking
                    console.log("Loading story from library:", story.mood);
                    setStoryPages(story.pages || []);
                    setMood(story.mood || '');
                    setBackdrop(story.backdrop || '');
                    setCurrentPage(0);
                    setIsFavorited(true); // Assume library items are favorited
                    // Stop any previous speech (though already checked, good failsafe)
                    if (isSpeaking) { stopSpeaking(); }
                  }}
                  title={`Load "${story.mood || 'Saved Tale'}" story`}
                  // Add aria-disabled for accessibility when speaking
                  aria-disabled={isSpeaking}
                >
                  <div className="book-spine">
                    <span className="spine-title">{story.mood || 'Saved Tale'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InteractiveStorytellingApp;