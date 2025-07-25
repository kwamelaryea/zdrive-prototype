#!/bin/bash

# ZDrive Development Server Troubleshooting Script
# This script fixes common issues that prevent the Next.js dev server from running

echo "🔧 ZDrive Development Server Troubleshooter"
echo "=============================================="

# Function to check if port 3000 is in use
check_port() {
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port 3000 is already in use"
        echo "   Process: $(lsof -Pi :3000 -sTCP:LISTEN -t)"
        return 1
    else
        echo "✅ Port 3000 is available"
        return 0
    fi
}

# Function to kill all Node.js processes
kill_node_processes() {
    echo "🔄 Killing all Node.js processes..."
    pkill -f "node" || true
    pkill -f "next" || true
    sleep 2
    echo "✅ Node processes killed"
}

# Function to clean build cache
clean_cache() {
    echo "🧹 Cleaning build cache..."
    rm -rf .next
    rm -rf node_modules/.cache
    rm -rf .turbo
    echo "✅ Cache cleaned"
}

# Function to reinstall dependencies
reinstall_deps() {
    echo "📦 Reinstalling dependencies..."
    rm -rf node_modules
    rm -f package-lock.json
    npm install --legacy-peer-deps
    echo "✅ Dependencies reinstalled"
}

# Function to start dev server
start_dev_server() {
    echo "🚀 Starting development server..."
    npm run dev
}

# Main troubleshooting flow
echo "Step 1: Checking port availability..."
check_port

echo "Step 2: Killing existing processes..."
kill_node_processes

echo "Step 3: Cleaning cache..."
clean_cache

echo "Step 4: Reinstalling dependencies..."
reinstall_deps

echo "Step 5: Starting development server..."
start_dev_server 