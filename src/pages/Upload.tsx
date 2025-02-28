
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { UploadArea } from "@/components/upload/UploadArea";
import { AnalysisProcess } from "@/components/analysis/AnalysisProcess";
import { ResultsDisplay } from "@/components/results/ResultsDisplay";
import { AnalysisResult, UploadProgress } from "@/lib/types";
import { simulateAnalysis } from "@/lib/analysis";

export default function Upload() {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    status: 'idle',
    progress: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setUploadProgress({
      status: 'idle',
      progress: 0,
    });
    setResult(null);
    
    // Start analysis process
    simulateAnalysis(file, (progress) => {
      setUploadProgress(progress);
      
      // When complete, set the result
      if (progress.status === 'complete') {
        setTimeout(() => {
          simulateAnalysis(file, () => {}).then((result) => {
            setResult(result);
          });
        }, 500);
      }
    });
  };
  
  const handleStartOver = () => {
    setSelectedFile(null);
    setUploadProgress({
      status: 'idle',
      progress: 0,
    });
    setResult(null);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Analyze Your Video
            </h1>
            <p className="mt-4 text-muted-foreground">
              Upload a video to scan for deepfake manipulation. 
              Our AI will analyze it and provide detailed results.
            </p>
          </div>
          
          {!result ? (
            <div className="space-y-12">
              <UploadArea 
                onFileSelected={handleFileSelected} 
                progress={uploadProgress} 
              />
              
              {(uploadProgress.status === 'uploading' || 
               uploadProgress.status === 'processing') && (
                <AnalysisProcess progress={uploadProgress} />
              )}
            </div>
          ) : (
            <ResultsDisplay 
              result={result} 
              videoFilename={selectedFile?.name || 'unknown.mp4'} 
              onStartOver={handleStartOver}
            />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
