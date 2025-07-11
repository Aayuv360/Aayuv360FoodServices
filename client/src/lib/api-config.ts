// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Millet Food Service';

// Environment detection
export const IS_DEVELOPMENT = import.meta.env.DEV;
export const IS_PRODUCTION = import.meta.env.PROD;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/api/auth`,
  MEALS: `${API_BASE_URL}/api/meals`,
  CART: `${API_BASE_URL}/api/cart`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  SUBSCRIPTIONS: `${API_BASE_URL}/api/subscriptions`,
  LOCATIONS: `${API_BASE_URL}/api/locations`,
  PAYMENTS: `${API_BASE_URL}/api/payments`,
} as const;

// Logging configuration
export const enableDetailedLogging = IS_DEVELOPMENT;

// Feature flags
export const FEATURES = {
  REAL_TIME_TRACKING: true,
  PUSH_NOTIFICATIONS: true,
  ANALYTICS: IS_PRODUCTION,
  DEBUG_MODE: IS_DEVELOPMENT,
} as const;