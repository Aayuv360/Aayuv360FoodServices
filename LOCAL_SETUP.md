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
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string_here

# Razorpay (for payments)
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# For session management (generate a random string)
SESSION_SECRET=a_random_secure_string_for_sessions
```

## Step 4: Start MongoDB
If using a local MongoDB installation:
```bash
# On Windows
mongod --dbpath=./data

# On macOS/Linux (if installed via package manager)
sudo systemctl start mongod
```

If using MongoDB Atlas:
1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Get your connection string from the Atlas dashboard
3. Replace `your_mongodb_connection_string_here` in the `.env` file

## Step 5: Start the Development Server
```bash
npm run dev
```

The server will start on http://localhost:5000

## Step 6: Resolving Type Issues
We've fixed several TypeScript issues, but if you encounter others:

### server/mongoStorage.ts
The MongoDB document type issues can be fixed by updating the interface in shared/mongoModels.ts:

```typescript
// Add these to your UserDocument interface
export interface UserDocument extends Document {
  // existing properties
  preferences?: any;
}

// Add these to your SubscriptionDocument interface
export interface SubscriptionDocument extends Document {
  // existing properties
  customMealPlans?: any[];
}
```

### server/notifications.ts
Add null checks before accessing db:

```typescript
'db' is possibly 'undefined'.
if (!db) {
  console.error('Database connection not established');
  // Handle appropriately - throw error or return early
  return null;
}
```

## Production Deployment

### Option 1: Using Our Custom Script
```bash
# Build the client
npm run build

# Start in production mode
NODE_ENV=production node -r tsx/register production-start.js
```

### Option 2: Simple Development Mode Deployment
```bash
# Start in development mode but with production environment
NODE_ENV=production npm run dev
```

## Data Structure
The application uses MongoDB with the following main collections:
- Users (authentication, preferences)
- Meals (menu items, categories)
- Orders (customer purchases)
- Subscriptions (membership plans)
- Locations (delivery areas)

## Testing
### Default Test Accounts
- Admin: username: admin, password: admin123
- Manager: username: manager, password: manager123
- User: username: guest, password: guest123

## Troubleshooting
1. If MongoDB connection fails, check your connection string and network setup
2. For "Module not found" errors, ensure all dependencies are properly installed
3. For TypeScript errors, update type definitions as shown in Step 6