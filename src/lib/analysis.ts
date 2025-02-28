
import { AnalysisResult, AnalysisStage, UploadProgress } from "./types";

// Simulated analysis stages with durations in milliseconds
const ANALYSIS_STAGES: { stage: AnalysisStage; duration: number; message: string }[] = [
  { stage: 'upload', duration: 1500, message: 'Uploading video...' },
  { stage: 'preprocessing', duration: 2000, message: 'Preprocessing frames...' },
  { stage: 'facial-analysis', duration: 3000, message: 'Analyzing facial features...' },
  { stage: 'temporal-analysis', duration: 2500, message: 'Detecting temporal inconsistencies...' },
  { stage: 'audio-analysis', duration: 2000, message: 'Analyzing audio-visual synchronization...' },
  { stage: 'technique-detection', duration: 2500, message: 'Identifying mathematical techniques...' },
  { stage: 'confidence-scoring', duration: 1500, message: 'Calculating confidence scores...' },
  { stage: 'report-generation', duration: 1000, message: 'Generating detailed report...' },
];

// Total duration of all stages
const TOTAL_DURATION = ANALYSIS_STAGES.reduce((total, stage) => total + stage.duration, 0);

// Mock abnormality types
const ABNORMALITY_TYPES = [
  {
    type: 'facial' as const,
    descriptions: [
      'Inconsistent facial textures around the cheek area',
      'Unnatural blending between facial features',
      'Abnormal eye blinking patterns',
      'Misaligned facial landmarks',
      'Poor edge blending around hairline',
    ],
  },
  {
    type: 'temporal' as const,
    descriptions: [
      'Inconsistent motion between frames',
      'Unnatural head movement transitions',
      'Flickering in facial features',
      'Temporal discontinuity in expression changes',
      'Irregular motion blur patterns',
    ],
  },
  {
    type: 'audio' as const,
    descriptions: [
      'Misalignment between lip movements and speech',
      'Unnatural voice timbre characteristics',
      'Inconsistent audio-visual synchronization',
      'Artificial voice modulation patterns',
      'Missing micro-expressions during speech',
    ],
  },
  {
    type: 'lighting' as const,
    descriptions: [
      'Inconsistent lighting across facial regions',
      'Unnatural shadows on facial features',
      'Mismatched lighting direction',
      'Inconsistent reflections in the eyes',
      'Abnormal specular highlights on skin',
    ],
  },
  {
    type: 'behavior' as const,
    descriptions: [
      'Unnatural micro-expressions',
      'Inconsistent gaze directions',
      'Abnormal facial muscle movements',
      'Missing natural face asymmetry',
      'Robotic expression transitions',
    ],
  },
];

// Mock mathematical techniques
const MATH_TECHNIQUES = [
  {
    name: 'Generative Adversarial Networks (GANs)',
    descriptions: [
      'Evidence of StyleGAN artifacts in facial features',
      'Characteristic GAN compression patterns detected',
      'Training dataset limitations evident in facial details',
    ],
  },
  {
    name: 'Autoencoders',
    descriptions: [
      'Reconstruction artifacts typical of deep autoencoders',
      'Characteristic compression-decompression patterns',
      'Latent space manipulation signatures',
    ],
  },
  {
    name: 'Face Swapping Algorithms',
    descriptions: [
      'Classical landmark-based face swapping patterns detected',
      'Evidence of 3D face model fitting and projection',
      'Warping artifacts consistent with spatial transformation networks',
    ],
  },
  {
    name: 'Neural Rendering',
    descriptions: [
      'Neural texture rendering inconsistencies',
      'View synthesis artifacts in facial orientation',
      'Neural radiance field (NeRF) characteristic patterns',
    ],
  },
  {
    name: 'Diffusion Models',
    descriptions: [
      'Distinctive noise patterns from diffusion process',
      'Evidence of iterative denoising technique application',
      'Characteristic texture degradation from diffusion process',
    ],
  },
];

// Function to simulate the analysis process
export function simulateAnalysis(
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<AnalysisResult> {
  return new Promise((resolve) => {
    // Start with upload stage
    onProgress({
      status: 'uploading',
      progress: 0,
      message: ANALYSIS_STAGES[0].message,
      currentStage: ANALYSIS_STAGES[0].stage,
    });

    let elapsedTime = 0;
    let currentStageIndex = 0;
    
    // Function to update progress
    const updateProgress = () => {
      const currentStage = ANALYSIS_STAGES[currentStageIndex];
      elapsedTime += 100; // 100ms intervals
      
      // Calculate progress within current stage
      const stageProgress = Math.min(
        (elapsedTime - stageStartTime) / currentStage.duration,
        1
      );
      
      // Calculate overall progress
      const overallProgress = 
        (currentStageIndex / ANALYSIS_STAGES.length) + 
        (stageProgress / ANALYSIS_STAGES.length);
      
      onProgress({
        status: currentStageIndex === ANALYSIS_STAGES.length - 1 && stageProgress === 1 
          ? 'complete' 
          : 'processing',
        progress: Math.min(overallProgress * 100, 99), // Cap at 99% until complete
        message: currentStage.message,
        currentStage: currentStage.stage,
      });
      
      // Check if current stage is complete
      if (elapsedTime >= stageStartTime + currentStage.duration) {
        currentStageIndex++;
        stageStartTime = elapsedTime;
        
        // Check if all stages are complete
        if (currentStageIndex >= ANALYSIS_STAGES.length) {
          clearInterval(intervalId);
          
          // Final progress update
          onProgress({
            status: 'complete',
            progress: 100,
            message: 'Analysis complete!',
          });
          
          // Resolve with analysis result
          setTimeout(() => {
            resolve(generateMockResult(file.name));
          }, 500);
        }
      }
    };
    
    let stageStartTime = 0;
    const intervalId = setInterval(updateProgress, 100);
  });
}

// Function to generate a random analysis result
function generateMockResult(filename: string): AnalysisResult {
  // Determine if this is a deepfake (70% chance for demo purposes)
  const isDeepfake = Math.random() < 0.7;
  
  // Generate confidence score (higher if deepfake)
  const confidence = isDeepfake 
    ? 0.7 + Math.random() * 0.29 // 70-99% for deepfakes
    : 0.6 + Math.random() * 0.35; // 60-95% for authentic videos
  
  // Generate 2-5 abnormalities if it's a deepfake
  const numAbnormalities = isDeepfake ? Math.floor(Math.random() * 4) + 2 : 0;
  
  const abnormalities = Array.from({ length: numAbnormalities }, () => {
    // Select random abnormality type
    const typeObj = ABNORMALITY_TYPES[Math.floor(Math.random() * ABNORMALITY_TYPES.length)];
    
    // Select random description for that type
    const description = typeObj.descriptions[
      Math.floor(Math.random() * typeObj.descriptions.length)
    ];
    
    // Generate 1-3 random timeframes (in seconds, max 60s)
    const numTimeframes = Math.floor(Math.random() * 3) + 1;
    const timeframes = Array.from(
      { length: numTimeframes },
      () => Math.floor(Math.random() * 60)
    ).sort((a, b) => a - b);
    
    return {
      type: typeObj.type,
      confidence: 0.7 + Math.random() * 0.29, // 70-99%
      description,
      timeframes,
    };
  });
  
  // Generate 1-3 mathematical techniques if it's a deepfake
  const numTechniques = isDeepfake ? Math.floor(Math.random() * 3) + 1 : 0;
  
  const techniques = Array.from({ length: numTechniques }, () => {
    // Select random technique
    const techniqueIndex = Math.floor(Math.random() * MATH_TECHNIQUES.length);
    const technique = MATH_TECHNIQUES[techniqueIndex];
    
    // Select random description
    const description = technique.descriptions[
      Math.floor(Math.random() * technique.descriptions.length)
    ];
    
    return {
      name: technique.name,
      probability: 0.6 + Math.random() * 0.39, // 60-99%
      description,
    };
  });
  
  // Sort techniques by probability (descending)
  techniques.sort((a, b) => b.probability - a.probability);
  
  return {
    isDeepfake,
    confidence,
    abnormalities,
    techniques,
    processedAt: new Date().toISOString(),
    processingTime: 15 + Math.random() * 10, // 15-25 seconds
  };
}

// Format a number as a percentage
export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// Generate a PDF report (mock function)
export function generateReport(result: AnalysisResult, filename: string): void {
  // In a real application, this would generate a PDF
  // For now, we'll just simulate a download by creating a text file
  const content = `
    DEEPFAKE ANALYSIS REPORT
    ------------------------
    File: ${filename}
    Processed: ${new Date(result.processedAt).toLocaleString()}
    Processing Time: ${result.processingTime.toFixed(2)} seconds
    
    CONCLUSION
    ----------
    This video ${result.isDeepfake ? 'IS' : 'IS NOT'} a deepfake (${formatPercentage(result.confidence)} confidence)
    
    ${result.isDeepfake ? `
    DETECTED ABNORMALITIES
    ----------------------
    ${result.abnormalities.map(a => 
      `- ${a.description} (${formatPercentage(a.confidence)} confidence)
       Time markers: ${a.timeframes.map(t => `${t}s`).join(', ')}`
    ).join('\n\n')}
    
    MATHEMATICAL TECHNIQUES
    ----------------------
    ${result.techniques.map(t => 
      `- ${t.name} (${formatPercentage(t.probability)} probability)
       ${t.description}`
    ).join('\n\n')}`
      : ''}
  `;
  
  // Create a Blob containing the data
  const blob = new Blob([content], { type: 'text/plain' });
  
  // Create a link element
  const link = document.createElement('a');
  
  // Set link's href to point to the Blob
  link.href = URL.createObjectURL(blob);
  link.download = `deepfake-analysis-${new Date().getTime()}.txt`;
  
  // Append link to the body
  document.body.appendChild(link);
  
  // Dispatch click event on the link
  link.click();
  
  // Remove link from the body
  document.body.removeChild(link);
}
