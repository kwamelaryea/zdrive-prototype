#!/bin/bash

# ZDrive Development Server with Auto-Restart
# This script starts the development server and automatically restarts it if it crashes

echo "🚀 Starting ZDrive Development Server with Auto-Restart"
echo "======================================================"

# Function to check if server is running
check_server() {
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill existing processes
cleanup() {
    echo "🧹 Cleaning up existing processes..."
    pkill -f "next dev" || true
    pkill -f "node.*next" || true
    sleep 2
}

# Function to start server
start_server() {
    echo "🚀 Starting development server..."
    
    # Clean cache if needed
    if [ ! -d ".next" ]; then
        echo "📦 Building fresh cache..."
        rm -rf .next
    fi
    
    # Start the server
    npm run dev &
    SERVER_PID=$!
    
    echo "✅ Server started with PID: $SERVER_PID"
    
    # Wait for server to be ready
    echo "⏳ Waiting for server to be ready..."
    for i in {1..30}; do
        if check_server; then
            echo "✅ Server is ready at http://localhost:3000"
            return 0
        fi
        sleep 1
    done
    
    echo "❌ Server failed to start within 30 seconds"
    return 1
}

# Function to monitor server
monitor_server() {
    echo "👀 Monitoring server health..."
    
    while true; do
        if ! check_server; then
            echo "⚠️  Server stopped responding, restarting..."
            cleanup
            if start_server; then
                echo "✅ Server restarted successfully"
            else
                echo "❌ Failed to restart server, exiting"
                exit 1
            fi
        fi
        sleep 5
    done
}

# Main execution
cleanup

if start_server; then
    echo "🎉 Development server is running!"
    echo "📱 Local: http://localhost:3000"
    echo "🌐 Network: http://192.168.1.236:3000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "The server will automatically restart if it crashes"
    echo ""
    
    # Start monitoring in background
    monitor_server &
    MONITOR_PID=$!
    
    # Wait for user interrupt
    trap "echo '🛑 Stopping server...'; kill $SERVER_PID $MONITOR_PID 2>/dev/null; exit 0" INT TERM
    
    # Keep script running
    wait
else
    echo "❌ Failed to start development server"
    exit 1
fi 