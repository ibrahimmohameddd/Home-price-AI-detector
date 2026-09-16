/**
 * FIXED FEATURE SCHEMA CONFIGURATION
 *
 * This file is the single source of truth for the predefined property features.
 * When the final ML dataset and model features are selected, update this schema
 * in this single location without touching the rest of the application.
 */

export interface PropertyFeatures {
  Location: string | null;
  Area: number | null;
  Bedrooms: number | null;
  Bathrooms: number | null;
  Floor: number | null;
  YearBuilt: number | null;
  Seller: string | null;
  View: string | null;
  Payment: string | null;
  Finishing: string | null;
  Furnished: string | null;
  Parking: string | null;
  Security: string | null;
  [key: string]: string | number | boolean | null;
}

/**
 * Default empty feature structure.
 * All predefined fields start as null until extracted.
 */
export const DEFAULT_PROPERTY_FEATURES: PropertyFeatures = {
  Location: null,
  Area: null,
  Bedrooms: null,
  Bathrooms: null,
  Floor: null,
  YearBuilt: null,
  Seller: null,
  View: null,
  Payment: null,
  Finishing: null,
  Furnished: null,
  Parking: null,
  Security: null,
};

/**
 * Allowed categorical values for each categorical feature.
 * This is the single source of truth — used by schema enforcement
 * and referenced by the Gemini extraction prompt.
 */
export const ALLOWED_CATEGORICAL_VALUES: Record<string, string[]> = {
  Location: [
    'Shubra', 'Al-Haram', 'Sheikh Zayed', 'Maadi', '6th of October',
    'Ain Shams', 'New Cairo', 'Madinaty', 'Nasr City', 'Heliopolis',
  ],
  View: ['Street', 'Other', 'Garden', 'Pool', 'Lake'],
  Seller: ['Developer', 'Broker', 'Private Owner'],
  Payment: ['Installments', 'Cash', 'Cash or installments'],
  Finishing: ['Finished', 'Unfinished'],
  Furnished: ['Furnished', 'Unfurnished'],
  Parking: ['Yes', 'No'],
  Security: ['Yes', 'No'],
};

/**
 * Human-readable definitions and guidance for each feature.
 * These definitions are used both by the Gemini prompt and the UI feature inspector.
 */
export const FEATURE_METADATA: Record<
  keyof typeof DEFAULT_PROPERTY_FEATURES,
  { label: string; type: 'integer' | 'number' | 'string'; description: string; unit?: string }
> = {
  Location: {
    label: 'Location',
    type: 'string',
    description: 'City, district, or neighborhood name',
  },
  Area: {
    label: 'Area',
    type: 'number',
    description: 'Total area as a numeric value',
    unit: 'm²',
  },
  Bedrooms: {
    label: 'Bedrooms',
    type: 'integer',
    description: 'Number of bedrooms (e.g., 3)',
  },
  Bathrooms: {
    label: 'Bathrooms',
    type: 'integer',
    description: 'Number of bathrooms (e.g., 2)',
  },
  Floor: {
    label: 'Floor',
    type: 'integer',
    description: 'Floor number of the unit (e.g., 4)',
  },
  YearBuilt: {
    label: 'Year Built',
    type: 'integer',
    description: 'Year the property was built (e.g., 2020)',
  },
  Seller: {
    label: 'Seller',
    type: 'string',
    description: 'Type of seller (Developer, Broker, Private Owner)',
  },
  View: {
    label: 'View',
    type: 'string',
    description: 'Primary view (Street, Garden, Pool, Lake, Other)',
  },
  Payment: {
    label: 'Payment',
    type: 'string',
    description: 'Payment method (Installments, Cash, Cash or installments)',
  },
  Finishing: {
    label: 'Finishing',
    type: 'string',
    description: 'Finishing status (Finished, Unfinished)',
  },
  Furnished: {
    label: 'Furnished',
    type: 'string',
    description: 'Furnishing status (Furnished, Unfurnished)',
  },
  Parking: {
    label: 'Parking',
    type: 'string',
    description: 'Parking available (Yes, No)',
  },
  Security: {
    label: 'Security',
    type: 'string',
    description: 'Security available (Yes, No)',
  },
};

/**
 * Enforces that any parsed JSON strictly matches the predefined schema.
 * - Strips out any extraneous fields Gemini might have generated.
 * - Guarantees all predefined fields are present (defaulting to null if missing).
 * - Sanitizes numeric and string values.
 * - Validates categorical values against allowed lists.
 */
export function enforceFixedSchema(input: any): PropertyFeatures {
  const result: PropertyFeatures = { ...DEFAULT_PROPERTY_FEATURES };

  if (!input || typeof input !== 'object') {
    return result;
  }

  const allowedKeys = Object.keys(DEFAULT_PROPERTY_FEATURES) as Array<keyof typeof DEFAULT_PROPERTY_FEATURES>;

  for (const key of allowedKeys) {
    const rawVal = input[key];
    const meta = FEATURE_METADATA[key];

    if (rawVal === undefined || rawVal === null || rawVal === '' || rawVal === 'null') {
      result[key] = null;
      continue;
    }

    if (meta.type === 'integer' || meta.type === 'number') {
      const num = Number(rawVal);
      if (isNaN(num)) {
        result[key] = null;
      } else {
        result[key] = meta.type === 'integer' ? Math.round(num) : num;
      }
    } else {
      const strVal = String(rawVal).trim();
      if (!strVal) {
        result[key] = null;
        continue;
      }
      // Validate against allowed categorical values if defined
      const allowed = ALLOWED_CATEGORICAL_VALUES[key];
      if (allowed) {
        const match = allowed.find(v => v.toLowerCase() === strVal.toLowerCase());
        result[key] = match ?? null;
      } else {
        result[key] = strVal;
      }
    }
  }

  return result;
}
