import clip
import torch
from ultralytics import YOLO
import cv2
from PIL import Image

# Load models
device = "cuda" if torch.cuda.is_available() else "cpu"
model_yolo = YOLO("yolo11n.pt")
model_clip, preprocess = clip.load("ViT-B/32", device=device)

# Path to test image 
image_path = r"C:\Users\fried\Downloads\data\data\images\table\wood table\image_89.jpg"
image = cv2.imread(image_path)

# Run YOLO
results = model_yolo(image)

TARGET_CLASSES = ["chair", "table"]

for result in results:
    for box in result.boxes:
        class_id = int(box.cls[0].item())
        label = result.names[class_id].lower()

        if label not in TARGET_CLASSES:
            continue
        if box.conf[0] < 0.5:
            continue

        x1, y1, x2, y2 = map(int, box.xyxy[0])
        cropped_object = image[y1:y2, x1:x2]

        # Show the object
        cv2.imshow(f"Detected: {label}", cropped_object)
        cv2.waitKey(0)
        cv2.destroyAllWindows()

        # Convert to CLIP embedding
        pil_image = Image.fromarray(cv2.cvtColor(cropped_object, cv2.COLOR_BGR2RGB))
        processed_image = preprocess(pil_image).unsqueeze(0).to(device)

        with torch.no_grad():
            image_features = model_clip.encode_image(processed_image)

        print(f"📌 CLIP vector for '{label}' (confidence: {box.conf[0]:.2f}):")
        print(image_features.cpu().numpy())
