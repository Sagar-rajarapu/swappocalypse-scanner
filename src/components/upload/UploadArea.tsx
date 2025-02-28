
import { useState, ChangeEvent } from "react";
import { simulateAnalysis } from "@/lib/analysis";
import { analyzeVideoWithBackend } from "@/lib/analysis-backend";
import { AnalysisResult, UploadProgress } from "@/lib/types";
import { AnalysisProcess } from "@/components/analysis/AnalysisProcess";
import { ResultsDisplay } from "@/components/results/ResultsDisplay";
import { ReportGenerator } from "@/components/report/ReportGenerator";

export function UploadArea() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [useBackend, setUseBackend] = useState<boolean>(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      
      // Basic validation
      if (!selectedFile.type.startsWith('video/')) {
        alert('Please select a video file.');
        return;
      }
      
      // Maximum file size (e.g., 100MB)
      const maxSize = 100 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        alert('File is too large. Please select a file smaller than 100MB.');
        return;
      }
      
      setFile(selectedFile);
      setProgress({ status: 'idle', progress: 0 });
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    try {
      // Choose whether to use backend or simulation
      const analysisFunc = useBackend ? analyzeVideoWithBackend : simulateAnalysis;
      
      const result = await analysisFunc(file, (progress) => {
        setProgress(progress);
      });
      
      setResult(result);
    } catch (error) {
      console.error('Analysis error:', error);
      setProgress({
        status: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  const handleStartOver = () => {
    setFile(null);
    setProgress({ status: 'idle', progress: 0 });
    setResult(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {progress.status === 'idle' && !result && (
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary/10 p-3">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m21 12-7-7v4H3v6h11v4z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Upload a video</h3>
              <p className="text-muted-foreground">
                Upload a video file to analyze for potential deepfake manipulation
              </p>
            </div>

            <div className="flex flex-col gap-2 items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={useBackend}
                  onChange={() => setUseBackend(!useBackend)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                  Use Backend Analysis
                </span>
              </label>
              <p className="text-xs text-muted-foreground max-w-xs text-center">
                {useBackend 
                  ? "Connect to Python backend for real AI-powered analysis (requires backend server)" 
                  : "Use simulation mode for frontend demo (no real analysis)"}
              </p>
            </div>
            
            <div className="grid w-full max-w-sm gap-1.5">
              <label
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="video-upload"
              >
                Video File
              </label>
              
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
              />
            </div>
            
            {file && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Selected file: <span className="font-medium">{file.name}</span> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
                <button
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  onClick={handleAnalyze}
                >
                  Analyze Video
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {(progress.status === 'uploading' || progress.status === 'processing') && (
        <AnalysisProcess progress={progress} />
      )}
      
      {progress.status === 'error' && (
        <div className="border border-destructive/50 rounded-lg p-8 bg-destructive/10">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-destructive/20 p-3">
              <svg
                className="h-6 w-6 text-destructive"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 8v4m0 4h.01M22 12A10 10 0 1 1 2 12a10 10 0 0 1 20 0z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Error</h3>
              <p className="text-muted-foreground">{progress.message || 'An error occurred during analysis.'}</p>
            </div>
            
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              onClick={handleStartOver}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      {result && (
        <ResultsDisplay 
          result={result} 
          videoFilename={file?.name || 'video'} 
          onStartOver={handleStartOver} 
        />
      )}
    </div>
  );
}
