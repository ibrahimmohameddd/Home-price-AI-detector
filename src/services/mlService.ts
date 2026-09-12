/**
 * PYTHON MACHINE LEARNING API INTEGRATION
 *
 * This module is exclusively responsible for communication with the downstream
 * Python ML prediction service.
 *
 * It contains:
 * 1. The configurable endpoint URL (single location for easy updating).
 * 2. The HTTP request dispatcher that sends the fixed feature JSON.
 * 3. The dedicated response parser to extract the predicted price.
 *
 * Note: No ML preprocessing or model logic is implemented on the frontend.
 */

import { PropertyFeatures } from '../schema/propertySchema';

/**
 * Single configuration object for the Python ML API.
 * Update `predictApiUrl` when connecting to your local or deployed Python service
 * (e.g., "http://localhost:8000/predict" or "https://ml-api.example.com/predict").
 */
export const ML_CONFIG = {
  predictApiUrl: '/predict',
  defaultCurrency: 'EGP',
};

export interface PredictionResult {
  success: boolean;
  predictedPrice?: number;
  formattedPrice?: string;
  error?: string;
  isUnavailable?: boolean;
  rawResponse?: any;
}

/**
 * Dedicated function to parse the future Python API response.
 * Update this function if your Python backend structure evolves.
 * Currently expects: { "predicted_price": 1850000 }
 */
export function parsePythonPredictionResponse(data: any): number {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid prediction response: response body is not an object.');
  }

  // Primary expected schema from the Python ML endpoint
  if (typeof data.predicted_price === 'number' && !isNaN(data.predicted_price)) {
    return data.predicted_price;
  }

  // Flexible fallbacks for minor variations in future Python models
  if (typeof data.price === 'number' && !isNaN(data.price)) {
    return data.price;
  }
  if (typeof data.prediction === 'number' && !isNaN(data.prediction)) {
    return data.prediction;
  }

  throw new Error('Invalid prediction response: missing numeric "predicted_price" field.');
}

/**
 * Formats a predicted price into a clean localized currency string.
 * Example: 1850000 -> "1,850,000 EGP"
 */
export function formatPrice(
  amount: number,
  currency: string = ML_CONFIG.defaultCurrency
): string {
  const formattedNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formattedNumber} ${currency}`;
}

/**
 * Sends the fixed feature JSON to the Python Machine Learning API.
 *
 * Request method: POST
 * Request body: JSON matching PropertyFeatures schema
 *
 * Gracefully detects when the Python service is unavailable or offline.
 */
export async function sendFeaturesToPythonModel(
  features: PropertyFeatures,
  overrideUrl?: string
): Promise<PredictionResult> {
  const targetUrl = overrideUrl || ML_CONFIG.predictApiUrl;

  // Log the EXACT JSON object passed into JSON.stringify(features)
  console.log('JSON sent to Python ML API:', features);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(features),
    });

    if (!response.ok) {
      if (response.status === 404 || response.status === 502 || response.status === 503) {
        return {
          success: false,
          isUnavailable: true,
          error: `Python ML service is currently offline or unreachable at "${targetUrl}" (HTTP ${response.status} ${response.statusText}).`,
        };
      }

      let errorDetail = response.statusText;
      try {
        const errorJson = await response.json();
        if (errorJson && (errorJson.detail || errorJson.error || errorJson.message)) {
          errorDetail = errorJson.detail || errorJson.error || errorJson.message;
        }
      } catch {
        // use default statusText
      }

      return {
        success: false,
        error: `Python ML API error (${response.status}): ${errorDetail}`,
      };
    }

    const json = await response.json();
    const predictedPrice = parsePythonPredictionResponse(json);

    return {
      success: true,
      predictedPrice,
      formattedPrice: formatPrice(predictedPrice),
      rawResponse: json,
    };
  } catch (err: any) {
    return {
      success: false,
      isUnavailable: true,
      error: `Could not connect to Python ML API at "${targetUrl}". The service might not be running yet (${err.message || 'Network error'}).`,
    };
  }
}
