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
FACEFORENSICS_PATH = r"C:\Users\sunil\Desktop\swappocalypse-scanner\FaceForensics++"
OUTPUT_MODEL_PATH = "deepfake_detector.h5"
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10
RANDOM_SEED = 42
USE_TEST_DATA = False

# Set random seeds
np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)
random.seed(RANDOM_SEED)

class DeepFakeDataset:
    """Dataset handler for deepfake detection"""

    def __init__(self, faceforensics_path):
        self.faceforensics_path = faceforensics_path
        self.face_detector = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )

    def prepare_dataset(self):
        """Prepare the FaceForensics++ dataset"""
        print(f"Checking dataset in: {self.faceforensics_path}")

        if not os.path.exists(self.faceforensics_path):
            print(f"Error: FaceForensics path {self.faceforensics_path} does not exist.")
            return []

        real_folder = os.path.join(self.faceforensics_path, "real samples")
        fake_folder = os.path.join(self.faceforensics_path, "fake samples")

        real_samples = glob.glob(f"{real_folder}/*.mp4")
        fake_samples = glob.glob(f"{fake_folder}/*.mp4")

        print(f"Found {len(real_samples)} real samples and {len(fake_samples)} fake samples.")

        if not real_samples and not fake_samples:
            print("Error: No dataset samples found.")
            return []

        all_samples = [(video, 0) for video in real_samples] + [(video, 1) for video in fake_samples]
        random.shuffle(all_samples)
        return all_samples


def main():
    """Main function to train the deepfake detection model"""
    print("🚀 Starting Deepfake Detection Training...")

    print("📂 Preparing dataset...")
    dataset = DeepFakeDataset(FACEFORENSICS_PATH)  
    print("✅ Dataset class initialized!")

    # Ensure video_samples is assigned correctly
    video_samples = dataset.prepare_dataset()

    if not video_samples:
     print("❌ Error: No data samples found. Check dataset paths.")
     return


    print(f"✅ Dataset preparation complete! Found {len(video_samples)} video samples.")

    # Ensure the variable is correctly used
    print("📊 Splitting data into train and test sets...")
    train_samples, test_samples = train_test_split(video_samples, test_size=0.2, random_state=RANDOM_SEED)
    print(f"✅ Train samples: {len(train_samples)}, Test samples: {len(test_samples)}")

    print("🖼️ Processing training videos...")
    train_data = dataset.process_videos_to_faces(train_samples, "train_faces")
    print("🖼️ Processing test videos...")
    test_data = dataset.process_videos_to_faces(test_samples, "test_faces")

    if not train_data or not test_data:
        print("❌ Error: No face images generated. Check video processing.")
        return

    print("🔄 Loading and preprocessing images...")
    X_train, y_train = load_and_preprocess_data(train_data)
    X_test, y_test = load_and_preprocess_data(test_data)

    print(f"✅ Image data ready! Training: {X_train.shape}, Testing: {X_test.shape}")

    print("🛠️ Building the CNN model...")
    model = build_model(input_shape=(IMAGE_SIZE[0], IMAGE_SIZE[1], 3))

    checkpoint = ModelCheckpoint(OUTPUT_MODEL_PATH, monitor='val_accuracy', save_best_only=True, mode='max', verbose=1)
    early_stopping = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True, verbose=1)

    print("🚀 Training model...")
    history = model.fit(
    X_train, y_train,
    batch_size=BATCH_SIZE,
    epochs=EPOCHS,
    validation_split=0.2,
    callbacks=[checkpoint, early_stopping]
    )

    print("✅ Training complete!")

    print("📊 Evaluating model on test set...")
    test_loss, test_acc = model.evaluate(X_test, y_test)
    print(f"🎯 Test Accuracy: {test_acc:.4f}")

    # Save model
    model.save(OUTPUT_MODEL_PATH)
    print(f"💾 Model saved to {OUTPUT_MODEL_PATH}")

    # Check predictions on test set
    y_pred = (model.predict(X_test) > 0.5).astype("int32")
    print(f"🔎 Sample Predictions: {y_pred[:20]}")
    print(f"🆚 Ground Truth: {y_test[:20]}")



if __name__ == "__main__":
    main()
