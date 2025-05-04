#!/bin/bash
# This script runs the MediChain backend on a Raspberry Pi and exposes it via ngrok
# Install ngrok on Raspberry Pi if not installed: curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list && sudo apt update && sudo apt install ngrok

# Start Ganache in the background
echo "Starting Ganache..."
ganache --deterministic --host 0.0.0.0 &
GANACHE_PID=$!

# Wait for Ganache to initialize
sleep 5
echo "Ganache started with PID: $GANACHE_PID"

# Deploy contracts
echo "Deploying contracts..."
cd /home/kds/Github/MediChain
node scripts/deploy_local.js

# Start the backend server
echo "Starting backend server..."
cd /home/kds/Github/MediChain/medichain-backend
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 3
echo "Backend server started with PID: $SERVER_PID"

# Start ngrok to expose the backend
echo "Starting ngrok tunnel..."
ngrok http 5000 > /dev/null &
NGROK_PID=$!

# Wait for ngrok to start
sleep 3
echo "Ngrok started with PID: $NGROK_PID"

# Get the ngrok public URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
echo "================================================"
echo "Backend is now accessible at: $NGROK_URL"
echo "================================================"
echo "Copy this URL and update the API_URL variable in your GitHub Pages deployment"

# Create a script to inject the API URL in the frontend
cat > /home/kds/Github/MediChain/medichain-frontend/public/config.js <<EOL
window.API_URL = "$NGROK_URL/api";
console.log("API URL set to: " + window.API_URL);
EOL

echo "Configuration file generated at medichain-frontend/public/config.js"
echo "Please commit and push this file to GitHub before deploying to GitHub Pages"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle graceful shutdown
function cleanup {
  echo "Shutting down all services..."
  kill $NGROK_PID $SERVER_PID $GANACHE_PID
  exit 0
}

trap cleanup SIGINT

# Keep the script running
while true; do
  sleep 1
done