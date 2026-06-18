@echo off
color 0B
echo ===================================================
echo             QIMLIK SISTEMI BASLATICI
echo ===================================================
echo.

rem Detect the active local IP address using routing table
set LOCAL_IP=127.0.0.1
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "127.0.0.1"') do set LOCAL_IP=%%a

echo Algilanan Aktif Yerel IP: %LOCAL_IP%
echo.

echo [1/4] Backend (Core API) Baslatiliyor... (Port: 3303)
start "Qimlik Backend" cmd /k "cd backend && node server.js"
timeout /t 2 /nobreak >nul

echo [2/4] Admin Paneli Baslatiliyor... (Port: 5001)
start "Qimlik Admin" cmd /k "cd frontend-admin && npm run dev -- --host --port 5001"
timeout /t 2 /nobreak >nul

echo [3/4] Musteri Paneli Baslatiliyor... (Port: 5002)
start "Qimlik Client" cmd /k "cd frontend-client && npm run dev -- --host --port 5002"
timeout /t 2 /nobreak >nul

echo [4/4] Kurumsal Web Sitesi Baslatiliyor... (Port: 5003)
start "Qimlik Website" cmd /k "cd frontend-website && npm run dev -- --host --port 5003"
timeout /t 3 /nobreak >nul

echo.
echo ===================================================
echo TARAYICI ACILIYOR (Yerel IP Uzerinden)...
echo ===================================================
start http://%LOCAL_IP%:5001
start http://%LOCAL_IP%:5002
start http://%LOCAL_IP%:5003

echo.
echo ===================================================
echo HER SEY HAZIR! SERVISLER CALISIYOR...
echo ===================================================
echo Backend API    -^> http://%LOCAL_IP%:3303
echo Admin Paneli   -^> http://%LOCAL_IP%:5001
echo Musteri Paneli -^> http://%LOCAL_IP%:5002
echo Web Sitesi     -^> http://%LOCAL_IP%:5003
echo ===================================================
echo Mobil uygulamadaki Sunucu Adresine bunu girin:
echo --^> http://%LOCAL_IP%:3303
echo ===================================================
echo Lutfen acilan siyah pencereleri kapatmayin.
echo.
pause
