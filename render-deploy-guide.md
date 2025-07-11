# Render.com Deployment Fix

## The Problem
The environment variables are not being loaded properly on Render.com, causing database connection failures.

## Required Environment Variables for Render.com

**CRITICAL: You must manually add these in your Render service's Environment tab:**

```
MONGODB_URI=mongodb+srv://sathishreddyk0337:MOrxxghoxAH5YUuJ@cluster0.qtzr9hy.mongodb.net/Aayuv
SESSION_SECRET=millet-food-service-production-secret-key-2025
RAZORPAY_KEY_ID=rzp_test_UxXBzl98ySixq7
RAZORPAY_KEY_SECRET=n78QX7ZaxGndqCdRryofDbNU
```

## Steps to Fix Deployment

1. **Go to Render.com Dashboard**
2. **Find your service** (millet-food-service)
3. **Click on Environment tab**
4. **Add each variable manually**:
   - Key: `MONGODB_URI`, Value: `mongodb+srv://sathishreddyk0337:MOrxxghoxAH5YUuJ@cluster0.qtzr9hy.mongodb.net/Aayuv`
   - Key: `SESSION_SECRET`, Value: `millet-food-service-production-secret-key-2025`
   - Key: `RAZORPAY_KEY_ID`, Value: `rzp_test_UxXBzl98ySixq7`
   - Key: `RAZORPAY_KEY_SECRET`, Value: `n78QX7ZaxGndqCdRryofDbNU`
5. **Redeploy the service**

## Why This Happens
- Render.com doesn't automatically load .env files
- Environment variables must be set in the Render dashboard
- The dotenv config in the code only works for local development