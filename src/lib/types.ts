
export interface AbnormalityDetail {
  type: 'facial' | 'temporal' | 'audio' | 'lighting' | 'behavior';
  confidence: number;
  description: string;
  timeframes: number[];
}

export interface MathTechnique {
  name: string;
  probability: number;
  description: string;
}

export interface AnalysisResult {
  isDeepfake: boolean;
  confidence: number;
  abnormalities: AbnormalityDetail[];
  techniques: MathTechnique[];
  processedAt: string;
  processingTime: number;
}

export interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message?: string;
  currentStage?: AnalysisStage;
}

export type AnalysisStage = 
  | 'upload'
  | 'preprocessing'
  | 'facial-analysis'
  | 'temporal-analysis'
  | 'audio-analysis'
  | 'technique-detection'
  | 'confidence-scoring'
  | 'report-generation';
