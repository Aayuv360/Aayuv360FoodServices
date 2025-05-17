// Custom build script to fix production build issues
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting custom build process...');

// Step 1: Build the client with Vite
console.log('Building client...');
exec('vite build', (err, stdout, stderr) => {
  if (err) {
    console.error('Error building client:', stderr);
    process.exit(1);
  }
  console.log(stdout);
  console.log('Client build complete.');

  // Step 2: Create dist directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'));
  }

  // Step 3: Build the server with esbuild
  console.log('Building server...');
  exec('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js', 
    (err, stdout, stderr) => {
      if (err) {
        console.error('Error building server:', stderr);
        process.exit(1);
      }
      console.log(stdout);
      console.log('Server build complete.');

      // Step 4: Copy necessary files to dist folder
      console.log('Copying necessary files...');
      
      // Create a package.json for the dist folder
      const packageJson = {
        "name": "millet-food-service",
        "version": "1.0.0",
        "type": "module",
        "scripts": {
          "start": "NODE_ENV=production node index.js"
        }
      };
      
      fs.writeFileSync(
        path.join(__dirname, 'dist', 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      // Copy .env file if it exists
      if (fs.existsSync(path.join(__dirname, '.env'))) {
        fs.copyFileSync(
          path.join(__dirname, '.env'),
          path.join(__dirname, 'dist', '.env')
        );
      }

      console.log('Build process completed successfully!');
      console.log('To run the production build:');
      console.log('cd dist && NODE_ENV=production node index.js');
    }
  );
});