// Configuration module for dynamic backend API URL resolution

export const getApiHost = () => {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
};
