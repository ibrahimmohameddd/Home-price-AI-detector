import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Plus, Image as ImageIcon, RotateCcw, X, Loader2 } from 'lucide-react';
import { RoofGraphic } from './RoofGraphic';

interface HouseUploadBoxProps {
  selectedFile: File | null;
  imagePreviewUrl: string | null;
  isLoading: boolean;
  loadingStep: 'gemini' | 'python' | null;
  onFileSelected: (file: File) => void;
  onClear: () => void;
  onAnalyze: () => void;
}

export const HouseUploadBox: React.FC<HouseUploadBoxProps> = ({
  selectedFile,
  imagePreviewUrl,
  isLoading,
  loadingStep,
  onFileSelected,
  onClear,
  onAnalyze,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelected(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelected(file);
      // Reset input value so re-selecting the same file triggers onChange
      e.target.value = '';
    }
  };

  const triggerSelect = () => {
    if (!isLoading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="upload-section">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileInputChange}
        className="visually-hidden"
        id="property-image-upload-input"
        disabled={isLoading}
      />

      {/* House Composition: Roof decorative element matching reference image roof.png */}
      <RoofGraphic isHovered={isDragging} className="roof-overlap" />

      {/* House Composition: Main Body (Upload Area) */}
      <div
        onClick={!imagePreviewUrl ? triggerSelect : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`upload-panel ${
          isDragging
            ? 'is-dragging'
            : ''
          } ${!imagePreviewUrl ? 'is-selectable' : ''}`}
      >
        {!imagePreviewUrl ? (
          /* Empty Upload State */
          <div className="upload-empty">
            <div
              className={`upload-plus ${
                isDragging
                  ? 'is-dragging'
                  : ''
              }`}
            >
              <Plus />
            </div>

            <h2>
              Upload property image
            </h2>
            <p className="upload-description">
              Drop a photo, flyer, or listing screenshot, or click to browse
            </p>

            <span className="file-types">
              <ImageIcon />
              PNG, JPG, or WEBP up to 12MB
            </span>
          </div>
        ) : (
          /* Image Preview & Actions State */
          <div className="preview-state">
            {/* Image Preview Container */}
            <div className="preview-frame">
              <img
                src={imagePreviewUrl}
                alt="Selected property"
                className="preview-image"
              />

              {/* Processing Overlay */}
              {isLoading && (
                <div className="processing-overlay">
                  <Loader2 />
                  <p className="processing-title">
                    {loadingStep === 'gemini'
                      ? 'Analyzing image...'
                      : 'Requesting prediction from Python ML model...'}
                  </p>
                  <p className="processing-detail">
                    {loadingStep === 'gemini'
                      ? 'Extracting predefined features'
                      : 'Sending payload to Python ML for prediction'}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="preview-actions">
              <div className="file-summary">
                <p className="file-name">
                  {selectedFile?.name || 'Property Image'}
                </p>
                <p className="file-size">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : 'Ready'}
                </p>
              </div>

              <div className="action-buttons">
                <button
                  type="button"
                  onClick={triggerSelect}
                  disabled={isLoading}
                  className="replace-button"
                  title="Choose another image"
                >
                  <RotateCcw />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  onClick={onClear}
                  disabled={isLoading}
                  className="clear-button"
                  title="Remove image"
                >
                  <X />
                </button>

                {!isLoading && (
                  <button
                    type="button"
                    onClick={onAnalyze}
                    className="analyze-button"
                  >
                    Analyze
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
