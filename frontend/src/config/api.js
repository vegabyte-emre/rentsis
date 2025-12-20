// Runtime config - config.js dosyasından alınır
const getApiUrl = () => {
  // Runtime config'den al (window.REACT_APP_BACKEND_URL)
  if (typeof window !== 'undefined' && window.REACT_APP_BACKEND_URL) {
    return window.REACT_APP_BACKEND_URL;
  }
  // Fallback: build-time env variable
  return process.env.REACT_APP_BACKEND_URL || '';
};

export const API_URL = getApiUrl();
export default API_URL;
