const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    apiUrl: 'http://localhost:5000/api'
  },
  production: {
    // For GitHub Pages connecting to your Raspberry Pi via ngrok
    // This will be updated dynamically in your ngrok setup script
    apiUrl: window.API_URL || 'http://localhost:5000/api'
  },
  test: {
    apiUrl: 'http://localhost:5000/api'
  }
};

export default config[env];