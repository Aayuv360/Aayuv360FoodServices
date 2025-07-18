// Environment Variable Validator
import dotenv from 'dotenv';

// Load environment file based on NODE_ENV
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI?: string;
  SESSION_SECRET: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
  FAST2SMS_API_KEY?: string;
  GOOGLE_MAPS_API_KEY?: string;
  REDIS_URL?: string;
  ACCESS_TOKEN_SECRET?: string;
  REFRESH_TOKEN_SECRET?: string;
}

class EnvironmentValidator {
  private config: Partial<EnvConfig> = {};
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor() {
    this.loadEnvironment();
    this.validate();
  }

  private loadEnvironment() {
    this.config = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: Number(process.env.PORT) || 5000,
      MONGODB_URI: process.env.MONGODB_URI,
      SESSION_SECRET: process.env.SESSION_SECRET,
      RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
      RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS: process.env.EMAIL_PASS,
      FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY,
      GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
      REDIS_URL: process.env.REDIS_URL,
      ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
    };
  }

  private validate() {
    // Required in all environments
    this.validateRequired('SESSION_SECRET', 'Session security requires a secret key');

    // Required in production
    if (this.config.NODE_ENV === 'production') {
      this.validateRequired('MONGODB_URI', 'Database connection required in production');
      this.validateRequired('RAZORPAY_KEY_ID', 'Payment gateway required in production');
      this.validateRequired('RAZORPAY_KEY_SECRET', 'Payment gateway secret required in production');
    }

    // For production on Render, require environment variables to be actually present
    if (this.config.NODE_ENV === 'production') {
      console.log('🔧 Production environment - validating all required variables are present');
      // Don't skip validation - ensure variables are actually set
    }

    // Optional but recommended
    this.validateOptional('MONGODB_URI', 'Database functionality will be limited');
    this.validateOptional('RAZORPAY_KEY_ID', 'Payment features will be disabled');
    this.validateOptional('RAZORPAY_KEY_SECRET', 'Payment features will be disabled');
    this.validateOptional('GOOGLE_MAPS_API_KEY', 'Location features may be limited');

    // Informational
    if (!this.config.EMAIL_USER || !this.config.EMAIL_PASS) {
      this.warnings.push('Email notifications disabled (EMAIL_USER/EMAIL_PASS not set)');
    }
    
    if (!this.config.FAST2SMS_API_KEY) {
      this.warnings.push('SMS notifications disabled (FAST2SMS_API_KEY not set)');
    }
  }

  private validateRequired(key: keyof EnvConfig, message: string) {
    if (!this.config[key]) {
      this.errors.push(`${key}: ${message}`);
    }
  }

  private validateOptional(key: keyof EnvConfig, message: string) {
    if (!this.config[key]) {
      this.warnings.push(`${key}: ${message}`);
    }
  }

  public getConfig(): Partial<EnvConfig> {
    return { ...this.config };
  }

  public getErrors(): string[] {
    return [...this.errors];
  }

  public getWarnings(): string[] {
    return [...this.warnings];
  }

  public isValid(): boolean {
    return this.errors.length === 0;
  }

  public printStatus() {
    console.log('\n🔧 Environment Configuration Status:');
    console.log(`Environment: ${this.config.NODE_ENV}`);
    console.log(`Port: ${this.config.PORT}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Critical Issues:');
      this.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All environment variables configured correctly');
    }
    
    console.log(''); // Empty line for spacing
  }
}

export const envValidator = new EnvironmentValidator();
export { EnvironmentValidator };