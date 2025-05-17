# Local Setup Guide for Millet Food Service Platform

## Prerequisites
- Node.js (v16 or higher)
- npm (v7 or higher)
- MongoDB (local installation or Atlas account)

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
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# For session management
SESSION_SECRET=your_session_secret_here
```

## Step 4: Start the Development Server
```bash
npm run dev
```

The server will start on http://localhost:5000

## Step 5: Building for Production
```bash
# Build the client
npm run build

# Start in production mode (using our custom script)
node -r tsx/register production-start.js
```

## Common Issues and Solutions

### MongoDB Connection
If you have issues connecting to MongoDB:
- Ensure MongoDB is running locally or your Atlas connection string is correct
- Check for any network restrictions if using a remote MongoDB instance

### Missing Node Modules
If you encounter missing module errors:
```bash
rm -rf node_modules
npm install
```

### TypeScript Errors
To fix common TypeScript errors:
```bash
npm run check
```

## Testing
### Default Test Accounts
- Admin: username: admin, password: admin123
- Manager: username: manager, password: manager123
- User: username: guest, password: guest123