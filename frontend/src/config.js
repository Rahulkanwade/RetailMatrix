import { Capacitor } from '@capacitor/core';

export const API_URL = Capacitor.isNativePlatform() 
  ? 'https://your-railway-url.up.railway.app'
  : 'http://localhost:5000';

export const API_BASE = API_URL; // If you need this alias