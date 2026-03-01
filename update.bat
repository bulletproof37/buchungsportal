@echo off
chcp 65001 >nul

:: /silent = kein Pause, für automatische geplante Tasks
set SILENT=0
if /i "%1"=="/silent" set SILENT=1

if %SILENT%==0 (
    title Buchungsportal - Update
    echo.
    echo  =====================================================
    echo   Buchungsportal - Update
    echo  =====================================================
    echo.
)

echo  [%date% %time%] Update gestartet.

cd /d "%~dp0"

:: Node.js Version prüfen (exit code 1 wenn zu neu)
node -e "process.exit(parseInt(process.version.slice(1)) > 21 ? 1 : 0)" >nul 2>&1
if %errorlevel% equ 1 (
    echo  FEHLER: Node.js Version wird nicht unterstuetzt!
    echo  Benoetigt: Version 18 oder 20 LTS
    echo  Download: https://nodejs.org  ^(LTS-Schaltflaeche^)
    if %SILENT%==0 ( echo. & pause )
    exit /b 1
)

:: -------------------------------------------------------
:: Datenbank sichern (BEVOR irgend etwas geändert wird)
:: -------------------------------------------------------
if exist "server\data\bookings.db" (
    if not exist "server\data\backups" mkdir "server\data\backups"

    :: Zeitstempel für Backup-Dateiname
    for /f %%I in ('powershell -command "Get-Date -Format yyyyMMdd_HHmmss"') do set TIMESTAMP=%%I
    set BACKUP_FILE=server\data\backups\bookings_pre-update_%TIMESTAMP%.db
    copy "server\data\bookings.db" "%BACKUP_FILE%" >nul
    echo  Datenbank gesichert: %BACKUP_FILE%

    :: Auch in Dokumente sichern (externe Kopie)
    if not exist "%USERPROFILE%\Documents\Buchungsportal-Backup" (
        mkdir "%USERPROFILE%\Documents\Buchungsportal-Backup"
    )
    copy "server\data\bookings.db" "%USERPROFILE%\Documents\Buchungsportal-Backup\bookings_pre-update_%TIMESTAMP%.db" >nul
    echo  Externe Kopie: Dokumente\Buchungsportal-Backup\
)

:: Git prüfen
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo  FEHLER: Git ist nicht installiert!
    if %SILENT%==0 ( echo. & pause )
    exit /b 1
)

:: Neueste Version laden
echo  [1/3] Lade neueste Version von GitHub...
git pull
if %errorlevel% neq 0 (
    echo  FEHLER: Git pull fehlgeschlagen. Internetverbindung prüfen.
    if %SILENT%==0 ( echo. & pause )
    exit /b 1
)

:: Abhängigkeiten aktualisieren
echo  [2/3] Aktualisiere Abhängigkeiten...
call npm run install:all
if %errorlevel% neq 0 (
    echo  FEHLER: npm install fehlgeschlagen.
    if %SILENT%==0 ( echo. & pause )
    exit /b 1
)

:: Neu bauen
echo  [3/3] Erstelle Anwendung...
call npm run build:all
if %errorlevel% neq 0 (
    echo  FEHLER: Build fehlgeschlagen.
    if %SILENT%==0 ( echo. & pause )
    exit /b 1
)

:: Dienst neu starten falls installiert
sc query Buchungsportal >nul 2>nul
if %errorlevel% equ 0 (
    echo  Starte Dienst neu...
    net stop Buchungsportal >nul 2>nul
    timeout /t 3 /nobreak >nul
    net start Buchungsportal >nul 2>nul
    echo  Dienst neu gestartet.
)

echo  [%date% %time%] Update abgeschlossen.

if %SILENT%==0 (
    echo.
    echo  =====================================================
    echo   Update abgeschlossen!
    echo  =====================================================
    echo.
    pause
)
