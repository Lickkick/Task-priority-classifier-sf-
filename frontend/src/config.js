export const getApiHost = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }

  // Fallback for deployed production environments (Vercel) if VITE_API_BASE_URL was omitted in build settings
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://task-priority-classifier-sf.onrender.com';
  }

  return 'http://localhost:8000';
};
