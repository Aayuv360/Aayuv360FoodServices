# Millet Food Service Platform

## Overview

This is a comprehensive millet-based food service platform that provides subscription meal delivery services in the Hyderabad area. The application offers 38 different millet-based meal options with flexible subscription plans, user authentication, order management, and payment processing capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with custom design system
- **State Management**: React Query for server state, React Context for local state
- **UI Components**: Custom component library based on Radix UI primitives
- **Routing**: React Router with protected routes
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Management**: Express sessions with memory store
- **API Design**: RESTful APIs with structured error handling

### Database Architecture
- **Primary Database**: MongoDB with Mongoose ODM
- **Schema Design**: Flexible document-based models for users, meals, orders, subscriptions
- **Collections**: Users, Meals, Orders, Subscriptions, CartItems, Addresses, Reviews, CurryOptions, SubscriptionPlans
- **Fallback**: In-memory storage for development environments

## Key Components

### User Management
- Role-based access control (user, admin, manager)
- Profile management with preferences
- Authentication with bcrypt password hashing
- Session-based authentication with secure cookies

### Meal System
- 38 millet-based meal options with nutritional information
- Dietary preference filtering (vegetarian, gluten-free, high-protein, etc.)
- Curry options and customization for meals
- Search and categorization functionality

### Subscription Management
- Multiple subscription plans (Basic, Premium, Family)
- Default and customized meal plan options
- Flexible delivery scheduling
- Subscription lifecycle management (active, expired, cancelled)

### Order Processing
- Shopping cart functionality with meal customization
- Order placement and tracking
- Delivery status updates
- Order history and management

### Payment Integration
- Razorpay payment gateway integration
- Support for both one-time orders and subscriptions
- Payment verification and webhook handling
- Secure payment processing with order mapping

### Admin Portal
- Order management and tracking
- Subscription plan administration
- Meal inventory management
- User management and analytics
- Delivery scheduling and notifications

## Data Flow

1. **User Registration/Login**: Users authenticate through Passport.js local strategy
2. **Meal Browsing**: Frontend fetches meal data from MongoDB via REST APIs
3. **Cart Management**: Cart items stored in database linked to user sessions
4. **Order Placement**: Orders processed through Razorpay with verification
5. **Subscription Management**: Automated meal planning and delivery scheduling
6. **Admin Operations**: Real-time management of orders, meals, and users

## External Dependencies

### Payment Processing
- **Razorpay**: Primary payment gateway for orders and subscriptions
- Environment variables: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`

### Email Services
- **SendGrid**: Email notifications for delivery updates
- Environment variable: `SENDGRID_API_KEY`

### SMS Services
- **Twilio** (configured but optional): SMS notifications
- Environment variables: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### Maps Integration
- **Google Maps API**: Location services and delivery area validation
- API key embedded in MapProvider component

### Database
- **MongoDB**: Primary data storage
- Environment variable: `MONGODB_URI`

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev`
- **Server**: Development server with hot reloading via Vite
- **Database**: MongoDB Atlas or local MongoDB instance
- **Port**: 5000 (configurable via PORT environment variable)

### Production Build
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`
- **Deployment**: Configured for Replit autoscale deployment
- **Static Assets**: Served from `/dist/public` directory
- **Process Management**: Single Node.js process with Express

### Environment Configuration
Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `SESSION_SECRET`: Session encryption key
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Payment processing
- `SENDGRID_API_KEY`: Email notifications (optional)

## Recent Changes
- **June 25, 2025**: Initial project setup and migration from Replit Agent
- **June 25, 2025**: Implemented image upload functionality for admin portal
  - Added multer and sharp for image processing
  - Created ImageUpload component replacing URL fields
  - Images stored in MongoDB using GridFS with optimization
  - Added server endpoints for image upload and serving from database
- **June 25, 2025**: Enhanced location management with RecoilState
  - Added comprehensive location state management with Recoil atoms
  - Created LocationModal with Google Maps integration and autocomplete
  - Implemented service area validation with distance calculations
  - Added saved addresses functionality with CRUD operations
  - Integrated location synchronization across all components
  - Enhanced header location selector with modal interface
- **July 3, 2025**: Migration to Replit and cart functionality fixes
  - Completed migration from Replit Agent to standard Replit environment
  - Fixed mobile cart close button with improved touch targets and z-index
  - Fixed payment flow by removing unnecessary payment step that showed empty data
  - Enhanced Razorpay modal interactions by preventing cart closure during payment
  - Improved error handling and user feedback for payment cancellation and failures
- **July 5, 2025**: Completed migration analysis and environment setup
  - Successfully migrated from Replit Agent to standard Replit environment
  - Identified missing environment variables that need configuration
  - Verified application architecture and security implementations
  - Server running successfully with MongoDB connection
  - Documented comprehensive feature improvement roadmap
- **July 5, 2025**: Implemented Performance Optimization and Accessibility Features
  - Added LazyImage component with intersection observer for image optimization
  - Implemented comprehensive API response caching with React Query
  - Created accessibility framework with high contrast mode and keyboard navigation
  - Added screen reader support and ARIA compliance
  - Implemented performance monitoring with metrics logging
  - Added memory optimization and bundle splitting utilities
  - Enhanced CSS with accessibility and reduced motion support
  - Created accessibility toolbar for user customization

## Changelog
```
Changelog:
- June 25, 2025. Initial setup
- June 25, 2025. Added image upload system for meal management
```

## User Preferences
```
Preferred communication style: Simple, everyday language.
```