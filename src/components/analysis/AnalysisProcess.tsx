
import { UploadProgress } from "@/lib/types";

interface AnalysisProcessProps {
  progress: UploadProgress;
}

const stages = [
  { id: 'upload', label: 'Upload' },
  { id: 'preprocessing', label: 'Preprocessing' },
  { id: 'facial-analysis', label: 'Facial Analysis' },
  { id: 'temporal-analysis', label: 'Temporal Analysis' },
  { id: 'audio-analysis', label: 'Audio Analysis' },
  { id: 'technique-detection', label: 'Technique Detection' },
  { id: 'confidence-scoring', label: 'Confidence Scoring' },
  { id: 'report-generation', label: 'Report Generation' },
];

export function AnalysisProcess({ progress }: AnalysisProcessProps) {
  // If no current stage, return null
  if (!progress.currentStage && progress.status !== 'complete') {
    return null;
  }

  // Find the index of the current stage
  const currentStageIndex = stages.findIndex(
    (stage) => stage.id === progress.currentStage
  );
  
  // If complete, set to last stage
  const activeIndex = progress.status === 'complete' 
    ? stages.length - 1 
    : currentStageIndex;

  return (
    <div className="w-full max-w-3xl mx-auto mt-12">
      <h3 className="text-lg font-medium mb-6 text-center">Analysis Progress</h3>
      
      <div className="relative">
        {/* Progress bar */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ 
              width: progress.status === 'complete' 
                ? '100%' 
                : `${(activeIndex / (stages.length - 1)) * 100}%` 
            }}
          ></div>
        </div>
        
        {/* Stages */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            // Determine if this stage is active, completed, or pending
            const isActive = index === activeIndex;
            const isCompleted = index < activeIndex || progress.status === 'complete';
            
            return (
              <div key={stage.id} className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-all z-10 ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isActive
                      ? 'border-2 border-primary bg-background'
                      : 'border border-muted-foreground/30 bg-background'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs">{index + 1}</span>
                  )}
                </div>
                <span 
                  className={`mt-2 text-xs ${
                    isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  } transition-colors text-center max-w-[80px]`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
