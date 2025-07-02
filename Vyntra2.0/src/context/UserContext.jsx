// // src/context/UserContext.js
// import React, { createContext,useState } from 'react';
// import run from '../gemini';
// export const dataContext=createContext();

// //text to speech
// function UserContext({ children }) {
// let [speaking,setSpeaking]=useState(false);
// let [prompt,setPrompt]=useState("listening...");
// let [response,setResponse]=useState(false);

//   function speak(text) {
//     let text_speak=new SpeechSynthesisUtterance(text);
//     text_speak.volume=1;
//     text_speak.rate=1;
//     text_speak.pitch=1;
//     text_speak.lang="hi-GB";
//     window.speechSynthesis.speak(text_speak)
//   }

//   async function aiResponse(prompt){
//     let text =await run(prompt)
//     setPrompt(text);
//     speak(text);
//     setResponse(true);
//     setTimeout(() => {
//     setSpeaking(false);
//     }, 10000);
//   }
// //recogntion
//  let speechRecognition=window.SpeechRecognition || window.webkitSpeechRecognition;
//  let recognition=new speechRecognition()
//  recognition.onresult=(e)=>{
//  let currentIndex=e.resultIndex;
//  let transcript = e.results[currentIndex][0].transcript;
//   setPrompt(transcript);
//  aiResponse(transcript)
//  }

//   let value = {
//   recognition,
//   speaking,
//   setSpeaking,
//   prompt,
//   setPrompt,setResponse
// }

//   return (
//     <div>
//       <dataContext.Provider value={value}>
//       {children}
//       </dataContext.Provider>
//     </div>
//   );
// }

// export default UserContext;
// src/context/UserContext.js
import React, { createContext, useState, useRef, useEffect, useCallback } from 'react';
import run from '../gemini';

export const dataContext = createContext();

function UserContext({ children }) {
    const [speaking, setSpeaking] = useState(false);
    const [prompt, setPrompt] = useState("Click the button and speak");
    const [response, setResponse] = useState(false);
    const typingIntervalRef = useRef(null);
    const resetTimeoutRef = useRef(null);
    const recognition = useRef(null);
    const currentSpeechUtterance = useRef(null); // Ref to hold the current speech object

    // Centralized timer/process cleanup function
    const clearTimersAndSpeech = useCallback(() => {
        // console.log("Clearing timers and speech"); // Debug log
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }
        if (resetTimeoutRef.current) {
            clearTimeout(resetTimeoutRef.current);
            resetTimeoutRef.current = null;
        }
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel(); // Cancel any ongoing speech
        }
        currentSpeechUtterance.current = null; // Clear ref to utterance
    }, []); // Empty dependency array as it uses refs and window


    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearTimersAndSpeech();
            if (recognition.current) {
                recognition.current.abort();
                recognition.current = null; // Help garbage collection
            }
        };
    }, [clearTimersAndSpeech]);

    // Reset state function
    const resetToIdleState = useCallback(() => {
        // console.log("Resetting to idle state"); // Debug log
        clearTimersAndSpeech();
        setSpeaking(false);
        setResponse(false);
        setPrompt("Click the button and speak");
    }, [clearTimersAndSpeech]);


    // --- Speech Synthesis ---
    function speak(text, onEndCallback) {
        if (!text || typeof text !== 'string' || text.trim() === '') {
            console.warn("Speak function called with empty text.");
            if(onEndCallback) onEndCallback(); // Call callback even if nothing to speak
            return;
        }
        // console.log("Attempting to speak:", text); // Debug log
        window.speechSynthesis.cancel(); // Cancel previous before starting new

        const text_speak = new SpeechSynthesisUtterance(text);
        text_speak.volume = 1;
        text_speak.rate = 1;
        text_speak.pitch = 1;
        text_speak.lang = "hi-IN"; // Hindi - India

        // Store the utterance so we can potentially check its state later if needed
        currentSpeechUtterance.current = text_speak;

        // Set up event listener for when speech ends
        text_speak.onend = () => {
            // console.log("Speech finished."); // Debug log
            currentSpeechUtterance.current = null; // Clear ref
            if (onEndCallback) {
                onEndCallback(); // Execute the callback provided
            }
        };

        text_speak.onerror = (event) => {
            console.error("Speech synthesis error:", event.error);
            currentSpeechUtterance.current = null; // Clear ref
             if (onEndCallback) {
                onEndCallback(); // Still execute callback on error to proceed
            }
        };

        window.speechSynthesis.speak(text_speak);
    }

    // --- AI Response Handling & Typing ---
    async function aiResponse(userPrompt) {
        clearTimersAndSpeech(); // Clear previous state/timers
        try {
            setResponse(false); // Keep showing listening gif while fetching

            const rawText = await run(userPrompt); // Get response (already includes custom identity handling)

            // Perform cleaning *after* getting the response
            const cleanedText = rawText
                                .replace(/\*\*/g, "")
                                .replace(/\*/g, "")
                                .replace(/google/gi, "vipul.space")
                                .trim(); // Trim whitespace

            // console.log("Cleaned AI text:", cleanedText); // Debug log

            if (!cleanedText) {
                 console.warn("AI returned empty response after cleaning.");
                 setPrompt("AI didn't provide a response this time.");
                 setResponse(true); // Show message in response area
                 resetTimeoutRef.current = setTimeout(resetToIdleState, 5000); // Reset after 5s
                 return; // Exit if no text
            }


            setResponse(true); // Signal AI response is ready (for aigif)
            setPrompt(''); // Clear display for typing effect

            // --- Typing Animation ---
            let index = 0;
            let accumulatedText = ''; // Build the string correctly
            typingIntervalRef.current = setInterval(() => {
                if (index < cleanedText.length) {
                    accumulatedText += cleanedText[index];
                    setPrompt(accumulatedText); // Update display with the growing string
                    index++;
                } else {
                    // Typing finished
                    clearInterval(typingIntervalRef.current);
                    typingIntervalRef.current = null;
                    // console.log("Typing finished."); // Debug log

                    // Start the 6-second reset timer AFTER typing is complete
                    // console.log("Starting 6s reset timer."); // Debug log
                    resetTimeoutRef.current = setTimeout(resetToIdleState, 5000);
                }
            }, 50); // Typing speed (ms)

            // --- Speech ---
            // Start speaking the *entire* cleaned text.
            // The reset timer might cut it off after 6s (from end of typing).
            speak(cleanedText, () => {
                 // Optional: Callback when speech ends. We might not need to do anything
                 // specific here if the 6s timer handles the UI reset.
                 // console.log("Speak function's onEnd callback executed."); // Debug log
            });


        } catch (error) {
            // This catch is mostly for errors *within* this aiResponse function logic itself,
            // as run() handles its own errors and returns error messages as strings.
            console.error("Error within aiResponse function logic:", error);
            setPrompt("An unexpected error occurred in the app.");
            setResponse(true);
            clearTimersAndSpeech();
            resetTimeoutRef.current = setTimeout(resetToIdleState, 6000);
        }
    }

    // --- Speech Recognition Setup & Handling ---
    const initializeRecognition = useCallback(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            console.error("Speech Recognition API not supported.");
            setPrompt("Speech recognition not supported.");
            return false; // Indicate failure
        }

        if (recognition.current) { // Avoid re-initialization
             // console.log("Recognition already initialized."); // Debug log
             return true;
        }

        // console.log("Initializing Speech Recognition"); // Debug log
        recognition.current = new SpeechRecognitionAPI();
        recognition.current.continuous = false;
        recognition.current.lang = 'en-US'; // Language for STT
        recognition.current.interimResults = false;

        recognition.current.onstart = () => {
            // console.log("Recognition started."); // Debug log
            clearTimersAndSpeech();
            setPrompt("Listening...");
            setResponse(false);
            setSpeaking(true); // Ensure speaking state is true when listening starts
        };

        recognition.current.onresult = (e) => {
            // console.log("Recognition result received."); // Debug log
            let transcript = e.results[e.results.length - 1][0].transcript.trim();
            if (transcript) {
                setPrompt(transcript); // Show user's speech
                aiResponse(transcript); // Send to AI
            } else {
                console.warn("Received empty transcript in onresult.");
                setPrompt("Didn't catch that. Try again?");
                resetTimeoutRef.current = setTimeout(resetToIdleState, 3000);
            }
        };

        recognition.current.onerror = (e) => {
            console.error("Speech recognition error:", e.error);
            let errorMsg = `Mic error: ${e.error}`;
            if (e.error === 'no-speech') {
                errorMsg = "Didn't hear anything. Try speaking.";
            } else if (e.error === 'audio-capture') {
                errorMsg = "Mic capture failed. Check permissions?";
            } else if (e.error === 'not-allowed') {
                errorMsg = "Mic access denied. Please allow it.";
            }
            setPrompt(errorMsg);
            // No need to setSpeaking(false) here, resetToIdleState handles it
            resetTimeoutRef.current = setTimeout(resetToIdleState, 3500);
        };

        recognition.current.onend = () => {
            // console.log("Recognition ended."); // Debug log
            // Don't change state here, onresult/onerror + timeouts handle it
             // If speaking is true but response is false, it might mean recognition ended without result/error handled
            if (speaking && !response && !resetTimeoutRef.current && !typingIntervalRef.current) {
               // console.log("Recognition ended unexpectedly, resetting."); // Debug log
               // Reset if ended without triggering result/error handlers properly
               // resetToIdleState(); // Careful with this, might interfere with normal flow
            }
        };
        return true; // Indicate success
    }, [aiResponse, clearTimersAndSpeech, resetToIdleState, speaking, response]); // Dependencies


    // Initialize recognition on mount
    useEffect(() => {
        initializeRecognition();
    }, [initializeRecognition]);


    // Function to trigger listening
    const startListening = () => {
        // console.log("startListening called."); // Debug log
        if (!recognition.current) {
             // console.log("Recognition not ready, attempting init..."); // Debug log
            if (!initializeRecognition()) { // Try initializing again if failed on mount
                 setPrompt("Cannot start: Recognition not supported/initialized.");
                 return;
            }
        }

        if (speaking) {
             console.warn("Already in speaking/listening state."); // Debug log
             return; // Avoid starting if already active
        }

        try {
            // console.log("Calling recognition.current.start()"); // Debug log
            // Clear any potential leftover state before starting
            clearTimersAndSpeech();
            setSpeaking(true); // Set state BEFORE calling start()
            setPrompt("Listening...");
            setResponse(false);
            recognition.current.start();
        } catch (error) {
            console.error("Error starting recognition:", error);
            setPrompt(`Mic start error: ${error.name}`);
            resetToIdleState(); // Reset if start fails
        }
    };

    // --- Context Value ---
    const value = {
        startListening,
        speaking,
        prompt,
        response,
        // Avoid passing setters unless absolutely necessary externally
    };

    return (
        <div>
            <dataContext.Provider value={value}>
                {children}
            </dataContext.Provider>
        </div>
    );
}

export default UserContext;