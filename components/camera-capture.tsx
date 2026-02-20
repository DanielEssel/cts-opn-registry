"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Check, Loader2, RefreshCcw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [captured, setCaptured] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraReady(true);
    } catch (err) {
      console.error(err);
      setError("Camera permission denied or unavailable.");
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { videoWidth: vw, videoHeight: vh } = video;
    const ratio = 3 / 4;

    let cropW = vw;
    let cropH = vw / ratio;

    if (cropH > vh) {
      cropH = vh;
      cropW = vh * ratio;
    }

    const sx = (vw - cropW) / 2;
    const sy = (vh - cropH) / 2;

    canvas.width = 600;
    canvas.height = 800;

    ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, 600, 800);
    setCaptured(canvas.toDataURL("image/jpeg", 0.85));
  };

  const retakePhoto = () => setCaptured(null);

  const confirmCapture = () => {
    canvasRef.current?.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "passport-photo.jpg", { type: "image/jpeg" });
        stopCamera();
        onCapture(file);
      },
      "image/jpeg",
      0.85
    );
  };

  const handleClose = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      {/* Fixed height modal so buttons are never pushed off screen */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col h-[90vh] max-h-[680px] overflow-hidden">

        {/* Header */}
        <div className="flex-none p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Take Passport Photo</h2>
          <button
            onClick={handleClose}
            aria-label="Close camera"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera / Preview — flex-1 fills remaining space */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden min-h-0">

          {loading && (
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          )}

          {error && (
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <p className="text-red-400 text-sm">{error}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startCamera}
                className="text-white border-white hover:bg-white/10"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          )}

          {!captured && cameraReady && !error && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {captured && (
            <img
              src={captured}
              alt="Captured photo preview"
              className="w-full h-full object-cover"
            />
          )}

          {/* Face guide overlay */}
          {!captured && cameraReady && !loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-green-400 rounded-xl w-36 h-48 opacity-70" />
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {/* Controls — always pinned to bottom */}
        <div className="flex-none p-4 border-t bg-white flex gap-2">
          {!captured ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              <Button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraReady || !!error}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
                className="flex-1"
              >
                Retake
              </Button>
              <Button
                type="button"
                onClick={confirmCapture}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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