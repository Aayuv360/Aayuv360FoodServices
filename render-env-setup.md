# Render.com Deployment Guide

## Simple Environment Variable Setup

Render.com works perfectly with just environment variables - no YAML configuration needed. Simply set these in your Render service's Environment tab:

### Critical Variables (Required)
```
MONGODB_URI=mongodb+srv://sathishreddyk0337:MOrxxghoxAH5YUuJ@cluster0.qtzr9hy.mongodb.net/Aayuv
SESSION_SECRET=millet-food-service-production-secret-key-2025
RAZORPAY_KEY_ID=rzp_test_UxXBzl98ySixq7
RAZORPAY_KEY_SECRET=n78QX7ZaxGndqCdRryofDbNU
```

### Optional Variables (Recommended)
```
GOOGLE_MAPS_API_KEY=AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI
FAST2SMS_API_KEY=ZqmW2sE3CUbwLTH4c0XDQMJk169zlNRonAvYP7tGyhpgOjaV8ujIYLf1CMOBQaKR93qdcE6ySmTZrNW5
FAST2SMS_SENDER_ID=FSTSMS
```

### Frontend Variables (Auto-set)
```
VITE_GOOGLE_MAPS_API_KEY=AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI
VITE_API_BASE_URL=https://millet-food-service.onrender.com
FRONTEND_URL=https://millet-food-service.onrender.com
```

## Setup Instructions

1. Deploy from Replit (or connect your GitHub repo to Render)
2. In Render dashboard, go to your service's Environment tab
3. Add the critical variables listed above
4. Render will automatically build using `npm run build` and start with `npm run start`
5. No YAML configuration needed - just environment variables

**Build Command:** `npm install && npm run build`
**Start Command:** `npm run start`
**Port:** Render will automatically detect port 10000 from your app