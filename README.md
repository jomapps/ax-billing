# AX Billing - Carwash Management System

A modern, gaming-style carwash management system built with PayloadCMS, Next.js, and MongoDB. Features AI-powered vehicle classification, real-time job tracking, and seamless payment integration.

## 🚀 Features

### Phase 1 (MVP) - ✅ Implemented
- **Modern Gaming UI**: Dark theme with neon accents and smooth animations
- **Staff Dashboard**: Real-time order tracking and job management
- **Order Management**: Create and track carwash orders
- **Vehicle Management**: License plate tracking and vehicle classification
- **Service Management**: Configurable services and pricing
- **Customer Tiers**: VIP, Regular, and Remnant queue management
- **Cloudflare R2 Storage**: Secure media storage for vehicle photos

### Phase 2 (Planned)
- **AI Vehicle Classification**: OpenRouter integration for automatic vehicle type detection
- **WhatsApp Integration**: Customer onboarding and notifications
- **Payment Gateway**: Fiuu payment processing
- **Enhanced Authentication**: WhatsApp-based customer identification and PayloadCMS admin authentication

### Phase 3 (Planned)
- **Subscription Packages**: Recurring service packages
- **Customer Portal**: Real-time service status tracking
- **Advanced Analytics**: Revenue and performance insights

## 🛠️ Tech Stack

- **Backend**: PayloadCMS 3.54.0 (Headless CMS)
- **Frontend**: Next.js 15.4.4 with React 19
- **Database**: MongoDB with Mongoose
- **Storage**: Cloudflare R2 (S3-compatible)
- **Styling**: Tailwind CSS with custom gaming theme
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## 🚀 Quick Start

### Prerequisites
- Node.js 18.20.2+ or 20.9.0+
- pnpm 9+ or 10+
- MongoDB instance (local or cloud)
- Cloudflare R2 bucket (optional, for media storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ax-billing
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Database
   DATABASE_URI=mongodb://127.0.0.1:27017/ax-billing
   PAYLOAD_SECRET=your-super-secret-key
   
   # Cloudflare R2 (Optional)
   S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   S3_REGION=auto
   S3_BUCKET=ax-billing-media
   S3_ACCESS_KEY_ID=your-access-key
   S3_SECRET_ACCESS_KEY=your-secret-key
   ```

4. **Generate TypeScript types**
   ```bash
   pnpm generate:types
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Frontend (Staff Dashboard): http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

### Docker Setup (Alternative)

1. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Application: http://localhost:3000
   - MongoDB: localhost:27017

## 📁 Project Structure

```
src/
├── app/
│   ├── (frontend)/          # Staff dashboard and customer interfaces
│   └── (payload)/           # PayloadCMS admin panel
├── collections/             # PayloadCMS collections (data models)
│   ├── Users.ts
│   ├── Vehicles.ts
│   ├── Services.ts
│   ├── Orders.ts
│   └── ...
├── components/
│   ├── ui/                  # Reusable gaming-style UI components
│   ├── dashboard/           # Dashboard components
│   └── orders/              # Order management components
├── lib/
│   └── utils.ts             # Utility functions
├── styles/
│   └── gaming-theme.css     # Custom gaming theme styles
└── payload.config.ts        # PayloadCMS configuration
```

## 🎨 Gaming UI Theme

The application features a modern gaming aesthetic with:
- **Dark theme** with gradient backgrounds
- **Neon accents** in blue, purple, and green
- **Smooth animations** and hover effects
- **Glitch effects** and holographic elements
- **Touch-friendly** interface for tablet use
- **Responsive design** for all screen sizes

## 🔧 Configuration

### Adding Services
1. Go to Admin Panel → Services
2. Create service categories first
3. Add services with pricing and steps
4. Configure service options (add-ons)

### Setting Up Customer Tiers
1. Go to Admin Panel → Customer Tiers
2. Create tiers (Standard, VIP, Fleet)
3. Set pricing overrides and benefits
4. Configure default queue priorities

### Managing Orders
- **Staff Dashboard**: Real-time view of all active orders
- **Queue Management**: VIP, Regular, and Remnant priorities
- **Job Tracking**: Step-by-step progress monitoring
- **Payment Status**: Cash and online payment tracking

## 🚀 Deployment

### Production Build
```bash
pnpm build
pnpm start
```

### Environment Variables for Production
Ensure all environment variables are properly set:
- Database connection string
- Cloudflare R2 credentials
- PayloadCMS secret key
- API keys for integrations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team
