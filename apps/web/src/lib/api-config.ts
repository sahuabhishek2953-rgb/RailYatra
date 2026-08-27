// Get API base URL from environment or default to relative path
export const API_BASE_URL = (typeof window !== 'undefined' && (window as any).__ENV__?.VITE_API_URL) 
  || import.meta.env.VITE_API_URL 
  || '';
