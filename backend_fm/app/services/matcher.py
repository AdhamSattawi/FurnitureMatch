# File: app/services/matcher.py

import os
import shutil
import uuid
import torch
import faiss
import numpy as np
import clip
from PIL import Image
import cv2
from fastapi import UploadFile
from ultralytics import YOLO

# Load models
device = "cuda" if torch.cuda.is_available() else "cpu"
model_yolo = YOLO("yolo11n.pt")
clip_model, preprocess = clip.load("ViT-B/32", device=device)

# Define targets
TARGET_CLASSES = ["chair", "couch", "sofa", "table", "bed", "cabinet", "desk", "dresser", "armchair"]

# Load index and associated image paths
INDEX_PATH = "faiss_index.bin"
IMAGE_PATHS_FILE = "image_paths.txt"

# Load FAISS index
if os.path.exists(INDEX_PATH):
    index = faiss.read_index(INDEX_PATH)
else:
    index = None

# Load image paths
if os.path.exists(IMAGE_PATHS_FILE):
    with open(IMAGE_PATHS_FILE, "r") as f:
        image_paths = [line.strip() for line in f.readlines()]
else:
    image_paths = []

async def process_image_and_search(file: UploadFile):
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    file_id = str(uuid.uuid4())
    file_path = os.path.join(temp_dir, f"{file_id}_{file.filename}")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Read image
    image = cv2.imread(file_path)
    results = model_yolo(image)

    vectors = []
    for result in results:
        for box in result.boxes:
            class_id = int(box.cls[0].item())
            label = result.names[class_id].lower()
            if label not in TARGET_CLASSES or box.conf[0] < 0.5:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            cropped = image[y1:y2, x1:x2]
            pil_image = Image.fromarray(cv2.cvtColor(cropped, cv2.COLOR_BGR2RGB))
            processed = preprocess(pil_image).unsqueeze(0).to(device)

            with torch.no_grad():
                vec = clip_model.encode_image(processed).cpu().numpy().flatten()
                vectors.append((label, vec))

    if not vectors:
        return {"status": "no relevant furniture detected"}

    if not index:
        return {"status": "FAISS index not loaded"}

    top_matches = []
    for label, vector in vectors:
        query = np.array([vector], dtype=np.float32)
        faiss.normalize_L2(query)
        distances, indices = index.search(query, 5)
        results = []
        for pos, idx in enumerate(indices[0]):
            if idx < len(image_paths):
                results.append({
                    "image_path": image_paths[idx],
                    "distance": float(distances[0][pos])
                })
        top_matches.append({"label": label, "matches": results})

    return {
        "status": "success",
        "results": top_matches
    }
