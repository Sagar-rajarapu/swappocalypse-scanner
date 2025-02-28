
import { useState } from "react";
import { AnalysisResult } from "@/lib/types";
import { formatPercentage, generateReport } from "@/lib/analysis";

interface ResultsDisplayProps {
  result: AnalysisResult;
  videoFilename: string;
  onStartOver: () => void;
}

export function ResultsDisplay({ result, videoFilename, onStartOver }: ResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'abnormalities' | 'techniques'>('summary');

  const handleDownloadReport = () => {
    generateReport(result, videoFilename);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-scale-in">
      {/* Result header */}
      <div className={`p-6 rounded-lg ${
        result.isDeepfake 
          ? 'bg-destructive/10 border border-destructive/20' 
          : 'bg-green-100 border border-green-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold">
              {result.isDeepfake ? 'Deepfake Detected' : 'No Deepfake Detected'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Analysis completed on {new Date(result.processedAt).toLocaleString()}
              {' · '}{result.processingTime.toFixed(1)}s processing time
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-center">
              <div className="text-3xl font-bold">
                {formatPercentage(result.confidence)}
              </div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === 'summary'
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Summary
            {activeTab === 'summary' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          
          {result.isDeepfake && (
            <>
              <button
                onClick={() => setActiveTab('abnormalities')}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'abnormalities'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Abnormalities ({result.abnormalities.length})
                {activeTab === 'abnormalities' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('techniques')}
                className={`pb-3 text-sm font-medium transition-colors relative ${
                  activeTab === 'techniques'
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Techniques ({result.techniques.length})
                {activeTab === 'techniques' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Analysis Summary</h3>
            
            <div className="prose max-w-none">
              <p>
                {result.isDeepfake
                  ? `We have detected that this video is likely a deepfake with ${formatPercentage(result.confidence)} confidence. 
                     Our analysis identified ${result.abnormalities.length} abnormalities consistent with manipulated content.`
                  : `Our analysis indicates that this video is likely authentic with ${formatPercentage(result.confidence)} confidence. 
                     We did not detect significant abnormalities consistent with deepfake manipulation.`}
              </p>
              
              {result.isDeepfake && (
                <p>
                  The most likely techniques used to create this deepfake are
                  {result.techniques.map((tech, index) => (
                    <span key={tech.name}>
                      {index === 0 
                        ? ' ' 
                        : index === result.techniques.length - 1 
                          ? ', and ' 
                          : ', '}
                      <strong>{tech.name}</strong> ({formatPercentage(tech.probability)} probability)
                    </span>
                  ))}.
                </p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={handleDownloadReport}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Full Report
              </button>
              
              <button
                onClick={onStartOver}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Analyze Another Video
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'abnormalities' && result.isDeepfake && (
          <div className="space-y-8">
            <h3 className="text-lg font-medium">Detected Abnormalities</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {result.abnormalities.map((abnormality, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4 transition-all hover:shadow-sm"
                >
                  <div className="flex justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="capitalize text-sm font-medium">
                          {abnormality.type} Abnormality
                        </span>
                        <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {formatPercentage(abnormality.confidence)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {abnormality.description}
                      </p>
                    </div>
                  </div>
                  
                  {abnormality.timeframes.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">
                        Time markers
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {abnormality.timeframes.map((time) => (
                          <span
                            key={time}
                            className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                          >
                            {time}s
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'techniques' && result.isDeepfake && (
          <div className="space-y-8">
            <h3 className="text-lg font-medium">Detected Techniques</h3>
            
            <div className="space-y-6">
              {result.techniques.map((technique) => (
                <div key={technique.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{technique.name}</h4>
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {formatPercentage(technique.probability)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {technique.description}
                  </p>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${technique.probability * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
