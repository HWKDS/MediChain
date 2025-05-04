/**
 * API Configuration for MediChain Frontend
 */

// Default API URL when running locally
const localApiUrl = 'http://localhost:5000/api';

// Check if window.API_URL is defined (by ngrok script)
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.API_URL) {
    console.log('Using dynamic API URL from config:', window.API_URL);
    return window.API_URL;
  }
  
  // Otherwise, try environment variables (for development/production builds)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback to local API URL
  console.log('No API URL configured, using default:', localApiUrl);
  return localApiUrl;
};

const config = {
  apiUrl: getApiUrl(),
  version: '1.0.0',
};

export default config;
