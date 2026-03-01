@echo off
chcp 65001 >nul
title Buchungsportal - Bioferienhof Loreley GbR

cd /d "%~dp0"

echo.
echo  =====================================================
echo   Buchungsportal - Bioferienhof Loreley GbR
echo  =====================================================
echo.

:: Node.js pruefen
where node >nul 2>nul
if %errorlevel% neq 0 goto :node_fehlt

:: Node.js Version pruefen (exit code 1 wenn zu neu)
node -e "process.exit(parseInt(process.version.slice(1)) > 21 ? 1 : 0)" >nul 2>&1
if %errorlevel% equ 1 goto :version_fehlt

:: node_modules pruefen
if exist "node_modules" goto :modules_ok
echo  Ersteinrichtung wird durchgefuehrt...
echo  ^(nur beim ersten Start, ca. 2-3 Minuten^)
echo.
call npm run install:all
if %errorlevel% neq 0 goto :install_fehlt

:modules_ok
:: dist pruefen
if exist "server\dist\index.js" goto :dist_ok
echo  Kein Build gefunden. Erstelle Anwendung...
echo  ^(einmalig, ca. 1-2 Minuten^)
echo.
call npm run build:all
if %errorlevel% neq 0 goto :build_fehlt

:dist_ok
echo  Starte Portal...

:: Browser nach kurzer Verzoegerung oeffnen
start "" powershell -windowstyle hidden -command "Start-Sleep 2; Start-Process 'http://localhost:3001'"

:: Server starten
echo.
echo  Portal laeuft unter: http://localhost:3001
echo.
echo  Dieses Fenster offen lassen.
echo  Schliessen beendet den Server.
echo.
node server/dist/index.js

echo.
echo  Server wurde beendet.
pause
goto :eof

:node_fehlt
echo  FEHLER: Node.js ist nicht installiert!
echo.
echo  Bitte installieren: https://nodejs.org
echo  Benoetigt: Version 18 oder 20 LTS ^(nicht 22/24!^)
echo.
pause
exit /b 1

:version_fehlt
echo  FEHLER: Node.js Version wird nicht unterstuetzt!
echo.
echo  better-sqlite3 benoetigt Node.js 18 oder 20 LTS.
echo  Bitte deinstallieren und neu installieren:
echo  https://nodejs.org  ^(LTS-Schaltflaeche anklicken^)
echo.
pause
exit /b 1

:install_fehlt
echo.
echo  FEHLER: Installation fehlgeschlagen!
pause
exit /b 1

:build_fehlt
echo.
echo  FEHLER: Build fehlgeschlagen!
pause
exit /b 1
