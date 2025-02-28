
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { UploadArea } from "@/components/upload/UploadArea";
import { AnalysisProcess } from "@/components/analysis/AnalysisProcess";
import { ResultsDisplay } from "@/components/results/ResultsDisplay";
import { AnalysisResult, UploadProgress } from "@/lib/types";
import { simulateAnalysis } from "@/lib/analysis";
import { DeepfakeGenerator } from "@/components/generation/DeepfakeGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Upload() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container max-w-4xl">
          <div className="mx-auto max-w-2xl text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Deepfake Tools
            </h1>
            <p className="mt-4 text-muted-foreground">
              Analyze videos for deepfake manipulation or generate synthetic videos for educational purposes.
            </p>
          </div>
          
          <Tabs defaultValue="analyze" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="analyze">Analyze Video</TabsTrigger>
              <TabsTrigger value="generate">Generate Deepfake</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analyze">
              <div className="mx-auto max-w-2xl text-center mb-6">
                <h2 className="text-2xl font-bold">
                  Analyze Your Video
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Upload a video to scan for deepfake manipulation. 
                  Our AI will analyze it and provide detailed results.
                </p>
              </div>
              <UploadArea />
            </TabsContent>
            
            <TabsContent value="generate">
              <div className="mx-auto max-w-2xl text-center mb-6">
                <h2 className="text-2xl font-bold">
                  Generate Synthetic Video
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Create synthetic videos using face swapping or text-to-video generation.
                  For educational and research purposes only.
                </p>
              </div>
              <DeepfakeGenerator />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
