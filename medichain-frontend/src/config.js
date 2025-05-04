const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    apiUrl: 'https://d58b-146-196-32-136.ngrok-free.app/api'
  },
  production: {
    // For GitHub Pages connecting to your Raspberry Pi via ngrok
    // This will be updated dynamically in your ngrok setup script
    apiUrl: window.API_URL || 'https://d58b-146-196-32-136.ngrok-free.app/api'
  },
  test: {
    apiUrl: 'https://d58b-146-196-32-136.ngrok-free.app/api'
  }
};


export default config[env];
