# File: backend_fm/app/services/build_faiss_from_db.py
import os
import io
import json
import sys
import sqlite3
import hashlib
from typing import Optional, List, Dict

import requests
from PIL import Image
from tqdm import tqdm

import numpy as np
import torch
import faiss
import clip


# ─────────────────────────────
# נתיבי בסיס
# ─────────────────────────────
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(ROOT, "data")
DB_PATH = os.path.join(DATA_DIR, "products.db")

IMAGES_DIR = os.path.join(DATA_DIR, "images")          # לשמירת התמונות באופן מקומי
INDEX_PATH = os.path.join(DATA_DIR, "faiss_index.bin") # קובץ ה־FAISS
IMG_PATHS_TXT = os.path.join(DATA_DIR, "image_paths.txt")
META_JSON = os.path.join(DATA_DIR, "metadata.json")    # מטאדטה לכל וקטור

os.makedirs(IMAGES_DIR, exist_ok=True)

# ─────────────────────────────
# CLIP
# ─────────────────────────────
device = "cuda" if torch.cuda.is_available() else "cpu"
clip_model, preprocess = clip.load("ViT-B/32", device=device)


def download_image(url: str, out_path: str) -> bool:
    """מוריד תמונה ל־out_path. מחזיר True אם הצליח."""
    try:
        r = requests.get(url, timeout=20)
        r.raise_for_status()
        img = Image.open(io.BytesIO(r.content)).convert("RGB")
        img.save(out_path, format="JPEG", quality=90)
        return True
    except Exception:
        return False


def row_to_stem(row: sqlite3.Row) -> str:
    """שם־קובץ יציב לכל שורה (ID אם יש; אחרת האש של ה־URL)."""
    if "id" in row.keys() and row["id"] is not None:
        return f"id_{row['id']}"
    h = hashlib.sha1((row["image_url"] or "").encode("utf-8")).hexdigest()[:16]
    return f"url_{h}"


def build_from_db(limit: Optional[int] = None) -> None:
    assert os.path.exists(DB_PATH), f"products.db not found at: {DB_PATH}"

    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    # ניקח את כל הרשומות עם image_url קיים
    sql = "SELECT * FROM products WHERE image_url IS NOT NULL"
    if limit is not None:
        sql += f" LIMIT {int(limit)}"

    rows: List[sqlite3.Row] = cur.execute(sql).fetchall()
    total_rows = len(rows)
    print(f"Found {total_rows} rows in DB. Downloading images…")

    local_paths: List[str] = []
    metadata: List[Dict] = []
    vectors: List[np.ndarray] = []

    downloaded = 0
    skipped_download = 0
    failed_download = 0
    encoded = 0
    failed_encode = 0

    for row in tqdm(rows, ncols=100):
        image_url = row["image_url"]
        if not image_url:
            continue

        stem = row_to_stem(row)
        out_path = os.path.join(IMAGES_DIR, f"{stem}.jpg")

        # הורדה רק אם לא קיים הקובץ
        if os.path.exists(out_path):
            skipped_download += 1
        else:
            ok = download_image(image_url, out_path)
            if ok:
                downloaded += 1
            else:
                failed_download += 1
                continue  # אין קובץ → אי אפשר לקודד

        # קידוד CLIP
        try:
            img = Image.open(out_path).convert("RGB")
            tensor = preprocess(img).unsqueeze(0).to(device)
            with torch.no_grad():
                vec = clip_model.encode_image(tensor).cpu().numpy().astype("float32")
            faiss.normalize_L2(vec)  # לנורמל ל־IndexFlatIP (קוסינוס)
            vectors.append(vec[0])
            encoded += 1
        except Exception:
            failed_encode += 1
            continue

        # מטא־דטה להצגה בפרונט
        metadata.append({
            "id": row["id"] if "id" in row.keys() else None,
            "category": row["category"] if "category" in row.keys() else None,
            "style": row["style"] if "style" in row.keys() else None,
            "image_url": image_url,
            "pinterest_url": row["pinterest_url"] if "pinterest_url" in row.keys() else None,
            "external_url": row["external_url"] if "external_url" in row.keys() else None,
            "price": row["price"] if "price" in row.keys() else None,
            "local_path": os.path.relpath(out_path, ROOT).replace("\\", "/"),
        })
        local_paths.append(out_path)

    print(
        f"Done downloading/encoding.\n"
        f"  downloaded: {downloaded}, skipped(existing): {skipped_download}, failed_download: {failed_download}\n"
        f"  encoded: {encoded}, failed_encode: {failed_encode}"
    )

    if not vectors:
        print("No vectors built. Nothing to index.")
        return

    print(f"Building FAISS on {len(vectors)} vectors…")
    mat = np.vstack(vectors).astype("float32")  # [N, D]
    index = faiss.IndexFlatIP(mat.shape[1])     # קוסינוס (אחרי normalize_L2)
    index.add(mat)

    faiss.write_index(index, INDEX_PATH)
    with open(IMG_PATHS_TXT, "w", encoding="utf-8") as f:
        for p in local_paths:
            f.write(os.path.relpath(p, ROOT).replace("\\", "/") + "\n")
    with open(META_JSON, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print("✅ Finished.")
    print(f"• FAISS index:   {INDEX_PATH}")
    print(f"• image_paths:   {IMG_PATHS_TXT}")
    print(f"• metadata.json: {META_JSON}")
    print(f"• Total indexed: {len(local_paths)} / {total_rows} rows")


if __name__ == "__main__":
    # ניתן להעביר limit בשורת הפקודה (למשל 1500). ללא פרמטר → כל הרשומות.
    lim = None
    if len(sys.argv) > 1:
        try:
            lim = int(sys.argv[1])
        except Exception:
            lim = None
    build_from_db(limit=lim)
