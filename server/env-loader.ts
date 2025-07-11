// Environment Loader - Loads environment-specific .env files
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load environment variables based on NODE_ENV
 * Priority: .env.{NODE_ENV} > .env > default values
 */
export function loadEnvironment() {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const rootDir = path.resolve(__dirname, '..');

  console.log(`🔧 Loading environment: ${NODE_ENV}`);

  // Load environment-specific .env file directly
  const envPath = path.join(rootDir, `.env.${NODE_ENV}`);
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.error(`❌ Could not load .env.${NODE_ENV}`);
    console.error('Available environment files should be: .env.development, .env.staging, .env.production');
    if (NODE_ENV === 'production') {
      console.error('Production environment requires .env.production file or environment variables set in deployment platform');
      process.exit(1);
    }
  } else {
    console.log(`✅ Loaded environment configuration from .env.${NODE_ENV}`);
  }

  // Validate critical environment variables
  validateEnvironment();
}

/**
 * Validate that critical environment variables are set
 */
function validateEnvironment() {
  const NODE_ENV = process.env.NODE_ENV;
  const required = ['SESSION_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // Environment-specific validations
  if (NODE_ENV === 'production') {
    const prodRequired = ['MONGODB_URI', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
    const prodMissing = prodRequired.filter(key => !process.env[key]);
    
    if (prodMissing.length > 0) {
      console.error(`❌ Missing production environment variables: ${prodMissing.join(', ')}`);
      process.exit(1);
    }
  }

  console.log(`✅ Environment validation passed for ${NODE_ENV}`);
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: Number(process.env.PORT) || 5000,
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_STAGING: process.env.NODE_ENV === 'staging',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    
    // Database
    MONGODB_URI: process.env.MONGODB_URI,
    
    // Authentication
    SESSION_SECRET: process.env.SESSION_SECRET,
    
    // Payment
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    
    // Communication
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
    
    // Frontend
    VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    
    // CORS
    FRONTEND_URL: process.env.FRONTEND_URL,
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
    RENDER_SERVICE_NAME: process.env.RENDER_SERVICE_NAME,
  };
}