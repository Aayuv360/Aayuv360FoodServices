# Deployment Guide for Render.com

## 🚨 **Fixing 401 Unauthorized Issues**

The 401 errors you're seeing on Render.com are due to session/authentication configuration differences between development (Replit) and production (Render.com).

### ✅ **Changes Made to Fix 401 Issues:**

1. **Session Configuration Fixed** - `server/auth.ts`
   - Added deployment-specific session settings
   - Fixed secure cookie configuration for Render.com HTTPS
   - Added proper `sameSite` and `httpOnly` settings

2. **CORS Configuration Added** - `server/index.ts`
   - Added cross-origin request handling for production
   - Added `trust proxy` setting for Render.com
   - Configured proper headers for authentication

3. **Production Environment Variables**
   ```
   NODE_ENV=production
   SESSION_SECRET=<strong-random-secret>
   MONGODB_URI=<your-mongodb-connection-string>
   RAZORPAY_KEY_ID=<your-razorpay-key>
   RAZORPAY_KEY_SECRET=<your-razorpay-secret>
   ```

### 🔧 **Required Environment Variables on Render.com:**

1. **Authentication & Sessions**
   - `SESSION_SECRET` - Generate a strong random secret
   - `NODE_ENV=production`

2. **Database**
   - `MONGODB_URI` - Your MongoDB Atlas connection string

3. **Payment Gateway**
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`

4. **Optional Services**
   - `SENDGRID_API_KEY` - Email notifications
   - `TWILIO_ACCOUNT_SID` - SMS notifications  
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

### 🚀 **Deployment Steps:**

1. **Build Configuration**
   ```bash
   Build Command: npm install && npm run build
   Start Command: npm run start
   ```

2. **Health Check**
   - Health Check Path: `/api/health`
   - Ensures your app is running correctly

3. **Environment Setup**
   - Set all required environment variables in Render.com dashboard
   - Ensure `NODE_ENV=production`
   - Generate a strong `SESSION_SECRET`

### 🔍 **Troubleshooting 401 Errors:**

1. **Check Session Configuration**
   - Verify `SESSION_SECRET` is set on Render.com
   - Ensure cookies are working with HTTPS

2. **Database Connection**
   - Verify `MONGODB_URI` is correctly configured
   - Check database connectivity

3. **Authentication Flow**
   - Test login endpoint: `POST /api/auth/login`
   - Check session persistence after login

### 📋 **Key Differences: Replit vs Render.com**

| Setting | Replit (Dev) | Render.com (Prod) |
|---------|--------------|-------------------|
| NODE_ENV | development | production |
| Cookies | `secure: false` | `secure: true` |
| CORS | Not required | Required |
| Trust Proxy | No | Yes |
| Session Store | Memory | Memory (but configured differently) |

### ✅ **Verification Steps:**

1. **Health Check**: Visit `https://your-app.onrender.com/api/health`
2. **Authentication Test**: Try logging in through the UI
3. **API Access**: Test protected endpoints after login

The changes made should resolve the 401 Unauthorized issues you're experiencing on Render.com while maintaining compatibility with Replit development environment.