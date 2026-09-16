import React from 'react';
import roofImage from '../roof.png';

interface RoofGraphicProps {
  className?: string;
  isHovered?: boolean;
}

/**
 * RoofGraphic
 *
 * Uses the actual roof.png image instead of SVG.
 * Wider than the upload panel to look like an actual house roof.
 */
export const RoofGraphic: React.FC<RoofGraphicProps> = ({
  className = '',
  isHovered = false,
}) => {
  return (
    <div className={`roof-graphic ${className}`}>
      <img
        src={roofImage}
        alt=""
        className="roof-img"
        style={{
          opacity: isHovered ? 0.85 : 1,
          transition: 'opacity 0.2s ease',
        }}
      />
    </div>
  );
};
