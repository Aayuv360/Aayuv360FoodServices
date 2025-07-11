# Render.com Environment Setup

## Required Environment Variables to Set in Render.com Dashboard

When deploying to Render.com, you need to manually set these environment variables in your service's Environment tab:

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

1. Go to your Render.com dashboard
2. Select your service "millet-food-service"
3. Go to Environment tab
4. Add each variable as a new environment variable
5. Deploy the service

This will resolve the "Critical environment configuration issues" error.