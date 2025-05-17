import { mongoStorage } from './mongoStorage';
import * as expressSession from "express-session";
import createMemoryStore from "memorystore";

// Define a simplified storage interface
export interface IStorage {
  sessionStore: expressSession.Store;
  [key: string]: any;
}

// Create a basic in-memory fallback
export class MemStorage implements IStorage {
  sessionStore: expressSession.Store;
  
  constructor() {
    const MemoryStore = createMemoryStore(expressSession);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
  }
}

// Initialize storage with MongoDB, but have MemStorage as fallback
declare global {
  var useMemoryFallback: boolean;
}

// Create a fallback memory storage instance
const memStorage = new MemStorage();

// Export a proxy to the current storage implementation
export const storage = new Proxy({} as IStorage, {
  get: (target, prop) => {
    // Always get the latest storage implementation
    return global.useMemoryFallback 
      ? memStorage[prop as keyof IStorage]
      : mongoStorage[prop as keyof IStorage];
  }
});

// Let other modules change the storage implementation
export function createFallbackStorage(): IStorage {
  console.log('Activating fallback in-memory storage');
  global.useMemoryFallback = true;
  return memStorage;
}