import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function verifyPassword(inputPassword, storedPassword) {
  const [hashedPart, salt] = storedPassword.split('.');
  if (!hashedPart || !salt) return false;

  const inputHashBuffer = await scryptAsync(inputPassword, salt, 64);
  const inputHash = inputHashBuffer.toString('hex');
  
  return inputHash === hashedPart;
}

async function main() {
  const samplePassword = 'admin123';
  const hashedPassword = await hashPassword(samplePassword);
  
  console.log('Original password:', samplePassword);
  console.log('Hashed password:', hashedPassword);
  
  // Test correct password
  const isValid = await verifyPassword(samplePassword, hashedPassword);
  console.log('Verification with correct password:', isValid);
  
  // Test incorrect password
  const isInvalidValid = await verifyPassword('wrongpassword', hashedPassword);
  console.log('Verification with incorrect password:', isInvalidValid);
}

main().catch(console.error);