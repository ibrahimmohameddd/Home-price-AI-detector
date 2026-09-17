/**
 * PYTHON MACHINE LEARNING API INTEGRATION
 *
 * This module is exclusively responsible for communication with the downstream
 * Python ML prediction service.
 *
 * It transforms PropertyFeatures into the numerical payload expected by
 * the Python ML model.
 */

import { PropertyFeatures } from '../schema/propertySchema';


/**
 * Single configuration object for the Python ML API.
 */
export const ML_CONFIG = {
  predictApiUrl: '/predict',
  defaultCurrency: 'EGP',
};


/**
 * The exact 28-field ML-ready prediction payload.
 */
export interface MLPredictionPayload {
  // Numerical fields
  Area: number | null;
  Bedrooms: number | null;
  Bathrooms: number | null;
  Floor: number | null;
  YearBuilt: number | null;

  // Binary-encoded categorical fields
  Payment: number | null;
  Finishing: number | null;
  Furnished: number | null;
  Parking: number | null;
  Security: number | null;

  // Additional model features
  Seller: number | null;
  SchoolDist: number | null;
  Color: number | null;

  // View one-hot encoded fields
  View_Garden: 0 | 1;
  View_Lake: 0 | 1;
  View_Other: 0 | 1;
  View_Pool: 0 | 1;
  View_Street: 0 | 1;

  // Location one-hot encoded fields
  'Location_6th of October': 0 | 1;
  'Location_Ain Shams': 0 | 1;
  'Location_Al-Haram': 0 | 1;
  'Location_Heliopolis': 0 | 1;
  'Location_Maadi': 0 | 1;
  'Location_Madinaty': 0 | 1;
  'Location_Nasr City': 0 | 1;
  'Location_New Cairo': 0 | 1;
  'Location_Sheikh Zayed': 0 | 1;
  'Location_Shubra': 0 | 1;
}


export interface PredictionResult {
  success: boolean;
  predictedPrice?: number;
  formattedPrice?: string;
  error?: string;
  isUnavailable?: boolean;
  rawResponse?: any;
}


/**
 * Transforms the human-readable PropertyFeatures into the
 * exact 28-field numerical ML payload.
 */
export function transformToMLPayload(
  features: PropertyFeatures
): MLPredictionPayload {

  // --- Binary encoding helper ---

  function encodeBinary(
    value: string | number | boolean | null,
    positiveValues: string[],
    negativeValues: string[]
  ): number | null {

    if (value === null || value === undefined) {
      return null;
    }

    const str = String(value).trim().toLowerCase();

    if (!str) {
      return null;
    }

    if (positiveValues.some(v => v.toLowerCase() === str)) {
      return 1;
    }

    if (negativeValues.some(v => v.toLowerCase() === str)) {
      return 0;
    }

    return null;
  }


  // --- Numerical fields ---

  const Area =
    typeof features.Area === 'number'
      ? features.Area
      : null;

  const Bedrooms =
    typeof features.Bedrooms === 'number'
      ? features.Bedrooms
      : null;

  const Bathrooms =
    typeof features.Bathrooms === 'number'
      ? features.Bathrooms
      : null;

  const Floor =
    typeof features.Floor === 'number'
      ? features.Floor
      : null;

  const YearBuilt =
    typeof features.YearBuilt === 'number'
      ? features.YearBuilt
      : null;


  // --- Binary fields ---

  // Payment:
  // Cash = 1
  // Installments = 0
  const Payment = encodeBinary(
    features.Payment,
    ['Cash'],
    ['Installments']
  );


  // Finishing:
  // Finished = 1
  // Unfinished = 0
  const Finishing = encodeBinary(
    features.Finishing,
    ['Finished'],
    ['Unfinished']
  );


  // Furnished:
  // Furnished = 1
  // Unfurnished = 0
  const Furnished = encodeBinary(
    features.Furnished,
    ['Furnished'],
    ['Unfurnished']
  );


  // Parking:
  // Yes = 1
  // No = 0
  const Parking = encodeBinary(
    features.Parking,
    ['Yes'],
    ['No']
  );


  // Security:
  // Yes = 1
  // No = 0
  const Security = encodeBinary(
    features.Security,
    ['Yes'],
    ['No']
  );


  // --- Additional model features ---

  /*
   * IMPORTANT:
   * Seller and Color must use the EXACT same numerical encoding
   * used by model.py during training.
   *
   * These are left as numeric values here because their exact
   * category mappings depend on the revised dataset.
   */

  const Seller =
    typeof features.Seller === 'number'
      ? features.Seller
      : null;

  const SchoolDist =
    typeof features.SchoolDist === 'number'
      ? features.SchoolDist
      : null;

  const Color =
    typeof features.Color === 'number'
      ? features.Color
      : null;


  // --- View one-hot encoding ---

  const viewValue =
    typeof features.View === 'string'
      ? features.View.trim()
      : '';

  const viewLower = viewValue.toLowerCase();

  const View_Garden: 0 | 1 =
    viewLower === 'garden' ? 1 : 0;

  const View_Lake: 0 | 1 =
    viewLower === 'lake' ? 1 : 0;

  const View_Other: 0 | 1 =
    viewLower === 'other' ? 1 : 0;

  const View_Pool: 0 | 1 =
    viewLower === 'pool' ? 1 : 0;

  const View_Street: 0 | 1 =
    viewLower === 'street' ? 1 : 0;


  // --- Location one-hot encoding ---

  const locationValue =
    typeof features.Location === 'string'
      ? features.Location.trim()
      : '';

  const locationLower = locationValue.toLowerCase();

  const locationMap: Array<[string, string]> = [
    ['6th of october', 'Location_6th of October'],
    ['ain shams', 'Location_Ain Shams'],
    ['al-haram', 'Location_Al-Haram'],
    ['heliopolis', 'Location_Heliopolis'],
    ['maadi', 'Location_Maadi'],
    ['madinaty', 'Location_Madinaty'],
    ['nasr city', 'Location_Nasr City'],
    ['new cairo', 'Location_New Cairo'],
    ['sheikh zayed', 'Location_Sheikh Zayed'],
    ['shubra', 'Location_Shubra'],
  ];


  const locationFields: Record<string, 0 | 1> = {};

  for (const [, fieldName] of locationMap) {
    locationFields[fieldName] = 0;
  }


  for (const [lowerName, fieldName] of locationMap) {

    if (locationLower === lowerName) {
      locationFields[fieldName] = 1;
      break;
    }

  }


  return {
    Area,
    Bedrooms,
    Bathrooms,
    Floor,
    YearBuilt,

    Payment,
    Finishing,
    Furnished,
    Parking,
    Security,

    Seller,
    SchoolDist,
    Color,

    View_Garden,
    View_Lake,
    View_Other,
    View_Pool,
    View_Street,

    'Location_6th of October':
      locationFields['Location_6th of October'],

    'Location_Ain Shams':
      locationFields['Location_Ain Shams'],

    'Location_Al-Haram':
      locationFields['Location_Al-Haram'],

    'Location_Heliopolis':
      locationFields['Location_Heliopolis'],

    'Location_Maadi':
      locationFields['Location_Maadi'],

    'Location_Madinaty':
      locationFields['Location_Madinaty'],

    'Location_Nasr City':
      locationFields['Location_Nasr City'],

    'Location_New Cairo':
      locationFields['Location_New Cairo'],

    'Location_Sheikh Zayed':
      locationFields['Location_Sheikh Zayed'],

    'Location_Shubra':
      locationFields['Location_Shubra'],
  };
}


/**
 * Parses the Python API response.
 */
export function parsePythonPredictionResponse(data: any): number {

  if (!data || typeof data !== 'object') {
    throw new Error(
      'Invalid prediction response: response body is not an object.'
    );
  }


  if (
    typeof data.predicted_price === 'number' &&
    !isNaN(data.predicted_price)
  ) {
    return data.predicted_price;
  }


  if (
    typeof data.price === 'number' &&
    !isNaN(data.price)
  ) {
    return data.price;
  }


  if (
    typeof data.prediction === 'number' &&
    !isNaN(data.prediction)
  ) {
    return data.prediction;
  }


  throw new Error(
    'Invalid prediction response: missing numeric "predicted_price" field.'
  );
}


/**
 * Formats a predicted price.
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
 * Sends the property features to the Python ML API.
 */
export async function sendFeaturesToPythonModel(
  features: PropertyFeatures,
  overrideUrl?: string
): Promise<PredictionResult> {

  const targetUrl =
    overrideUrl || ML_CONFIG.predictApiUrl;


  // Transform human-readable features into ML-ready payload
  const predictionData =
    transformToMLPayload(features);


  // Debug
  console.log(
    'Prediction payload:',
    predictionData
  );


  try {

    const response = await fetch(
      targetUrl,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },

        body: JSON.stringify(
          predictionData
        ),
      }
    );


    if (!response.ok) {

      if (
        response.status === 404 ||
        response.status === 502 ||
        response.status === 503
      ) {

        return {
          success: false,
          isUnavailable: true,
          error:
            `Python ML service is currently offline or unreachable at ` +
            `"${targetUrl}" ` +
            `(HTTP ${response.status} ${response.statusText}).`,
        };

      }


      let errorDetail =
        response.statusText;


      try {

        const errorJson =
          await response.json();


        if (
          errorJson &&
          (
            errorJson.detail ||
            errorJson.error ||
            errorJson.message
          )
        ) {

          errorDetail =
            errorJson.detail ||
            errorJson.error ||
            errorJson.message;

        }

      } catch {
        // Use default statusText
      }


      return {
        success: false,
        error:
          `Python ML API error (${response.status}): ${errorDetail}`,
      };

    }


    const json =
      await response.json();


    const predictedPrice =
      parsePythonPredictionResponse(json);


    return {
      success: true,
      predictedPrice,
      formattedPrice:
        formatPrice(predictedPrice),
      rawResponse: json,
    };


  } catch (err: any) {

    return {
      success: false,
      isUnavailable: true,
      error:
        `Could not connect to Python ML API at "${targetUrl}". ` +
        `The service might not be running yet ` +
        `(${err.message || 'Network error'}).`,
    };

  }
}
