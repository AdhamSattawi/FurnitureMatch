@echo off
echo Installing Backend Requirements...
cd backend_fm
pip install -r requirements.txt

echo.
echo Installing Frontend Dependencies...
cd ../frontend_fm
call npm install

echo.
echo Installation Complete! You can now run start_app.bat
pause