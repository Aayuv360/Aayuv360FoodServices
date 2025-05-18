# Troubleshooting MongoDB Connection Issues

If you're encountering the error "Operation `meals.countDocuments()` buffering timed out after 10000ms", follow these steps to resolve the issue:

## 1. Check your MongoDB connection string

Make sure your `.env` file has a valid MongoDB connection string:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
```

Common issues:
- Username or password contains special characters that need URL encoding
- Incorrect database name
- Missing or incorrect cluster address

## 2. Verify MongoDB is running

If using MongoDB Atlas:
- Log into your MongoDB Atlas account
- Check that your cluster is active
- Verify your IP address is whitelisted in the Network Access settings

If using local MongoDB:
- Ensure MongoDB service is running with: `sudo systemctl status mongodb`
- Start it if needed with: `sudo systemctl start mongodb`

## 3. Test your connection manually

You can test your MongoDB connection string directly:

```bash
# Install MongoDB CLI if needed
npm install -g mongodb-cli

# Test connection
mongosh "your_connection_string"
```

## 4. Increase connection timeout (Advanced)

If you're on a slow network, you can increase the connection timeout by modifying `server/db.ts`:
- Increase `serverSelectionTimeoutMS` to 10000 or higher
- Increase `socketTimeoutMS` to 60000 or higher

## 5. Setup a local MongoDB instance

For development purposes, you can set up a local MongoDB:

```bash
# Install MongoDB (Ubuntu)
sudo apt-get install mongodb

# Start MongoDB service
sudo systemctl start mongodb

# Update your .env file to use local MongoDB
MONGODB_URI=mongodb://localhost:27017/mealMillet
```

## Still having issues?

If you continue to face connection problems:
1. Temporarily run the app without MongoDB dependence
2. Check your network firewall settings
3. Consider using MongoDB Community Edition for local development