@echo off
color 0B
echo ===================================================
echo             QIMLIK SISTEMI BASLATICI
echo ===================================================
echo.

echo [0/5] Eski calisan veya cakisan servisler temizleniyor...
rem Kill processes listening on ports 3303, 5001, 5002, 5003, 5004, 5005, 5006
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3303 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5002 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5003 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5004 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5005 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5006 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
echo Temizlik tamamlandi. Portlar serbest birakildi.
echo.

rem Detect the active local IP address using routing table
set LOCAL_IP=127.0.0.1
for /f "tokens=4" %%a in ('route print ^| findstr 0.0.0.0 ^| findstr /v "127.0.0.1"') do set LOCAL_IP=%%a

echo Algilanan Aktif Yerel IP: %LOCAL_IP%
echo.

echo [1/7] Backend (Core API) Baslatiliyor... (Port: 3303)
start "Qimlik Backend" cmd /k "cd backend && node server.js"
timeout /t 2 /nobreak >nul

echo [2/7] Admin Paneli Baslatiliyor... (Port: 5001)
start "Qimlik Admin" cmd /k "cd frontend-admin && npm run dev -- --host --port 5001"
timeout /t 2 /nobreak >nul

echo [3/7] Musteri Paneli Baslatiliyor... (Port: 5002)
start "Qimlik Client" cmd /k "cd frontend-client && npm run dev -- --host --port 5002"
timeout /t 2 /nobreak >nul

echo [4/7] Kurumsal Web Sitesi Baslatiliyor... (Port: 5003)
start "Qimlik Website" cmd /k "cd frontend-website && npm run dev -- --host --port 5003"
timeout /t 2 /nobreak >nul

echo [5/7] Dijital Bakım Paneli Baslatiliyor... (Port: 5004)
start "Qimlik Dijital" cmd /k "cd frontend-dijital && npm run dev -- --host --port 5004"
timeout /t 2 /nobreak >nul

echo [6/7] Mesai Takip Paneli Baslatiliyor... (Port: 5005)
start "Qimlik Mesai" cmd /k "cd frontend-mesai && npm run dev -- --host --port 5005"
timeout /t 2 /nobreak >nul

echo [7/7] Teslimat Takip Paneli Baslatiliyor... (Port: 5006)
start "Qimlik Teslimat" cmd /k "cd frontend-teslimat && npm run dev -- --host --port 5006"
timeout /t 3 /nobreak >nul

echo.
echo ===================================================
echo TARAYICI ACILIYOR (Yerel IP Uzerinden)...
echo ===================================================
start http://%LOCAL_IP%:5001
start http://%LOCAL_IP%:5002
start http://%LOCAL_IP%:5003
start http://%LOCAL_IP%:5004
start http://%LOCAL_IP%:5005
start http://%LOCAL_IP%:5006

echo.
echo ===================================================
echo HER SEY HAZIR! SERVISLER CALISIYOR...
echo ===================================================
echo Backend API    -^> http://%LOCAL_IP%:3303
echo Admin Paneli   -^> http://%LOCAL_IP%:5001
echo Musteri Paneli -^> http://%LOCAL_IP%:5002
echo Web Sitesi     -^> http://%LOCAL_IP%:5003
echo Dijital Bakım  -^> http://%LOCAL_IP%:5004
echo Mesai Takip    -^> http://%LOCAL_IP%:5005
echo Teslimat Takip -^> http://%LOCAL_IP%:5006
echo ===================================================
echo Mobil uygulamadaki Sunucu Adresine bunu girin:
echo --^> http://%LOCAL_IP%:3303
echo ===================================================
echo Lutfen acilan siyah pencereleri kapatmayin.
echo.
pause
