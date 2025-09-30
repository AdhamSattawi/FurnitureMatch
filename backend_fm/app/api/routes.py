# File: backend_fm/app/api/routes.py
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from backend_fm.app.services.matcher import match_image  # השם בפועל אצלך

router = APIRouter()

@router.post("/match")
async def match_furniture(file: UploadFile = File(...)):
    print(f"[/match] received: {getattr(file, 'filename', '?')}", flush=True)
    try:
        res = await match_image(file)
        print("[/match] done OK", flush=True)
        return res
    except Exception as e:
        import traceback; traceback.print_exc()
        print(f"[/match] ERROR: {e}", flush=True)
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)
