@echo off
chcp 65001 >nul
title Buchungsportal - Bioferienhof Loreley GbR

echo.
echo  =====================================================
echo   Buchungsportal - Bioferienhof Loreley GbR
echo  =====================================================
echo.

:: Zum Verzeichnis dieser Datei wechseln
cd /d "%~dp0"

:: Node.js prüfen
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  FEHLER: Node.js ist nicht installiert!
    echo.
    echo  Bitte installieren: https://nodejs.org
    echo  Empfohlen: Version 20 LTS
    echo.
    pause
    exit /b 1
)

:: Erste Einrichtung falls node_modules fehlen
if not exist "node_modules" (
    echo  Ersteinrichtung wird durchgefuehrt...
    echo  ^(nur beim ersten Start, ca. 2-3 Minuten^)
    echo.
    call npm run install:all
    if %errorlevel% neq 0 (
        echo.
        echo  FEHLER: Installation fehlgeschlagen!
        pause
        exit /b 1
    )
    echo.
)

:: Anwendung bauen
echo  Bereite Anwendung vor...
call npm run build:all
if %errorlevel% neq 0 (
    echo.
    echo  FEHLER: Build fehlgeschlagen!
    pause
    exit /b 1
)

:: Browser nach kurzer Verzögerung öffnen (PowerShell Timer)
start "" powershell -windowstyle hidden -command "Start-Sleep 3; Start-Process 'http://localhost:3001'"

:: Server starten (Fenster bleibt offen)
echo.
echo  Portal laeuft unter: http://localhost:3001
echo  Dieses Fenster offen lassen - Schliessen beendet den Server.
echo.
node server/dist/index.js

echo.
echo  Server wurde beendet.
pause
