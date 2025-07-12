import { Request, Response } from "express";
import mongoose from "mongoose";
import { getCurrentISTISOString } from "./timezone-utils";

export const healthCheck = async (req: Request, res: Response) => {
  try {
    const dbStatus =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      status: "healthy",
      timestamp: getCurrentISTISOString(),
      uptime: `${Math.floor(uptime / 60)} minutes`,
      database: dbStatus,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + " MB",
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + " MB",
      },
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: "Health check failed",
    });
  }
};

export const databaseHealthCheck = async (req: Request, res: Response) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.status(200).json({ database: "healthy" });
  } catch (error) {
    res.status(503).json({ database: "unhealthy", error: error.message });
  }
};
