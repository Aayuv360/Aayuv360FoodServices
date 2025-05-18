# Local Setup Guide for Millet Food Service Platform

## Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- MongoDB (local installation or MongoDB Atlas account)

## Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd mealMillet
```

## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Configure Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Connection (Required)
MONGODB_URI=your_mongodb_connection_string_here

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Session management (Required)
SESSION_SECRET=any_random_string_for_session_security
```

## Step 4: Start the Development Server
```bash
npm run dev
```

The server will start on http://localhost:5000

## Step 5: For Production Mode
```bash
# First build the project
node build.js

# Then start in production mode
npm start
```

## Test Accounts
- Admin: username: admin, password: admin123
- Manager: username: manager, password: manager123
- User: username: guest, password: guest123

## Troubleshooting
1. If MongoDB connection fails, check your connection string and network setup
2. For "Module not found" errors, ensure all dependencies are properly installed
3. For TypeScript errors, check shared/mongoModels.ts file for proper interfaces