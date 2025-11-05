# 🔎 FurnitureMatch – AI-Powered Visual Search for Furniture

**FurnitureMatch** is a visual search app where users upload a photo of a furniture item, and the system returns the top 5 most visually similar purchasable items scraped from Pinterest. It combines machine learning, computer vision, and fast similarity search to deliver accurate, aesthetic matches.

# 🔎 Instructions to run the application:

First terminal:

python -m uvicorn backend_fm.app.main:app --reload --port 8000

And then enter: 

http://localhost:8000/docs

Second terminal:

cd frontend_fm

npm run dev

## 🛠 Tech Stack

- **Frontend**: React 
- **Backend**: Python FastAPI  
- **Database**: SQLite  
- **Image Processing**: OpenCV, YOLO  
- **Embedding Model**: CLIP  
- **Similarity Search**: FAISS  
- **Scraping Source**: Pinterest  

## 🚀 Features

- 📷 Upload a photo of any furniture item  
- 🧠 AI detects and isolates the furniture  
- 🧬 Generates image embeddings using CLIP  
- ⚡ Searches Pinterest product embeddings with FAISS  
- 🖼 Returns top 5 visually similar matches  


## 🔄 Workflow

1. **Scraping**: Collect furniture images from Pinterest using a custom scraper  
2. **Storage**: Save the images and metadata in SQLite  
3. **Preprocessing**: Use YOLO to detect and crop furniture  
4. **Embedding**: Generate feature vectors using CLIP  
5. **Indexing**: Store embeddings in a FAISS index for fast lookup  
6. **Search**: On user upload, embed the input and search FAISS for nearest neighbors  

## AI Assistance

Portions of this project were developed with the assistance of  ChatGPT. These AI tool were used for:
- planning project.
- Generating boilerplate code.
- Assisting with debugging and refactoring specific functions.
- Helping to write documentation and comments






