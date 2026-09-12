/**
 * GEMINI EXTRACTION CLIENT SERVICE
 *
 * Calls the secure server-side API endpoint (/api/extract-features) to extract
 * only the predefined property features from the uploaded image.
 *
 * Keeps Gemini API call logic isolated from the UI components.
 */

import { PropertyFeatures, enforceFixedSchema } from '../schema/propertySchema';

export interface ExtractionResult {
  success: boolean;
  features?: PropertyFeatures;
  error?: string;
  rawResponse?: string;
}

/**
 * Validates the uploaded file.
 */
export function validateImageFile(file: File | null): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No image selected. Please choose a property photo, flyer, or listing screenshot.' };
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/bmp'];
  if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|bmp)$/i)) {
    return { valid: false, error: 'Invalid file format. Please upload an image file (PNG, JPG, or WEBP).' };
  }

  const maxSizeBytes = 12 * 1024 * 1024; // 12 MB
  if (file.size > maxSizeBytes) {
    return { valid: false, error: 'Image size exceeds 12MB. Please upload a smaller image file.' };
  }

  return { valid: true };
}

/**
 * Converts a File object to a Base64 data string.
 */
export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      const base64 = commaIdx >= 0 ? result.substring(commaIdx + 1) : result;
      const mimeType = file.type || 'image/jpeg';
      resolve({ base64, mimeType });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Sends the image to the server-side Gemini route for feature extraction.
 */
export async function extractFeaturesFromImage(file: File): Promise<ExtractionResult> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const { base64, mimeType } = await fileToBase64(file);

    const response = await fetch('/api/extract-features', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
        mimeType,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Server error (${response.status} ${response.statusText})`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.error) {
          errorMessage = errJson.error;
        }
      } catch {
        // use default
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();

    if (!data.success || !data.features) {
      return {
        success: false,
        error: data.error || 'Gemini returned an invalid feature payload.',
      };
    }

    // Double-check with our fixed schema enforcement on the client
    const sanitizedFeatures = enforceFixedSchema(data.features);

    return {
      success: true,
      features: sanitizedFeatures,
      rawResponse: data.rawText,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Failed to analyze image: ${err.message || 'Network connection failed.'}`,
    };
  }
}
