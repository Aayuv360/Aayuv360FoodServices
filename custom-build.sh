#!/bin/bash

# Custom build script that works with npm start
echo "Starting the custom build process..."

# Build the client
echo "Building client with Vite..."
npx vite build

# Create dist directory
mkdir -p dist 

# Build the server
echo "Building server with esbuild..."
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js

# Copy .env file to dist
if [ -f .env ]; then
  cp .env dist/.env
fi

# Create a minimal package.json in dist
echo '{
  "name": "millet-food-service",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js"
}' > dist/package.json

echo "Build complete! Run 'cd dist && NODE_ENV=production node index.js' to start the application"