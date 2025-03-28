// server/storyteller.js
require("dotenv").config();

// --- CORRECTED IMPORTS ---
// Import AzureOpenAI from the main 'openai' package
const { AzureOpenAI } = require("openai");
// AzureKeyCredential is still needed if you were using it, but the constructor might take the key directly
// Let's try passing the key directly first as per common 'openai' library usage for Azure
// const { AzureKeyCredential } = require("@azure/core-auth"); NO LONGER NEEDED for this constructor style
const axios = require('axios'); // For fetching journal entries

class StoryGenerator {
  constructor(token) {
    // --- Azure OpenAI Configuration ---
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureApiKey = process.env.AZURE_OPENAI_KEY;
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME; // Keep this
    // Get API Version from .env or use a recent default (check Azure docs for current recommended)
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-01"; // Example: Use a recent stable version

    if (!endpoint || !azureApiKey || !this.deploymentName) {
      console.warn(
        "Azure OpenAI environment variables (ENDPOINT, KEY, DEPLOYMENT_NAME) are not fully configured. Story generation may fail."
      );
      this.openaiClient = null;
    } else {
      try {
        console.log(`Initializing AzureOpenAI client (from 'openai' package) for endpoint: ${endpoint}`);
        // --- CORRECTED CONSTRUCTOR ---
        // Use AzureOpenAI from 'openai' package
        // Pass configuration directly as properties in an object
        this.openaiClient = new AzureOpenAI({
          endpoint: endpoint,         // Pass the endpoint
          apiKey: azureApiKey,        // Pass the API key directly
          deployment: this.deploymentName, // Pass the deployment name (used implicitly by methods now)
          apiVersion: apiVersion,     // Specify the API version
        });
        console.log("AzureOpenAI client initialized successfully.");
      } catch (error) {
        console.error("Failed to initialize AzureOpenAI client:", error);
        this.openaiClient = null;
      }
    }
    // --- End Azure OpenAI Configuration ---
    this.token = token; // Store the user auth token
  }

  async fetchJournalEntries() {
    // ... (This method remains the same - no changes needed) ...
    if (!this.token) {
        console.error("Authentication token missing for fetching journal entries.");
        return { texts: [] };
    }
    const apiUrl = "http://localhost:5000/api/journal/texts";
    console.log(`Fetching journal entries from: ${apiUrl}`);
    try {
      const response = await axios.get(apiUrl, {
        headers: { 'Authorization': `Bearer ${this.token}`, 'Accept': 'application/json' }
      });
      const responseData = response.data;
      if (responseData && Array.isArray(responseData.texts)) {
        console.log(`Journal entries fetched successfully. Count: ${responseData.texts.length}`);
        return responseData;
      } else {
        console.warn("Received unexpected data format from /api/journal/texts:", responseData);
        return { texts: [] };
      }
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      console.error(`Error fetching journal entries (Status: ${status}): ${message}`);
      return { texts: [] };
    }
  }

  adaptMoodToInstructions(mood) {
     // ... (This method remains the same - no changes needed) ...
     let toneStyleInstruction = "Tell the story in a clear and straightforward style.";
    switch (mood?.toLowerCase() ?? 'neutral') {
      case "melancholic": toneStyleInstruction = "Tell the story with a reflective and somewhat somber tone..."; break;
      case "joyful": toneStyleInstruction = "Tell the story with an upbeat, warm, and happy tone..."; break;
      case "mysterious": toneStyleInstruction = "Weave an air of mystery and intrigue into the story..."; break;
      case "thrilling": toneStyleInstruction = "Make the story exciting and tense..."; break;
      case "serene": toneStyleInstruction = "Create a calm, peaceful, and tranquil atmosphere..."; break;
      case "nostalgic": toneStyleInstruction = "Evoke a sense of sentimentality and wistfulness..."; break;
    }
    console.log(`Mood instructions for "${mood}": ${toneStyleInstruction}`);
    return toneStyleInstruction;
  }

  async weaveStoryWithAzureOpenAI(journalTexts, mood) {
    if (!this.openaiClient) {
        console.error("weaveStoryWithAzureOpenAI: Azure OpenAI client not available.");
        return "Story generation service is unavailable due to configuration issues.";
    }

    const moodInstructions = this.adaptMoodToInstructions(mood);
    const messages = [
        { role: "system", content: `You are a compassionate... storyteller... (Your system prompt)` },
        { role: "user", content: `Please write a story with the following mood: **${mood}**. ${moodInstructions}\n\nMemories:\n${journalTexts.map(text => `- "${text.replace(/"/g, "'")}"`).join('\n')}\n\nCreate a unique story.`}
    ];

    console.log("Sending prompt to Azure OpenAI using 'openai' package client:");
    console.log("--------------------PROMPT START--------------------");
    console.log(JSON.stringify(messages, null, 2));
    console.log("---------------------PROMPT END---------------------");

    try {
        // --- CORRECTED API CALL ---
        // Use the standard chat.completions.create method
        // The client is already configured with the deployment, so no need to pass it here
        const result = await this.openaiClient.chat.completions.create({
            model: this.deploymentName, // Recommended to still pass model/deployment here explicitly
            messages: messages,
            max_tokens: 600,
            temperature: 0.75,
            top_p: 0.95,
        });

        if (result.choices && result.choices.length > 0 && result.choices[0].message?.content) {
            const generatedStory = result.choices[0].message.content.trim();
            console.log("Story generated successfully by Azure OpenAI.");
            return generatedStory;
        } else {
            console.error("Azure OpenAI response was empty or malformed:", JSON.stringify(result, null, 2));
            return "Could not generate a story (unexpected response).";
        }
    } catch (error) {
        console.error("Azure OpenAI API error:", error.response?.data || error.message || error);
        // Provide a user-friendly fallback message
        let fallbackStory = `A story reflecting on ${mood?.toLowerCase() || 'life'} could be told... (Service currently unavailable)`;
        if (journalTexts.length === 0) {
             fallbackStory = "No memories were available... (Service currently unavailable)";
        }
        return fallbackStory;
    }
  }

  async generate(mood) {
    if (!this.openaiClient) {
        console.error("generate: Azure OpenAI client not available.");
        return "Story generation service unavailable.";
    }

    const entriesData = await this.fetchJournalEntries();
    const journalTexts = entriesData?.texts || [];

    if (!journalTexts || journalTexts.length === 0) {
      console.log("No journal entries found to generate a story.");
      return "I couldn't find any memories to generate a story from. Try saving some journal entries first!";
    }

    console.log(`Generating story with mood: ${mood} based on ${journalTexts.length} memories.`);
    return await this.weaveStoryWithAzureOpenAI(journalTexts, mood);
  }
}

module.exports = { StoryGenerator };