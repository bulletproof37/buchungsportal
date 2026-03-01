@echo off
cd /d "%~dp0"
if not exist "logs" mkdir logs
call update.bat /silent >> "%~dp0logs\autoupdate.log" 2>&1
