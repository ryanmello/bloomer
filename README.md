<p align="center">
  <img src="public/flower.png" width="100"/>
  <h1>🌸 Bloomer</h1>
  <p><strong>Grow with Bloomer: Customer Relationship Management for Flower Shops</strong></p>
</p>

---

# README TODO:

Screenshots of product ui + descriptions and examples

Testing section

Clear deployment instructions

### Project Description

Bloomer is a comprehensive, all-in-one CRM platform specifically designed for flower shops and florists. It provides powerful tools for customer management, marketing automation, inventory tracking, and business analytics to help flower shops thrive in the modern marketplace.

### What the Application Does
Bloomer allows users to manage customer relationships, track inventory with stock and expiration monitoring, and create targeted marketing campaigns through email broadcasts and automation workflows. It also provides business analytics through a real-time dashboard, supports audience segmentation for personalized outreach, and integrates with Square to synchronize customer and order data. The platform streamlines core business processes such as order tracking, occasion reminders, and promotional campaign management.

### Why This Application Was Created
This application was created to address the lack of affordable, industry-specific CRM solutions for flower shops. Existing CRM platforms are often too generic or costly, failing to account for the unique operational needs of florists, such as managing perishable inventory, tracking customer occasions like birthdays and anniversaries, and handling time-sensitive orders and seasonal demand. Bloomer was developed to fill this gap by providing a tailored, cost-effective solution that helps floral businesses operate more efficiently and grow through data-driven decision-making.

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
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [Square Integration](#-square-integration)
- [Contributing](#-contributing)
- [Team Members](#-team-members)

---
## ERD 
<img width="3353" height="5769" alt="image" src="https://github.com/user-attachments/assets/f0605bc2-6e4d-4d98-b9f0-4557bbc9810b" />

### CRM ERD Diagram
- This Entity-Relationship Diagram represents a CRM and shop-management platform that connects users, customers, products, orders, inventory, discounts, and marketing campaigns into a single integrated system.
- It shows the complete lifecycle of business operations; covering customer management, product tracking, order processing, inventory control, coupon handling, and automated marketing—centered around each shop owned by a user.
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

The testing system in Bloomer ensures reliability across API routes, UI components, and core business logic using a multi-layer testing strategy. It includes unit testing, integration testing, end-to-end system testing, and automated CI/CD validation.

---

### Testing Strategy

**Unit Testing**
- Vitest + Jsdom  
- Tests for individual functions, utilities, and components in isolation


**Integration Testing**
- Supertest
- Tests for how multiple parts work together (API routes, database interactions, frontend/backend communication)

  
**End-to-End (E2E) System Testing**
- Playwright
- Tests for simulating full user workflows in the browser (e.g. customer creation, form submission, dashboard updates)

  
**CI/CD Testing**
- Github Actions
- Automatically runs all tests on every push and pull request 

---

### Test Structure

- `.test.ts` – Unit and integration tests  
- `.test.tsx` – React component tests
- `.e2e.ts` -  End-to-end system tests
- `/tests` – Centralized test directory (optional)  
- Tests can also be colocated next to components for feature-based testing  

---

### Creating Tests

Create a test file next to a feature or inside `/tests`:

```ts
import { describe, it, expect } from "vitest";

describe("Example Test", () => {
  it("should work correctly", () => {
    expect(true).toBe(true);
  });
});
```
### Running Tests

- `npm test` – Run all tests once
- `npm run test path/to/test-file` - Run a specific test
- `npm run test:watch` – Run tests in watch mode (auto re-runs on changes)  
- `npm run test:coverage` – Generate a coverage report
- `npm test:e2e` - Run E2E tests

---

### Watch Mode

Watch mode keeps the test runner active and automatically re-runs tests whenever code changes are detected. This is useful during development for instant feedback without manually restarting tests.

---

### Coverage Report

Coverage reports show how much of the codebase is tested, including:

- Lines of code covered  
- Functions tested  
- Branches covered  
- Statements covered  

This helps identify untested areas and improve overall test quality.

---

### Testing Workflow

- Create or update a feature  
- Add a matching `.test.ts` or `.test.tsx` file  
- Run tests in watch mode during development  
- Run full set of tests before committing changes  
- Check coverage for missing tests  
- Validate full user flows using Playwright End-to-End System tests  
- CI/CD automatically runs tests on every push and pull request  

---

### CI/CD Testing

All tests run automatically using GitHub Actions on:

- Every push  
- Every pull request  

This ensures no broken code is merged into the main branch.

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

---

## 👥 Team Members

### 1. Zyale Brown-Sanger
- **Email:** zyaleparis@gmail.com
- **GitHub:** github.com/Zyale21

### 2. Pavel Bratan
- **Email:** pbratan@csus.edu
- **GitHub:** github.com/Proxtron

### 3. Ryan Mello
- **Email:** ryanmello897@gmail.com
- **GitHub:** github.com/ryanmello

### 4. Brendan Wong
- **Email:** tobrendanw@gmail.com
- **GitHub:** github.com/BrendanMWong

### 5. Arianna Hernandez
- **Email:** ari.hernandez0010@gmail.com
- **GitHub:** github.com/ahernandez41

### 6. Edgar Castaneda
- **Email:** edgar.castaneda1211@gmail.com
- **GitHub:** github.com/edgarcastaneda89

### 7. Chik Pan Wong
- **Email:** chikpanwong@gmail.com
- **GitHub:** github.com/chikpanwong

### 8. Caillou Xiong
- **Email:** caillouxiong@csus.edu
- **GitHub:** github.com/cxiiong

---

**Built with ❤️ for flower shops everywhere**

*Grow your business. Bloom with confidence.*
