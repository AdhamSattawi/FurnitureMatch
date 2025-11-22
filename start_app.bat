@echo off
echo Starting FurnitureMatch...

:: Start Backend in a new window (Enters backend_fm folder)
start "FurnitureMatch Backend" cmd /k "python -m uvicorn backend_fm.app.main:app --reload --port 8000"

:: Start Frontend in a new window (Enters frontend_fm folder)
start "FurnitureMatch Frontend" cmd /k "cd frontend_fm && npm run dev"

echo App is starting! Check the new windows.
timeout /t 5