/**
 * Script to run the PostgreSQL to MongoDB migration
 * 
 * This script uses tsx to run the TypeScript migration file
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting PostgreSQL to MongoDB data migration...');

// Run the migration script using tsx
const migrationScript = path.join(__dirname, 'server', 'migrate-pg-to-mongo.ts');
const child = spawn('npx', ['tsx', migrationScript], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('Migration completed successfully!');
  } else {
    console.error(`Migration process exited with code ${code}`);
  }
});

// Handle errors
child.on('error', (err) => {
  console.error('Failed to start migration process:', err);
});