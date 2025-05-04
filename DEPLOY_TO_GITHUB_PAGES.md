# Deploying MediChain to GitHub Pages with Raspberry Pi Backend

This guide will help you deploy your MediChain frontend application to GitHub Pages while connecting to a backend running on your Raspberry Pi via ngrok.

## Setting up the Raspberry Pi Backend

### Prerequisites
1. Raspberry Pi with internet connection
2. Node.js and npm installed on the Pi
3. Ganache installed (`npm install -g ganache`)
4. ngrok installed (follow instructions in run-with-ngrok.sh)

### Steps to Run the Backend on Raspberry Pi

1. Copy the MediChain project to your Raspberry Pi
2. Make the run script executable:
   ```
   chmod +x medichain-backend/run-with-ngrok.sh
   ```
3. Run the backend with ngrok:
   ```
   cd MediChain
   ./medichain-backend/run-with-ngrok.sh
   ```
4. The script will output a ngrok URL. Make note of this URL.
5. The script will automatically generate a `config.js` file with the ngrok URL.

## Deploying the Frontend to GitHub Pages

### Prerequisites
1. GitHub account with the MediChain repository pushed to it
2. Node.js and npm installed on your development machine

### Steps to Deploy

1. Make sure you have the GitHub Pages package installed:
   ```
   cd medichain-frontend
   npm install gh-pages --save-dev
   ```

2. Update the `homepage` field in `package.json` with your GitHub username:
   ```
   "homepage": "https://yourusername.github.io/MediChain"
   ```

3. Copy the generated `config.js` from your Raspberry Pi to your development machine:
   ```
   # On your development machine:
   cd medichain-frontend/public
   # Replace with the actual config.js content from your Pi
   ```

4. Deploy to GitHub Pages:
   ```
   cd medichain-frontend
   npm run deploy
   ```

5. This will create a `gh-pages` branch in your repository and push the built frontend to it.

6. Go to your GitHub repository settings, scroll down to the GitHub Pages section, and make sure it's set to deploy from the `gh-pages` branch.

## Updating the Backend URL

When your ngrok URL changes (which happens each time you restart ngrok unless you have a paid account):

1. Run the backend script again on your Raspberry Pi
2. Copy the new `config.js` file to your development machine
3. Commit and push the new `config.js` to your repository
4. Redeploy to GitHub Pages:
   ```
   cd medichain-frontend
   npm run deploy
   ```

## Troubleshooting

1. **CORS Issues**: If you encounter CORS issues, update your backend server.js to allow requests from your GitHub Pages domain:
   ```javascript
   app.use(cors({
     origin: 'https://yourusername.github.io'
   }));
   ```

2. **Mixed Content Warnings**: If your GitHub Pages site (https) is trying to load the API from an ngrok http URL, make sure to use an ngrok URL that supports HTTPS.

3. **Connection Issues**: Ensure your Raspberry Pi is properly connected to the internet and the ngrok tunnel is active.