# File: app/main.py
import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from backend_fm.app.api.routes import router

app = FastAPI(title="FurnitureMatch Backend")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the API router
app.include_router(router)


# Convenience routes
@app.get("/", include_in_schema=False)
def root():
    """Redirect root to interactive docs for easier testing."""
    return RedirectResponse(url="/docs")


@app.get("/health", tags=["system"])
def health():
    """Simple liveness probe."""
    return {"status": "ok"}
