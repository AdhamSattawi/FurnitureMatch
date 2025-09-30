# File: backend_fm/app/services/matcher.py
import os
import io
import json
import uuid
import shutil
from typing import List, Dict, Any

import cv2
import faiss
import numpy as np
import torch
from PIL import Image, UnidentifiedImageError
from fastapi import UploadFile

# ──────────────────────────────────────────────────────────────────────────────
# נתיבי קבצים
# ──────────────────────────────────────────────────────────────────────────────
HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
DATA_DIR = os.path.join(BACKEND_ROOT, "data")

FAISS_INDEX_PATH = os.path.join(DATA_DIR, "faiss_index.bin")
IMG_PATHS_TXT   = os.path.join(DATA_DIR, "image_paths.txt")
META_JSON       = os.path.join(DATA_DIR, "metadata.json")

# ──────────────────────────────────────────────────────────────────────────────
# מודלים: CLIP + YOLO (אופציונלי)
# ──────────────────────────────────────────────────────────────────────────────
torch.set_num_threads(4)  # צמצום עומס CPU במכונות חלשות

device = "cuda" if torch.cuda.is_available() else "cpu"

# CLIP עם jit=False כדי להימנע מתקלות jit
import clip
CLIP_CACHE = os.path.join(DATA_DIR, ".clip")
os.makedirs(CLIP_CACHE, exist_ok=True)

clip_model, preprocess = clip.load(
    "ViT-B/32",
    device=device,
    jit=False,
    download_root=CLIP_CACHE,
)
clip_model.eval()

# YOLO אופציונלי — אם אין משקולות פשוט נוותר עליו
YOLO = None
YOLO_WEIGHTS = os.path.join(BACKEND_ROOT, "yolo11n.pt")
if not os.path.exists(YOLO_WEIGHTS):
    YOLO_WEIGHTS = os.path.join(BACKEND_ROOT, "app", "yolo11n.pt")
try:
    if os.path.exists(YOLO_WEIGHTS):
        from ultralytics import YOLO as _YOLO
        YOLO = _YOLO(YOLO_WEIGHTS)
except Exception:
    YOLO = None  # לא קריטי — נשתמש בכל התמונה

TARGET_CLASSES = {
    "chair", "couch", "sofa", "table", "bed",
    "cabinet", "desk", "dresser", "armchair"
}

# ──────────────────────────────────────────────────────────────────────────────
# טעינת FAISS + מטא־דאטה
# ──────────────────────────────────────────────────────────────────────────────
def _load_faiss_and_metadata():
    index = faiss.read_index(FAISS_INDEX_PATH) if os.path.exists(FAISS_INDEX_PATH) else None

    image_paths: List[str] = []
    if os.path.exists(IMG_PATHS_TXT):
        with open(IMG_PATHS_TXT, "r", encoding="utf-8") as f:
            image_paths = [ln.strip() for ln in f if ln.strip()]

    metadata: List[Dict[str, Any]] = []
    if os.path.exists(META_JSON):
        with open(META_JSON, "r", encoding="utf-8") as f:
            metadata = json.load(f)

    return index, image_paths, metadata

FAISS_INDEX, FAISS_IMAGE_PATHS, FAISS_METADATA = _load_faiss_and_metadata()

# ──────────────────────────────────────────────────────────────────────────────
# עזר
# ──────────────────────────────────────────────────────────────────────────────
def _pil_from_cv2(ar_bgr: np.ndarray) -> Image.Image:
    """המרת BGR (OpenCV) ל-PIL RGB."""
    return Image.fromarray(cv2.cvtColor(ar_bgr, cv2.COLOR_BGR2RGB))

def _np_rgb_from_any(path: str) -> np.ndarray:
    """
    טוען תמונה מכל פורמט (כולל AVIF/WEBP) בעזרת PIL ומחזיר NumPy RGB (H,W,3).
    זורק UnidentifiedImageError אם לא ניתן לפענח.
    """
    with Image.open(path) as im:
        im = im.convert("RGB")
        return np.array(im)  # RGB

def _clip_encode_image(pil_img: Image.Image) -> np.ndarray:
    """החזרת embedding של CLIP מנורמל לקוסינוס (float32, צורה [512])."""
    tens = preprocess(pil_img).unsqueeze(0).to(device)
    with torch.no_grad():
        vec = clip_model.encode_image(tens).detach().cpu().numpy().astype("float32")
    faiss.normalize_L2(vec)
    return vec[0]

def _search_faiss(vec: np.ndarray, k: int = 10) -> List[Dict[str, Any]]:
    if FAISS_INDEX is None or len(FAISS_IMAGE_PATHS) == 0:
        return []
    q = vec.reshape(1, -1).astype("float32")
    faiss.normalize_L2(q)
    D, I = FAISS_INDEX.search(q, k)
    out: List[Dict[str, Any]] = []
    for rank, idx in enumerate(I[0]):
        if idx < 0 or idx >= len(FAISS_IMAGE_PATHS):
            continue
        rel_path = FAISS_IMAGE_PATHS[idx]
        meta: Dict[str, Any] = {}
        if 0 <= idx < len(FAISS_METADATA):
            meta = FAISS_METADATA[idx] or {}
        out.append({
            "rank": rank,
            "score": float(D[0][rank]),
            "image_path": rel_path,   # נתיב יחסי ברפו (אם משרתים סטטי)
            "meta": meta,
        })
    return out

# ──────────────────────────────────────────────────────────────────────────────
# API logic
# ──────────────────────────────────────────────────────────────────────────────
async def match_image(file: UploadFile) -> Dict[str, Any]:
    """
    מקבל תמונה, מבצע:
    - זיהוי (YOLO אם קיים; אחרת כל התמונה)
    - CLIP embedding לכל crop
    - חיפוש FAISS
    """
    if FAISS_INDEX is None:
        return {"status": "error", "message": "FAISS index not loaded. Run build_faiss_from_db.py first."}
    if not FAISS_IMAGE_PATHS:
        return {"status": "error", "message": "image_paths.txt is empty or missing."}

    tmp_dir = os.path.join(BACKEND_ROOT, "temp_uploads")
    os.makedirs(tmp_dir, exist_ok=True)
    tmp_name = f"{uuid.uuid4().hex}_{file.filename}"
    tmp_path = os.path.join(tmp_dir, tmp_name)

    # שמירה ל-disk
    with open(tmp_path, "wb") as w:
        shutil.copyfileobj(file.file, w)

    # קריאת תמונה בצורה חסינה לכל פורמט
    try:
        img_rgb = _np_rgb_from_any(tmp_path)  # RGB
    except UnidentifiedImageError:
        # ניקוי קובץ זמני
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        return {"status": "error", "message": "Unsupported image format (cannot decode). Use JPG/PNG/WEBP/AVIF."}

    h, w = img_rgb.shape[:2]

    # אם YOLO קיים – נעבוד על BGR (נוח ל-OpenCV/Ultralytics). אחרת פשוט ניקח את כל התמונה.
    detections: List[Dict[str, Any]] = []
    if YOLO is not None:
        try:
            img_bgr = cv2.cvtColor(img_rgb, cv2.COLOR_RGB2BGR)
            yres = YOLO(img_bgr)
            for r in yres:
                names = r.names
                for b in r.boxes:
                    cls_id = int(b.cls[0].item())
                    label = (names.get(cls_id) if isinstance(names, dict) else names[cls_id]).lower()
                    conf = float(b.conf[0].item())
                    x1, y1, x2, y2 = [int(v) for v in b.xyxy[0].tolist()]
                    if conf >= 0.30 and (label in TARGET_CLASSES):
                        x1, y1 = max(x1, 0), max(y1, 0)
                        x2, y2 = min(x2, w - 1), min(y2, h - 1)
                        if x2 > x1 and y2 > y1:
                            detections.append({
                                "label": label,
                                "conf": conf,
                                "box": [x1, y1, x2, y2],
                            })
        except Exception:
            detections = []

    if not detections:
        detections = [{"label": "full", "conf": 1.0, "box": [0, 0, w, h]}]

    results: List[Dict[str, Any]] = []
    for det in detections:
        x1, y1, x2, y2 = det["box"]
        crop_rgb = img_rgb[y1:y2, x1:x2]
        if crop_rgb.size == 0:
            continue
        pil_img = Image.fromarray(crop_rgb)  # RGB
        vec = _clip_encode_image(pil_img)
        top = _search_faiss(vec, k=10)

        matches = []
        for m in top:
            meta = m.get("meta") or {}
            title = meta.get("name") or meta.get("title") or meta.get("category") or "Match"
            price = meta.get("price")
            ext   = meta.get("external_url")
            pin   = meta.get("pinterest_url")
            preview = meta.get("image_url") or m["image_path"].replace("\\", "/")

            matches.append({
                "score": round(m["score"], 4),
                "title": title,
                "image": preview,
                "price": price,
                "external_url": ext,
                "pinterest_url": pin,
                "image_path": m["image_path"],
                "meta": meta,
            })

        results.append({
            "label": det["label"],
            "conf": det["conf"],
            "box": det["box"],   # [x1,y1,x2,y2]
            "matches": matches,
        })

    # ניקוי קובץ זמני (best effort)
    try:
        os.remove(tmp_path)
    except Exception:
        pass

    return {"status": "success", "results": results}
