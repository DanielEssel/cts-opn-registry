"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Check, Loader2, RefreshCcw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

// ─── PHOTO CONSTRAINTS ────────────────────────────────────────────────────────
// Target: passport-style, under 200 KB, 3:4 portrait ratio
const PHOTO = {
  width:   480,   // px — enough for ID purposes
  height:  640,   // px — 3:4 ratio
  quality: 0.75,  // JPEG quality — good balance of clarity vs size
  maxKB:   200,   // hard limit before warning
} as const;

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [captured,    setCaptured]    = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [photoSizeKB, setPhotoSizeKB] = useState<number | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // ─── CAMERA START ──────────────────────────────────────────────────────────
  // Try rear camera first (mobile), fall back to any available camera (laptop)
  const startCamera = async () => {
    setLoading(true);
    setError(null);
    setCameraReady(false);

    const attempts = [
      { video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: { facingMode: "user",        width: { ideal: 1280 }, height: { ideal: 720 } } },
      { video: true }, // last resort — any camera
    ];

    let stream: MediaStream | null = null;

    for (const constraints of attempts) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ ...constraints, audio: false });
        break; // got a stream — stop trying
      } catch {
        // try next constraint
      }
    }

    if (!stream) {
      setError("No camera found or permission denied. Please allow camera access and try again.");
      setLoading(false);
      return;
    }

    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      // Wait for metadata so dimensions are known before play
      await new Promise<void>((resolve) => {
        if (!videoRef.current) return resolve();
        videoRef.current.onloadedmetadata = () => resolve();
      });
      await videoRef.current.play();
    }

    setCameraReady(true);
    setLoading(false);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  // ─── CAPTURE + COMPRESS ────────────────────────────────────────────────────
  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const vw = video.videoWidth;
    const vh = video.videoHeight;

    if (!vw || !vh) {
      setError("Camera not ready yet — please wait a moment and try again.");
      return;
    }

    // ── Centre-crop to 3:4 portrait ──────────────────────────────────────────
    const targetRatio = PHOTO.width / PHOTO.height; // 0.75
    let cropW = vw;
    let cropH = vw / targetRatio;

    if (cropH > vh) {
      cropH = vh;
      cropW = vh * targetRatio;
    }

    const sx = (vw - cropW) / 2;
    const sy = (vh - cropH) / 2;

    // ── Draw at target size (aggressive downscale = smaller file) ────────────
    canvas.width  = PHOTO.width;
    canvas.height = PHOTO.height;
    ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, PHOTO.width, PHOTO.height);

    const dataUrl = canvas.toDataURL("image/jpeg", PHOTO.quality);
    setCaptured(dataUrl);

    // Estimate size from base64 (base64 ≈ 4/3 × binary)
    const base64 = dataUrl.split(",")[1] ?? "";
    const estimatedKB = Math.round((base64.length * 3) / 4 / 1024);
    setPhotoSizeKB(estimatedKB);
  };

  const retakePhoto = () => {
    setCaptured(null);
    setPhotoSizeKB(null);
  };

  // ─── CONFIRM — re-compress if still over limit ─────────────────────────────
  const confirmCapture = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // If over limit, try lower quality
    let quality: number = PHOTO.quality;
if (photoSizeKB && photoSizeKB > PHOTO.maxKB) {
  quality = Math.max(0.5, PHOTO.quality * (PHOTO.maxKB / photoSizeKB));
}

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const finalKB = Math.round(blob.size / 1024);
        const file = new File(
          [blob],
          `passport-photo-${Date.now()}.jpg`,
          { type: "image/jpeg" }
        );
        console.log(`📷 Photo saved: ${finalKB} KB (${PHOTO.width}×${PHOTO.height}px)`);
        stopCamera();
        onCapture(file);
      },
      "image/jpeg",
      quality
    );
  };

  const handleClose = () => {
    stopCamera();
    onCancel();
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col h-[90vh] max-h-[680px] overflow-hidden">

        {/* Header */}
        <div className="flex-none px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Passport Photo</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Position face within the guide — max {PHOTO.maxKB} KB
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Camera / Preview */}
        <div className="flex-1 relative bg-gray-900 flex items-center justify-center overflow-hidden min-h-0">

          {/* Loading spinner */}
          {loading && (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
              <p className="text-white/60 text-xs">Starting camera...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <Camera className="h-6 w-6 text-red-400" />
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {/* Live video */}
          {!captured && !error && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${cameraReady ? "opacity-100" : "opacity-0"}`}
            />
          )}

          {/* Captured preview */}
          {captured && (
            <img
              src={captured}
              alt="Captured photo"
              className="w-full h-full object-cover"
            />
          )}

          {/* Face guide overlay */}
          {!captured && cameraReady && !loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Dimmed corners to highlight face area */}
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative w-36 h-48 border-2 border-green-400 rounded-xl z-10">
                {/* Corner markers */}
                {[
                  "top-0 left-0 border-t-4 border-l-4 rounded-tl-xl",
                  "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl",
                  "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl",
                  "bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl",
                ].map((cls, i) => (
                  <span
                    key={i}
                    className={`absolute w-5 h-5 border-green-400 ${cls}`}
                  />
                ))}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-[10px] whitespace-nowrap">
                  Align face here
                </span>
              </div>
            </div>
          )}

          {/* Photo size badge after capture */}
          {captured && photoSizeKB !== null && (
            <div className={`absolute bottom-3 right-3 px-2 py-1 rounded-lg text-[10px] font-bold ${
              photoSizeKB <= PHOTO.maxKB
                ? "bg-green-600 text-white"
                : "bg-orange-500 text-white"
            }`}>
              {photoSizeKB} KB {photoSizeKB <= PHOTO.maxKB ? "✓" : "— will compress"}
            </div>
          )}
        </div>

        {/* Hidden canvas for capture/compression */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="flex-none p-4 border-t bg-white flex gap-2">
          {!captured ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraReady || !!error || loading}
                className="flex-1 h-11 bg-green-700 hover:bg-green-800 text-white"
              >
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={retakePhoto}
                className="flex-1 h-11"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button
                type="button"
                onClick={confirmCapture}
                className="flex-1 h-11 bg-green-700 hover:bg-green-800 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Use Photo
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}