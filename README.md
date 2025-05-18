# Millet Food Service Platform

A membership-based millet food service platform that delivers personalized culinary experiences through advanced technological integrations and comprehensive meal planning solutions.

## Overview

This platform offers a variety of millet-based meal options with subscription services, allowing users to choose from default or customized meal plans for delivery in the Hyderabad area.

## Features

- Browse 38 millet-based meal options
- Subscription management (default and customized plans)
- User authentication and profile management
- Order placement and tracking
- Location-based delivery services
- Payment processing with Razorpay
- Admin dashboard for order management
- Real-time delivery status updates

## Technology Stack

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Payment**: Razorpay integration
- **Authentication**: Passport.js with session-based auth

## Environment Variables

The application requires the following environment variables to function properly:

### Required Environment Variables

```
# MongoDB Connection (Required)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/<database-name>

# Session Security (Required)
SESSION_SECRET=<random_secure_string>
```

### Optional Environment Variables

```
# Payment Processing (Optional, required for payment features)
RAZORPAY_KEY_ID=<your_razorpay_key_id>
RAZORPAY_KEY_SECRET=<your_razorpay_key_secret>

# Server Configuration (Optional)
PORT=5000                         # Default is 5000
NODE_ENV=development              # Use 'production' for production environment
```

## Local Development Setup

1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with the required environment variables
4. Start the development server with `npm run dev`

For more detailed instructions, see [LOCAL_SETUP_SIMPLE.md](./LOCAL_SETUP_SIMPLE.md)

## Test Accounts

The system includes the following test accounts:

- **Admin**: username: `admin`, password: `admin123`
- **Manager**: username: `manager`, password: `manager123`
- **User**: username: `guest`, password: `guest123`

## Deployment

To deploy to production:

1. Set up all required environment variables
2. Set `NODE_ENV=production`
3. Run `npm run build`
4. Start the server with `npm start`

## Important Notes

- The application requires a valid MongoDB connection string to function
- Payment features require valid Razorpay API credentials
- The session secret should be a secure random string to ensure session security
- Do not hardcode sensitive information in the application code