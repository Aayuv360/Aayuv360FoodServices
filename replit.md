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