/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazily initialize Gemini client to prevent startup failure if API key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Dynamic storyboard generation utilizing Gemini 3.5-flash
  app.post("/api/generate-timeline", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Please provide a valid plant description or name." });
      }

      console.log(`Generating timeline for plant prompt: "${prompt}"`);

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Design a scientifically detailed visual growth timeline of exactly 15 seconds for the requested plant concept: "${prompt}".
Identify its real or imaginary scientific properties, family, and render appropriate growth parameters.
Create between 5 and 9 stage keyframes spanning sequentially from 0s (seed stage) to exactly 15s (terminal or reproductive cycle stage).
The timeline seconds MUST include 0 and 15, and have increasing time steps in between.`,
        config: {
          systemInstruction: "You are a visual director and botanist creator mapping plant life-cycle storyboarding for a 15-second computer graphic video simulation.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              plantName: { type: Type.STRING, description: "Common name of the plant" },
              scientificName: { type: Type.STRING, description: "Binomial scientific name (real or fictive)" },
              family: { type: Type.STRING, description: "Botanical family classification" },
              summary: { type: Type.STRING, description: "A highly engaging 1-sentence bio description of the plant's special features" },
              primaryColor: { type: Type.STRING, description: "Hex color for the main stem/foliage, e.g. '#22C55E'" },
              flowerColor: { type: Type.STRING, description: "Hex color for the bloom/pollen, e.g. '#EF4444'" },
              bgColor: { type: Type.STRING, description: "A dark deep midnight background hex color that fits or complements this plant, e.g., '#0B0F19'" },
              stages: {
                type: Type.ARRAY,
                description: "Sequential list of key stages in the 15-second timeline",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.INTEGER, description: "The second on the timeline, from 0 to 15. The first stage must be 0, the last must be 15." },
                    title: { type: Type.STRING, description: "Scientific title of this event (max 5 words)" },
                    narration: { type: Type.STRING, description: "A 1-sentence detailed narrative of the physiological growth event (max 25 words)" },
                    particleIntensity: { type: Type.INTEGER, description: "Atmospheric pollen or moisture particle density, 0 (none) to 100 (heavy)" },
                    growthRatio: { type: Type.NUMBER, description: "Aerial stem shoot length, 0.0 (soil level) to 1.0 (full mature size)" },
                    rootRatio: { type: Type.NUMBER, description: "Subterranean root elongation and branching depth, 0.0 to 1.0" },
                    flowerBloom: { type: Type.NUMBER, description: "Blossom expansion ratio, 0.0 (no bud) to 1.0 (fully open bloom)" },
                    leafCount: { type: Type.INTEGER, description: "Estimated number of lateral leaves fully formed, 0 to 18" },
                    windSway: { type: Type.NUMBER, description: "Wind sway susceptibility fraction, 0.0 (stiff) to 1.0 (very flexible sway)" }
                  },
                  required: ["time", "title", "narration", "particleIntensity", "growthRatio", "rootRatio", "flowerBloom", "leafCount", "windSway"]
                }
              }
            },
            required: ["plantName", "scientificName", "family", "summary", "primaryColor", "flowerColor", "bgColor", "stages"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Received empty response from the visual storyboard system.");
      }

      const cleanJson = JSON.parse(responseText.trim());
      res.json({ success: true, storyboard: cleanJson });
    } catch (err: any) {
      console.error("Timeline Generation Error:", err.message);
      res.status(500).json({
        success: false,
        error: err.message || "An expected error occurred during plant design.",
        fallbackAvailable: true
      });
    }
  });

  // Serve static assets and bundle SPA
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Flora 15 Full-Stack Server boot complete at http://localhost:${PORT}`);
  });
}

startServer();
