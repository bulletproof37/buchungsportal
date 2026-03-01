@echo off
chcp 65001 >nul
title Buchungsportal - Windows-Dienst installieren

cd /d "%~dp0"

echo.
echo  =====================================================
echo   Buchungsportal - Windows-Dienst installieren
echo  =====================================================
echo.
echo  Dieser Schritt richtet das Portal als Windows-Dienst
echo  ein. Es startet dann automatisch mit Windows.
echo.
echo  WICHTIG: Als Administrator ausfuehren!
echo.

:: Adminrechte prüfen
net session >nul 2>nul
if %errorlevel% neq 0 (
    echo  FEHLER: Bitte Rechtsklick auf die Datei und
    echo         "Als Administrator ausfuehren" wählen!
    echo.
    pause
    exit /b 1
)

:: Node.js prüfen
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo  FEHLER: Node.js ist nicht installiert!
    echo  Bitte installieren: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Anwendung bauen falls noch kein Build vorhanden
if not exist "server\dist\index.js" (
    echo  Kein Build gefunden. Erstelle Anwendung...
    echo.
    if not exist "node_modules" call npm run install:all
    call npm run build:all
    if %errorlevel% neq 0 (
        echo  FEHLER: Build fehlgeschlagen!
        pause
        exit /b 1
    )
    echo.
)

:: node-windows installieren falls nicht vorhanden
if not exist "node_modules\node-windows" (
    echo  Installiere node-windows...
    call npm install node-windows
    if %errorlevel% neq 0 (
        echo  FEHLER: node-windows konnte nicht installiert werden!
        pause
        exit /b 1
    )
    echo.
)

:: Dienst installieren
echo  Installiere Dienst...
echo.
node service\install.js

echo.
pause
