# Environment Setup Options

There are several ways to set up environment variables for this application:

## 1. Command Line Export (Recommended for Development)

Export variables directly in your terminal session before starting the application:

```bash
# Set essential environment variables
export MONGODB_URI="your_mongodb_connection_string"
export SESSION_SECRET="your_session_secret"

# Optional variables for payment processing
export RAZORPAY_KEY_ID="your_razorpay_key_id"
export RAZORPAY_KEY_SECRET="your_razorpay_key_secret"

# Start the application
npm run dev
```

## 2. Environment Setup Script

Create a `setup-env.sh` script:

```bash
#!/bin/bash

# MongoDB Configuration
export MONGODB_URI="your_mongodb_connection_string"

# Session Configuration
export SESSION_SECRET="your_session_secret"

# Run the application
npm run dev
```

Make it executable and run it:

```bash
chmod +x setup-env.sh
./setup-env.sh
```

## 3. Process Manager Configuration (PM2)

If using PM2 for production, use ecosystem.config.js:

```javascript
module.exports = {
  apps: [
    {
      name: "millet-food-service",
      script: "server/index.ts",
      interpreter: "tsx",
      env: {
        NODE_ENV: "production",
        MONGODB_URI: "your_mongodb_connection_string",
        SESSION_SECRET: "your_session_secret",
      }
    }
  ]
};
```

Then start with: `pm2 start ecosystem.config.js`

## 4. Docker Environment Variables

If using Docker, set variables in docker-compose.yml:

```yaml
version: '3'
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - MONGODB_URI=your_mongodb_connection_string
      - SESSION_SECRET=your_session_secret
```

## 5. Host Platform Environment Variables

If deploying to platforms like Replit, Heroku, or Vercel, configure environment variables in their dashboard settings.

## Security Notes

* Keep all environment variables secure and never commit them to version control
* Use different values for development and production environments
* Rotate secrets periodically for enhanced security