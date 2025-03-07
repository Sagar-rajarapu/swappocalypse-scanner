
import { useState, ChangeEvent } from "react";
import { simulateAnalysis } from "@/lib/analysis";
import { analyzeVideoWithBackend } from "@/lib/analysis-backend";
import { AnalysisResult, UploadProgress } from "@/lib/types";
import { AnalysisProcess } from "@/components/analysis/AnalysisProcess";
import { ResultsDisplay } from "@/components/results/ResultsDisplay";
import { ReportGenerator } from "@/components/report/ReportGenerator";
import { useToast } from "@/hooks/use-toast";

export function UploadArea() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [useBackend, setUseBackend] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      
      // Basic validation
      if (!selectedFile.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file.",
          variant: "destructive"
        });
        return;
      }
      
      // Maximum file size (e.g., 100MB)
      const maxSize = 100 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 100MB.",
          variant: "destructive"
        });
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
      if (useBackend) {
        toast({
          title: "Using Python Backend",
          description: "Connecting to real AI analysis server...",
        });
      } else {
        toast({
          title: "Using Simulation",
          description: "Running simulated analysis (no real AI detection)...",
        });
      }
      
      // Choose whether to use backend or simulation
      const analysisFunc = useBackend ? analyzeVideoWithBackend : simulateAnalysis;
      
      const result = await analysisFunc(file, (progress) => {
        setProgress(progress);
      });
      
      setResult(result);
      
      toast({
        title: "Analysis Complete",
        description: `Video analyzed with ${result.isDeepfake ? "deepfake detected!" : "no deepfake detected."}`,
        variant: result.isDeepfake ? "destructive" : "default"
      });
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Create a more user-friendly error message
      let errorMessage = "An unexpected error occurred during analysis.";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check for specific connection errors
        if (errorMessage.includes("backend server") || errorMessage.includes("not responding")) {
          errorMessage = "Cannot connect to Python backend server. Please make sure it's running on http://localhost:5000";
          
          toast({
            title: "Backend Server Error",
            description: "Python server is not running. Try using simulation mode instead.",
            variant: "destructive"
          });
        }
      }
      
      setProgress({
        status: 'error',
        progress: 0,
        message: errorMessage,
      });
    }
  };

  const handleStartOver = () => {
    setFile(null);
    setProgress({ status: 'idle', progress: 0 });
    setResult(null);
  };

  const toggleBackendMode = () => {
    if (useBackend) {
      setUseBackend(false);
    } else {
      setUseBackend(true);
      toast({
        title: "Backend Mode Enabled",
        description: "Make sure the Python backend server is running at http://localhost:5000",
      });
    }
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
                  onChange={toggleBackendMode}
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
              
              {useBackend && (
                <div className="mt-2 text-sm bg-yellow-100 dark:bg-yellow-900 p-3 rounded">
                  <p className="font-medium">Backend server issue detected</p>
                  <p>Make sure the Python backend is running with this command:</p>
                  <pre className="bg-black/10 p-2 mt-1 rounded text-xs overflow-x-auto">python deepfake_detection_api.py</pre>
                  <p className="mt-2">Or switch to "simulation mode" below.</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              <button
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={handleStartOver}
              >
                Try Again
              </button>
              
              {useBackend && (
                <button
                  className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
                  onClick={() => {
                    setUseBackend(false);
                    setProgress({ status: 'idle', progress: 0 });
                  }}
                >
                  Switch to Simulation
                </button>
              )}
            </div>
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
