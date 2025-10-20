#!/bin/bash

# Mining Finance System Frontend Startup Script

echo "Starting Mining Finance System Frontend..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if backend is running
echo "Checking if backend is running on port 9006..."
if ! curl -s http://localhost:9006/health > /dev/null; then
    echo "Backend is not running on port 9006."
    echo "Please start the backend first by running:"
    echo "cd ../backend && ./run.sh"
    echo ""
    echo "Or start it manually with:"
    echo "cd ../backend && go run cmd/api/main.go"
    exit 1
fi

echo "Backend is running. Starting frontend development server..."

# Start the development server
npm run dev
