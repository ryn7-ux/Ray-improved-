import express from "express";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(express.json());

async function generateAIContent(req: express.Request, prompt: string, isJson: boolean = false): Promise<string> {
  const provider = req.header('x-ai-provider') || 'gemini';
  
  if (provider === 'openai') {
    const key = req.header('x-openai-api-key')?.trim();
    if (!key) throw new Error("API key not valid. Please pass a valid API key.");
    const openai = new OpenAI({ apiKey: key });
    
    const response = await openai.chat.completions.create({
      model: req.header('x-openai-model') || 'gpt-4o-mini',
      messages: [{ role: "user", content: prompt }],
      response_format: isJson ? { type: "json_object" } : { type: "text" }
    });
    return response.choices[0].message.content || '';
    
  } else if (provider === 'anthropic') {
    const key = req.header('x-anthropic-api-key')?.trim();
    if (!key) throw new Error("API key not valid. Please pass a valid API key.");
    const anthropic = new Anthropic({ apiKey: key });
    
    const response = await anthropic.messages.create({
      model: req.header('x-anthropic-model') || 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    });
    return (response.content[0] as any).text || '';
    
  } else {
    // Gemini
    const key = req.header('x-gemini-api-key')?.trim() || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("API key not valid. Please pass a valid API key.");
    const ai = new GoogleGenAI({ apiKey: key });
    
    const response = await ai.models.generateContent({
      model: req.header('x-gemini-model') || 'gemini-2.5-flash',
      contents: prompt,
      config: isJson ? { responseMimeType: "application/json" } : undefined
    });
    return response.text || '';
  }
}

function extractJSON(text: string) {
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    const start = text.indexOf('{');
    if (start !== -1) {
      let depth = 0;
      for (let i = start; i < text.length; i++) {
        if (text[i] === '{') depth++;
        if (text[i] === '}') depth--;
        if (depth === 0) {
          try {
            return JSON.parse(text.substring(start, i + 1));
          } catch (e2) {
            break;
          }
        }
      }
    }
    const startArr = text.indexOf('[');
    if (startArr !== -1) {
      let depth = 0;
      for (let i = startArr; i < text.length; i++) {
        if (text[i] === '[') depth++;
        if (text[i] === ']') depth--;
        if (depth === 0) {
          try {
            return JSON.parse(text.substring(startArr, i + 1));
          } catch (e2) {
            break;
          }
        }
      }
    }
    throw e;
  }
}

app.post("/api/estimate-calories", async (req, res) => {
  try {
    const { exercise, reps, durationMins } = req.body;
    const prompt = `Estimate the calories burned for this exercise. Be realistic. Only respond with a JSON object in this format: {"caloriesBurned": number}. 
    Exercise: ${exercise}
    Reps: ${reps || 'N/A'}
    Duration (mins): ${durationMins || 'N/A'}`;
    
    const text = await generateAIContent(req, prompt, true);
    if (text) {
      res.json(extractJSON(text));
    } else {
      res.status(500).json({ error: "Empty response from AI API" });
    }
  } catch (error) {
    console.error("AI API Error:", error);
    let errorMessage = "Failed to process request";
    if (error instanceof Error) {
      errorMessage = error.message;
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.message) errorMessage = parsed.error.message;
      } catch(e) {}
    }
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/diet-check", async (req, res) => {
  try {
    const { calories, protein, fat, carbs, burned } = req.body;
    const prompt = `I have consumed ${calories} calories today (${protein}g protein, ${fat}g fat, ${carbs}g carbs). I have burned ${burned} calories through exercise. Provide a very brief (1-2 sentences) assessment of my diet today, and if I should eat more or less. Be encouraging.`;
    
    const text = await generateAIContent(req, prompt, false);
    res.json({ feedback: text });
  } catch (error) {
    console.error("AI API Error:", error);
    let errorMessage = "Failed to process request";
    if (error instanceof Error) {
      errorMessage = error.message;
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.message) errorMessage = parsed.error.message;
      } catch(e) {}
    }
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/estimate-macros", async (req, res) => {
  try {
    const { mealDescription } = req.body;
    const prompt = `Analyze the following meal/ingredients and estimate the total nutritional values. 
    Meal/Ingredients: ${mealDescription}
    
    Respond ONLY with a JSON object in exactly this format: 
    {"name": "string", "calories": 0, "protein": 0, "fat": 0, "carbs": 0}
    
    Make the "name" a short summary of the meal. Provide realistic numerical estimates.`;
    
    const text = await generateAIContent(req, prompt, true);
    if (text) {
      res.json(extractJSON(text));
    } else {
      res.status(500).json({ error: "Empty response from AI API" });
    }
  } catch (error) {
    console.error("AI API Error:", error);
    let errorMessage = "Failed to process request";
    if (error instanceof Error) {
      errorMessage = error.message;
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.message) errorMessage = parsed.error.message;
      } catch(e) {}
    }
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/generate-workout-plan", async (req, res) => {
  try {
    const { goal, experience, types, equipment } = req.body;
    const prompt = `Design a detailed weekly workout plan based on the following user profile:
    Goal: ${goal}
    Experience Level: ${experience}
    Preferred Workout Types: ${types.join(', ')}
    Available Equipment: ${equipment.length > 0 ? equipment.join(', ') : 'None / Bodyweight only'}

    Create a structured 7-day schedule. For each active day, provide a list of exercises with recommended sets and reps. Include rest days as needed. Tailor the difficulty to their experience level, and only include exercises that can be performed with their available equipment or bodyweight.

    Respond ONLY with a JSON object following this EXACT schema:
    {
      "days": [
        {
          "dayName": "string (e.g., 'Monday - Push', 'Tuesday - Rest')",
          "exercises": [
            {
              "name": "string",
              "sets": "string or number",
              "reps": "string or number"
            }
          ]
        }
      ]
    }`;
    
    const text = await generateAIContent(req, prompt, true);
    if (text) {
      res.json(extractJSON(text));
    } else {
      res.status(500).json({ error: "Empty response from AI API" });
    }
  } catch (error) {
    console.error("AI API Error:", error);
    let errorMessage = "Failed to process request";
    if (error instanceof Error) {
      errorMessage = error.message;
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.message) errorMessage = parsed.error.message;
      } catch(e) {}
    }
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/parse-workout-plan", async (req, res) => {
  try {
    const { textInput } = req.body;
    const prompt = `Parse the following user-provided workout plan into a structured 7-day schedule. 
    For each day, extract the exercises, sets, and reps. If a day is empty or a rest day, leave the exercises array empty.
    
    User Input:
    ${textInput}

    Respond ONLY with a JSON object following this EXACT schema:
    {
      "goal": "string (extract or infer goal)",
      "experience": "string (extract or infer experience, default to 'Beginner')",
      "types": ["string (extract or infer workout types)"],
      "equipment": ["string (extract or infer equipment mentioned)"],
      "days": [
        {
          "dayName": "string",
          "exercises": [
            {
              "name": "string",
              "sets": "string or number",
              "reps": "string or number"
            }
          ]
        }
      ]
    }`;
    
    const text = await generateAIContent(req, prompt, true);
    if (text) {
      res.json(extractJSON(text));
    } else {
      res.status(500).json({ error: "Empty response from AI API" });
    }
  } catch (error) {
    console.error("AI API Error:", error);
    let errorMessage = "Failed to process request";
    if (error instanceof Error) {
      errorMessage = error.message;
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.message) errorMessage = parsed.error.message;
      } catch(e) {}
    }
    res.status(500).json({ error: errorMessage });
  }
});

app.post("/api/verify-key", async (req, res) => {
  try {
    const { provider, key, model } = req.body;
    if (!key) {
      return res.status(400).json({ valid: false });
    }
    
    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey: key });
      await openai.models.list(); // Simple check
      return res.json({ valid: true });
    } else if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey: key });
      await anthropic.messages.create({
        model: model || "claude-3-5-haiku-20241022",
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }]
      });
      return res.json({ valid: true });
    } else {
      // Gemini
      const ai = new GoogleGenAI({ apiKey: key });
      await ai.models.generateContent({
        model: model || "gemini-2.5-flash",
        contents: "hi",
        config: { maxOutputTokens: 1 }
      });
      return res.json({ valid: true });
    }
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.message) {
          errorMessage = parsed.error.message;
        }
      } catch (e) {
        // Not JSON
      }
    }
    return res.json({ valid: false, error: errorMessage });
  }
});

export default app;
