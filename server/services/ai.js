import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

export const generateCheckpointSummary = async (checkpointName, type) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'dummy_key') {
      throw new Error("GEMINI_API_KEY is not set or invalid");
    }

    // Initialize the new GoogleGenAI client (it picks up GEMINI_API_KEY automatically)
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Provide a concise 2-paragraph summary about "${checkpointName}" (Type: ${type}). Include what it is famous for, and 2-3 quick tips (what to do or what not to do).`;

    let summaryText = '';
    try {
      const interaction = await ai.interactions.create({
        model: "gemini-2.5-flash",
        input: prompt,
      });
      summaryText = interaction.output_text;
    } catch (aiError) {
      console.warn("Gemini AI failed, attempting Groq fallback...", aiError.message);
      
      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey || groqKey === 'YOUR_GROQ_KEY_HERE') {
        throw new Error("Gemini AI failed and GROQ_API_KEY is not configured for fallback.");
      }
      
      const groq = new Groq({ apiKey: groqKey });
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
      });
      summaryText = chatCompletion.choices[0]?.message?.content || "AI Summary unavailable.";
    }

    return summaryText;
  } catch (error) {
    console.error('Error generating AI summary with @google/genai:', error);
    return "Summary currently unavailable due to AI service issue.";
  }
};
