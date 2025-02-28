
import { UploadProgress } from "./types";

// Backend API URL - replace with your actual backend URL when deployed
const API_URL = "http://localhost:5000/api";

export interface GenerationResult {
  videoUrl: string;
  technique: string;
  parameters: Record<string, any>;
  generatedAt: string;
}

export interface GenerationOptions {
  method: "faceswap" | "text-to-video";
  sourceFile?: File;
  targetFile?: File;
  textPrompt?: string;
  duration?: number;
  technique?: string;
  model?: string;
}

/**
 * Generates a deepfake video using the Python backend
 */
export async function generateDeepfakeWithBackend(
  options: GenerationOptions,
  onProgress: (progress: UploadProgress) => void
): Promise<GenerationResult> {
  // Start with upload stage
  onProgress({
    status: 'uploading',
    progress: 0,
    message: 'Uploading content to generation server...',
    currentStage: 'upload',
  });

  try {
    // Check if backend is available first
    try {
      const healthCheck = await fetch(`${API_URL}/health`, { 
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!healthCheck.ok) {
        throw new Error("Backend server is not responding. Please make sure the Python API is running.");
      }
    } catch (error) {
      // If health check fails, throw a user-friendly error
      throw new Error(
        "Cannot connect to the generation server. Please make sure the Python backend is running on http://localhost:5000"
      );
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('method', options.method);
    
    if (options.method === 'faceswap') {
      if (!options.sourceFile || !options.targetFile) {
        throw new Error("Both source and target files are required for face swapping");
      }
      formData.append('source', options.sourceFile);
      formData.append('target', options.targetFile);
      formData.append('technique', options.technique || 'gan');
    } else {
      if (!options.textPrompt) {
        throw new Error("Text prompt is required for text-to-video generation");
      }
      formData.append('prompt', options.textPrompt);
      formData.append('duration', String(options.duration || 5));
      formData.append('model', options.model || 'sd');
    }

    // Use fetch with progress tracking via XMLHttpRequest
    const xhr = new XMLHttpRequest();
    
    // Create promise for XHR request
    const uploadPromise = new Promise<GenerationResult>((resolve, reject) => {
      xhr.open('POST', `${API_URL}/generate`, true);
      
      // Set a timeout of 300 seconds (5 minutes) for the generation request
      xhr.timeout = 300000;
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const uploadPercentage = (event.loaded / event.total) * 100 * 0.2; // Upload is 20% of total progress
          onProgress({
            status: 'uploading',
            progress: uploadPercentage,
            message: 'Uploading content to generation server...',
            currentStage: 'upload',
          });
        }
      };
      
      // Handle upload complete
      xhr.upload.onload = () => {
        onProgress({
          status: 'processing',
          progress: 20, // Upload complete, now processing
          message: 'Content received. Beginning generation...',
          currentStage: 'preprocessing',
        });
      };
      
      // Handle errors
      xhr.onerror = () => {
        reject(new Error('Network error occurred. Please check your connection and make sure the backend server is running.'));
      };
      
      xhr.ontimeout = () => {
        reject(new Error('Request timed out. The server may be overwhelmed or not responding.'));
      };
      
      // Handle response
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            onProgress({
              status: 'complete',
              progress: 100,
              message: 'Generation complete!',
            });
            try {
              const result = JSON.parse(xhr.responseText);
              resolve(result);
            } catch (error) {
              reject(new Error('Invalid response from server. The response could not be parsed as JSON.'));
            }
          } else if (xhr.status === 0) {
            reject(new Error('Could not connect to the backend server. Please make sure the Python API is running at http://localhost:5000'));
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || `Server error: ${xhr.status}`));
            } catch (error) {
              reject(new Error(`Server error: ${xhr.status}. Please check that the backend server is running correctly.`));
            }
          }
        }
      };
      
      // Simulate processing progress while we wait for the backend
      let progressInterval: number;
      let currentProgress = 20; // Start at 20% after upload
      
      const processingStages = [
        { stage: 'preprocessing' as const, message: 'Preprocessing content...', target: 30 },
        { stage: 'model-loading' as const, message: 'Loading AI generation models...', target: 40 },
        { stage: 'face-extraction' as const, message: 'Extracting facial features...', target: 50 },
        { stage: 'generation' as const, message: 'Generating synthetic content...', target: 80 },
        { stage: 'refinement' as const, message: 'Refining generated output...', target: 90 },
        { stage: 'rendering' as const, message: 'Rendering final video...', target: 95 },
        { stage: 'finalization' as const, message: 'Finalizing generation...', target: 99 }
      ];
      
      let currentStageIndex = 0;
      
      progressInterval = window.setInterval(() => {
        // Don't update if we're already done
        if (xhr.readyState === 4 || currentProgress >= 99) {
          window.clearInterval(progressInterval);
          return;
        }
        
        const currentStage = processingStages[currentStageIndex];
        currentProgress += 0.3;
        
        // Move to next stage if we reached the target for this stage
        if (currentProgress >= currentStage.target && currentStageIndex < processingStages.length - 1) {
          currentStageIndex++;
        }
        
        // Update progress
        onProgress({
          status: 'processing',
          progress: Math.min(currentProgress, 99), // Cap at 99% until complete
          message: processingStages[currentStageIndex].message,
          currentStage: processingStages[currentStageIndex].stage,
        });
      }, 200);
      
      // Clean up interval when request is done
      xhr.onloadend = () => {
        window.clearInterval(progressInterval);
      };
      
      // Send the request
      xhr.send(formData);
    });
    
    return uploadPromise;
  } catch (error) {
    onProgress({
      status: 'error',
      progress: 0,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
    throw error;
  }
}

/**
 * Simulated deepfake generation for when backend is not available
 */
export async function simulateDeepfakeGeneration(
  options: GenerationOptions,
  onProgress: (progress: UploadProgress) => void
): Promise<GenerationResult> {
  // Start with upload stage
  onProgress({
    status: 'uploading',
    progress: 0,
    message: 'Uploading content to generation server...',
    currentStage: 'upload',
  });

  // Simulate upload progress
  for (let i = 0; i <= 100; i += 5) {
    await new Promise(resolve => setTimeout(resolve, 100));
    onProgress({
      status: 'uploading',
      progress: i * 0.2, // Upload is 20% of total progress
      message: 'Uploading content to generation server...',
      currentStage: 'upload',
    });
  }

  // Simulate generation process
  onProgress({
    status: 'processing',
    progress: 20,
    message: 'Content received. Beginning generation...',
    currentStage: 'preprocessing',
  });

  const processingStages = [
    { progress: 30, message: 'Preprocessing content...', stage: 'preprocessing' as const },
    { progress: 40, message: 'Loading AI generation models...', stage: 'model-loading' as const },
    { progress: 50, message: 'Extracting facial features...', stage: 'face-extraction' as const },
    { progress: 60, message: 'Generating synthetic content...', stage: 'generation' as const },
    { progress: 70, message: 'Continuing generation...', stage: 'generation' as const },
    { progress: 80, message: 'Refining generated output...', stage: 'refinement' as const },
    { progress: 90, message: 'Rendering final video...', stage: 'rendering' as const },
    { progress: 99, message: 'Finalizing generation...', stage: 'finalization' as const }
  ];

  for (const stage of processingStages) {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    onProgress({
      status: 'processing',
      progress: stage.progress,
      message: stage.message,
      currentStage: stage.stage,
    });
  }

  // Complete the process
  onProgress({
    status: 'complete',
    progress: 100,
    message: 'Generation complete!',
  });

  // Return mock result
  return {
    videoUrl: 'https://example.com/generated-deepfake.mp4',
    technique: options.method === 'faceswap' ? 'GAN-based Face Swapping' : 'Text-to-Video Diffusion',
    parameters: {
      model: options.method === 'faceswap' ? (options.technique || 'gan') : (options.model || 'sd'),
      resolution: '512x512',
      duration: options.duration || 5,
      prompt: options.textPrompt || '',
    },
    generatedAt: new Date().toISOString()
  };
}
