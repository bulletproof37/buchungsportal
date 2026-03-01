@echo off
chcp 65001 >nul
title Buchungsportal - Bioferienhof Loreley GbR

cd /d "%~dp0"

:: Debug-Log anlegen
echo %DATE% %TIME% === start.bat gestartet === > "%~dp0start-debug.log"
echo Arbeitsverzeichnis: %CD% >> "%~dp0start-debug.log"

echo.
echo  =====================================================
echo   Buchungsportal - Bioferienhof Loreley GbR
echo  =====================================================
echo.

echo %DATE% %TIME% CHECKPOINT 1: nach Header >> "%~dp0start-debug.log"

:: Node.js pruefen
where node >nul 2>nul
echo %DATE% %TIME% where node = errorlevel %errorlevel% >> "%~dp0start-debug.log"
if %errorlevel% neq 0 goto :node_fehlt

echo %DATE% %TIME% CHECKPOINT 2: Node gefunden >> "%~dp0start-debug.log"

:: Node.js Version pruefen (exit code 1 wenn zu neu)
node -e "process.exit(parseInt(process.version.slice(1)) > 21 ? 1 : 0)" >nul 2>&1
echo %DATE% %TIME% node version check = errorlevel %errorlevel% >> "%~dp0start-debug.log"
if %errorlevel% equ 1 goto :version_fehlt

echo %DATE% %TIME% CHECKPOINT 3: Version OK >> "%~dp0start-debug.log"

:: node_modules pruefen
if exist "node_modules" goto :modules_ok
echo %DATE% %TIME% node_modules: FEHLT - starte Installation >> "%~dp0start-debug.log"
echo  Ersteinrichtung wird durchgefuehrt...
echo  ^(nur beim ersten Start, ca. 2-3 Minuten^)
echo.
call npm run install:all >> "%~dp0start-debug.log" 2>&1
echo %DATE% %TIME% npm install:all = errorlevel %errorlevel% >> "%~dp0start-debug.log"
if %errorlevel% neq 0 goto :install_fehlt

:modules_ok
echo %DATE% %TIME% CHECKPOINT 4: node_modules OK >> "%~dp0start-debug.log"

:: dist pruefen
if exist "server\dist\index.js" goto :dist_ok
echo %DATE% %TIME% server\dist\index.js: FEHLT - starte Build >> "%~dp0start-debug.log"
echo  Kein Build gefunden. Erstelle Anwendung...
echo  ^(einmalig, ca. 1-2 Minuten^)
echo.
call npm run build:all >> "%~dp0start-debug.log" 2>&1
echo %DATE% %TIME% npm build:all = errorlevel %errorlevel% >> "%~dp0start-debug.log"
if %errorlevel% neq 0 goto :build_fehlt

:dist_ok
echo %DATE% %TIME% CHECKPOINT 5: dist OK, starte Server >> "%~dp0start-debug.log"
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
echo %DATE% %TIME% node server/dist/index.js wird gestartet... >> "%~dp0start-debug.log"
node server/dist/index.js
echo %DATE% %TIME% node beendet, errorlevel=%errorlevel% >> "%~dp0start-debug.log"

echo.
echo  Server wurde beendet.
pause
goto :eof

:node_fehlt
echo %DATE% %TIME% ABBRUCH: Node nicht gefunden >> "%~dp0start-debug.log"
echo  FEHLER: Node.js ist nicht installiert!
echo.
echo  Bitte installieren: https://nodejs.org
echo  Benoetigt: Version 18 oder 20 LTS ^(nicht 22/24!^)
echo.
pause
exit /b 1

:version_fehlt
echo %DATE% %TIME% ABBRUCH: Node Version nicht unterstuetzt >> "%~dp0start-debug.log"
echo  FEHLER: Node.js Version wird nicht unterstuetzt!
echo.
echo  better-sqlite3 benoetigt Node.js 18 oder 20 LTS.
echo  Bitte deinstallieren und neu installieren:
echo  https://nodejs.org  ^(LTS-Schaltflaeche anklicken^)
echo.
pause
exit /b 1

:install_fehlt
echo %DATE% %TIME% ABBRUCH: Installation fehlgeschlagen >> "%~dp0start-debug.log"
echo.
echo  FEHLER: Installation fehlgeschlagen!
echo  Details in: start-debug.log
pause
exit /b 1

:build_fehlt
echo %DATE% %TIME% ABBRUCH: Build fehlgeschlagen >> "%~dp0start-debug.log"
echo.
echo  FEHLER: Build fehlgeschlagen!
echo  Details in: start-debug.log
pause
exit /b 1
