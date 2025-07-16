import { Request, Response, NextFunction } from "express";
import { logError, logSecurityEvent } from "./logger";
import { getCurrentISTISOString } from "./timezone-utils";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const createError = (message: string, statusCode: number): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode = 500, message } = err;
  const userId = req.user?.id;
  const ip = req.ip || req.connection.remoteAddress;

  // Log error with context
  logError(err, {
    url: req.url,
    method: req.method,
    userId,
    ip,
    userAgent: req.get("User-Agent"),
    body: req.body,
  });

  // Log security events for suspicious status codes
  if (statusCode === 401 || statusCode === 403) {
    logSecurityEvent("Unauthorized Access Attempt", userId, ip, {
      url: req.url,
      method: req.method,
    });
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(statusCode).json({
    success: false,
    message: isDevelopment ? message : "Something went wrong",
    ...(isDevelopment && {
      stack: err.stack,
      context: {
        url: req.url,
        method: req.method,
        timestamp: getCurrentISTISOString(),
      },
    }),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};
