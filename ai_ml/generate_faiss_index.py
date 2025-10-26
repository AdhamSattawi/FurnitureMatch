# File: generate_faiss_index.py

import os
import faiss
import clip
import torch
import numpy as np
from PIL import Image

# === CONFIGURATION ===
IMAGE_FOLDER = r"C:\Users\fried\Downloads\data\data\images\chair\rustic chair"
INDEX_FILE = "faiss_index.bin"
PATHS_FILE = "image_paths.txt"

# Load CLIP model
device = "cuda" if torch.cuda.is_available() else "cpu"
clip_model, preprocess = clip.load("ViT-B/32", device=device)

# Supported image types
IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.bmp']

# Storage
image_vectors = []
image_paths = []

print("\n📦 Scanning images in folder...")
for root, _, files in os.walk(IMAGE_FOLDER):
    for file in files:
        if any(file.lower().endswith(ext) for ext in IMAGE_EXTENSIONS):
            path = os.path.join(root, file)
            try:
                image = Image.open(path).convert('RGB')
                processed = preprocess(image).unsqueeze(0).to(device)
                with torch.no_grad():
                    vec = clip_model.encode_image(processed).cpu().numpy().flatten()
                image_vectors.append(vec)
                image_paths.append(path)
                print(f"✓ Processed: {path}")
            except Exception as e:
                print(f"❌ Failed: {path} ({e})")

# Convert to FAISS index
if image_vectors:
    vectors = np.array(image_vectors).astype('float32')
    faiss.normalize_L2(vectors)
    index = faiss.IndexFlatL2(vectors.shape[1])
    index.add(vectors)
    faiss.write_index(index, INDEX_FILE)

    with open(PATHS_FILE, "w") as f:
        f.write("\n".join(image_paths))

    print(f"\n✅ Saved index to: {INDEX_FILE}")
    print(f"✅ Saved paths to: {PATHS_FILE}")
    print(f"Total vectors: {len(image_vectors)}")
else:
    print("⚠️ No images found to process.")
