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

PREDEFINED FIXED SCHEMA (use these EXACT key names):
{
  "Location": string or null,
  "Area": number (total area in sqm, numeric only) or null,
  "Bedrooms": integer or null,
  "Bathrooms": integer or null,
  "Floor": integer or null,
  "YearBuilt": integer (the year the property was built, e.g. 2020) or null,
  "Seller": string or null,
  "View": string or null,
  "Payment": string or null,
  "Finishing": string or null,
  "Furnished": string or null,
  "Parking": string or null,
  "Security": string or null
}

ALLOWED CATEGORICAL VALUES (you MUST use ONLY these exact values):
- Location: "Shubra", "Al-Haram", "Sheikh Zayed", "Maadi", "6th of October", "Ain Shams", "New Cairo", "Madinaty", "Nasr City", "Heliopolis"
- View: "Street", "Other", "Garden", "Pool", "Lake"
- Seller: "Developer", "Broker", "Private Owner"
- Payment: "Installments", "Cash", "Cash or installments"
- Finishing: "Finished", "Unfinished"
- Furnished: "Furnished", "Unfurnished"
- Parking: "Yes", "No"
- Security: "Yes", "No"

CRITICAL RULES:
1. ONLY extract the 13 predefined fields listed above.
2. If a feature cannot be reliably determined or is not explicitly mentioned, you MUST set its value to null.
3. NEVER guess, assume, or invent values.
4. NEVER estimate or predict the property's price.
5. For categorical features, use ONLY the exact allowed values listed above. If the extracted value does not match any allowed value, set it to null.
6. If the image mentions a property age (e.g. "5 years old"), calculate YearBuilt as current year minus age.
7. Output MUST be strictly valid JSON matching the exact schema. No markdown formatting, no commentary.
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
 * Proxy endpoint that forwards prediction requests to the Python ML API.
 */
app.post('/predict', async (req, res) => {
  try {
    const pythonResponse = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await pythonResponse.json();
    return res.status(pythonResponse.status).json(data);
  } catch (error: any) {
    return res.status(503).json({
      error: 'Python ML service is currently offline. Start app.py to enable predictions.',
    });
  }
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
