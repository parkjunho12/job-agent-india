#!/bin/bash

# UK Job Agent - Setup Script
# This script sets up the development environment

set -e

echo "🚀 UK Job Agent - Initial Setup"
echo "================================"
echo ""

# Check prerequisites
echo "Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi
echo "✓ Python $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi
echo "✓ Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo "✓ npm $(npm --version)"

echo ""
echo "1️⃣  Setting up backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Backend dependencies installed"

# Create uploads directory
mkdir -p uploads
echo "✓ Uploads directory created"

cd ..

echo ""
echo "2️⃣  Setting up frontend..."
cd frontend

# Install dependencies
if [ ! -d "node_modules" ]; then
    npm install
    echo "✓ Frontend dependencies installed"
fi

cd ..

echo ""
echo "3️⃣  Setting up environment variables..."

# Copy .env.example if .env doesn't exist
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✓ .env file created from .env.example"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your ANTHROPIC_API_KEY"
    echo ""
else
    echo "✓ .env file already exists"
fi

echo ""
echo "4️⃣  Setting up database..."

# Check if PostgreSQL is installed
if command -v psql &> /dev/null; then
    echo "PostgreSQL detected"
    echo "Do you want to create the database now? (y/n)"
    read -r create_db
    
    if [ "$create_db" = "y" ]; then
        echo "Creating database 'job_agent_db'..."
        createdb job_agent_db 2>/dev/null || echo "Database may already exist"
        echo "✓ Database setup complete"
    fi
else
    echo "PostgreSQL not found. Using SQLite for development."
    echo "✓ SQLite will be used (DATABASE_URL in .env)"
fi

echo ""
echo "5️⃣  Creating necessary directories..."
mkdir -p database/migrations
mkdir -p database/seeds
mkdir -p docs
mkdir -p tests/backend
mkdir -p tests/extension
mkdir -p tests/e2e
echo "✓ Directories created"

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Edit .env and add your Anthropic API key:"
echo "   nano .env"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   uvicorn app.main:app --reload"
echo ""
echo "3. Start the frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Load the browser extension:"
echo "   - Chrome: chrome://extensions → Load unpacked → select extension/ folder"
echo "   - Firefox: about:debugging → Load Temporary Add-on → select extension/manifest.json"
echo ""
echo "5. Or use Docker Compose:"
echo "   docker-compose up"
echo ""
echo "🎉 Happy job hunting!"
