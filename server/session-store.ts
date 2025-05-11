import * as expressSession from 'express-session';
import createMemoryStore from "memorystore";

// Create a consistent session store interface
const MemoryStore = createMemoryStore(expressSession);

// Export a function to create a memory store with consistent type
export function createSessionStore(): expressSession.Store {
  return new MemoryStore({
    checkPeriod: 86400000, // prune expired entries every 24h
  });
}

// Export the type for reuse
export type SessionStore = expressSession.Store;