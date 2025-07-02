// src/App.jsx (or src/App.js)

import React, { useContext } from 'react';
import './App.css'; // Make sure your CSS file is correctly linked

// Import assets
import va from "./assets/ai.png"; // Your main AI image
import speakimg from './assets/speak.gif'; // Listening GIF
import aigif from './assets/aiVoice.gif'; // AI talking GIF

// Import icons
import { CiMicrophoneOn } from "react-icons/ci"; // Microphone Icon

// Import context
import { dataContext } from './context/UserContext'; // Your context provider

function App() {
  // Destructure the values provided by the context
  const {
    speaking,      // boolean: true if listening or responding, false if idle (showing button)
    prompt,        // string: "Click...", "Listening...", user's speech, AI's response, or error message
    response,      // boolean: true if AI response is ready/being typed (show aigif), false if listening (show speakimg)
    startListening // function: call this to initiate the speech recognition process
  } = useContext(dataContext);

  // Determine if the button should be disabled (e.g., if speech recognition isn't supported)
  const isRecognitionNotSupported = prompt === "Speech recognition not supported.";

  return (
    <div className='main'>
      {/* Main AI visual */}
      <img src={va} alt="Vyntra" id="vyntra" />

      {/* Title/Greeting Text */}
      <span>I'm Vyntra, Your Advanced Virtual Assistant</span>

      {/* Conditional Rendering: Show Button OR Response Area */}
      {!speaking ? (
        // Show Button when not speaking/listening/responding
        <button
          onClick={startListening}
          disabled={isRecognitionNotSupported} // Disable button if recognition failed to initialize
        >
          Click here
          <CiMicrophoneOn /> {/* Microphone icon */}
        </button>
      ) : (
        // Show Response Area when speaking/listening/responding
        <div className='response'>
          {/* Conditional Rendering: Show Listening GIF OR AI GIF */}
          {!response ? (
            // Show Listening GIF while waiting for user speech or AI response fetch
            <img src={speakimg} alt="Listening..." id="speak" />
          ) : (
            // Show AI GIF when AI response is ready and being typed/spoken
            <img src={aigif} alt="Talking..." id="aigif" />
          )}

          {/* Display the current prompt (Listening..., user speech, AI response, error) */}
          {/* Added min-height to prevent layout jumps when text changes */}
          <p style={{ minHeight: '1.5em' }}>{prompt}</p>
        </div>
      )}
    </div>
  );
}

export default App;
