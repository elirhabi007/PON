import React, { useState } from 'react';
import { CameraView } from './components/CameraView';
import { ImagePreview } from './components/ImagePreview';
import { CameraIcon } from './components/Icons';

export default function App() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCapture = (imageDataUrl: string) => {
    setCapturedImage(imageDataUrl);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-900 text-white font-sans antialiased">
      {/* Header */}
      <header className="flex-none p-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <CameraIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            GeoSnap
          </h1>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-center bg-black">
        {!capturedImage ? (
          <CameraView onCapture={handleCapture} />
        ) : (
          <ImagePreview 
            imageDataUrl={capturedImage} 
            onRetake={handleRetake} 
          />
        )}
      </main>
    </div>
  );
}