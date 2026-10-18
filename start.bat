@echo off
cd /d "%~dp0"
echo ================================================
echo           MorphLive Local Reality Studio
echo ================================================

if not exist "node_modules" (
    echo Installing application dependencies...
    call npm install
    if errorlevel 1 exit /b 1
)

echo Launching MorphLive...
call npm start
