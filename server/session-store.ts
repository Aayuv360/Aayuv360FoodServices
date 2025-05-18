import * as expressSession from "express-session";
import createMemoryStore from "memorystore";
const MemoryStore = createMemoryStore(expressSession);

export function createSessionStore(): expressSession.Store {
  return new MemoryStore({
    checkPeriod: 86400000,
  });
}

export type SessionStore = expressSession.Store;
