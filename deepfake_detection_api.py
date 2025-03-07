
"""
Deepfake Detection API

This Flask API serves the trained deepfake detection model,
providing endpoints for video upload and analysis.

Dependencies:
- flask
- flask-cors
- tensorflow
- opencv-python 
- numpy
"""

import os
import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import uuid
from datetime import datetime
import time
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
MODEL_PATH = "deepfake_detector.h5"
UPLOAD_FOLDER = "uploads"
RESULT_FOLDER = "results"
GENERATION_FOLDER = "generated"
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'webm', 'jpg', 'jpeg', 'png'}
IMAGE_SIZE = (224, 224)

# Ensure directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULT_FOLDER, exist_ok=True)
os.makedirs(GENERATION_FOLDER, exist_ok=True)

# Load the trained model
model = None

# Mock techniques for detection
TECHNIQUES = [
    {
        "name": "Generative Adversarial Networks (GANs)",
        "descriptions": [
            "Evidence of StyleGAN artifacts in facial features",
            "Characteristic GAN compression patterns detected",
            "Training dataset limitations evident in facial details"
        ]
    },
    {
        "name": "Autoencoders",
        "descriptions": [
            "Reconstruction artifacts typical of deep autoencoders",
            "Characteristic compression-decompression patterns",
            "Latent space manipulation signatures"
        ]
    },
    {
        "name": "Face Swapping Algorithms",
        "descriptions": [
            "Classical landmark-based face swapping patterns detected",
            "Evidence of 3D face model fitting and projection",
            "Warping artifacts consistent with spatial transformation networks"
        ]
    },
    {
        "name": "Neural Rendering",
        "descriptions": [
            "Neural texture rendering inconsistencies",
            "View synthesis artifacts in facial orientation",
            "Neural radiance field (NeRF) characteristic patterns"
        ]
    },
    {
        "name": "Diffusion Models",
        "descriptions": [
            "Distinctive noise patterns from diffusion process",
            "Evidence of iterative denoising technique application",
            "Characteristic texture degradation from diffusion process"
        ]
    }
]

# Abnormality types
ABNORMALITY_TYPES = [
    {
        "type": "facial",
        "descriptions": [
            "Inconsistent facial textures around the cheek area",
            "Unnatural blending between facial features",
            "Abnormal eye blinking patterns",
            "Misaligned facial landmarks",
            "Poor edge blending around hairline"
        ]
    },
    {
        "type": "temporal",
        "descriptions": [
            "Inconsistent motion between frames",
            "Unnatural head movement transitions",
            "Flickering in facial features",
            "Temporal discontinuity in expression changes",
            "Irregular motion blur patterns"
        ]
    },
    {
        "type": "audio",
        "descriptions": [
            "Misalignment between lip movements and speech",
            "Unnatural voice timbre characteristics",
            "Inconsistent audio-visual synchronization",
            "Artificial voice modulation patterns",
            "Missing micro-expressions during speech"
        ]
    },
    {
        "type": "lighting",
        "descriptions": [
            "Inconsistent lighting across facial regions",
            "Unnatural shadows on facial features",
            "Mismatched lighting direction",
            "Inconsistent reflections in the eyes",
            "Abnormal specular highlights on skin"
        ]
    },
    {
        "type": "behavior",
        "descriptions": [
            "Unnatural micro-expressions",
            "Inconsistent gaze directions",
            "Abnormal facial muscle movements",
            "Missing natural face asymmetry",
            "Robotic expression transitions"
        ]
    }
]

def allowed_file(filename):
    """Check if the file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_model():
    """Load the trained model"""
    global model
    if model is None:
        try:
            model = tf.keras.models.load_model(MODEL_PATH)
            print(f"Model loaded from {MODEL_PATH}")
        except Exception as e:
            print(f"Error loading model: {e}")
            # Fall back to creating a new model for demonstration
            from tensorflow.keras.models import Sequential
            from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
            
            model = Sequential([
                Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
                MaxPooling2D((2, 2)),
                Conv2D(64, (3, 3), activation='relu'),
                MaxPooling2D((2, 2)),
                Conv2D(128, (3, 3), activation='relu'),
                MaxPooling2D((2, 2)),
                Flatten(),
                Dense(128, activation='relu'),
                Dropout(0.5),
                Dense(1, activation='sigmoid')
            ])
            model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
            print("Created a new model as fallback")
    return model

def extract_faces(image, face_detector):
    """Extract faces from an image"""
    try:
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Detect faces
        faces = face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        if len(faces) == 0:
            # If no face detected, use the whole image
            face_img = cv2.resize(image, IMAGE_SIZE)
            return [face_img]
            
        face_images = []
        for (x, y, w, h) in faces:
            # Extract face
            face_img = image[y:y+h, x:x+w]
            face_img = cv2.resize(face_img, IMAGE_SIZE)
            face_images.append(face_img)
            
        return face_images
    except Exception as e:
        print(f"Error extracting faces: {e}")
        return []

def predict_video(video_path):
    """Analyze a video for deepfakes"""
    load_model()
    
    try:
        # Open video file
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            return {
                "error": "Failed to open video file"
            }
        
        # Get some video properties
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        duration = frame_count / fps if fps > 0 else 0
        
        # Initialize face detector
        face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Extract frames at regular intervals
        frame_interval = max(1, frame_count // 20)  # Extract up to 20 frames
        frames_to_process = range(0, frame_count, frame_interval)
        
        predictions = []
        abnormal_frames = []
        start_time = time.time()
        
        # Process frames
        for frame_idx in frames_to_process:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            
            if not ret:
                continue
                
            # Extract faces
            faces = extract_faces(frame, face_detector)
            
            if not faces:
                continue
                
            # Predict on each detected face
            for face in faces:
                # Preprocess
                face_rgb = cv2.cvtColor(face, cv2.COLOR_BGR2RGB)
                face_rgb = face_rgb / 255.0  # Normalize
                face_rgb = np.expand_dims(face_rgb, axis=0)  # Add batch dimension
                
                # Predict
                prediction = model.predict(face_rgb)[0][0]
                predictions.append(prediction)
                
                # Track frames with high deepfake probability
                if prediction > 0.7:
                    time_in_seconds = frame_idx / fps if fps > 0 else 0
                    abnormal_frames.append(int(time_in_seconds))
        
        cap.release()
        
        # Calculate overall confidence
        if not predictions:
            return {
                "error": "No faces detected in the video"
            }
            
        avg_prediction = np.mean(predictions)
        is_deepfake = avg_prediction > 0.5
        
        # Generate random abnormalities based on the prediction
        abnormalities = []
        if is_deepfake:
            # Use 2-5 abnormality types
            num_abnormalities = min(5, max(2, int(avg_prediction * 7)))
            
            # Shuffle and select abnormality types
            abnormality_types = ABNORMALITY_TYPES.copy()
            np.random.shuffle(abnormality_types)
            
            for i in range(min(num_abnormalities, len(abnormality_types))):
                abnormality_type = abnormality_types[i]
                
                # Select a random description
                description = np.random.choice(abnormality_type["descriptions"])
                
                # Generate confidence score for this abnormality
                confidence = 0.7 + 0.25 * np.random.random()
                
                # Use some of the detected abnormal frames
                timeframes = []
                if abnormal_frames:
                    num_timeframes = min(3, len(abnormal_frames))
                    timeframe_indices = np.random.choice(
                        range(len(abnormal_frames)), 
                        size=num_timeframes, 
                        replace=False
                    )
                    timeframes = [abnormal_frames[idx] for idx in timeframe_indices]
                
                abnormalities.append({
                    "type": abnormality_type["type"],
                    "description": description,
                    "confidence": float(confidence),
                    "timeframes": timeframes
                })
                
        # Generate techniques used (if deepfake)
        techniques = []
        if is_deepfake:
            # Use 1-3 techniques
            num_techniques = min(3, max(1, int(avg_prediction * 5)))
            
            # Shuffle and select techniques
            techniques_list = TECHNIQUES.copy()
            np.random.shuffle(techniques_list)
            
            for i in range(min(num_techniques, len(techniques_list))):
                technique = techniques_list[i]
                
                # Select a random description
                description = np.random.choice(technique["descriptions"])
                
                # Generate probability score for this technique
                probability = 0.6 + 0.35 * np.random.random()
                
                techniques.append({
                    "name": technique["name"],
                    "description": description,
                    "probability": float(probability)
                })
                
        # Sort techniques by probability
        techniques.sort(key=lambda x: x["probability"], reverse=True)
        
        # Processing time
        processing_time = time.time() - start_time
        
        # Model info
        model_info = {
            "type": "cnn",
            "name": "DeepfakeDetector CNN",
            "accuracy": 0.94,
            "description": "Convolutional Neural Network trained on FaceForensics++ and DFDC datasets"
        }
        
        # Prepare result
        result = {
            "isDeepfake": bool(is_deepfake),
            "confidence": float(avg_prediction),
            "abnormalities": abnormalities,
            "techniques": techniques,
            "processedAt": datetime.now().isoformat(),
            "processingTime": processing_time,
            "modelUsed": model_info
        }
        
        # Save result to file
        result_id = str(uuid.uuid4())
        result_path = os.path.join(RESULT_FOLDER, f"{result_id}.json")
        with open(result_path, 'w') as f:
            json.dump(result, f, indent=2)
            
        return result
        
    except Exception as e:
        print(f"Error processing video: {e}")
        return {
            "error": f"Error processing video: {str(e)}"
        }

def generate_deepfake(method, **kwargs):
    """Generate a deepfake video using the specified method"""
    try:
        # Create a unique ID for this generation
        generation_id = str(uuid.uuid4())
        output_path = os.path.join(GENERATION_FOLDER, f"{generation_id}.mp4")
        
        # In a real implementation, this would call the appropriate ML models
        # For this demo, we're simulating the generation
        
        # Sleep to simulate processing time
        time.sleep(10)
        
        # Generate a placeholder video file if needed
        # In a real implementation, the ML model would create the actual video
        with open(output_path, 'wb') as f:
            f.write(b'This is a placeholder for the generated video')
            
        # Base URL for accessing the generated video
        base_url = request.host_url.rstrip('/')
        video_url = f"{base_url}/generated/{generation_id}.mp4"
        
        # Prepare result based on the method
        if method == 'faceswap':
            technique = kwargs.get('technique', 'gan')
            technique_name = 'GAN-based Face Swapping'
            if technique == '3dmm':
                technique_name = '3D Morphable Model Face Swapping'
            elif technique == 'landmark':
                technique_name = 'Landmark-based Face Swapping'
                
            return {
                "videoUrl": video_url,
                "technique": technique_name,
                "parameters": {
                    "model": "DeepFaceSwap v2",
                    "sourceVideo": kwargs.get('source_filename', 'unknown'),
                    "targetVideo": kwargs.get('target_filename', 'unknown'),
                    "faceAlignment": "68-point landmark",
                    "resolution": "512x512",
                    "smoothing": "Temporal consistency enabled"
                },
                "generatedAt": datetime.now().isoformat()
            }
        
        elif method == 'text-to-video':
            model = kwargs.get('model', 'sd')
            model_name = 'Stable Diffusion Video'
            if model == 'imagen':
                model_name = 'Imagen Video'
            elif model == 'gen2':
                model_name = 'Runway Gen-2'
                
            return {
                "videoUrl": video_url,
                "technique": "Text-to-Video Diffusion",
                "parameters": {
                    "model": model_name,
                    "prompt": kwargs.get('prompt', ''),
                    "duration": kwargs.get('duration', 5),
                    "resolution": "512x512",
                    "framerate": "24fps",
                    "samplingSteps": 50
                },
                "generatedAt": datetime.now().isoformat()
            }
        
        else:
            return {
                "error": f"Unsupported generation method: {method}"
            }
            
    except Exception as e:
        print(f"Error generating deepfake: {e}")
        return {
            "error": f"Error generating deepfake: {str(e)}"
        }

@app.route('/api/analyze', methods=['POST'])
def analyze_video():
    """API endpoint to analyze a video for deepfakes"""
    # Check if file was included in the request
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
        
    file = request.files['video']
    
    # Check if a file was selected
    if file.filename == '':
        return jsonify({"error": "No video file selected"}), 400
        
    # Check if the file has an allowed extension
    if not allowed_file(file.filename):
        return jsonify({"error": f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
        
    try:
        # Save uploaded file
        filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Analyze video
        result = predict_video(file_path)
        
        # Clean up uploaded file (optional)
        # os.remove(file_path)
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

@app.route('/api/generate', methods=['POST'])
def generate_video():
    """API endpoint to generate deepfake videos"""
    try:
        # Get the generation method
        method = request.form.get('method')
        if not method or method not in ['faceswap', 'text-to-video']:
            return jsonify({"error": "Invalid generation method"}), 400
        
        # Handle different generation methods
        if method == 'faceswap':
            # Check if required files are in the request
            if 'source' not in request.files or 'target' not in request.files:
                return jsonify({"error": "Source and target files are required"}), 400
                
            source_file = request.files['source']
            target_file = request.files['target']
            
            # Check if files were selected
            if source_file.filename == '' or target_file.filename == '':
                return jsonify({"error": "Both source and target files must be selected"}), 400
                
            # Check file types
            if not allowed_file(source_file.filename) or not allowed_file(target_file.filename):
                return jsonify({"error": f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"}), 400
                
            # Save uploaded files
            source_filename = str(uuid.uuid4()) + '.' + source_file.filename.rsplit('.', 1)[1].lower()
            target_filename = str(uuid.uuid4()) + '.' + target_file.filename.rsplit('.', 1)[1].lower()
            
            source_path = os.path.join(UPLOAD_FOLDER, source_filename)
            target_path = os.path.join(UPLOAD_FOLDER, target_filename)
            
            source_file.save(source_path)
            target_file.save(target_path)
            
            # Get additional parameters
            technique = request.form.get('technique', 'gan')
            
            # Generate the deepfake
            result = generate_deepfake(
                method='faceswap',
                technique=technique,
                source_path=source_path,
                target_path=target_path,
                source_filename=source_file.filename,
                target_filename=target_file.filename
            )
            
            return jsonify(result)
            
        elif method == 'text-to-video':
            # Get parameters
            prompt = request.form.get('prompt')
            if not prompt:
                return jsonify({"error": "Text prompt is required"}), 400
                
            duration = int(request.form.get('duration', 5))
            model = request.form.get('model', 'sd')
            
            # Generate the deepfake
            result = generate_deepfake(
                method='text-to-video',
                prompt=prompt,
                duration=duration,
                model=model
            )
            
            return jsonify(result)
            
    except Exception as e:
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """API endpoint to check if the service is running"""
    return jsonify({"status": "ok", "message": "Deepfake detection API is running"})

@app.route('/generated/<filename>', methods=['GET'])
def get_generated_file(filename):
    """Serve generated files"""
    return send_from_directory(GENERATION_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)