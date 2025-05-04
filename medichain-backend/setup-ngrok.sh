#!/bin/bash
# Script to set up ngrok authentication for MediChain

echo "========================================================="
echo "Setting up ngrok for MediChain - Raspberry Pi Deployment"
echo "========================================================="

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "ngrok not found. Installing..."
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt-get update && sudo apt-get install -y ngrok
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq not found. Installing..."
    sudo apt-get update && sudo apt-get install -y jq
fi

echo ""
echo "To use ngrok, you need to create a free account and get your authtoken."
echo "1. Go to https://dashboard.ngrok.com/signup"
echo "2. Sign up for a free account"
echo "3. After signing in, go to https://dashboard.ngrok.com/get-started/your-authtoken"
echo "4. Copy your authtoken"
echo ""
echo "Enter your ngrok authtoken (paste it here): "
read authtoken

# Configure ngrok
ngrok config add-authtoken $authtoken

echo ""
echo "Testing ngrok connection..."
ngrok http 8000 --log=stdout > /dev/null &
NGROK_PID=$!

# Give ngrok a moment to start
sleep 3

# Check if ngrok is running correctly
if curl -s http://localhost:4040/api/tunnels > /dev/null; then
    echo "ngrok setup successful!"
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
    echo "Test URL: $NGROK_URL"
    echo ""
    echo "You can now run the full MediChain backend with:"
    echo "cd /home/kds/Github/MediChain"
    echo "./medichain-backend/run-with-ngrok.sh"
else
    echo "ngrok setup failed. Please check your authtoken and try again."
fi

# Cleanup
kill $NGROK_PID 2>/dev/null