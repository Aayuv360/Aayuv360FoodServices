// This file is a simple production starter
// It works around the build issues by directly running the server/index.ts file

// Set production environment
process.env.NODE_ENV = 'production';

// Import and run the server
import('./server/index.ts').catch(err => {
  console.error('Failed to start production server:', err);
  process.exit(1);
});