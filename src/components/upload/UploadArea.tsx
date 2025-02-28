
import { useState, useRef } from "react";
import { UploadProgress } from "@/lib/types";

interface UploadAreaProps {
  onFileSelected: (file: File) => void;
  progress: UploadProgress;
}

export function UploadArea({ onFileSelected, progress }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isUploading = progress.status === 'uploading' || progress.status === 'processing';
  const showProgress = progress.status !== 'idle';

  // Handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        handleFile(file);
      } else {
        alert('Please upload a video file.');
      }
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  // Common file handling
  const handleFile = (file: File) => {
    setSelectedFile(file);
    onFileSelected(file);
  };

  // Trigger file input click
  const handleClick = () => {
    if (fileInputRef.current && !isUploading) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`relative rounded-lg border-2 border-dashed p-8 transition-all duration-300 ${
          isDragging
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        } ${isUploading ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/*"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full p-3 bg-secondary">
            <svg
              className="h-6 w-6 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {selectedFile && !showProgress
                ? selectedFile.name
                : "Upload your video file"}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag and drop or click to select a video file
            </p>
          </div>
        </div>
      </div>

      {showProgress && (
        <div className="mt-6 space-y-4 animate-fade-in">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progress.message}</span>
              <span>{progress.progress.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
          </div>

          {progress.currentStage && (
            <p className="text-xs text-muted-foreground">
              Current stage: {progress.currentStage.replace(/-/g, ' ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
