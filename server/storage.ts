import { mongoStorage } from "./mongoStorage";
import * as expressSession from "express-session";
import createMemoryStore from "memorystore";

export interface IStorage {
  sessionStore: expressSession.Store;
  [key: string]: any;
}

export class MemStorage implements IStorage {
  sessionStore: expressSession.Store;

  constructor() {
    const MemoryStore = createMemoryStore(expressSession);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getCurryOptions(): Promise<any[]> {
    return [];
  }
}

declare global {
  var useMemoryFallback: boolean;
}

const memStorage = new MemStorage();

export const storage = new Proxy({} as IStorage, {
  get: (target, prop) => {
    return global.useMemoryFallback
      ? memStorage[prop as keyof IStorage]
      : mongoStorage[prop as keyof IStorage];
  },
});

export function createFallbackStorage(): IStorage {
  console.log("Activating fallback in-memory storage");
  global.useMemoryFallback = true;
  return memStorage;
}
