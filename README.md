# 🌸 Bloomer

**Grow with Bloomer: Customer Relationship Management for Flower Shops**

Bloomer is a comprehensive, all-in-one CRM platform specifically designed for flower shops and florists. It provides powerful tools for customer management, marketing automation, inventory tracking, and business analytics to help flower shops thrive in the modern marketplace.

---

## 📖 Project Synopsis

Bloomer is a specialized Customer Relationship Management (CRM) solution built specifically for the floral industry. Traditional CRM platforms are either too generic or too expensive for small flower shops, leaving a gap in the market for an affordable, industry-specific solution.

**The Problem:** Flower shops have unique needs including tracking customer occasions (birthdays, anniversaries), managing perishable inventory with expiration dates, coordinating time-sensitive deliveries, and running targeted campaigns for seasonal events (Valentine's Day, Mother's Day, etc.). Most existing CRM tools don't address these specific requirements.

**Our Solution:** Bloomer provides florists with an all-in-one platform featuring customer management, occasion tracking, email marketing automation, inventory management with shelf-life monitoring, order tracking, and seamless Square POS integration. Built with modern web technologies (Next.js, React, TypeScript, MongoDB), Bloomer offers an intuitive interface with light/dark themes and real-time analytics.

**Target Users:** Small to medium-sized flower shops (1-10 employees) looking to modernize their customer management and grow their business through data-driven marketing.

**Project Info:** CSC 190 (Fall 2025) / CSC 191 (Spring 2026)

---

## 📋 Table of Contents

- [Project Synopsis](#-project-synopsis)
- [Features](#-features)
- [Dashboard Overview](#-dashboard-overview)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Developer Instructions](#-developer-instructions)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Project Timeline](#-project-timeline)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Square Integration](#-square-integration)
- [Contributing](#-contributing)

---

## ✨ Features

### 🎯 Core Features

- **Customer Relationship Management** - Comprehensive customer database with order history, spending analytics, and occasion tracking
- **Email Campaigns & Broadcasts** - Create and send targeted email campaigns to customer segments
- **Marketing Automation** - Set up automated workflows for customer communication and follow-ups
- **Audience Segmentation** - Organize customers into groups (VIP, New, Repeat, Potential) for targeted marketing
- **Coupon Management** - Create and manage discount codes with expiration dates
- **Inventory Tracking** - Monitor stock levels with low-stock alerts and out-of-stock notifications
- **Square POS Integration** - Sync customers and orders from Square POS system
- **Analytics Dashboard** - Real-time business metrics and performance tracking
- **Multi-theme Support** - Light and dark mode with seamless theme switching

### 💼 Business Intelligence

- Revenue tracking and trend analysis
- Customer lifetime value analytics
- Order tracking and management
- Inventory status monitoring
- Customer occasion reminders (birthdays, anniversaries)
- Upcoming events calendar (holidays, weddings, memorial services)
- Recent activity feed

---

## 📊 Dashboard Overview

The Bloomer dashboard provides a comprehensive view of your flower shop's business performance and operations.

### Main Dashboard Components

#### 1. **Key Performance Metrics**
The dashboard displays four primary metric cards at the top:
- **Total Revenue** - Current month's revenue with percentage change from previous period
- **Orders** - Total order count with growth rate
- **Customers** - Total customer base with growth tracking
- **Inventory Items** - Current inventory count with stock change indicators

Each metric card features:
- Real-time value display
- Percentage change indicator (positive/negative)
- Icon representation
- Color-coded trends (green for positive, red for negative)

#### 2. **Revenue Trend Graph**
A beautiful, interactive line chart displaying:
- Monthly revenue data over the past year
- Smooth trend lines with gradient fill
- Hover tooltips showing exact values
- Overall growth percentage
- Responsive design with theme support (light/dark)

Built with Chart.js and React Chart.js 2, the graph automatically adjusts colors based on the active theme.

#### 3. **Recent Activity Feed**
Real-time activity stream showing:
- **New Orders** - Order number, items, and time
- **New Customers** - Customer sign-ups and registrations
- **Inventory Alerts** - Low stock warnings and notifications
- **Sales Highlights** - Best-selling products and trends

Each activity item includes:
- Color-coded icons by activity type
- Timestamp (relative time)
- Brief description
- Scrollable list with latest updates at the top

#### 4. **Upcoming Events Calendar**
Track important dates and occasions:
- **Holidays** - Valentine's Day, Mother's Day, Easter, etc.
- **Weddings** - Customer wedding dates with couple names
- **Memorial Services** - Sympathy arrangement bookings
- **Custom Events** - Other important dates

Features:
- Days until event countdown
- Urgency badges (color-coded by proximity)
- Customer names for personalized events
- Sortable by date
- Scrollable list with fixed height

#### 5. **Inventory Status Monitor**
Real-time stock level tracking:
- **In Stock** - Items with adequate inventory (green badge)
- **Low Stock** - Items below threshold (amber badge)
- **Out of Stock** - Items requiring reorder (red badge)

Displays:
- Item name and quantity
- Unit of measurement (stems, bunches, plants)
- Status indicators with icons
- Scrollable list for large inventories

#### 6. **Customer Occasions Table**
Comprehensive tracking of customer special dates:
- **Birthdays** - Customer birthday dates
- **Anniversaries** - Wedding anniversary dates
- **Contact Information** - Email and phone for quick outreach
- **Customer Notes** - Preferences, allergies, past orders

Table features:
- Sortable columns
- Days until occasion countdown
- Urgency color coding (red for imminent, amber for soon)
- Customer preferences and notes
- Scrollable table with responsive design
- Minimum 800px width for optimal viewing

---

## 🛠 Tech Stack

### Frontend
- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **Chart.js** - Data visualization
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **next-themes** - Theme management

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth 5** - Authentication solution
- **Prisma** - Type-safe database ORM
- **MongoDB** - NoSQL database
- **bcrypt** - Password hashing

### Development Tools
- **Turbopack** - Fast bundler (Next.js 15)
- **PostCSS** - CSS processing
- **ESLint** - Code linting
- **Prettier** - Code formatting

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** or **yarn** package manager
- **MongoDB** database (local or cloud-based like MongoDB Atlas)
- **Square Developer Account** (optional, for POS integration)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/bloomer.git
cd bloomer
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory (see [Environment Variables](#-environment-variables) section below)

4. **Generate Prisma Client**
```bash
npx prisma generate
```

5. **Run database migrations** (if using a SQL database)
```bash
npx prisma db push
```

6. **Start the development server**
```bash
npm run dev
```

7. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## 👨‍💻 Developer Instructions

### Setting Up Development Environment

1. **Clone and Install**
```bash
git clone https://github.com/yourusername/bloomer.git
cd bloomer
npm install
```

2. **Configure Environment Variables**

Create a `.env` file:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/bloomer"
AUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
SQUARE_ACCESS_TOKEN="your-square-token"
```

3. **Setup Database**
```bash
npx prisma generate
npx prisma db push
```

4. **Run Development Server**
```bash
npm run dev
```

### Development Workflow

- Create feature branches: `git checkout -b feature/feature-name`
- Follow TypeScript and ESLint rules
- Test changes before committing
- Submit pull requests for review

### Useful Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npx prisma studio    # Open database GUI
npx prisma generate  # Regenerate Prisma client
```

---

## 🧪 Testing

> **Note:** Testing will be implemented in CSC 191 (Spring 2026)

### Planned Testing Approach

- **Unit Tests:** Jest + React Testing Library for component testing
- **Integration Tests:** API route testing with Supertest
- **E2E Tests:** Playwright for end-to-end user flows
- **Coverage Goal:** 80%+ code coverage

### Running Tests (CSC 191)

```bash
npm test              # Run all tests
npm test:coverage     # Run with coverage report
npm test:e2e          # Run E2E tests
```

---

## 🚀 Deployment

> **Note:** Deployment will be configured in CSC 191 (Spring 2026)

### Planned Deployment Strategy

- **Platform:** Vercel (Next.js hosting)
- **Database:** MongoDB Atlas (production cluster)
- **Domain:** Custom domain with SSL
- **CI/CD:** GitHub Actions for automated deployments

### Deployment Checklist (CSC 191)

- [ ] Set up production MongoDB cluster
- [ ] Configure environment variables in Vercel
- [ ] Set up custom domain
- [ ] Configure monitoring and error tracking
- [ ] Test Square integration in production
- [ ] Set up automated backups

---

## 📅 Project Timeline

### CSC 191 Spring 2026 - Key Milestones

| Sprint | Weeks | Features | Story Points |
|--------|-------|----------|--------------|
| **Sprint 1** | 1-3 | Email Campaign Enhancement: Template builder, scheduling, automated sends | 13 pts |
| **Sprint 2** | 4-6 | Advanced Customer Segmentation: Custom audience builder, dynamic filters | 13 pts |
| **Sprint 3** | 7-9 | Order Management: Complete order workflow, status tracking, delivery scheduling | 21 pts |
| **Sprint 4** | 10-11 | Inventory System: Product management, stock tracking, low-stock alerts, shelf-life monitoring | 13 pts |
| **Sprint 5** | 12-13 | Marketing Automation: Workflow engine, occasion reminders, automated follow-ups | 13 pts |
| **Sprint 6** | 14 | Testing & QA: Unit tests, integration tests, E2E tests, bug fixes | 8 pts |
| **Sprint 7** | 15 | Deployment: Production setup, monitoring, documentation | 5 pts |
| **Beta Release** | 16 | Final presentation and user acceptance testing | - |

**Total Story Points:** 86

### Key Feature Breakdown

**Sprint 1 - Campaign Enhancement (Weeks 1-3)**
- JIRA-45: Email template builder with drag-and-drop interface
- JIRA-46: Campaign scheduling with timezone support
- JIRA-47: Automated email sending with retry logic

**Sprint 2 - Segmentation (Weeks 4-6)**
- JIRA-50: Visual custom audience builder
- JIRA-51: Dynamic customer filters (spend, orders, occasions)
- JIRA-52: Smart groups with auto-update

**Sprint 3 - Orders (Weeks 7-9)**
- JIRA-60: Order creation workflow
- JIRA-61: Order status tracking system
- JIRA-62: Delivery scheduling with calendar

**Sprint 4 - Inventory (Weeks 10-11)**
- JIRA-70: Product management interface
- JIRA-71: Inventory movement tracking
- JIRA-72: Low-stock and expiration alerts

**Sprint 5 - Automation (Weeks 12-13)**
- JIRA-80: Automation workflow builder
- JIRA-81: Occasion-based reminder system
- JIRA-82: Automated email sequences

**Sprint 6 - Testing (Week 14)**
- JIRA-90: Unit and integration test suite
- JIRA-91: E2E testing with Playwright

**Sprint 7 - Deployment (Week 15)**
- JIRA-95: Production environment setup
- JIRA-96: Monitoring and analytics

---

## 📁 Project Structure

```
bloomer/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/             # Sign in page
│   │   └── sign-up/             # Sign up page
│   ├── (dashboard)/             # Protected dashboard routes
│   │   ├── audiences/           # Customer segmentation
│   │   ├── automations/         # Marketing automation
│   │   ├── broadcasts/          # Email campaigns
│   │   ├── contact/             # Contact management
│   │   ├── coupons/             # Coupon management
│   │   ├── customers/           # Customer database
│   │   ├── dashboard/           # Main dashboard
│   │   ├── deliveries/          # Delivery management
│   │   ├── forms/               # Forms management
│   │   ├── inbox/               # Message inbox
│   │   ├── orders/              # Order management
│   │   ├── settings/            # Shop settings
│   │   ├── storefront/          # Storefront configuration
│   │   └── layout.tsx           # Dashboard layout
│   ├── (site)/                  # Public marketing pages
│   │   └── page.tsx             # Landing page
│   ├── api/                     # API routes
│   │   ├── auth/                # Authentication endpoints
│   │   ├── campaigns/           # Campaign management
│   │   ├── customer/            # Customer CRUD operations
│   │   ├── integrations/        # Third-party integrations
│   │   ├── shop/                # Shop management
│   │   ├── square/              # Square POS sync
│   │   └── user/                # User management
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
├── components/                   # React components
│   ├── audiences/               # Audience components
│   ├── automations/             # Automation components
│   ├── broadcasts/              # Campaign components
│   ├── coupons/                 # Coupon components
│   ├── customers/               # Customer components
│   ├── dashboard/               # Dashboard components
│   │   ├── CustomerOccasions.tsx
│   │   ├── DashboardHeader.tsx
│   │   ├── InventoryStatus.tsx
│   │   ├── MetricCard.tsx
│   │   ├── RecentActivity.tsx
│   │   ├── TrendGraph.tsx
│   │   └── UpcomingEvents.tsx
│   ├── deliveries/              # Delivery components
│   ├── header/                  # Header component
│   ├── sidebar/                 # Sidebar navigation
│   ├── ui/                      # Reusable UI components
│   └── ThemeToggle.tsx          # Theme switcher
├── context/                      # React contexts
│   ├── AuthContext.tsx          # Authentication state
│   └── ThemeProvider.tsx        # Theme management
├── lib/                         # Utility libraries
│   ├── auth-utils.ts            # Auth helpers
│   ├── prisma.ts                # Prisma client
│   └── utils.ts                 # General utilities
├── prisma/                      # Database schema
│   └── schema.prisma            # Prisma schema
├── public/                      # Static assets
├── utils/                       # Utility functions
│   └── password.ts              # Password hashing
├── auth.ts                      # NextAuth configuration
├── middleware.ts                # Next.js middleware
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
└── tailwind.config.ts           # Tailwind configuration
```

---

## 🗄 Database Schema

![Entity Relationship Diagram](./public/erd-diagram.png)

Bloomer uses Prisma with MongoDB. Here's an overview of the main models:

### User
- Stores user authentication and profile information
- One-to-many with Shops, Coupons, and Campaigns

### Shop
- Represents a flower shop business
- Contains business details (name, phone, email, address)
- One-to-many with Customers and Campaigns

### Customer
- Complete customer profile with contact information
- Tracks order history, spend amount, and occasions
- Can be synced with Square POS via `squareId`
- Supports multiple addresses
- Customer groups: VIP, Repeat, New, Potential

### Campaign
- Email marketing campaigns
- Statuses: Draft, Scheduled, Sent, Failed
- Audience types: All, VIP, New, Potential, Newsletter, Custom
- Tracks scheduling and delivery times

### CampaignRecipient
- Junction table for Campaign-Customer relationship
- Tracks individual email delivery status
- Records opens and clicks
- Statuses: Pending, Sent, Failed, Opened, Clicked

### Coupon
- Discount codes for customers
- Percentage-based discounts
- Expiration date support
- Unique code names

### Address
- Customer addresses for deliveries
- Supports multiple addresses per customer
- Full address details (line1, line2, city, state, zip, country)

## 🔄 Square Integration

Bloomer integrates with Square POS to sync customer and order data.

### Features
- **Customer Import** - Sync customers from Square
- **Order Sync** - Import order history
- **Automatic Updates** - Keep data synchronized
- **Configuration UI** - Easy setup through dashboard

### Setup Instructions

1. Create a Square Developer account at [developer.squareup.com](https://developer.squareup.com)
2. Create a new application
3. Get your Access Token and Application ID
4. Add credentials to `.env` file
5. Configure Square integration in Settings page
6. Click "Import Customers" in Customers page

### API Integration

```typescript
// Import customers from Square
await fetch("/api/customer/import", { method: "POST" });

// Sync Square data
await fetch("/api/square/sync", { method: "POST" });
```

---

## 📱 Responsive Design

Bloomer is fully responsive and optimized for:
- 📱 Mobile phones (320px+)
- 📱 Tablets (768px+)
- 💻 Laptops (1024px+)
- 🖥 Desktop (1280px+)
- 🖥 Large screens (1536px+)

---

## 🎨 Theming

Bloomer supports light and dark themes with:
- Automatic theme detection
- Persistent theme selection
- Smooth theme transitions
- Theme-aware components and charts

Toggle theme using the theme switcher in the header.

---

## 🧪 Development

### Running the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000` with hot-reload enabled.

### Building for Production

```bash
npm run build
npm start
```

### Database Management

```bash
# Generate Prisma Client
npm run postinstall

# Open Prisma Studio (Database GUI)
npx prisma studio

# Push schema changes to database
npx prisma db push

# Pull schema from database
npx prisma db pull
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for code formatting
- Write meaningful commit messages
- Add comments for complex logic

---

- [Next.js](https://nextjs.org/) - The React Framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS Framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Radix UI](https://www.radix-ui.com/) - UI Components
- [Chart.js](https://www.chartjs.org/) - Data Visualization
- [Lucide](https://lucide.dev/) - Icon Library
- [Square](https://squareup.com/) - POS Integration

**Built with ❤️ for flower shops everywhere**

*Grow your business. Bloom with confidence.*
