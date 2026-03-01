@echo off
chcp 65001 >nul
title Buchungsportal - Bioferienhof Loreley GbR

cd /d "%~dp0"

echo.
echo  =====================================================
echo   Buchungsportal - Bioferienhof Loreley GbR
echo  =====================================================
echo.

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
    echo  Ersteinrichtung wird durchgeführt...
    echo  (nur beim ersten Start, ca. 2-3 Minuten)
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

:: Bauen nur wenn noch kein Build vorhanden
if not exist "server\dist\index.js" (
    echo  Kein Build gefunden. Erstelle Anwendung...
    echo  (einmalig, ca. 1-2 Minuten)
    echo.
    call npm run build:all
    if %errorlevel% neq 0 (
        echo.
        echo  FEHLER: Build fehlgeschlagen!
        pause
        exit /b 1
    )
    echo.
) else (
    echo  Starte Portal...
)

:: Browser nach kurzer Verzögerung öffnen
start "" powershell -windowstyle hidden -command "Start-Sleep 2; Start-Process 'http://localhost:3001'"

:: Server starten
echo.
echo  Portal läuft unter: http://localhost:3001
echo.
echo  Dieses Fenster offen lassen.
echo  Schliessen beendet den Server.
echo.
node server/dist/index.js

echo.
echo  Server wurde beendet.
pause
