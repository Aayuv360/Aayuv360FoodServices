# Multi-Environment Configuration Guide

## 🌟 **Three-Environment Setup**

Instead of using `.env.example`, we now have proper environment-specific configurations:

### **Environment Files Structure:**

```
├── .env                    # Current environment (development by default)
├── .env.development        # Development configuration ✅ Committed
├── .env.staging           # Staging configuration ✅ Committed  
├── .env.production        # Production template ✅ Committed
├── .env.example           # Template for reference
└── .env.local             # Personal overrides (not committed)
```

## 🔧 **Environment Loading System**

### **Automatic Environment Detection:**
```bash
NODE_ENV=development → Loads .env.development
NODE_ENV=staging     → Loads .env.staging  
NODE_ENV=production  → Loads .env.production
```

### **Priority Order:**
1. `.env.{NODE_ENV}` (highest priority)
2. `.env` (fallback)
3. System environment variables (override all)

## 🚀 **Usage Commands**

### **Development:**
```bash
npm run dev                    # Uses .env.development
# or
NODE_ENV=development npm start
```

### **Staging:**
```bash
npm run dev:staging           # Uses .env.staging
# or  
NODE_ENV=staging npm start
```

### **Production:**
```bash
npm run start                 # Uses .env.production
# or
NODE_ENV=production npm start
```

## 📋 **Environment Configurations**

### **🔨 Development (.env.development)**
- **Database:** `Aayuv-dev` (development database)
- **Payment:** Test Razorpay keys
- **API URL:** `http://localhost:5000`
- **CORS:** Local development domains
- **Logging:** Detailed debug logs enabled

### **🧪 Staging (.env.staging)**  
- **Database:** `Aayuv-staging` (staging database)
- **Payment:** Test Razorpay keys (staging)
- **API URL:** `https://millet-food-staging.onrender.com`
- **CORS:** Staging domain configuration
- **Logging:** Production-like but with debug info

### **🏭 Production (.env.production)**
- **Database:** `Aayuv-production` (production database)
- **Payment:** Live Razorpay keys
- **API URL:** `https://millet-food-service.onrender.com`
- **CORS:** Production domain configuration
- **Logging:** Error and info levels only

## 🔒 **Security Strategy**

### **What's Committed to Git:**
- ✅ `.env.development` - Safe development credentials
- ✅ `.env.staging` - Template for staging (placeholder secrets)
- ✅ `.env.production` - Template only (placeholder secrets)
- ✅ `.env.example` - Documentation template

### **What's NOT Committed:**
- ❌ `.env.local` - Personal overrides
- ❌ Real production secrets (set in deployment dashboard)

### **Production Deployment:**
1. **Use template:** `.env.production` provides structure
2. **Set real secrets:** In Render.com/Vercel/AWS dashboard
3. **Override template:** Real values override placeholder ones

## 🛠 **Development Workflow**

### **For New Team Members:**
```bash
# 1. Clone repository
git clone <repository>

# 2. Copy development environment
npm run env:copy

# 3. Start development
npm run dev
```

### **For Environment Switching:**
```bash
# Switch to staging
cp .env.staging .env
npm run dev

# Switch to development  
cp .env.development .env
npm run dev
```

## 📊 **Environment Validation**

The system automatically validates:
- ✅ Required variables for each environment
- ✅ Critical production variables
- ✅ Database connectivity
- ✅ API key availability

### **Validation Output:**
```
🔧 Loading environment: development
✅ Loaded environment configuration from .env.development
✅ Environment validation passed for development
🚀 Starting server in development mode on port 5000
```

## 🔄 **Migration from .env.example**

### **Why This is Better:**
1. **Clear Separation:** Each environment has dedicated configuration
2. **Team Collaboration:** Developers can share working configurations
3. **Deployment Ready:** Production template guides proper setup
4. **Validation:** Environment-specific validation prevents errors
5. **Flexibility:** Easy switching between environments

### **No More .env.example Confusion:**
- No copying and manual editing required
- Environment-specific defaults provided
- Automatic validation ensures completeness

This setup provides professional-grade environment management suitable for teams and production deployments.