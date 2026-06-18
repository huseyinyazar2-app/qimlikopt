@echo off
color 0B
echo ===================================================
echo             QIMLIK SISTEMI BASLATICI
echo ===================================================
echo.

echo [1/4] Backend (Core API) Baslatiliyor... (Port: 3303)
start "Qimlik Backend" cmd /k "cd backend && node server.js"
timeout /t 2 /nobreak >nul

echo [2/4] Admin Paneli Baslatiliyor... (Port: 5001)
start "Qimlik Admin" cmd /k "cd frontend-admin && npm run dev -- --port 5001"
timeout /t 2 /nobreak >nul

echo [3/4] Musteri Paneli Baslatiliyor... (Port: 5002)
start "Qimlik Client" cmd /k "cd frontend-client && npm run dev -- --port 5002"
timeout /t 2 /nobreak >nul

echo [4/4] Kurumsal Web Sitesi Baslatiliyor... (Port: 5003)
start "Qimlik Website" cmd /k "cd frontend-website && npm run dev -- --port 5003"
timeout /t 2 /nobreak >nul

echo.
echo ===================================================
echo HER SEY HAZIR! SERVISLER CALISIYOR...
echo ===================================================
echo Backend API    -^> http://localhost:3303
echo Admin Paneli   -^> http://localhost:5001
echo Musteri Paneli -^> http://localhost:5002
echo Web Sitesi     -^> http://localhost:5003
echo ===================================================
echo Lutfen acilan 4 siyah pencereyi kapatmayin.
echo Sistemi durdurmak istediginizde pencereleri kapatabilirsiniz.
echo.
pause
