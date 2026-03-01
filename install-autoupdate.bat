@echo off
chcp 65001 >nul
title Buchungsportal - Automatisches Update einrichten

cd /d "%~dp0"

echo.
echo  =====================================================
echo   Buchungsportal - Automatisches Update einrichten
echo  =====================================================
echo.
echo  Richtet einen Task ein, der das Portal automatisch
echo  aktualisiert, sobald der PC hochfahrt.
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

:: Log-Verzeichnis anlegen
if not exist "logs" mkdir logs

:: Pfad in Variable speichern (ohne abschließenden Backslash)
set APPDIR=%~dp0

echo  Richte geplanten Task ein (beim Systemstart)...
echo.

:: Geplanten Task erstellen - alles auf einer Zeile
:: ONSTART = bei jedem Hochfahren, 90 Sekunden Verzoegerung fuer Netzwerk
schtasks /create /tn "Buchungsportal-Autoupdate" /tr "cmd /c \"cd /d \"%APPDIR%\" && update.bat /silent >> \"%APPDIR%logs\autoupdate.log\" 2>&1\"" /sc ONSTART /delay 0001:30 /ru SYSTEM /f

if %errorlevel% neq 0 (
    echo  FEHLER: Geplanter Task konnte nicht erstellt werden!
    echo.
    pause
    exit /b 1
)

echo  =====================================================
echo   Automatisches Update eingerichtet!
echo  =====================================================
echo.
echo  Bei jedem PC-Start wird das Portal automatisch
echo  auf die neueste Version aktualisiert (nach 90 Sek.).
echo.
echo  Logs werden gespeichert in: logs\autoupdate.log
echo.
echo  Manuelles Update jederzeit: update.bat starten
echo  Task entfernen:             uninstall-autoupdate.bat
echo.
pause
