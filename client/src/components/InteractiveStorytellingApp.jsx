import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/InteractiveStorytellingStyles.css';
import Navbar from './Navbar';

const icons = {
  quill: "M3 17v4h4l11-11-4-4-11 11zm18-14l-3-3-1.41 1.41 3 3L21 3z",
  bookmark: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
};

const AnimatedIcon = ({ path, className = "" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`action-icon ${className}`}>
    <path d={path} fill="currentColor" />
  </svg>
);

const InteractiveStorytellingApp = () => {
  const [storyPages, setStoryPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [mood, setMood] = useState('');
  const [backdrop, setBackdrop] = useState('');
  const [savedStories, setSavedStories] = useState([]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || ''); // Assuming token is stored in localStorage after login

  const moodOptions = ["Melancholic", "Joyful", "Mysterious", "Thrilling", "Serene", "Nostalgic"];
  const backdropOptions = [
    { label: "Enchanted Forest", value: "enchanted" },
    { label: "Twilight Sky", value: "twilight" },
    { label: "Misty Shores", value: "mist" },
    { label: "Starry Realm", value: "stars" }
  ];

  useEffect(() => {
    const bookOpenSound = new Audio('/sounds/book-open.mp3');
    bookOpenSound.volume = 0.3;
    bookOpenSound.play().catch(e => console.log('Audio autoplay prevented:', e));
    fetchSavedStories();
  }, []);

  const fetchSavedStories = async () => {
    if (!token) return;
    try {
      const response = await axios.get('http://localhost:5000/api/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedStories(response.data);
    } catch (error) {
      console.error('Error fetching saved stories:', error);
    }
  };

  const generateStory = async () => {
    if (!mood) {
      alert("Please select a mood to weave your tale!");
      return;
    }
    if (!token) {
      alert("Please log in to weave a tale!");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/story/${mood.toLowerCase()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fullStory = response.data.story;
      const pages = fullStory.split('. ').map(sentence => sentence.trim() + '.');
      setStoryPages(pages);
      setCurrentPage(0);
      setIsFavorited(false);
    } catch (error) {
      console.error("Error fetching story:", error);
      setStoryPages(["An error occurred while weaving your tale. Please try again."]);
    } finally {
      setLoading(false);
    }
  };

  const flipPage = (direction) => {
    if (isFlipping || !storyPages.length) return;
    setIsFlipping(true);
    if (direction === 'next' && currentPage < storyPages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else if (direction === 'prev' && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
    setTimeout(() => setIsFlipping(false), 1000);
  };

  const toggleFavorite = async () => {
    if (!token) {
      alert("Please log in to save stories!");
      return;
    }
    setIsFavorited(!isFavorited);
    if (!isFavorited && storyPages.length) {
      try {
        const response = await axios.post(
          'http://localhost:5000/api/stories',
          { pages: storyPages, mood, backdrop },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSavedStories([...savedStories, response.data.story]);
      } catch (error) {
        console.error('Error saving story:', error);
        setIsFavorited(false); // Revert if save fails
      }
    }
  };

  return (
    <>
    <Navbar/>
    <div className="storybook-container">
      <div className="storybook-bg">
        <div className="sparkle-layer">
          {Array(15).fill().map((_, i) => (
            <div
              key={i}
              className="sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="storybook-header">
        <h1 className="storybook-title">Enchanted Chronicles</h1>
        <div className="controls">
          <select value={mood} onChange={(e) => setMood(e.target.value)} className="story-select">
            <option value="">Select Mood</option>
            {moodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <select value={backdrop} onChange={(e) => setBackdrop(e.target.value)} className="story-select">
            <option value="">Select Scene</option>
            {backdropOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
          <button className="weave-btn" onClick={generateStory} disabled={loading || !token}>
            <AnimatedIcon path={icons.quill} />
            {loading ? "Weaving..." : "Weave a Tale"}
          </button>
        </div>
      </div>

      <div className="storybook-content">
        {storyPages.length ? (
          <div className="story-book">
            <div className={`backdrop-overlay ${backdrop}`}></div>
            <h2 className="story-title">{mood || "Untitled"} Adventure</h2>
            <div className="book-pages">
              <div className={`page left-page ${currentPage === 0 ? 'active' : ''}`}>
                <div className="page-content">
                  <p>{storyPages[currentPage]}</p>
                </div>
              </div>
              <div className={`page right-page ${isFlipping ? 'flipping' : ''}`}>
                <div className="page-content">
                  {currentPage < storyPages.length - 1 && <p>{storyPages[currentPage + 1]}</p>}
                </div>
              </div>
              <button className="flip-btn prev" onClick={() => flipPage('prev')} disabled={currentPage === 0 || isFlipping}>
                <AnimatedIcon path={icons.star} />
              </button>
              <button className="flip-btn next" onClick={() => flipPage('next')} disabled={currentPage === storyPages.length - 1 || isFlipping}>
                <AnimatedIcon path={icons.star} />
              </button>
              <button className={`favorite-btn ${isFavorited ? 'favorited' : ''}`} onClick={toggleFavorite}>
                <AnimatedIcon path={icons.bookmark} />
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-story">
            <p>{token ? "Weave a tale to begin your adventure..." : "Please log in to start weaving tales!"}</p>
          </div>
        )}
      </div>

      <div className="storybook-library">
        <h2 className="library-title">Your Enchanted Library</h2>
        {savedStories.length === 0 ? (
          <div className="story-shelf">
            <p className="library-empty">{token ? "Bookmark your tales to fill this library!" : "Log in to view your library!"}</p>
          </div>
        ) : (
          <div className="story-shelf">
            {savedStories.map((story, index) => (
              <div
                key={index}
                className="story-book"
                onClick={() => {
                  setStoryPages(story.pages);
                  setMood(story.mood);
                  setBackdrop(story.backdrop);
                  setCurrentPage(0);
                  setIsFavorited(true);
                }}
              >
                <div className="book-spine">
                  <span className="spine-title">{story.mood}</span>
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