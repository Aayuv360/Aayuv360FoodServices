import { mongoStorage } from "./mongoStorage";

export interface IStorage {
  [key: string]: any;
}

export class MemStorage implements IStorage {
  [key: string]: any;

  constructor() {
    // JWT authentication doesn't need session store
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
