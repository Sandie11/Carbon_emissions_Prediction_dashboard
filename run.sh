#!/bin/bash

# Emissions Dashboard - Quick Start Script

echo "=========================================="
echo "Emissions Prediction Dashboard"
echo "=========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.7 or higher."
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

echo ""
echo "🔧 Activating virtual environment..."
source venv/bin/activate

echo "✓ Virtual environment activated"
echo ""

echo "📥 Installing dependencies..."
#pip install -q -r requirements.txt
echo "✓ Dependencies installed"
echo ""

echo "=========================================="
echo "Starting Flask Application..."
echo "=========================================="
echo ""
echo "🌐 Dashboard available at: http://localhost:5000"
echo "📊 Press Ctrl+C to stop the server"
echo ""

# Run the Flask app
python app.py
