const env = process.env.NODE_ENV || 'development';

const config = {
  development: {
    apiUrl: 'http://localhost:5000/api'
  },
  production: {
    // Change this to your production API URL when you deploy the backend
    apiUrl: process.env.REACT_APP_API_URL || 'https://your-backend-url.vercel.app/api'
  },
  test: {
    apiUrl: 'http://localhost:5000/api'
  }
};

export default config[env];