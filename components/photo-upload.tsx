"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "./camera-capture";
import { Upload, Camera, X, Check } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface PhotoUploadProps {
  value?: File | string;
  onChange: (file: File) => void;
  error?: string;
}

// ============================================================================
// PHOTO UPLOAD COMPONENT
// ============================================================================

export function PhotoUpload({ value, onChange, error }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // ========================================================================
  // GENERATE PREVIEW
  // ========================================================================

  /**
   * Generate preview from File
   */
  const generatePreview = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // ========================================================================
  // HANDLE FILE SELECT
  // ========================================================================

  const handleFileSelect = (file: File) => {
    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      console.error("File size too large");
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      console.error("Invalid file type");
      return;
    }

    setFileName(file.name);
    generatePreview(file);
    onChange(file);
  };

  // ========================================================================
  // HANDLE INPUT CHANGE
  // ========================================================================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // ========================================================================
  // HANDLE CAMERA CAPTURE
  // ========================================================================

  const handleCameraCapture = (file: File) => {
    setShowCamera(false);
    setFileName("passport-photo.jpg");
    generatePreview(file);
    onChange(file);
  };

  // ========================================================================
  // HANDLE REMOVE
  // ========================================================================

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="space-y-4">
      {/* Label */}
      <div>
        <label className="text-base font-semibold text-gray-900 block mb-2">
          📷 Passport Photo *
        </label>
        <p className="text-xs text-gray-500 mb-3">
          JPEG or PNG format, max 5MB - Use camera or upload file
        </p>
      </div>

      {/* Preview or Upload Area */}
      {preview ? (
        <div className="relative rounded-lg overflow-hidden border-2 border-green-200 bg-green-50">
          <img
            src={preview}
            alt="Passport preview"
            className="w-full aspect-video object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="absolute top-2 right-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <Check className="h-3 w-3" />
            Captured
          </div>
          {fileName && (
            <div className="p-2 bg-green-100 text-green-800 text-xs font-medium">
              {fileName}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-green-400 transition-colors">
          <div className="space-y-3">
            <div className="flex justify-center gap-3 flex-wrap">
              <Button
                type="button"
                onClick={() => setShowCamera(true)}
                className="bg-green-600 hover:bg-green-700 gap-2"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Click to capture photo with camera or upload from device
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}