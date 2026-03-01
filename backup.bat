@echo off
chcp 65001 >nul
title Buchungsportal - Manuelles Backup

cd /d "%~dp0"

echo.
echo  =====================================================
echo   Buchungsportal - Manuelles Backup
echo  =====================================================
echo.

if not exist "server\data\bookings.db" (
    echo  Keine Datenbank gefunden. Noch keine Daten vorhanden.
    echo.
    pause
    exit /b 0
)

:: Zeitstempel
for /f %%I in ('powershell -command "Get-Date -Format yyyyMMdd_HHmmss"') do set TIMESTAMP=%%I

:: Lokales Backup
if not exist "server\data\backups" mkdir "server\data\backups"
set LOCAL_BACKUP=server\data\backups\bookings_manuell_%TIMESTAMP%.db
copy "server\data\bookings.db" "%LOCAL_BACKUP%" >nul
echo  Lokal gesichert:   %LOCAL_BACKUP%

:: Externes Backup in Dokumente
if not exist "%USERPROFILE%\Documents\Buchungsportal-Backup" (
    mkdir "%USERPROFILE%\Documents\Buchungsportal-Backup"
)
set EXT_BACKUP=%USERPROFILE%\Documents\Buchungsportal-Backup\bookings_manuell_%TIMESTAMP%.db
copy "server\data\bookings.db" "%EXT_BACKUP%" >nul
echo  Dokumente:         %EXT_BACKUP%

:: Optional: USB-Stick (Laufwerk D: oder E:, falls vorhanden)
for %%D in (D E F G) do (
    if exist "%%D:\" (
        if not exist "%%D:\Buchungsportal-Backup" mkdir "%%D:\Buchungsportal-Backup"
        copy "server\data\bookings.db" "%%D:\Buchungsportal-Backup\bookings_manuell_%TIMESTAMP%.db" >nul
        if %errorlevel% equ 0 (
            echo  USB-Stick %%D:     %%D:\Buchungsportal-Backup\
        )
    )
)

echo.
echo  =====================================================
echo   Backup abgeschlossen!
echo  =====================================================
echo.
pause
