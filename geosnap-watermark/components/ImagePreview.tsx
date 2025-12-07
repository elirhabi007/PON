import React from 'react';
import { DownloadIcon, RefreshIcon, CheckIcon } from './Icons';

interface ImagePreviewProps {
  imageDataUrl: string;
  onRetake: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ imageDataUrl, onRetake }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `geosnap-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col w-full h-full bg-black">
      <div className="flex-1 relative flex items-center justify-center overflow-hidden p-4">
        <img 
          src={imageDataUrl} 
          alt="Captured" 
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-gray-800"
        />
      </div>

      <div className="flex-none p-6 bg-gray-900 border-t border-gray-800">
        <div className="flex gap-4 justify-center max-w-lg mx-auto">
          <button
            onClick={onRetake}
            className="flex-1 py-3 px-4 rounded-xl bg-gray-800 text-white font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshIcon className="w-5 h-5" />
            Retake
          </button>
          
          <button
            onClick={handleDownload}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            <DownloadIcon className="w-5 h-5" />
            Save Photo
          </button>
        </div>
      </div>
    </div>
  );
};