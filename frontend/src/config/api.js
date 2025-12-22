// Runtime config - doğrudan window'dan al (öncelikli)
export const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.REACT_APP_BACKEND_URL) {
    return window.REACT_APP_BACKEND_URL;
  }
  return process.env.REACT_APP_BACKEND_URL || 'http://72.61.158.147:8001';
};

// API_URL artık runtime config'den alıyor - tüm sayfalar için çalışır
// Bu getter pattern sayesinde her erişimde güncel değer döner
let _apiUrlCache = null;
export const API_URL = new Proxy({}, {
  get: function(target, prop) {
    const url = getApiUrl();
    if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf') {
      return () => url;
    }
    return url;
  },
  // Template literal için
  [Symbol.toPrimitive]: function() {
    return getApiUrl();
  }
});

// String olarak kullanılabilmesi için getter
Object.defineProperty(API_URL, 'toString', {
  value: function() { return getApiUrl(); }
});

Object.defineProperty(API_URL, 'valueOf', {
  value: function() { return getApiUrl(); }
});

// Runtime'da kullanmak için bu fonksiyonu kullan
export default getApiUrl;
