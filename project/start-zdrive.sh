#!/bin/bash

# ZDrive Quick Start Script
# This script starts your ZDrive development server

echo "🚀 Starting ZDrive Development Server..."
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project directory"
    echo "   cd project && ./start-zdrive.sh"
    exit 1
fi

# Check if server is already running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is already running on http://localhost:3000"
    echo "   Open your browser and navigate to: http://localhost:3000"
    exit 0
fi

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "next dev" || true
sleep 2

# Start the server
echo "🚀 Starting development server..."
npm run dev &

# Wait for server to start
echo "⏳ Waiting for server to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ SUCCESS: ZDrive is running on http://localhost:3000"
        echo "   Open your browser and navigate to: http://localhost:3000"
        echo ""
        echo "📝 To stop the server: Ctrl+C"
        echo "📝 To restart: ./start-zdrive.sh"
        exit 0
    fi
    sleep 1
done

echo "❌ ERROR: Server failed to start within 30 seconds"
echo "   Try running: ./troubleshoot-dev-server.sh"
exit 1 