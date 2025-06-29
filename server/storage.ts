import { mongoStorage } from "./mongoStorage";
import expressSession from "express-session";
import createMemoryStore from "memorystore";

export interface IStorage {
  sessionStore: expressSession.Store;
  [key: string]: any;
}

export class MemStorage implements IStorage {
  sessionStore: expressSession.Store;
  [key: string]: any;

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

export const storage = new Proxy<IStorage>({} as IStorage, {
  get: (target, prop: string) => {
    const storageInstance = global.useMemoryFallback
      ? memStorage
      : (mongoStorage as IStorage);
    return storageInstance[prop as keyof IStorage];
  },
});

export function createFallbackStorage(): IStorage {
  console.log("Activating fallback in-memory storage");
  global.useMemoryFallback = true;
  return memStorage;
}
