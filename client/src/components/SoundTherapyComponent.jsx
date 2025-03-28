import React, { useState, useEffect } from 'react';
import '../styles/SoundTherapyComponent.css';

const soundTherapyOptions = {
  calm: [
    { name: "brown noise", audio: "/sounds/relaxing-smoothed-brown-noise-294838.mp3", icon: "🌊", description: "Gentle waves washing against the shore" },
    { name: "ocean waves", audio: "/sounds/relaxing-ocean-waves-high-quality-recorded-177004.mp3", icon: "🌧️", description: "Soft rainfall on a quiet afternoon" },
    { name: "guitar", audio: "/sounds/relaxing-guitar-loop-v5-245859.mp3", icon: "🎐", description: "Delicate chimes dancing in the breeze" }
  ],
  focus: [
    { name: "White Noise", audio: "/sounds/white-noise.mp3", icon: "⚪", description: "Steady background noise to help concentration" },
    { name: "Coffee Shop", audio: "/sounds/coffee-shop.mp3", icon: "☕", description: "Ambient coffee shop sounds for productivity" },
    { name: "Soft Piano", audio: "/sounds/soft-piano.mp3", icon: "🎹", description: "Gentle piano melodies for deep focus" }
  ],
  nature: [
    { name: "birds chirping", audio: "/sounds/birds-chirping-calm-173695.mp3", icon: "🌙", description: "Crickets and gentle night ambience" },
    { name: "jungle", audio: "/sounds/jungle-nature-229896.mp3", icon: "🧘", description: "Guided breathing pattern for sleep" },
    { name: "Lullaby", audio: "/sounds/nature-216798.mp3", icon: "🛌", description: "Soft melody to help drift into sleep" }
  ],
  energize: [
    { name: "Morning Birds", audio: "/sounds/uplifting-pad-texture-113842.mp3", icon: "🐦", description: "Cheerful birdsong to lift your spirits" },
    { name: "Upbeat Nature", audio: "/sounds/uplifting-pad-texture-113842.mp3", icon: "🌿", description: "Energizing blend of natural sounds" },
    { name: "Positive Chimes", audio: "/sounds/uplifting-pad-texture-113842.mp3", icon: "✨", description: "Bright, uplifting wind chimes" }
  ]
};

const SoundTherapyComponent = () => {
  const [currentMood, setCurrentMood] = useState("calm");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audio.loop = true;
    setAudioElement(audio);

    // Cleanup on component unmount
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume / 100;
    }
  }, [volume, audioElement]);

  const handleMoodChange = (mood) => {
    setCurrentMood(mood);
    // If something is playing, switch to the first sound in the new mood
    if (isPlaying && audioElement) {
      const newSound = soundTherapyOptions[mood][0];
      playSound(newSound);
    }
  };

  const playSound = (sound) => {
    if (audioElement) {
      // Stop current sound if playing
      audioElement.pause();
      
      // Set new sound
      audioElement.src = sound.audio;
      setCurrentSound(sound);
      
      // Play sound
      audioElement.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error("Error playing sound:", error);
          setIsPlaying(false);
        });
    }
  };

  const stopSound = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
  };

  return (
    <div className="sound-therapy-card">
      <div className="sound-therapy-header">
        <h2 className="sound-therapy-title">Sound Therapy</h2>
        <p className="sound-therapy-subtitle">Choose sounds to match your mood</p>
      </div>

      <div className="mood-selector">
        <button 
          className={`mood-button ${currentMood === 'calm' ? 'active' : ''}`} 
          onClick={() => handleMoodChange('calm')}
        >
          😌 Calm
        </button>
        <button 
          className={`mood-button ${currentMood === 'focus' ? 'active' : ''}`} 
          onClick={() => handleMoodChange('focus')}
        >
          🧠 Focus
        </button>
        <button 
          className={`mood-button ${currentMood === 'sleep' ? 'active' : ''}`} 
          onClick={() => handleMoodChange('sleep')}
        >
          😴 Sleep
        </button>
        <button 
          className={`mood-button ${currentMood === 'energize' ? 'active' : ''}`} 
          onClick={() => handleMoodChange('energize')}
        >
          ⚡ Energize
        </button>
      </div>

      <div className="sound-options">
        {soundTherapyOptions[currentMood].map((sound, index) => (
          <div 
            key={index} 
            className={`sound-option ${currentSound?.name === sound.name && isPlaying ? 'playing' : ''}`}
            onClick={() => isPlaying && currentSound?.name === sound.name ? stopSound() : playSound(sound)}
          >
            <div className="sound-icon">{sound.icon}</div>
            <div className="sound-details">
              <h3 className="sound-name">{sound.name}</h3>
              <p className="sound-description">{sound.description}</p>
            </div>
            <div className="sound-status">
              {currentSound?.name === sound.name && isPlaying ? '⏹️' : '▶️'}
            </div>
          </div>
        ))}
      </div>

      {currentSound && (
        <div className="sound-controls">
          <div className="volume-control">
            <span className="volume-icon">🔈</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume} 
              onChange={handleVolumeChange} 
              className="volume-slider"
            />
            <span className="volume-icon">🔊</span>
          </div>
          <div className="now-playing">
            <p>Now playing: <span className="current-sound-name">{currentSound.name}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoundTherapyComponent;