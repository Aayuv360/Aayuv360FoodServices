# Local Setup Guide for Millet Food Service

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
# Use your actual MongoDB connection string from MongoDB Atlas
# Format: mongodb+srv://<username>:<password>@<cluster-url>/<database-name>
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Session management (Required)
# Generate a random string for securing user sessions
SESSION_SECRET=random_string_for_security

# Optional payment provider settings - add these when needed
# RAZORPAY_KEY_ID=
# RAZORPAY_KEY_SECRET=
```

## Step 4: Start the Development Server
```bash
npm run dev
```

The server will start on http://localhost:5000

## Test Accounts
- Admin: username: admin, password: admin123
- Manager: username: manager, password: manager123
- User: username: guest, password: guest123

## Troubleshooting
1. If MongoDB connection fails, check your connection string and network setup
2. For "Module not found" errors, ensure all dependencies are properly installed
3. For TypeScript errors, check shared/mongoModels.ts file for proper interfaces