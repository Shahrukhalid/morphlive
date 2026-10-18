@echo off
cd /d "%~dp0"
echo ================================================
echo           MorphLive Local Reality Studio
echo ================================================

if not exist "node_modules" (
    echo Installing application dependencies...
    call npm install
)

if not exist "dist" (
    echo Building desktop studio...
    call npm run build
)

echo Launching MorphLive...
call npm run desktop
