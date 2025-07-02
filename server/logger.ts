// import winston from "winston";

// // Create logger instance
// const logger = winston.createLogger({
//   level: process.env.NODE_ENV === "production" ? "info" : "debug",
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.errors({ stack: true }),
//     winston.format.json()
//   ),
//   defaultMeta: { service: "millet-food-service" },
//   transports: [
//     // Write all logs with importance level of 'error' or less to error.log
//     new winston.transports.File({ filename: "logs/error.log", level: "error" }),
//     // Write all logs with importance level of 'info' or less to combined.log
//     new winston.transports.File({ filename: "logs/combined.log" }),
//   ],
// });

// // If we're not in production, log to the console as well
// if (process.env.NODE_ENV !== "production") {
//   logger.add(
//     new winston.transports.Console({
//       format: winston.format.combine(
//         winston.format.colorize(),
//         winston.format.simple()
//       ),
//     })
//   );
// }

// // Log database operations
// export const logDBOperation = (
//   operation: string,
//   collection: string,
//   duration?: number
// ) => {
//   logger.info("Database Operation", {
//     operation,
//     collection,
//     duration: duration ? `${duration}ms` : undefined,
//     timestamp: new Date().toISOString(),
//   });
// };

// // Log API requests
// export const logAPIRequest = (
//   method: string,
//   path: string,
//   statusCode: number,
//   duration: number,
//   userId?: number
// ) => {
//   logger.info("API Request", {
//     method,
//     path,
//     statusCode,
//     duration: `${duration}ms`,
//     userId,
//     timestamp: new Date().toISOString(),
//   });
// };

// // Log errors with context
// export const logError = (error: Error, context?: any) => {
//   logger.error("Application Error", {
//     message: error.message,
//     stack: error.stack,
//     context,
//     timestamp: new Date().toISOString(),
//   });
// };

// // Log security events
// export const logSecurityEvent = (
//   event: string,
//   userId?: number,
//   ip?: string,
//   details?: any
// ) => {
//   logger.warn("Security Event", {
//     event,
//     userId,
//     ip,
//     details,
//     timestamp: new Date().toISOString(),
//   });
// };

// export default logger;
