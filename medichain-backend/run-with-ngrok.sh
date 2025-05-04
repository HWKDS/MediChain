#!/bin/bash
# This script runs the MediChain backend on a Raspberry Pi and exposes it via ngrok

# Check for required dependencies
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo "$1 not found. Installing..."
    case $1 in
      jq)
        sudo apt-get update && sudo apt-get install -y jq
        ;;
      ngrok)
        echo "Installing ngrok..."
        curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
        echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
        sudo apt-get update && sudo apt-get install -y ngrok
        echo "Please configure ngrok with your authtoken:"
        echo "ngrok config add-authtoken YOUR_AUTH_TOKEN"
        echo "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
        exit 1
        ;;
    esac
  fi
}

# Check for required dependencies
check_dependency "jq"
check_dependency "ngrok"

# Check if ngrok is authenticated
ngrok_check=$(ngrok version)
if [[ $ngrok_check == *"ERR_NGROK_4018"* ]]; then
  echo "ngrok is not authenticated. Please run:"
  echo "ngrok config add-authtoken YOUR_AUTH_TOKEN"
  echo "Get your token from: https://dashboard.ngrok.com/get-started/your-authtoken"
  exit 1
fi

# Function to check if truffle is installed
if ! command -v truffle &> /dev/null; then
  echo "Truffle not found. Installing..."
  npm install -g truffle
fi

# Start Ganache in the background
echo "Starting Ganache..."
ganache --deterministic --host 0.0.0.0 &
GANACHE_PID=$!

# Wait for Ganache to initialize
sleep 5
echo "Ganache started with PID: $GANACHE_PID"

# Deploy contracts if not already compiled
if [ ! -d "/home/kds/Github/MediChain/build/contracts" ]; then
  echo "Compiling contracts..."
  cd /home/kds/Github/MediChain
  npx truffle compile
fi

# Deploy contracts
echo "Deploying contracts..."
cd /home/kds/Github/MediChain
node scripts/deploy_local.js
CONTRACT_STATUS=$?

if [ $CONTRACT_STATUS -ne 0 ]; then
  echo "Contract deployment failed. Exiting."
  kill $GANACHE_PID
  exit 1
fi

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
sleep 5
echo "Ngrok started with PID: $NGROK_PID"

# Get the ngrok public URL - retry a few times in case it's not immediately available
MAX_ATTEMPTS=5
ATTEMPT=1
NGROK_URL=""

while [ $ATTEMPT -le $MAX_ATTEMPTS ] && [ -z "$NGROK_URL" ]; do
  echo "Attempt $ATTEMPT to get ngrok URL..."
  
  if [ -f /tmp/ngrok-url.txt ]; then
    rm /tmp/ngrok-url.txt
  fi
  
  # Try to get the URL directly
  curl -s http://localhost:4040/api/tunnels > /tmp/ngrok-tunnels.json
  
  if [ -s /tmp/ngrok-tunnels.json ]; then
    # Check if jq is available for JSON parsing
    if command -v jq &> /dev/null; then
      NGROK_URL=$(jq -r '.tunnels[0].public_url' /tmp/ngrok-tunnels.json)
    else
      # Fallback to grep if jq is not available
      NGROK_URL=$(grep -o '"public_url":"[^"]*' /tmp/ngrok-tunnels.json | head -1 | cut -d'"' -f4)
    fi
  fi
  
  if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" = "null" ]; then
    echo "Couldn't get ngrok URL yet. Waiting..."
    sleep 3
    ATTEMPT=$((ATTEMPT+1))
  else
    break
  fi
done

if [ -z "$NGROK_URL" ] || [ "$NGROK_URL" = "null" ]; then
  echo "Failed to get ngrok URL after multiple attempts."
  echo "Please check if ngrok is running properly with:"
  echo "curl http://localhost:4040/api/tunnels"
  NGROK_URL="http://localhost:5000"
fi

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