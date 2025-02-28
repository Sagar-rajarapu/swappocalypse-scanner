
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
          
          <UploadArea />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
