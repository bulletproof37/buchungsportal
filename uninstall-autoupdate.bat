@echo off
chcp 65001 >nul
title Buchungsportal - Automatisches Update entfernen

cd /d "%~dp0"

echo.
echo  =====================================================
echo   Buchungsportal - Automatisches Update entfernen
echo  =====================================================
echo.
echo  WICHTIG: Als Administrator ausfuehren!
echo.

:: Adminrechte prüfen
net session >nul 2>nul
if %errorlevel% neq 0 (
    echo  FEHLER: Bitte Rechtsklick und "Als Administrator ausfuehren"!
    echo.
    pause
    exit /b 1
)

set /p CONFIRM=  Automatisches Update wirklich entfernen? (j/n):
if /i not "%CONFIRM%"=="j" (
    echo  Abgebrochen.
    echo.
    pause
    exit /b 0
)

echo.
schtasks /delete /tn "Buchungsportal-Autoupdate" /f

if %errorlevel% equ 0 (
    echo  Automatisches Update wurde entfernt.
) else (
    echo  Task nicht gefunden oder bereits entfernt.
)

echo.
pause
