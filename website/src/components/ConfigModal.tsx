import React, { useState } from 'react';
import { X, Check, Sliders } from 'lucide-react';
import { DEFAULT_PROPERTY_FEATURES } from '../schema/propertySchema';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  onSaveUrl: (newUrl: string) => void;
}

/** Dropdown option presets for string-typed features */
const VIEW_OPTIONS = ['Sea', 'Garden', 'Highroad', 'City', 'Street', 'Pool', 'Park', 'Nile', 'Desert', 'Courtyard'];
const LOCATION_OPTIONS = [
  'New Cairo', '6th of October', 'Maadi', 'Zamalek', 'Heliopolis',
  'Nasr City', 'Mohandessin', 'Dokki', 'Tagamoa', 'Mokattam',
  'Imbaba', 'Kitkat', 'Sheikh Zayed', 'Rehab City', 'Obour City',
  'Shoubra', 'Ain Shams', 'Hadayek El Kobba', 'Giza', 'Haram',
];
const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const BATHROOM_OPTIONS = [1, 2, 3, 4, 5, 6];
const FLOOR_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  currentUrl,
  onSaveUrl,
}) => {
  const [savedMessage, setSavedMessage] = useState(false);

  // Feature editing state — initialized from defaults
  const [bedrooms, setBedrooms] = useState<string>('');
  const [bathrooms, setBathrooms] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [view, setView] = useState<string>('');
  const [floor, setFloor] = useState<string>('');
  const [propertyAge, setPropertyAge] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Save URL unchanged (keeping existing logic intact)
    onSaveUrl(currentUrl);
    setSavedMessage(true);
    setTimeout(() => {
      setSavedMessage(false);
      onClose();
    }, 700);
  };

  return (
    <div className="modal-backdrop">
      <div className="config-modal">
        <button
          type="button"
          onClick={onClose}
          className="modal-close"
        >
          <X />
        </button>

        <div className="modal-title">
          <Sliders className="modal-title-icon" />
          <h3>Property Features</h3>
        </div>
        <p className="modal-description">
          Edit or enter property features manually if the AI missed any details.
        </p>

        <form onSubmit={handleSave} className="config-form">
          {/* Features grid */}
          <div className="config-features-grid">
            {/* Bedrooms */}
            <div className="config-field">
              <label>Bedrooms</label>
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="config-select"
              >
                <option value="">Select...</option>
                {BEDROOM_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Bathrooms */}
            <div className="config-field">
              <label>Bathrooms</label>
              <select
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="config-select"
              >
                <option value="">Select...</option>
                {BATHROOM_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div className="config-field">
              <label>Area (m²)</label>
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="e.g. 150"
                className="config-select"
              />
            </div>

            {/* Floor */}
            <div className="config-field">
              <label>Floor</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="config-select"
              >
                <option value="">Select...</option>
                {FLOOR_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n === 0 ? 'Ground' : n}</option>
                ))}
              </select>
            </div>

            {/* Property Age */}
            <div className="config-field">
              <label>Property Age (yrs)</label>
              <input
                type="number"
                value={propertyAge}
                onChange={(e) => setPropertyAge(e.target.value)}
                placeholder="e.g. 5"
                className="config-select"
              />
            </div>

            {/* Location */}
            <div className="config-field">
              <label>Location</label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="config-select"
              >
                <option value="">Select location...</option>
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* View */}
            <div className="config-field config-field-wide">
              <label>View</label>
              <select
                value={view}
                onChange={(e) => setView(e.target.value)}
                className="config-select"
              >
                <option value="">Select view...</option>
                {VIEW_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save-button"
            >
              {savedMessage ? <Check /> : null}
              <span>{savedMessage ? 'Saved' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
