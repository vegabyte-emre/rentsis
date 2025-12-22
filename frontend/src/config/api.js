// Runtime config - her zaman window'dan al
export const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.REACT_APP_BACKEND_URL) {
    return window.REACT_APP_BACKEND_URL;
  }
  return process.env.REACT_APP_BACKEND_URL || 'http://72.61.158.147:8001';
};

// Getter olarak export et - her kullanımda güncel değer alınır
export const API_URL = typeof window !== 'undefined' && window.REACT_APP_BACKEND_URL 
  ? window.REACT_APP_BACKEND_URL 
  : (process.env.REACT_APP_BACKEND_URL || 'http://72.61.158.147:8001');

export default API_URL;
