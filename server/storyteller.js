require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

class StoryGenerator {
  constructor(token) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey || apiKey === "AIzaSyD2e4TPfRcCHAc_9fEHna_3duYuoN") {
      console.warn("Warning: No valid API key found in GEMINI_API_KEY. Using placeholder (may fail).");
    }
    console.log("Using API key:", apiKey);
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.token = token; // Store the token for authenticated requests
  }

  async fetchJournalEntries() {
    try {
      const response = await fetch("http://localhost:5000/api/journal/texts", {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch journal entries: ${response.status} ${response.statusText}`);
      }
      const entries = await response.json();
      return entries;
    } catch (error) {
      console.error("Error fetching entries:", error.message);
      return { texts: [] };
    }
  }

  parseMemories(entries) {
    const parsed = [];
    for (const entry of entries) {
      const setting = this.extractSetting(entry);
      const emotion = this.extractEmotion(entry);
      const event = this.extractEvent(entry, setting);
      parsed.push({ setting, emotion, event });
    }
    console.log("Parsed memories:", parsed);
    return parsed;
  }

  extractSetting(entry) {
    const words = entry.toLowerCase().split(" ");
    const settings = ["window", "lake", "shop", "coffee", "garden", "room", "forest", "street"];
    return words.find(word => settings.includes(word)) || "unknown place";
  }

  extractEmotion(entry) {
    const lowerEntry = entry.toLowerCase();
    if (lowerEntry.includes("thinking") || lowerEntry.includes("old") || lowerEntry.includes("remember")) return "nostalgia";
    if (lowerEntry.includes("smiling") || lowerEntry.includes("laughed") || lowerEntry.includes("favourite") || lowerEntry.includes("happy")) return "joy";
    if (lowerEntry.includes("closed") || lowerEntry.includes("lost") || lowerEntry.includes("sad")) return "loss";
    if (lowerEntry.includes("new") || lowerEntry.includes("added")) return "curiosity";
    return "neutral";
  }

  extractEvent(entry, setting) {
    const lowerEntry = entry.toLowerCase();
    const settingIndex = lowerEntry.indexOf(setting);
    if (settingIndex !== -1) {
      const eventText = entry.slice(settingIndex + setting.length).trim();
      return eventText || "an event unfolded";
    }
    const keywords = ["my", "favourite", "new", "added"];
    let event = entry;
    keywords.forEach(keyword => {
      event = event.replace(new RegExp(keyword, "gi"), "").trim();
    });
    return event || "an event unfolded";
  }

  adaptToMood(mood) {
    let tone, style;
    switch (mood.toLowerCase()) {
      case "melancholic":
        tone = "reflective, somber";
        style = "slow-paced, detailed";
        break;
      case "joyful":
        tone = "upbeat, warm";
        style = "light, conversational";
        break;
      case "mysterious":
        tone = "enigmatic, subtle";
        style = "intriguing, descriptive";
        break;
      case "thrilling":
        tone = "exciting, tense";
        style = "fast-paced, vivid";
        break;
      case "serene":
        tone = "calm, peaceful";
        style = "gentle, flowing";
        break;
      case "nostalgic":
        tone = "sentimental, wistful";
        style = "reflective, evocative";
        break;
      default:
        tone = "neutral";
        style = "clear, straightforward";
    }
    return { tone, style };
  }

  async weaveStoryWithGemini(parsedMemories, tone, style) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt = `Create a compelling story with a ${tone} tone and ${style} style based on these memories:\n`;
    parsedMemories.forEach(memory => {
      prompt += `- In ${memory.setting}, ${memory.event}, with a sense of ${memory.emotion}.\n`;
    });
    prompt += "Structure it with a clear beginning, middle, and end. Use the full context of each memory to enrich the narrative.";
    console.log("Gemini prompt:", prompt);

    try {
      const result = await model.generateContent(prompt);
      return await result.response.text();
    } catch (error) {
      console.error("Gemini API error:", error);
      let fallbackStory = "";
      if (parsedMemories.length > 0) {
        fallbackStory += `In ${parsedMemories[0].setting}, the tale began with ${parsedMemories[0].event}, touched by a ${tone} air. `;
        for (let i = 1; i < parsedMemories.length - 1; i++) {
          fallbackStory += `Then, in ${parsedMemories[i].setting}, ${parsedMemories[i].event}, hinting at ${parsedMemories[i].emotion}. `;
        }
        fallbackStory += `Finally, in ${parsedMemories[parsedMemories.length - 1].setting}, ${parsedMemories[parsedMemories.length - 1].event}, leaving a ${tone} resonance.`;
      } else {
        fallbackStory = "No memories were found to craft a story.";
      }
      return fallbackStory;
    }
  }

  async generate(mood) {
    const entries = await this.fetchJournalEntries();
    console.log("Raw API response from http://localhost:5000/api/journal/texts:", entries);
    const textEntries = entries.texts || [];
    if (!textEntries.length) return "No memories to generate a story from.";
    const parsedMemories = this.parseMemories(textEntries);
    const { tone, style } = this.adaptToMood(mood);
    return await this.weaveStoryWithGemini(parsedMemories, tone, style);
  }
}

module.exports = { StoryGenerator };