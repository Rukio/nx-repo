export const environment = {
  nodeEnv: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL || window.location.origin,
};
