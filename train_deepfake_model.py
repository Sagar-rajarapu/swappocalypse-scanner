
"""
Deepfake Detection Model Training Script

This script trains a deep learning model to detect deepfake videos using
the Kaggle Deepfake Detection Challenge and FaceForensics++ datasets.

Dependencies:
- tensorflow
- opencv-python
- numpy
- matplotlib
- scikit-learn
- pandas
- kaggle (for dataset download)
"""

import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Dense, Flatten, Dropout
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import glob
import random
import pandas as pd
from tqdm import tqdm

# Configuration
KAGGLE_DATASET_PATH = "deepfake-detection-challenge"
FACEFORENSICS_PATH = "hungle3401/faceforensics"
OUTPUT_MODEL_PATH = "deepfake_detector.h5"
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10
RANDOM_SEED = 42

# Set random seeds for reproducibility
np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

def download_datasets():
    """Download datasets from Kaggle if not already present"""
    try:
        # Make sure Kaggle API credentials are set up
        if not os.path.exists(os.path.expanduser("~/.kaggle/kaggle.json")):
            print("Please set up Kaggle API credentials first.")
            print("Create an API token at https://www.kaggle.com/account")
            print("Place kaggle.json in ~/.kaggle/ directory")
            return False
            
        # Download DFDC dataset if not exists
        if not os.path.exists(KAGGLE_DATASET_PATH):
            print("Downloading Deepfake Detection Challenge dataset...")
            os.system(f"kaggle competitions download -c deepfake-detection-challenge")
            os.system(f"mkdir -p {KAGGLE_DATASET_PATH}")
            os.system(f"unzip deepfake-detection-challenge.zip -d {KAGGLE_DATASET_PATH}")
            
        # Download FaceForensics++ dataset if not exists
        if not os.path.exists(FACEFORENSICS_PATH):
            print("Downloading FaceForensics++ dataset...")
            os.system(f"kaggle datasets download -d hungle3401/faceforensics")
            os.system(f"mkdir -p {FACEFORENSICS_PATH}")
            os.system(f"unzip faceforensics.zip -d {FACEFORENSICS_PATH}")
            
        return True
    except Exception as e:
        print(f"Error downloading datasets: {e}")
        return False

class DeepFakeDataset:
    """Dataset handler for deepfake detection"""
    
    def __init__(self, kaggle_path, faceforensics_path):
        self.kaggle_path = kaggle_path
        self.faceforensics_path = faceforensics_path
        self.face_detector = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
    def extract_faces(self, image_path, target_size=(224, 224)):
        """Extract faces from an image and resize to target size"""
        try:
            img = cv2.imread(image_path)
            if img is None:
                return None
                
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = self.face_detector.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
            
            if len(faces) == 0:
                # If no face detected, use the whole image
                face_img = cv2.resize(img, target_size)
                return face_img
                
            # Use the largest face
            largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
            x, y, w, h = largest_face
            
            # Extract and resize the face
            face_img = img[y:y+h, x:x+w]
            face_img = cv2.resize(face_img, target_size)
            
            return face_img
        except Exception as e:
            print(f"Error processing image {image_path}: {e}")
            return None
    
    def extract_frame(self, video_path, frame_count=10):
        """Extract frames from a video"""
        frames = []
        try:
            cap = cv2.VideoCapture(video_path)
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            if total_frames == 0:
                return frames
                
            # Calculate frames to extract
            step = max(1, total_frames // frame_count)
            frame_indexes = range(0, total_frames, step)[:frame_count]
            
            for idx in frame_indexes:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if ret:
                    frames.append(frame)
            
            cap.release()
        except Exception as e:
            print(f"Error extracting frames from {video_path}: {e}")
        
        return frames
    
    def prepare_kaggle_dataset(self, sample_limit=1000):
        """Process Kaggle DFDC dataset"""
        print("Processing Kaggle DFDC dataset...")
        
        # Find metadata files
        metadata_files = glob.glob(f"{self.kaggle_path}/**/metadata.json", recursive=True)
        
        real_samples = []
        fake_samples = []
        
        for metadata_file in tqdm(metadata_files):
            try:
                metadata = pd.read_json(metadata_file).T
                folder = os.path.dirname(metadata_file)
                
                for idx, row in metadata.iterrows():
                    video_path = os.path.join(folder, idx)
                    if os.path.exists(video_path):
                        # Extract label
                        label = 1 if row['label'] == 'FAKE' else 0  # 1 for fake, 0 for real
                        
                        # Add to appropriate list
                        if label == 1 and len(fake_samples) < sample_limit:
                            fake_samples.append((video_path, label))
                        elif label == 0 and len(real_samples) < sample_limit:
                            real_samples.append((video_path, label))
                            
                    # Check if we have enough samples
                    if len(real_samples) >= sample_limit and len(fake_samples) >= sample_limit:
                        break
            except Exception as e:
                print(f"Error processing metadata file {metadata_file}: {e}")
                continue
                
        return real_samples, fake_samples
        
    def prepare_faceforensics_dataset(self, sample_limit=1000):
        """Process FaceForensics++ dataset"""
        print("Processing FaceForensics++ dataset...")
        
        real_folder = os.path.join(self.faceforensics_path, "original_sequences/youtube/c23/videos")
        fake_folders = [
            os.path.join(self.faceforensics_path, "manipulated_sequences/Deepfakes/c23/videos"),
            os.path.join(self.faceforensics_path, "manipulated_sequences/Face2Face/c23/videos"),
            os.path.join(self.faceforensics_path, "manipulated_sequences/FaceSwap/c23/videos"),
            os.path.join(self.faceforensics_path, "manipulated_sequences/NeuralTextures/c23/videos")
        ]
        
        real_samples = []
        fake_samples = []
        
        # Process real videos
        real_videos = glob.glob(f"{real_folder}/*.mp4")
        for video_path in tqdm(real_videos[:sample_limit]):
            real_samples.append((video_path, 0))  # 0 for real
            
        # Process fake videos
        for fake_folder in fake_folders:
            fake_videos = glob.glob(f"{fake_folder}/*.mp4")
            sample_per_category = sample_limit // len(fake_folders)
            
            for video_path in tqdm(fake_videos[:sample_per_category]):
                fake_samples.append((video_path, 1))  # 1 for fake
                
        return real_samples, fake_samples
        
    def prepare_dataset(self):
        """Prepare the full dataset"""
        # Prepare data from both sources
        kaggle_real, kaggle_fake = self.prepare_kaggle_dataset()
        ff_real, ff_fake = self.prepare_faceforensics_dataset()
        
        # Combine datasets
        real_samples = kaggle_real + ff_real
        fake_samples = kaggle_fake + ff_fake
        
        # Ensure balanced dataset
        min_samples = min(len(real_samples), len(fake_samples))
        real_samples = real_samples[:min_samples]
        fake_samples = fake_samples[:min_samples]
        
        print(f"Final dataset: {len(real_samples)} real samples, {len(fake_samples)} fake samples")
        
        # Combine and shuffle
        all_samples = real_samples + fake_samples
        random.shuffle(all_samples)
        
        return all_samples
        
    def process_videos_to_faces(self, video_samples, output_dir, frames_per_video=5):
        """Process videos into face images"""
        os.makedirs(output_dir, exist_ok=True)
        
        processed_data = []
        
        for i, (video_path, label) in enumerate(tqdm(video_samples)):
            # Extract frames
            frames = self.extract_frame(video_path, frames_per_video)
            
            for j, frame in enumerate(frames):
                # Save frame temporarily
                temp_frame_path = f"{output_dir}/temp_frame_{i}_{j}.jpg"
                cv2.imwrite(temp_frame_path, frame)
                
                # Extract face
                face_img = self.extract_faces(temp_frame_path)
                
                if face_img is not None:
                    # Save face image
                    face_path = f"{output_dir}/face_{i}_{j}_{label}.jpg"
                    cv2.imwrite(face_path, face_img)
                    processed_data.append((face_path, label))
                
                # Remove temp frame
                if os.path.exists(temp_frame_path):
                    os.remove(temp_frame_path)
        
        return processed_data

def build_model(input_shape=(224, 224, 3)):
    """Build a CNN model for deepfake detection"""
    model = Sequential([
        # First convolutional block
        Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        MaxPooling2D((2, 2)),
        
        # Second convolutional block
        Conv2D(64, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        
        # Third convolutional block
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        
        # Fourth convolutional block
        Conv2D(128, (3, 3), activation='relu'),
        MaxPooling2D((2, 2)),
        
        # Flatten and dense layers
        Flatten(),
        Dense(512, activation='relu'),
        Dropout(0.5),  # Prevent overfitting
        Dense(1, activation='sigmoid')  # Binary classification (real vs fake)
    ])
    
    # Compile model
    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
    )
    
    return model

def load_and_preprocess_data(data_samples):
    """Load and preprocess image data"""
    X = []
    y = []
    
    for img_path, label in tqdm(data_samples):
        try:
            img = cv2.imread(img_path)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)  # Convert BGR to RGB
            img = cv2.resize(img, IMAGE_SIZE)
            img = img / 255.0  # Normalize to [0,1]
            
            X.append(img)
            y.append(label)
        except Exception as e:
            print(f"Error loading image {img_path}: {e}")
    
    return np.array(X), np.array(y)

def plot_training_history(history):
    """Plot training and validation metrics"""
    plt.figure(figsize=(12, 4))
    
    # Plot accuracy
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'])
    plt.plot(history.history['val_accuracy'])
    plt.title('Model accuracy')
    plt.ylabel('Accuracy')
    plt.xlabel('Epoch')
    plt.legend(['Train', 'Validation'], loc='upper left')
    
    # Plot loss
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'])
    plt.plot(history.history['val_loss'])
    plt.title('Model loss')
    plt.ylabel('Loss')
    plt.xlabel('Epoch')
    plt.legend(['Train', 'Validation'], loc='upper left')
    
    plt.tight_layout()
    plt.savefig('training_history.png')
    plt.show()

def main():
    """Main function to train the deepfake detection model"""
    # Download datasets
    if not download_datasets():
        print("Failed to download datasets. Exiting.")
        return
    
    # Initialize dataset handler
    dataset = DeepFakeDataset(KAGGLE_DATASET_PATH, FACEFORENSICS_PATH)
    
    # Process videos into faces
    print("Preparing dataset...")
    video_samples = dataset.prepare_dataset()
    
    # Split data for processing
    train_samples, test_samples = train_test_split(
        video_samples, test_size=0.2, random_state=RANDOM_SEED
    )
    
    # Process videos into face images
    print("Processing training videos...")
    train_data = dataset.process_videos_to_faces(train_samples, "train_faces")
    
    print("Processing test videos...")
    test_data = dataset.process_videos_to_faces(test_samples, "test_faces")
    
    # Load and preprocess images
    print("Loading and preprocessing images...")
    X_train, y_train = load_and_preprocess_data(train_data)
    X_test, y_test = load_and_preprocess_data(test_data)
    
    # Further split training data into train and validation
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.2, random_state=RANDOM_SEED
    )
    
    print(f"Training data shape: {X_train.shape}")
    print(f"Validation data shape: {X_val.shape}")
    print(f"Test data shape: {X_test.shape}")
    
    # Data augmentation for training
    datagen = ImageDataGenerator(
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest'
    )
    datagen.fit(X_train)
    
    # Build model
    print("Building and compiling model...")
    model = build_model(input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3))
    model.summary()
    
    # Callbacks
    checkpoint = ModelCheckpoint(
        OUTPUT_MODEL_PATH,
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    )
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True,
        verbose=1
    )
    
    # Train model
    print("Training model...")
    history = model.fit(
        datagen.flow(X_train, y_train, batch_size=BATCH_SIZE),
        steps_per_epoch=len(X_train) // BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(X_val, y_val),
        callbacks=[checkpoint, early_stopping]
    )
    
    # Plot training history
    plot_training_history(history)
    
    # Evaluate on test set
    print("Evaluating model on test set...")
    test_loss, test_acc, test_precision, test_recall = model.evaluate(X_test, y_test)
    print(f"Test accuracy: {test_acc:.4f}")
    print(f"Test precision: {test_precision:.4f}")
    print(f"Test recall: {test_recall:.4f}")
    
    # Calculate F1 score
    f1_score = 2 * (test_precision * test_recall) / (test_precision + test_recall)
    print(f"Test F1 score: {f1_score:.4f}")
    
    print(f"Model saved to {OUTPUT_MODEL_PATH}")
    
    # Also save to the format expected by the frontend
    model.save("public/models/deepfake_detector_web.h5")
    print("Model saved in web-compatible format")

if __name__ == "__main__":
    main()
