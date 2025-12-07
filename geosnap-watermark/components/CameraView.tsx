import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { getFormattedDateParts } from '../utils/dateUtils';
import { AlertIcon, RefreshIcon } from './Icons';

interface CameraViewProps {
  onCapture: (imageDataUrl: string) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const geoState = useGeolocation();
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  // State for live clock
  const [dateTime, setDateTime] = useState(getFormattedDateParts());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(getFormattedDateParts());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const startCamera = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setPermissionDenied(true);
      } else {
        setError("Could not access the camera. Please ensure permissions are granted.");
      }
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const getLocationString = () => {
    if (geoState.loading) return "Mencari Lokasi...";
    if (geoState.error) return "Lokasi Tidak Tersedia";
    if (geoState.coords) {
      return `Lat: ${geoState.coords.latitude.toFixed(5)}\nLong: ${geoState.coords.longitude.toFixed(5)}`;
    }
    return "";
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video stream resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 1. Draw Video Frame
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (facingMode === 'user') {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // 2. Prepare Data
    const { time, date } = getFormattedDateParts();
    const locationLines = getLocationString().split('\n');

    // 3. Configuration for Watermark
    const padding = canvas.width * 0.04; // Left/Bottom margin
    const bottomMargin = canvas.width * 0.05;
    
    // Font Sizes relative to image width
    const timeFontSize = canvas.width * 0.09;
    const dateFontSize = canvas.width * 0.035;
    const locationFontSize = canvas.width * 0.03;
    
    // --- Draw Time Box ---
    ctx.font = `bold ${timeFontSize}px monospace`; // Monospace for time
    const timeMetrics = ctx.measureText(time);
    
    // Icon Box size
    const iconSize = timeFontSize * 0.8;
    const iconPadding = timeFontSize * 0.2;
    
    // Total Box Dimensions
    const boxPaddingX = timeFontSize * 0.3;
    const boxPaddingY = timeFontSize * 0.15;
    const boxWidth = boxPaddingX + timeMetrics.width + boxPaddingX + iconSize + boxPaddingX;
    const boxHeight = timeFontSize + (boxPaddingY * 2);
    
    const startX = padding;
    // Calculate Y so the info block fits below it
    const infoBlockHeight = (dateFontSize * 1.5) + (locationLines.length * locationFontSize * 1.4);
    const startY = canvas.height - bottomMargin - infoBlockHeight - (boxHeight * 0.5);

    // Draw Dark Background Box
    ctx.fillStyle = 'rgba(35, 25, 25, 0.85)'; // Dark brownish/grey
    roundRect(ctx, startX, startY - timeFontSize + (boxPaddingY), boxWidth, boxHeight, 15);
    ctx.fill();

    // Draw Time Text
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'bottom';
    ctx.fillText(time, startX + boxPaddingX, startY + boxPaddingY * 0.5);

    // Draw Yellow Icon Box
    const iconBoxX = startX + boxPaddingX + timeMetrics.width + boxPaddingX;
    const iconBoxY = startY - timeFontSize + boxPaddingY + (boxHeight - iconSize) / 2;
    
    ctx.fillStyle = '#f59e0b'; // Amber-500
    roundRect(ctx, iconBoxX, iconBoxY, iconSize, iconSize, 8);
    ctx.fill();

    // Draw Checkmark in Icon Box
    ctx.strokeStyle = '#332b2b';
    ctx.lineWidth = iconSize * 0.1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const cx = iconBoxX + iconSize / 2;
    const cy = iconBoxY + iconSize / 2;
    const size = iconSize * 0.25;
    ctx.moveTo(cx - size, cy);
    ctx.lineTo(cx - size * 0.2, cy + size * 0.8);
    ctx.lineTo(cx + size * 1.2, cy - size * 0.8);
    ctx.stroke();

    // --- Draw Info Block (Date + Location) ---
    const lineX = startX;
    const lineY = startY + boxPaddingY * 2; // Start below the box
    const lineWidth = canvas.width * 0.008; // Thickness of vertical line
    const textLeftPadding = canvas.width * 0.02;

    // Draw Vertical Line
    ctx.fillStyle = '#f59e0b'; // Amber-500
    // Height covers date + location lines
    const lineHeightTotal = (dateFontSize * 1.5) + (locationLines.length * locationFontSize * 1.3);
    ctx.fillRect(lineX, lineY, lineWidth, lineHeightTotal);

    // Draw Date
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.font = `600 ${dateFontSize}px sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillText(date, lineX + lineWidth + textLeftPadding, lineY);

    // Draw Location Lines
    ctx.font = `${locationFontSize}px sans-serif`;
    let currentTextY = lineY + (dateFontSize * 1.5);
    
    locationLines.forEach(line => {
      ctx.fillText(line, lineX + lineWidth + textLeftPadding, currentTextY);
      currentTextY += (locationFontSize * 1.3);
    });

    // 6. Export
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(dataUrl);
  };

  // Helper function for rounded rectangles
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center h-full max-w-md">
        <div className="bg-red-500/10 p-4 rounded-full mb-4">
          <AlertIcon className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Akses Kamera Ditolak</h2>
        <p className="text-gray-400 mb-6">
          Aplikasi membutuhkan akses kamera untuk mengambil foto. Mohon izinkan akses kamera di pengaturan browser Anda.
        </p>
        <button 
          onClick={startCamera}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Viewport for Video */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-gray-900">
        {!stream && !error && <div className="text-gray-500">Memuat Kamera...</div>}
        {error && <div className="text-red-400 px-4 text-center">{error}</div>}
        
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        
        {/* === LIVE PREVIEW OVERLAY (Matching the Watermark Template) === */}
        <div className="absolute bottom-8 left-6 flex flex-col items-start gap-3 pointer-events-none select-none z-10">
            
            {/* Time Box */}
            <div className="flex items-center bg-[#231919]/85 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                <span className="text-5xl font-mono font-bold text-white tracking-tighter mr-3">
                    {dateTime.time}
                </span>
                {/* Yellow Icon Box */}
                <div className="bg-amber-500 rounded-lg p-1.5 flex items-center justify-center shadow-inner">
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-[#231919]">
                      <polyline points="20 6 9 17 4 12"></polyline>
                   </svg>
                </div>
            </div>

            {/* Info Block with Vertical Line */}
            <div className="flex flex-row gap-3 pl-1">
                {/* Vertical Bar */}
                <div className="w-1.5 bg-amber-500 rounded-full shadow-lg h-auto min-h-[60px]"></div>
                
                {/* Text Details */}
                <div className="flex flex-col justify-start text-white text-shadow drop-shadow-md">
                    <div className="text-lg font-semibold mb-0.5 leading-tight">
                        {dateTime.date}
                    </div>
                    <div className="text-xs font-light opacity-90 leading-snug whitespace-pre-line">
                        {getLocationString()}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-none p-6 bg-gray-900 flex items-center justify-between gap-4 z-20 border-t border-gray-800">
         <button 
            onClick={toggleCamera}
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors text-white"
            aria-label="Switch Camera"
         >
           <RefreshIcon className="w-6 h-6" />
         </button>

         <button 
           onClick={capturePhoto}
           disabled={!!geoState.loading}
           className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
         >
           <div className="w-16 h-16 rounded-full bg-white group-active:scale-90 transition-transform duration-100"></div>
         </button>

         <div className="w-12 h-12"></div> {/* Spacer for balance */}
      </div>

      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
