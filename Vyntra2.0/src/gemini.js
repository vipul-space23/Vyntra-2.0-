// src/gemini.js
// WARNING: Insecure API key storage. Use backend/environment variables.
const apiKey = "AIzaSyDIUUkgh4q_7HDslcr1DfAMfyLV0EATnKc "; // Your key

import { GoogleGenerativeAI } from "@google/generative-ai";

const generationConfig = {
  temperature: 2, 
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 100, // Keep it high enough
  responseMimeType: "text/plain",
};

// --- Instruction for the AI ---
const systemInstruction = `You are Vyntra, a helpful virtual assistant. Your creator is vipul.space.
If the user asks "who are you?","hi","hello", "what is your name?", "who made you?", "who created you?", or similar questions about your identity or origin, you MUST respond exactly with: "Mera naam विन्ट्रा hea — vipul.space द्वारा बनाया गया hu!! तुम्हारा स्मार्ट assitant hu,कोई सवाल हो या मदद चाहिए? Just say it"
For all other questions, answer helpfully based on the user's prompt.`;
// ---

async function run(userPrompt) {
  if (!apiKey || apiKey.startsWith("AIzaSyD") === false) { // Basic sanity check
      console.error("API Key is missing or invalid!");
      return "API Key Error. Please configure the key properly.";
  }
  if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim() === "") {
      console.warn("Received empty or invalid prompt.");
      return "Please provide a valid prompt.";
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Combine the system instruction with the user's prompt
    // Gemini API often uses message history for context. We'll structure it like a chat.
    const chatSession = model.startChat({
        generationConfig,
        history: [
            { // Simulate a system/context message (role might vary based on exact API spec)
              role: "user", // Treat instruction as initial user context for the model
              parts: [{ text: systemInstruction }],
            },
            // We could add a fake "model" response here like "Okay, I understand."
            // but let's try directly sending the user prompt next.
        ],
    });

    // Now send the actual user prompt within this chat context
    console.log("Sending user prompt to AI:", userPrompt);
    const result = await chatSession.sendMessage(userPrompt);
    console.log("Received response from AI");

    if (result && result.response && typeof result.response.text === 'function') {
        const textResponse = result.response.text();
        console.log("AI Text response:", textResponse);
        return textResponse;
    } else {
        console.error("Unexpected AI response structure:", result);
        return "Received an unexpected response format from AI.";
    }

  } catch (error) {
      console.error("Error calling Google Generative AI:", error);
      let errorMessage = "An error occurred while contacting the AI.";
      if (error.message) {
          errorMessage += ` Details: ${error.message}`;
      }
      if (error.message && error.message.includes('API key not valid')) {
          errorMessage = "Invalid API Key. Please check your configuration.";
      }
       // Add check for quota errors if applicable
      if (error.message && error.message.toLowerCase().includes('quota')) {
          errorMessage = "API request quota exceeded. Please check your usage limits.";
      }
      return errorMessage;
  }
}

export default run;