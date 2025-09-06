# Seed Data for AX Billing System

This folder contains organized seed data for testing and development of the AX Billing car wash management system.

## Structure

- `service-categories.json` - Service categories (Exterior Wash, Interior Detailing, etc.)
- `service-options.json` - Add-on options (Wax Coating, Tire Shine, etc.)
- `customer-tiers.json` - Customer tiers with pricing overrides (Standard, VIP, Corporate, etc.)
- `services.json` - Available services with steps and pricing
- `users.json` - Sample users (admin, staff, customers)
- `vehicles.json` - Sample vehicles owned by customers
- `orders.json` - Sample orders in various states
- `enhanced-seed.ts` - Enhanced seeding script that uses these JSON files

## Usage

### Available Scripts:

```bash
# Original seed script (basic data)
pnpm run seed

# Enhanced seed script (uses JSON files)
pnpm run seed:enhanced

# Clear all data from database
pnpm run seed:clear

# Clear database and run enhanced seed (fresh start)
pnpm run seed:fresh
```

## Sample Data Overview

### Users
- **Admin**: admin@axbilling.com (password: admin123456)
- **Staff**: staff@axbilling.com (password: staff123)
- **Customers**: 6 sample customers with different tiers

### Customer Tiers
- **Standard**: Regular pricing
- **VIP Member**: 10-20% discounts, priority queue
- **Corporate**: Bulk pricing for business customers
- **Loyalty Plus**: Long-term customer benefits

### Services
- **Basic Wash**: $25, 30 minutes
- **Premium Wash**: $45, 60 minutes  
- **Express Wash**: $15, 15 minutes
- **Deluxe Detailing**: $85, 120 minutes
- **Interior Only**: $35, 45 minutes

### Service Options
- Wax Coating (+$15)
- Tire Shine (+$8)
- Interior Fragrance (+$5)
- Leather Conditioning (+$20)
- Engine Bay Cleaning (+$25)
- Ceramic Coating (+$50)
- Headlight Restoration (+$30)
- Undercarriage Wash (+$12)

### Sample Orders
- Order in progress (Basic Wash)
- VIP order pending (Premium Wash)
- Corporate order pending payment (Deluxe Detailing)

## Testing Scenarios

This seed data supports testing:
- Different customer tiers and pricing
- Various service combinations
- Order status workflows
- Queue management (regular vs VIP)
- Payment status tracking
- Multi-step service processes

## Customization

You can modify the JSON files to:
- Add more services or options
- Create different customer scenarios
- Test specific pricing models
- Simulate various order states
