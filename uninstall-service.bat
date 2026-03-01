@echo off
chcp 65001 >nul
title Buchungsportal - Windows-Dienst entfernen

cd /d "%~dp0"

echo.
echo  =====================================================
echo   Buchungsportal - Windows-Dienst entfernen
echo  =====================================================
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

:: Sicherheitsabfrage
set /p CONFIRM=  Dienst wirklich entfernen? (j/n):
if /i not "%CONFIRM%"=="j" (
    echo  Abgebrochen.
    echo.
    pause
    exit /b 0
)

echo.
node service\uninstall.js

echo.
pause
