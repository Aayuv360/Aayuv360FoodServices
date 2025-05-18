#!/usr/bin/env node

/**
 * Simple build script to fix production deployment
 * Run this with Node.js before using npm start
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building application for production...');

try {
  // Step 1: Build the client
  console.log('Building client...');
  execSync('vite build', { stdio: 'inherit' });
  
  // Step 2: Create dist directory if it doesn't exist
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }

  // Step 3: Build server with esbuild
  console.log('Building server...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', 
    { stdio: 'inherit' });
  
  // Step 4: Copy necessary files
  console.log('Copying necessary files...');
  
  // Copy .env file if it exists
  const envFile = path.join(__dirname, '.env');
  if (fs.existsSync(envFile)) {
    fs.copyFileSync(envFile, path.join(distDir, '.env'));
  }
  
  console.log('Build completed successfully!');
  console.log('Use npm start to run the production server');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}