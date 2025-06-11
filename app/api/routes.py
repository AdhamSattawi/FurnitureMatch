# File: app/api/routes.py

from fastapi import APIRouter, UploadFile, File
from app.services.matcher import process_image_and_search

router = APIRouter()

@router.post("/match")
async def match_furniture(file: UploadFile = File(...)):
    result = await process_image_and_search(file)
    return result
