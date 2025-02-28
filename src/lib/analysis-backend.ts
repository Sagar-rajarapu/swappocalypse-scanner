
import { AnalysisResult, UploadProgress } from "./types";

// Backend API URL - replace with your actual backend URL when deployed
const API_URL = "http://localhost:5000/api";

/**
 * Analyzes a video file using the Python backend
 */
export async function analyzeVideoWithBackend(
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<AnalysisResult> {
  // Start with upload stage
  onProgress({
    status: 'uploading',
    progress: 0,
    message: 'Uploading video to analysis server...',
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
        },
        timeout: 3000
      });
      
      if (!healthCheck.ok) {
        throw new Error("Backend server is not responding. Please make sure the Python API is running.");
      }
    } catch (error) {
      // If health check fails, throw a user-friendly error
      throw new Error(
        "Cannot connect to the analysis server. Please make sure the Python backend is running on http://localhost:5000"
      );
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('video', file);

    // Use fetch with progress tracking
    const xhr = new XMLHttpRequest();
    
    // Create promise for XHR request
    const uploadPromise = new Promise<AnalysisResult>((resolve, reject) => {
      xhr.open('POST', `${API_URL}/analyze`, true);
      
      // Set a timeout of 30 seconds for the request
      xhr.timeout = 30000;
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const uploadPercentage = (event.loaded / event.total) * 100 * 0.3; // Upload is 30% of total progress
          onProgress({
            status: 'uploading',
            progress: uploadPercentage,
            message: 'Uploading video to analysis server...',
            currentStage: 'upload',
          });
        }
      };
      
      // Handle upload complete
      xhr.upload.onload = () => {
        onProgress({
          status: 'processing',
          progress: 30, // Upload complete, now processing
          message: 'Video received. Beginning analysis...',
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
              message: 'Analysis complete!',
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
      let currentProgress = 30; // Start at 30% after upload
      
      const processingStages = [
        { stage: 'preprocessing' as const, message: 'Preprocessing frames...', target: 40 },
        { stage: 'facial-analysis' as const, message: 'Analyzing facial features with CNN...', target: 55 },
        { stage: 'temporal-analysis' as const, message: 'Detecting temporal inconsistencies...', target: 70 },
        { stage: 'audio-analysis' as const, message: 'Analyzing audio-visual synchronization...', target: 80 },
        { stage: 'technique-detection' as const, message: 'Identifying mathematical techniques...', target: 90 },
        { stage: 'confidence-scoring' as const, message: 'Calculating confidence scores...', target: 95 },
        { stage: 'report-generation' as const, message: 'Generating detailed report...', target: 99 }
      ];
      
      let currentStageIndex = 0;
      
      progressInterval = window.setInterval(() => {
        // Don't update if we're already done
        if (xhr.readyState === 4 || currentProgress >= 99) {
          window.clearInterval(progressInterval);
          return;
        }
        
        const currentStage = processingStages[currentStageIndex];
        currentProgress += 0.5;
        
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
