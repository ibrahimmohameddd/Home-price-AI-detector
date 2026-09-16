import React from 'react';

/**
 * HeroBanner
 *
 * A standalone decorative tagline component displayed above the main content.
 * Designed to be easily removable — just delete the import and usage in App.tsx.
 */
export const HeroBanner: React.FC = () => {
  return (
    <div className="hero-banner">
      <div className="hero-bubble">
        <span className="hero-accent" />
        <p className="hero-text">
          Estimate any property's value — just from a photo
        </p>
        <span className="hero-accent hero-accent-end" />
      </div>
    </div>
  );
};
