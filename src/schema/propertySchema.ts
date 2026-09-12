/**
 * FIXED FEATURE SCHEMA CONFIGURATION
 *
 * This file is the single source of truth for the predefined property features.
 * When the final ML dataset and model features are selected, update this schema
 * in this single location without touching the rest of the application.
 */

export interface PropertyFeatures {
  bedrooms: number | null;
  bathrooms: number | null;
  area: number | null;
  location: string | null;
  view: string | null;
  floor: number | null;
  property_age: number | null;
  [key: string]: string | number | boolean | null;
}

/**
 * Default empty feature structure.
 * All predefined fields start as null until extracted.
 */
export const DEFAULT_PROPERTY_FEATURES: PropertyFeatures = {
  bedrooms: null,
  bathrooms: null,
  area: null,
  location: null,
  view: null,
  floor: null,
  property_age: null,
};

/**
 * Human-readable definitions and guidance for each feature.
 * These definitions are used both by the Gemini prompt and the UI feature inspector.
 */
export const FEATURE_METADATA: Record<
  keyof typeof DEFAULT_PROPERTY_FEATURES,
  { label: string; type: 'integer' | 'number' | 'string'; description: string; unit?: string }
> = {
  bedrooms: {
    label: 'Bedrooms',
    type: 'integer',
    description: 'Number of bedrooms (e.g., 3)',
  },
  bathrooms: {
    label: 'Bathrooms',
    type: 'integer',
    description: 'Number of bathrooms (e.g., 2)',
  },
  area: {
    label: 'Area',
    type: 'number',
    description: 'Total area as a numeric value',
    unit: 'm²',
  },
  location: {
    label: 'Location',
    type: 'string',
    description: 'City, district, or neighborhood name (e.g., "Cairo")',
  },
  view: {
    label: 'View',
    type: 'string',
    description: 'Primary view (e.g., "sea", "garden", "city", "street")',
  },
  floor: {
    label: 'Floor',
    type: 'integer',
    description: 'Floor number of the unit (e.g., 4)',
  },
  property_age: {
    label: 'Property Age',
    type: 'number',
    description: 'Age of the property in years (e.g., 5)',
    unit: 'yrs',
  },
};

/**
 * Enforces that any parsed JSON strictly matches the predefined schema.
 * - Strips out any extraneous fields Gemini might have generated.
 * - Guarantees all predefined fields are present (defaulting to null if missing).
 * - Sanitizes numeric and string values.
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
      result[key] = String(rawVal).trim() || null;
    }
  }

  return result;
}
