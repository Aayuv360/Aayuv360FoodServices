# Millet Food Service Platform

## Overview

This is a comprehensive millet-based food service platform built as a full-stack web application. The system provides subscription-based meal delivery services with 38 millet-based meal options, featuring user authentication, shopping cart functionality, order management, and real-time delivery tracking. The platform includes both customer-facing features and administrative tools for managing the business operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: TailwindCSS with custom design system and component library
- **State Management**: 
  - React Query (TanStack Query) for server state management and caching
  - Recoil for global client state management
  - Context API for specific feature state (Location, UI, Accessibility)
- **UI Components**: Custom component library built on Radix UI primitives with shadcn/ui
- **Routing**: React Router with protected routes for authentication

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for better type safety
- **Authentication**: Passport.js with local strategy and session-based authentication
- **Session Management**: Express sessions with in-memory store (MemoryStore)
- **API Design**: RESTful APIs with structured error handling and middleware
- **File Uploads**: Multer with Sharp for image processing
- **Payment Processing**: Razorpay integration for orders and subscriptions

### Database Architecture
- **Primary Database**: MongoDB with Mongoose ODM
- **Schema Design**: Flexible document-based models with TypeScript interfaces
- **Key Collections**: Users, Meals, Orders, Subscriptions, CartItems, Addresses, Reviews, CurryOptions, SubscriptionPlans, ContactReviews
- **Image Storage**: GridFS for meal images with optimization using Sharp
- **Data Seeding**: Automated initialization of sample meals and admin users

## Key Components

### Authentication & Authorization
- **Problem**: Secure user access and role-based permissions
- **Solution**: Passport.js with local strategy, bcrypt password hashing, and role-based middleware
- **Rationale**: Session-based auth provides good security for web applications without token management complexity

### Shopping Cart System
- **Problem**: Complex cart management with meal customization and curry options
- **Solution**: MongoDB-based cart storage with rich meal metadata and curry option tracking
- **Features**: Real-time cart updates, curry option selection, quantity management, and persistent storage

### Subscription Management
- **Problem**: Recurring meal delivery with flexible scheduling
- **Solution**: Three-tier subscription system (Basic ₹2000, Premium ₹3500, Family ₹5000) with automated meal planning
- **Features**: Subscription lifecycle management, delivery scheduling, and payment integration

### Real-time Features
- **Order Tracking**: Live GPS tracking integration with Google Maps API
- **Notifications**: Multi-channel notifications (app, SMS via Twilio, email via SendGrid)
- **Delivery Updates**: Real-time status updates for orders and subscriptions

### Admin Portal
- **Problem**: Business operations management
- **Solution**: Comprehensive admin dashboard with analytics, order management, and user administration
- **Features**: Revenue analytics, meal management, user role management, and order status updates

## Data Flow

1. **User Registration/Login**: User authentication through Passport.js with session storage
2. **Menu Browsing**: Meals fetched from MongoDB with curry options formatting
3. **Cart Management**: Items stored in MongoDB with user association and real-time updates
4. **Order Processing**: Order creation triggers payment gateway integration and inventory updates
5. **Subscription Handling**: Automated meal planning and delivery scheduling based on subscription type
6. **Payment Flow**: Razorpay integration for secure payment processing with webhook handling
7. **Delivery Tracking**: Real-time location updates and notification system

## External Dependencies

### Payment Gateway
- **Service**: Razorpay for payment processing
- **Integration**: Order creation, payment verification, and webhook handling
- **Features**: Support for one-time payments and subscription billing

### Communication Services
- **SMS**: Twilio for SMS notifications and delivery updates
- **Email**: SendGrid for email notifications and subscription confirmations
- **Maps**: Google Maps API for location services and delivery tracking

### Image Processing
- **Service**: Sharp for image optimization and resizing
- **Storage**: MongoDB GridFS for storing processed meal images
- **Features**: Automatic image compression and multiple format support

## Deployment Strategy

### Environment Configuration
- **Development**: Local MongoDB with hot reload via Vite
- **Staging**: Environment-specific configuration with .env files
- **Production**: Optimized builds with proper security headers and rate limiting

### Database Strategy
- **Primary**: MongoDB for all application data with Mongoose ODM
- **Fallback**: In-memory storage fallback for development when MongoDB is unavailable
- **Migrations**: Automated database seeding for initial data setup

### Security Features
- **Rate Limiting**: Express rate limiter for API endpoints
- **Input Validation**: Zod schemas for request validation
- **Security Headers**: Helmet.js for security headers
- **Authentication**: Secure session management with proper cookie settings

### Performance Optimizations
- **Caching**: Multi-level caching with NodeCache for different data types
- **Image Optimization**: Lazy loading and responsive images
- **Database**: Query optimization and proper indexing
- **Frontend**: Code splitting and optimized bundle sizes

The architecture prioritizes maintainability, scalability, and user experience while providing a robust foundation for a food delivery service platform.

## Recent Changes (July 2025)

### Payment Flow Overhaul - COMPLETED ✅
- **Problem**: Cart checkout was failing with 404 errors due to outdated payment API calls
- **Solution**: Implemented payment-first approach across all payment flows
- **Changes Made**:
  - Updated cart payment flow to use direct Razorpay integration without server pre-order creation
  - Fixed subscription payment flows (subscription.tsx, subscriptionCRUD.tsx) to use the same payment-first approach
  - Updated `use-razorpay` hook to generate temporary order IDs for payment tracking
  - Removed dependency on `/api/payments/create-order` endpoint for cart operations
  - Orders and subscriptions now created only after successful payment verification
  - Cleaned up unused components and fixed all import errors

### Component Cleanup - COMPLETED ✅
- **Problem**: Unused components causing import errors
- **Solution**: Removed unused SubscriptionPlanCards component and integrated functionality inline
- **Changes Made**:
  - Replaced SubscriptionPlanCards with inline Card components in both subscription pages
  - Added missing imports (Check icon from lucide-react)
  - Fixed all syntax errors and import issues

### Security Improvements - COMPLETED ✅
- **Enhancement**: Payment-first approach eliminates creation of unpaid orders
- **Benefits**: 
  - No orphaned orders in database
  - Payment verification happens before order creation
  - Cart remains intact when payment is cancelled
  - Better error handling for payment failures

**Status**: All payment flows now working correctly. Cart checkout and subscription payments use secure payment-first approach with proper error handling.

## Latest Fixes (July 2025)

### Cart API Completion - COMPLETED ✅
- **Problem**: Missing cart API endpoints causing "API endpoint not found" errors
- **Solution**: Added complete cart management endpoints in cart-routes.ts
- **Changes Made**:
  - Added POST `/api/cart/add` for adding items to cart
  - Added PUT `/api/cart/:id` for updating cart items
  - Added DELETE `/api/cart/:id` for removing specific items
  - Added DELETE `/api/cart` for clearing entire cart
  - All endpoints include proper authentication and validation
  - Support for curry options and meal customization

### Payment Modal Integration - COMPLETED ✅
- **Problem**: Razorpay payment modal not opening despite correct configuration
- **Solution**: Added Razorpay script to HTML and enhanced error handling
- **Changes Made**:
  - Added Razorpay checkout script to client/index.html
  - Enhanced payment flow with proper error handling
  - Payment config endpoint was already working correctly
  - Complete payment flow now functional: Cart → Payment → Order Creation

### Server Component Cleanup - COMPLETED ✅
- **Problem**: Unnecessary and duplicate server components causing complexity
- **Solution**: Removed unused/redundant files and consolidated functionality
- **Files Removed**:
  - `index.js` - Duplicate simple server file
  - `mealItems.ts` - Empty placeholder file 
  - `production.ts` - Duplicate production server setup
  - `env-loader.ts` - Redundant with env-validator.ts
  - `session-store.ts` - Functionality moved inline to mongoStorage.ts
  - `update-subscription-plans.ts` - One-time migration script no longer needed

**Benefits**:
- Cleaner codebase with reduced redundancy
- Single source of truth for environment validation (env-validator.ts)
- Simplified session store management
- Better maintainability and reduced confusion

### Render.com Deployment Simplified - COMPLETED ✅
- **Problem**: Unnecessary render.yaml configuration causing complexity
- **Solution**: Removed render.yaml file - Render works with environment variables only
- **Changes Made**:
  - Removed render.yaml configuration file
  - Environment variables set directly in Render dashboard
  - Simplified deployment process using standard npm scripts
  - Created clear deployment guide (render-env-setup.md)

**Benefits**:
- Simpler deployment process
- No YAML configuration maintenance required
- Direct environment variable management in Render dashboard
- Standard Node.js deployment approach

### Production Environment Issues Identified - IN PROGRESS ⚠️
- **Problem**: Environment variables not loading properly on Render.com
- **Root Cause**: Render.com requires manual environment variable setup in dashboard
- **Solution**: Environment variables must be set manually in Render service settings
- **Status**: User needs to add 4 critical variables in Render dashboard:
  - MONGODB_URI, SESSION_SECRET, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
- **Next Step**: User must configure environment variables in Render.com dashboard

### Cart Payment Flow Issue Fixed - COMPLETED ✅
- **Problem**: Orders created before payment, causing "processed" orders when payment was cancelled
- **Root Cause**: CartSidebar.tsx was creating order first (POST /api/orders), then initiating payment
- **Solution**: Implemented payment-first approach for cart orders (same as subscriptions)
- **Changes Made**:
  - Removed order creation before payment in CartSidebar.tsx
  - Cart orders now use temporary order IDs during payment (`cart_${timestamp}_${random}`)
  - Orders only created after successful payment verification with payment details included
  - When payment is cancelled, no order is created in database
  - Cart remains intact for retry when payment fails or is cancelled
  - Improved error handling for payment vs order creation failures

**Technical Details**:
- Old flow: POST /api/orders → initiate payment → PATCH /api/orders (if success)
- New flow: initiate payment with temp ID → POST /api/orders with payment details (if success)
- Temporary order IDs prevent database pollution during payment process

**Benefits**:
- No orphaned orders when payment is cancelled
- Cart remains available for retry after cancellation
- Clean database without unpaid orders
- Consistent payment flow across cart and subscription features