
import type { Express, Request, Response } from "express";
import { setupAuth } from "../auth";

export function registerAuthRoutes(app: Express) {
  setupAuth(app);
}
