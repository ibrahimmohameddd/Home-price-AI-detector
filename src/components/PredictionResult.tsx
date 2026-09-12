import React from 'react';
import {
  BedDouble,
  Bath,
  Maximize2,
  MapPin,
  Eye,
  Layers,
  Calendar,
  AlertTriangle,
  Loader2,
  RotateCw,
} from 'lucide-react';
import { PropertyFeatures } from '../schema/propertySchema';
import { formatPrice } from '../services/mlService';

interface PredictionResultProps {
  predictedPrice: number | null;
  currency?: string;
  extractedFeatures: PropertyFeatures | null;
  isPythonUnavailable: boolean;
  priceError: string | null;
  extractionError: string | null;
  isLoadingPython?: boolean;
  onRetryPrediction?: () => void;
}

export const PredictionResult: React.FC<PredictionResultProps> = ({
  predictedPrice,
  currency = 'EGP',
  extractedFeatures,
  isPythonUnavailable,
  priceError,
  extractionError,
  isLoadingPython = false,
  onRetryPrediction,
}) => {
  // Case 1: Gemini Extraction Failed (e.g. invalid file, API error)
  if (extractionError && !extractedFeatures) {
    return (
      <div className="analysis-error">
        <div>
          <AlertTriangle />
          <div>
            <h3>Image Analysis Failed</h3>
            <p>{extractionError}</p>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Features have been extracted (Normal or Python unavailable)
  // Both cases are rendered in the same unified two-half card!
  if (extractedFeatures) {
    const renderFeatureValue = (val: string | number | boolean | null, unit?: string) => {
      if (val === null || val === undefined || val === '') {
        return <span className="feature-empty">—</span>;
      }
      return (
        <span className="feature-value">
          {val}
          {unit ? <span className="feature-unit">{unit}</span> : null}
        </span>
      );
    };

    return (
      <div className="result-section">
        <div className="result-card">
          {/* Details and price */}
          <div className="result-columns">
            <div className="features-panel">
              <div>
                <div className="feature-heading-row">
                  <div className="result-heading">
                    <span />
                    <h3>Property details</h3>
                  </div>
                </div>

                {/* Compact inline feature strip — no cards, minimal height */}
                <div className="feature-strip">
                  {/* Area */}
                  <div className="feature-chip">
                    <div className="feature-icon"><Maximize2 /></div>
                    <div className="feature-copy">
                      <span className="feature-label">Area</span>
                      {renderFeatureValue(extractedFeatures.area, 'm²')}
                    </div>
                  </div>

                  {/* Bedrooms */}
                  <div className="feature-chip">
                    <div className="feature-icon"><BedDouble /></div>
                    <div className="feature-copy">
                      <span className="feature-label">Bedrooms</span>
                      {renderFeatureValue(extractedFeatures.bedrooms)}
                    </div>
                  </div>

                  {/* Bathrooms */}
                  <div className="feature-chip">
                    <div className="feature-icon"><Bath /></div>
                    <div className="feature-copy">
                      <span className="feature-label">Bathrooms</span>
                      {renderFeatureValue(extractedFeatures.bathrooms)}
                    </div>
                  </div>

                  {/* Floor */}
                  <div className="feature-chip">
                    <div className="feature-icon"><Layers /></div>
                    <div className="feature-copy">
                      <span className="feature-label">Floor</span>
                      {renderFeatureValue(extractedFeatures.floor)}
                    </div>
                  </div>

                  {/* Property Age */}
                  <div className="feature-chip">
                    <div className="feature-icon"><Calendar /></div>
                    <div className="feature-copy">
                      <span className="feature-label">Property Age</span>
                      {renderFeatureValue(extractedFeatures.property_age, 'yrs')}
                    </div>
                  </div>

                  {/* Location — last */}
                  <div className="feature-chip">
                    <div className="feature-icon"><MapPin /></div>
                    <div className="feature-copy">
                      <span className="feature-label">Location</span>
                      {renderFeatureValue(extractedFeatures.location)}
                    </div>
                  </div>

                  {/* View — last */}
                  <div className="feature-chip">
                    <div className="feature-icon"><Eye /></div>
                    <div className="feature-copy">
                      <span className="feature-label">View</span>
                      {renderFeatureValue(extractedFeatures.view)}
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT HALF: PREDICTED PRICE */}
            <div className="price-panel">
              <span>
                Estimated Property Value
              </span>

              {/* State A: Loading prediction from Python */}
              {isLoadingPython ? (
                <div className="loading-state">
                  <Loader2 />
                  <p>Querying Python ML API...</p>
                </div>
              ) : predictedPrice !== null ? (
                /* State B: Price successfully obtained */
                <div className="price-result">
                  <div className="price-value">
                    {formatPrice(predictedPrice, currency)}
                  </div>
                  <div className="prediction-status">
                    <span />
                    Predicted by Python ML
                  </div>
                </div>
              ) : (
                /* State C: Python API is unavailable or price cannot be obtained */
                /* ONLY the right-side price area reflects this, leaving left side features intact */
                <div className="unavailable-state">
                  <div>
                    Price unavailable
                  </div>
                  <p>
                    Could not determine price (Python ML service offline)
                  </p>
                  {onRetryPrediction && (
                    <button
                      type="button"
                      onClick={onRetryPrediction}
                      className="retry-button"
                    >
                      <RotateCw />
                      <span>Retry Python API</span>
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    );
  }

  // Case 3: Idle state before any image upload
  return (
    <div className="idle-result">
      <div>
        <p>
          Property details and price estimate will appear here once an image is uploaded.
        </p>
      </div>
    </div>
  );
};
