// Configuration module for dynamic backend API URL resolution

export const getApiHost = () => {
  // 1. If VITE_API_URL environment variable is configured in Vercel / Netlify
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }

  // 2. If running locally on developer machine (localhost or 127.0.0.1)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
  }

  // 3. Fallback to production deployed backend service
  return 'https://sfcollab-task-priority-backend.onrender.com';
};
