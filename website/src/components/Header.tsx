import React from 'react';
import { Home, SlidersHorizontal } from 'lucide-react';

interface HeaderProps {
  onOpenSettings?: () => void;
  apiUrl: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="app-header">
      <div className="brand-group">
        <div className="brand-icon">
          <Home />
        </div>
        <div className="brand-copy">
          <h1>
            PropVal <span>ML</span>
          </h1>
        </div>
      </div>

      <div className="header-actions">
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            type="button"
            className="settings-button"
          >
            <SlidersHorizontal />
            <span>Settings</span>
          </button>
        )}
      </div>
    </header>
  );
};
