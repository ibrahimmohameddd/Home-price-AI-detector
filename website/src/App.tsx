import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HouseUploadBox } from './components/HouseUploadBox';
import { PredictionResult } from './components/PredictionResult';
import { ConfigModal } from './components/ConfigModal';
import { PropertyFeatures } from './schema/propertySchema';
import { extractFeaturesFromImage } from './services/geminiService';
import {
  sendFeaturesToPythonModel,
  ML_CONFIG,
} from './services/mlService';

export default function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<'gemini' | 'python' | null>(null);

  // Gemini Extraction State
  const [extractedFeatures, setExtractedFeatures] = useState<PropertyFeatures | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Python ML API Prediction State (Independent from Gemini stage)
  const [predictedPrice, setPredictedPrice] = useState<number | null>(null);
  const [isPythonUnavailable, setIsPythonUnavailable] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Configuration Modal
  const [pythonApiUrl, setPythonApiUrl] = useState<string>(ML_CONFIG.predictApiUrl);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Clean up object URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  /**
   * Main Pipeline Execution:
   * Image → Gemini analyzes image
   * → Gemini extracts ONLY predefined fixed PropertyFeatures JSON
   * → frontend receives that JSON
   * → frontend logs EXACT JSON that will be sent to Python in browser console
   * → frontend sends that JSON to the Python ML API
   * → Python returns predicted price
   * → frontend displays the result.
   * If Python is unavailable, only the price area reflects it; features remain visible.
   */
  const processPipeline = async (file: File) => {
    setIsLoading(true);
    setLoadingStep('gemini');
    setExtractionError(null);
    setPriceError(null);
    setPredictedPrice(null);
    setIsPythonUnavailable(false);
    setExtractedFeatures(null);

    // Stage 1: Gemini Image Analysis & Fixed Feature Extraction
    const extraction = await extractFeaturesFromImage(file);

    if (!extraction.success || !extraction.features) {
      setIsLoading(false);
      setLoadingStep(null);
      setExtractionError(extraction.error || 'Gemini feature extraction failed.');
      return;
    }

    const features = extraction.features;
    setExtractedFeatures(features);
    setExtractionError(null);

    // Stage 2: Send to Python ML API
    // Note: sendFeaturesToPythonModel logs the EXACT JSON object to the console
    setLoadingStep('python');
    const prediction = await sendFeaturesToPythonModel(features, pythonApiUrl);

    setIsLoading(false);
    setLoadingStep(null);

    if (prediction.success && prediction.predictedPrice !== undefined) {
      setPredictedPrice(prediction.predictedPrice);
      setPriceError(null);
      setIsPythonUnavailable(false);
    } else {
      // Python unavailable or errored - only affects price display, features stay visible!
      setPredictedPrice(null);
      setIsPythonUnavailable(prediction.isUnavailable ?? true);
      setPriceError(prediction.error || 'Price unavailable');
    }
  };

  const handleFileSelected = (file: File) => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    const newUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setImagePreviewUrl(newUrl);

    // Trigger analysis immediately upon file drop or selection
    processPipeline(file);
  };

  const handleClear = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setExtractedFeatures(null);
    setPredictedPrice(null);
    setIsPythonUnavailable(false);
    setExtractionError(null);
    setPriceError(null);
  };

  const handleRetryPrediction = async () => {
    if (!extractedFeatures) return;
    setIsLoading(true);
    setLoadingStep('python');
    setPriceError(null);

    const prediction = await sendFeaturesToPythonModel(extractedFeatures, pythonApiUrl);
    setIsLoading(false);
    setLoadingStep(null);

    if (prediction.success && prediction.predictedPrice !== undefined) {
      setPredictedPrice(prediction.predictedPrice);
      setPriceError(null);
      setIsPythonUnavailable(false);
    } else {
      setPredictedPrice(null);
      setIsPythonUnavailable(prediction.isUnavailable ?? true);
      setPriceError(prediction.error || 'Price unavailable');
    }
  };

  return (
    <div className="app-shell">
      {/* Header Bar */}
      <Header apiUrl={pythonApiUrl} onOpenSettings={() => setIsConfigOpen(true)} />

      {/* Main Single-Screen Body */}
      <main className="app-main">
        {/* Dominant Upload Component with House Composition & Reference Roof */}
        <HouseUploadBox
          selectedFile={selectedFile}
          imagePreviewUrl={imagePreviewUrl}
          isLoading={isLoading}
          loadingStep={loadingStep}
          onFileSelected={handleFileSelected}
          onClear={handleClear}
          onAnalyze={() => selectedFile && processPipeline(selectedFile)}
        />

        {/* Result area */}
        <PredictionResult
          predictedPrice={predictedPrice}
          extractedFeatures={extractedFeatures}
          isPythonUnavailable={isPythonUnavailable}
          priceError={priceError}
          extractionError={extractionError}
          isLoadingPython={isLoading && loadingStep === 'python'}
          onRetryPrediction={handleRetryPrediction}
        />
      </main>

      {/* Optional Configuration Dialog */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        currentUrl={pythonApiUrl}
        onSaveUrl={(url) => setPythonApiUrl(url)}
      />
    </div>
  );
}
