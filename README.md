# Avara SL - Complete Property Platform

A comprehensive fullstack Next.js application for property rentals, sales, and short-term bookings in Sri Lanka. Built with MongoDB, featuring advanced search, booking management, payment integration, and WhatsApp communications.

## 🌟 Features

### Core Functionality
- **Multi-Purpose Platform**: Rental properties, property sales, and short-term bookings (Airbnb-style)
- **Advanced Search & Filtering**: Location-based search with geospatial queries, price ranges, amenities
- **User Management**: Multiple user roles (Guest, Tenant, Host, Admin) with secure authentication
- **Property Management**: Complete CRUD operations with image uploads and status management
- **Booking System**: Real-time availability checking and booking management
- **Payment Integration**: Support for PayHere (Sri Lankan) and Stripe (International)
- **Admin Dashboard**: Comprehensive moderation tools and analytics

### Technical Features
- **Mobile-First PWA**: Responsive design optimized for Sri Lankan market
- **MongoDB Integration**: Scalable database with geospatial indexing
- **File Storage**: AWS S3 integration for property images
- **Real-time Updates**: Calendar availability and booking management
- **WhatsApp Integration**: Ready for WhatsApp Business API integration
- **Type Safety**: Full TypeScript implementation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- AWS S3 bucket (for image storage)

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd avara-sl
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Configure your `.env.local` with:
   - MongoDB connection string
   - AWS S3 credentials
   - Payment provider keys (PayHere/Stripe)
   - JWT secrets

3. **Start Development Server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
avara-sl/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── listings/          # Property listing pages
│   ├── admin/             # Admin dashboard
│   └── page.tsx          # Home page
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── property/         # Property-specific components
│   └── search/           # Search and filter components
├── lib/                  # Utility libraries
│   ├── db.ts            # Database connection
│   ├── auth.ts          # Authentication utilities
│   └── s3.ts            # File storage utilities
├── models/               # MongoDB/Mongoose models
│   ├── User.ts          # User model
│   ├── Property.ts      # Property model
│   ├── Booking.ts       # Booking model
│   └── Transaction.ts   # Payment transaction model
└── services/             # Business logic layer
    ├── propertyService.ts
    └── bookingService.ts
```

## 🔧 Configuration

### Database Models

The platform uses four main models:

- **User**: Complete user management with roles and preferences
- **Property**: Comprehensive property data with geospatial coordinates
- **Booking**: Short-term booking management with availability tracking
- **Transaction**: Payment tracking and financial records

### API Endpoints

Key API routes include:

- `GET /api/properties` - Search and filter properties
- `POST /api/properties` - Create new property listing
- `GET /api/properties/[id]` - Get property details
- `POST /api/bookings` - Create booking reservation
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration

### Authentication & Security

- JWT-based authentication with HTTP-only cookies
- Role-based access control (Guest, Tenant, Host, Admin)
- Input validation and sanitization
- Rate limiting and security headers

## 💳 Payment Integration

### PayHere (Sri Lankan Market)
- Local currency (LKR) support
- Mobile payment integration
- Sandbox and production environments

### Stripe (International)
- Credit card processing
- Multi-currency support
- Webhook handling for payment confirmation

## 📱 Mobile & PWA Features

- Responsive design with mobile-first approach
- Touch-friendly interfaces
- Fast loading with optimized images
- Offline capability (PWA ready)

## 🔍 Search & Filtering

Advanced search capabilities:
- **Text Search**: Title and description indexing
- **Geospatial Search**: Location-based with radius filtering
- **Price Ranges**: Dynamic price filtering by purpose
- **Property Attributes**: Bedrooms, bathrooms, amenities
- **Location Filters**: City, district, and area-based filtering

## 🏠 Property Types & Purposes

### Property Types
- Apartments
- Houses
- Villas
- Bungalows
- Land plots
- Commercial properties
- Rooms

### Listing Purposes
- **Rent**: Monthly/yearly rentals
- **Sale**: Property sales
- **Short-term**: Daily/weekly bookings

## 👥 User Roles & Permissions

### Guest/Visitor
- Browse properties
- Basic search and filtering
- View property details

### Tenant/Renter
- All guest features
- Save favorites
- Book properties
- Manage bookings

### Host/Landlord
- All tenant features
- List properties
- Manage property calendar
- View earnings and bookings

### Admin
- Platform moderation
- User management
- Property approval/rejection
- Analytics and reports

## 🚀 Deployment

### Frontend (Netlify)
```bash
npm run build
# Deploy to Netlify
```

### Backend (Render/Railway)
- Environment variables configuration
- MongoDB Atlas connection
- S3 bucket setup
- Payment webhook endpoints

### Production Checklist
- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] S3 bucket permissions set
- [ ] Payment webhooks configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured

## 🛠️ Development

### Adding New Features
1. Create database models in `models/`
2. Implement business logic in `services/`
3. Add API routes in `app/api/`
4. Create UI components in `components/`
5. Add pages in `app/`

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Modular component architecture

## 🔐 Security Features

- Input validation with Zod
- SQL injection prevention
- XSS protection
- CSRF token validation
- Rate limiting
- Secure file upload handling

## 📊 Analytics & Monitoring

- User activity tracking
- Property view analytics
- Booking conversion metrics
- Revenue tracking
- Performance monitoring

## 🌍 Sri Lankan Market Features

- LKR currency support
- Sri Lankan city/district data
- Local phone number formats
- WhatsApp integration for communication
- Mobile-first design for local users

## 📞 Support & Contact

For technical support or business inquiries:
- Email: contact@avara.lk
- Phone: +94 77 123 4567
- Address: Colombo, Sri Lanka

## 📄 License

This project is proprietary software. All rights reserved.

---

Built with ❤️ for the Sri Lankan property market using Next.js, MongoDB, and modern web technologies.