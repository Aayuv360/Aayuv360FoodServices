# Millet Food Service Platform

A comprehensive millet-based food service platform that delivers personalized culinary experiences with subscription services, featuring 38 millet-based meal options, user authentication, order management, payment processing, and real-time order tracking with Google Maps integration for the Hyderabad area.

## Features

### Core Functionality
- **38 Millet-Based Meals**: Complete catalog with nutritional information and dietary preferences
- **User Authentication**: Secure session-based authentication with role-based access control
- **Shopping Cart**: Advanced cart functionality with meal customization and curry options
- **Order Management**: Complete order lifecycle from placement to delivery tracking
- **Subscription Plans**: Three tiers - Basic (₹2000), Premium (₹3500), Family (₹5000)
- **Payment Integration**: Secure payment processing with Razorpay gateway
- **Real-time Tracking**: Live GPS tracking with Google Maps integration displayed on home page
- **Admin Portal**: Comprehensive dashboard for order, meal, and user management

### Advanced Features
- **Location Services**: Service area validation with distance calculations
- **Meal Planning**: Automated meal planning and delivery scheduling
- **Performance Optimization**: Image lazy loading, API caching, and memory optimization
- **Accessibility**: High contrast mode, keyboard navigation, and screen reader support
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Multi-Environment**: Development, staging, and production configurations

## Tech Stack

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with custom design system
- **State Management**: React Query for server state, Recoil for global state
- **UI Components**: Custom component library based on Radix UI primitives
- **Routing**: React Router with protected routes
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Management**: Express sessions with MongoDB store
- **API Design**: RESTful APIs with structured error handling

### Database Architecture
- **Primary Database**: MongoDB with Mongoose ODM
- **Schema Design**: Flexible document-based models
- **Collections**: Users, Meals, Orders, Subscriptions, CartItems, Addresses, Reviews, CurryOptions, SubscriptionPlans
- **Image Storage**: GridFS for meal images with optimization

### External Services
- **Payment Processing**: Razorpay for orders and subscriptions
- **Maps Integration**: Google Maps API for location services and tracking
- **Email Services**: SendGrid for delivery notifications (optional)
- **SMS Services**: Twilio for delivery updates (optional)

## Environment Configuration

### Required Environment Variables

```env
# Core Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://your_connection_string

# Authentication & Security
SESSION_SECRET=your_secure_session_secret

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Location Services
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Frontend Configuration
VITE_API_BASE_URL=https://your-api-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

### Optional Services

```env
# Email Notifications
SENDGRID_API_KEY=your_sendgrid_api_key

# SMS Notifications
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd millet-food-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   - Copy environment variables to your hosting platform
   - Configure MongoDB Atlas database
   - Set up Razorpay account and get API keys
   - Configure Google Maps API key

4. **Development server**
   ```bash
   npm run dev
   ```

5. **Production build**
   ```bash
   npm run build
   npm start
   ```

## Deployment

### Render.com Deployment
The application includes a `render.yaml` configuration for easy deployment:

1. **Push to GitHub repository**
2. **Connect to Render.com**
3. **Set environment variables** in Render dashboard
4. **Deploy** - the multi-environment system automatically detects production mode

### Environment Detection
The platform automatically detects the environment and loads appropriate configurations:
- **Development**: Uses `.env.development`
- **Staging**: Uses `.env.staging`
- **Production**: Uses environment variables from hosting platform

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Meals & Menu
- `GET /api/meals` - Get all 38 millet meals
- `GET /api/meals/:id` - Get specific meal details
- `GET /api/meals/type/:type` - Get meals by type

### Subscription Plans
- `GET /api/subscription-plans` - Get all subscription plans
- `POST /api/subscriptions` - Create new subscription
- `GET /api/subscriptions` - Get user subscriptions

### Orders & Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id/tracking` - Get order tracking details

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment signature

### Location Services
- `GET /api/locations` - Get service areas
- `POST /api/addresses` - Save delivery address
- `GET /api/addresses` - Get saved addresses

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/           # Utilities and configurations
├── server/                 # Backend Express application
│   ├── routes/            # API route handlers
│   ├── auth.ts            # Authentication logic
│   ├── razorpay.ts        # Payment processing
│   └── mongoStorage.ts    # Database operations
├── shared/                # Shared TypeScript types
└── package.json          # Dependencies and scripts
```

## Key Features Implementation

### Real-time Order Tracking
- Live GPS tracking for delivery partners
- Server-Sent Events (SSE) for status updates
- Google Maps integration on home page
- Delivery time estimation

### Payment Processing
- Razorpay integration with order verification
- Support for one-time orders and subscriptions
- Secure payment signature validation
- Order-payment mapping system

### Multi-Environment Support
- Automatic environment detection
- Environment-specific configurations
- Production-ready CORS and security settings
- Comprehensive environment validation

## Test Accounts

The system includes the following test accounts:

- **Admin**: username: `admin`, password: `admin123`
- **Manager**: username: `manager`, password: `manager123`
- **User**: username: `guest`, password: `guest123`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.