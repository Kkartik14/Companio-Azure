import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/ChatbotStyles.css';
import Navbar from './Navbar';

// Define the microphone icon path (same as in JournalingComponent)
const icons = {
  microphone: "M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM11 5C11 4.45 11.45 4 12 4C12.55 4 13 4.45 13 5V11C13 11.55 12.55 12 12 12C11.45 12 11 11.55 11 11V5ZM17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.9V21H13V17.9C16.39 17.43 19 14.53 19 11H17Z",
};

// Reusable AnimatedIcon component (same as in JournalingComponent)
const AnimatedIcon = ({ path, className = "" }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`action-icon ${className}`}>
    <path d={path} fill="currentColor" />
  </svg>
);

const EmpatheticChatbot = () => {
  const [messages, setMessages] = useState([
    { sender: 'companion', text: "Oh, hello, my lovely wanderer! I’ve been waiting by the window for you. What’s stirring in your heart today?" }
  ]);
  const [input, setInput] = useState('');
  const [keepsakes, setKeepsakes] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isRecording, setIsRecording] = useState(false); // State for speech recording
  const [error, setError] = useState(''); // State for error messages
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null); // Ref for SpeechRecognition instance

  // Initialize SpeechRecognition
  useEffect(() => {
    console.log('Checking for SpeechRecognition support...');
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      console.log('SpeechRecognition is supported in this browser.');
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      console.log('SpeechRecognition initialized with lang: en-US, continuous: false, interimResults: false');

      let hasResult = false;

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
        setIsRecording(true);
      };

      recognitionRef.current.onresult = (event) => {
        console.log('Speech recognition result received:', event.results);
        hasResult = true;
        if (event.results.length > 0) {
          const transcript = event.results[0][0].transcript;
          console.log('Transcript received:', transcript);
          console.log('Confidence:', event.results[0][0].confidence);
          setInput(prev => {
            const newInput = prev ? `${prev} ${transcript}` : transcript;
            console.log('New input value:', newInput);
            return newInput;
          });
        } else {
          console.log('No results received from speech recognition.');
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'network') {
          setError('Network error. Please check your internet connection.');
        } else {
          setError(`Speech recognition failed: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended.');
        if (!hasResult) {
          setError('Speech recognition ended without results. Please try again.');
        }
        setIsRecording(false);
        hasResult = false;
      };
    } else {
      console.log('SpeechRecognition is NOT supported in this browser.');
      setError('Speech recognition is not supported in this browser.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleVoiceInput = () => {
    console.log('handleVoiceInput triggered');
    console.log('Current isRecording state:', isRecording);
    console.log('recognitionRef.current exists:', !!recognitionRef.current);

    if (!recognitionRef.current) {
      console.log('SpeechRecognition not available.');
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      console.log('Stopping speech recognition');
      try {
        recognitionRef.current.stop();
        console.log('SpeechRecognition stop() called.');
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        setError('Failed to stop speech recognition: ' + err.message);
      }
      setIsRecording(false);
    } else {
      console.log('Starting speech recognition');
      setIsRecording(true);
      try {
        recognitionRef.current.start();
        console.log('SpeechRecognition start() called.');
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setError('Failed to start speech recognition: ' + err.message);
        setIsRecording(false);
      }
    }
  };

  const craftKeepsake = (text) => {
    const words = text.toLowerCase().split(' ');
    const emotion = words.find(w => ['happy', 'sad', 'love', 'miss', 'dream'].includes(w)) || 'moment';
    return {
      keyword: emotion,
      poem: `A little ${emotion} danced in your words, "${text.slice(0, 20)}..." — I’ll tuck it in my pocket for us!`
    };
  };

  const maybeEchoKeepsake = () => {
    if (keepsakes.length > 0 && Math.random() > 0.7) {
      const randomKeepsake = keepsakes[Math.floor(Math.random() * keepsakes.length)];
      return `Oh, wait! I found this in my pocket: "${randomKeepsake.poem}" — doesn’t that feel like yesterday?`;
    }
    return null;
  };

  const getResponse = async (userInput) => {
    const keepsakeEcho = maybeEchoKeepsake();
    if (keepsakeEcho) return keepsakeEcho;

    try {
      const response = await axios.post(
        'http://localhost:8000/chat',
        {
          prompt: userInput,
          history: conversationHistory,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const assistantResponse = response.data.response;

      if (userInput.toLowerCase().includes('happy') || userInput.toLowerCase().includes('sad')) {
        setKeepsakes(prev => [...prev, craftKeepsake(userInput)]);
      }

      return assistantResponse;
    } catch (error) {
      console.error('Error fetching response:', error);
      return "Oh dear, something went awry! Shall we try again?";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);

    const companionResponseText = await getResponse(input);
    const companionResponse = { sender: 'companion', text: companionResponseText };
    setMessages(prev => [...prev, companionResponse]);

    setConversationHistory(prev => {
      const newHistory = [...prev, [input, companionResponseText]];
      return newHistory.length > 5 ? newHistory.slice(1) : newHistory;
    });

    setInput('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      <Navbar />
      <div className="chatbot-container">
        <div className="vintage-overlay"></div>
        <div className="companion-backdrop">
          <div className="floating-memory"></div>
          <div className="floating-memory second"></div>
        </div>

        <div className="chatbot-header">
          <h1 className="chatbot-title">Your Companion Bot</h1>
          <div className="header-decoration"></div>
          <p className="chatbot-subtitle">A keeper of your heart’s little treasures</p>
        </div>

        <div className="chatbot-card">
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message-bubble ${msg.sender === 'user' ? 'user-message' : 'companion-message'}`}
              >
                <span className="message-text">{msg.text}</span>
                <span className="message-tail"></span>
                {msg.sender === 'companion' && (
                  <span className="message-doodle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input">
            <div className="input-wrapper">
              <textarea
                value={input}
                onChange={(e) => {
                  console.log('Textarea value:', e.target.value);
                  setInput(e.target.value);
                }}
                placeholder="Whisper a thought, a memory, or a giggle..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="input-textarea"
                tabIndex={0}
                autoFocus
              />
              <button
                className={`mic-button ${isRecording ? 'recording' : ''}`}
                onClick={handleVoiceInput}
              >
                <AnimatedIcon path={icons.microphone} />
              </button>
              <div className="input-focus-effect"></div>
              <div className="input-decorations">
                <div className="input-decoration top-left"></div>
                <div className="input-decoration top-right"></div>
                <div className="input-decoration bottom-left"></div>
                <div className="input-decoration bottom-right"></div>
              </div>
            </div>
            <button onClick={handleSend} className="send-button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M2 12L22 2L12 22L10 14L2 12Z" fill="currentColor" />
              </svg>
              <span>Toss it my way!</span>
            </button>
          </div>
          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}
        </div>

        <div className="companion-details">
          <img src="comp.png" alt="ur companion" className="companion-image" />
          <p className="companion-note">I’m your quirky pal, collecting your stories like shiny pebbles!</p>
        </div>
      </div>
    </>
  );
};

export default EmpatheticChatbot;