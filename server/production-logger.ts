// Production logging utility to replace console.log statements
import { logError } from "./logger";

export const productionLog = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'production') {
      // Use proper logging service in production
      console.info(`[INFO] ${message}`, data ? JSON.stringify(data) : '');
    } else {
      console.log(message, data);
    }
  },
  
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'production') {
      logError(error || new Error(message), { context: message });
    } else {
      console.error(message, error);
    }
  },
  
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[WARN] ${message}`, data ? JSON.stringify(data) : '');
    } else {
      console.warn(message, data);
    }
  }
};