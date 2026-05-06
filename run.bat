@echo off
REM Emissions Dashboard - Quick Start Script for Windows

echo.
echo ==========================================
echo Emissions Prediction Dashboard
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    echo Please install Python 3.7 or higher from https://www.python.org
    pause
    exit /b 1
)

echo Python found
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created
) else (
    echo Virtual environment already exists
)

echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo Virtual environment activated
echo.

echo Installing dependencies...
#pip install -q -r requirements.txt
echo Dependencies installed
echo.

echo ==========================================
echo Starting Flask Application...
echo ==========================================
echo.
echo Dashboard available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

REM Run the Flask app
python app.py

pause
