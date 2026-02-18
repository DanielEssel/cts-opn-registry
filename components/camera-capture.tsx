"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Check } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const imageData = canvasRef.current.toDataURL("image/jpeg", 0.9);
        setCaptured(imageData);
      }
    }
  };

  const confirmCapture = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], "passport-photo.jpg", {
              type: "image/jpeg",
            });
            onCapture(file);
            stopCamera();
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      setIsOpen(false);
      setCaptured(null);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Capture Passport Photo</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative bg-black aspect-video">
          {!captured ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={captured}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          {/* Camera guide overlay */}
          {!captured && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-green-400 rounded-lg w-48 h-64 opacity-50" />
              <p className="absolute bottom-4 text-white text-sm text-center w-full">
                Position your face in the frame
              </p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="p-4 flex gap-2">
          {!captured ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={capturePhoto}
                className="flex-1 bg-green-600 hover:bg-green-700"
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
                onClick={() => setCaptured(null)}
                className="flex-1"
              >
                Retake
              </Button>
              <Button
                type="button"
                onClick={confirmCapture}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}