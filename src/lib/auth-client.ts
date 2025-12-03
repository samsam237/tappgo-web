'use client';

export function setAuthCookies(token: string, refreshToken: string) {
  if (typeof window !== 'undefined') {
    document.cookie = `access_token=${token}; path=/; max-age=900`; // 15 minutes
    document.cookie = `refresh_token=${refreshToken}; path=/; max-age=604800`; // 7 jours
  }
}

export function clearAuthCookies() {
  if (typeof window !== 'undefined') {
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

export function getClientToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Vérifier d'abord localStorage (utilisé par api.ts)
  const localStorageToken = localStorage.getItem('access_token');
  if (localStorageToken) {
    return localStorageToken;
  }
  
  // Sinon, vérifier les cookies (pour compatibilité)
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
  
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  
  return null;
}

export function isClientAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Vérifier localStorage d'abord (utilisé par api.ts)
  const localStorageToken = localStorage.getItem('access_token');
  if (localStorageToken) {
    return true;
  }
  
  // Sinon, vérifier les cookies
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
  
  return tokenCookie !== undefined;
}
