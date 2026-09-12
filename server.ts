import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { enforceFixedSchema } from './src/schema/propertySchema';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser for JSON payloads including base64 images
app.use(express.json({ limit: '25mb' }));

// Lazy initialization for GoogleGenAI to ensure graceful handling
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Server-side Gemini Property Feature Extraction
 * Extracts ONLY predefined features into a strict JSON schema.
 */
app.post('/api/extract-features', async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg' } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No image payload provided.',
      });
    }

    const ai = getGeminiClient();

    const extractionPrompt = `
You are an automated property data extraction system for a downstream Machine Learning model.
Extract ONLY the predefined property features from the uploaded image. The image may be a property photograph, a flyer/advertisement, or a social media listing screenshot.

PREDEFINED FIXED SCHEMA:
{
  "bedrooms": integer or null,
  "bathrooms": integer or null,
  "area": number (total size in numeric format) or null,
  "location": string (city/district/neighborhood name) or null,
  "view": string (e.g. "sea", "garden", "city", "street", "pool") or null,
  "floor": integer or null,
  "property_age": number (years) or null
}

CRITICAL RULES:
1. ONLY extract the 7 predefined fields listed above.
2. If a feature cannot be reliably determined or is not explicitly mentioned, you MUST set its value to null.
3. NEVER guess, assume, or invent values.
4. NEVER estimate or predict the property's price.
5. Completely ignore any extra information (such as schools, parking, elevators, renovation, owner info, phone numbers, contact names, price tags, or general descriptions).
6. Output MUST be strictly valid JSON matching the exact schema. No markdown formatting, no commentary.
`;

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: image,
              },
            },
            {
              text: extractionPrompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
    } catch (primaryError) {
      console.warn('gemini-3.6-flash attempt failed, falling back to gemini-3.8-flash:', primaryError);
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: image,
              },
            },
            {
              text: extractionPrompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });
    }

    const rawText = response.text?.trim() || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      // Try extracting JSON block if any wrapper exists
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Gemini output could not be parsed as valid JSON.');
      }
    }

    // Enforce fixed schema guarantees on server side
    const fixedFeatures = enforceFixedSchema(parsed);

    return res.json({
      success: true,
      features: fixedFeatures,
      rawText,
    });
  } catch (error: any) {
    console.error('Extraction error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract property features with Gemini.',
    });
  }
});

/**
 * Placeholder endpoint for the future Python Machine Learning API.
 * As per instructions: "Do not implement the Python machine-learning backend yet.
 * Use a placeholder endpoint: POST /predict. The request body contains the fixed feature JSON."
 * Returns 503 so the frontend properly registers the "Python API unavailable" state.
 */
app.post('/predict', (req, res) => {
  res.status(503).json({
    status: 'unavailable',
    error: 'Python ML service is currently offline. The Python prediction API is not yet connected.',
    endpoint: '/predict',
    received_payload: req.body,
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
