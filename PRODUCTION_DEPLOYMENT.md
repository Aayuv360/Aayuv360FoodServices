# Production Deployment Guide

## 🚀 **Complete Environment Configuration**

### **Environment Variables Fixed:**

#### **✅ Backend (.env)**
```bash
# Core Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
SESSION_SECRET=your-strong-session-secret

# Payment Gateway
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret_key

# SMS Services
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email Service
SENDGRID_API_KEY=your_sendgrid_key

# Google Maps
GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_TITLE=Millet Food Service

# Production CORS
FRONTEND_URL=https://your-domain.com
RENDER_EXTERNAL_URL=https://your-app.onrender.com
RENDER_SERVICE_NAME=your-service-name
```

#### **✅ Frontend (client/.env)**
```bash
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_TITLE=Millet Food Service
```

### **Production Issues Fixed:**

#### **1. Environment Variable Loading**
- ✅ Removed hardcoded API keys from Razorpay service
- ✅ Added proper environment variable handling for Google Maps
- ✅ Created centralized API configuration

#### **2. CORS Configuration**
- ✅ Fixed CORS origin handling for production deployment
- ✅ Added proper null checking for origin headers
- ✅ Configured allowedOrigins for Render.com

#### **3. Database Connection**
- ✅ Added production-specific error handling
- ✅ Required database connection in production
- ✅ Improved connection logging

#### **4. Port Configuration**
- ✅ Fixed port handling for production (supports PORT env var)
- ✅ Added proper retry logic for port conflicts
- ✅ Configured host binding to 0.0.0.0

#### **5. Session Security**
- ✅ Configured secure cookies for HTTPS production
- ✅ Added proper sameSite settings for cross-origin
- ✅ Detect Render.com deployment for cookie settings

## 🔧 **Render.com Deployment Steps**

### **1. Environment Variables to Set in Render.com Dashboard:**

#### **Required (Production Values):**
```
NODE_ENV=production
PORT=10000
MONGODB_URI=<your-production-database-url>
SESSION_SECRET=<generate-strong-secret>
RAZORPAY_KEY_ID=<production-razorpay-key>
RAZORPAY_KEY_SECRET=<production-razorpay-secret>
```

#### **Optional (but recommended):**
```
TWILIO_ACCOUNT_SID=<production-twilio-sid>
TWILIO_AUTH_TOKEN=<production-twilio-token>
TWILIO_PHONE_NUMBER=<production-phone>
SENDGRID_API_KEY=<production-sendgrid-key>
GOOGLE_MAPS_API_KEY=<production-maps-key>
```

#### **CORS Configuration:**
```
FRONTEND_URL=https://your-custom-domain.com
RENDER_EXTERNAL_URL=https://your-app.onrender.com
RENDER_SERVICE_NAME=your-service-name
VITE_API_BASE_URL=https://your-app.onrender.com
```

### **2. Build Configuration:**
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Node Version: 18+

### **3. Files Ready for Deployment:**
- ✅ `render.yaml` - Deployment configuration
- ✅ `.env` - Development environment (safe to commit)
- ✅ `package.json` - Build scripts configured
- ✅ Production error handling implemented

## 🔍 **Testing Production Environment**

Before deploying, test locally with production settings:

```bash
# Set production environment
export NODE_ENV=production
export PORT=10000

# Start server
npm run start
```

## 🚨 **Security Checklist**

- ✅ Production secrets not committed to Git
- ✅ CORS properly configured for production domains
- ✅ Session cookies secure for HTTPS
- ✅ Database connection required in production
- ✅ Error handling doesn't expose sensitive data
- ✅ Trust proxy configured for cloud deployment

## 🎯 **Next Steps**

1. Set environment variables in Render.com dashboard
2. Deploy using `render.yaml` configuration
3. Test all functionality in production
4. Monitor logs for any issues

The application is now fully configured for production deployment with proper environment variable handling across all components.