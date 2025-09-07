# Dashboard Components

This directory contains the modular dashboard components for the AX Billing car wash management system.

## Structure

### Main Components
- `ModularStaffDashboard.tsx` - Main dashboard component with workflow navigation
- `EnhancedStaffDashboard.tsx` - Legacy monolithic dashboard (kept for reference)
- `DashboardDataProvider.tsx` - Data provider with real-time updates
- `ClientDashboardWrapper.tsx` - Client-side wrapper component

### Overview Components (`/overview/`)
- `OverviewDashboard.tsx` - Main overview component that combines all overview elements
- `StatsCards.tsx` - Reusable stats cards with loading states and trends
- `QuickActions.tsx` - Quick action buttons for common tasks
- `OrderQueueCards.tsx` - Order queue display with responsive grid layout

## Features

### Real-time Data
- Automatic data refresh every 30 seconds
- Manual refresh capability
- Loading states and error handling
- Optimistic updates

### Modular Design
- Reusable components
- Clear separation of concerns
- Easy to test and maintain
- Responsive design

### Dynamic Stats
- Today's orders count
- Active jobs tracking
- Real-time revenue calculation
- Actual average completion time (calculated from completed orders)

## Usage

```tsx
import { ModularStaffDashboard } from '@/components/dashboard/ModularStaffDashboard'

export default function DashboardPage() {
  return (
    <ModularStaffDashboard 
      staffId="staff-001"
      location="Main Branch"
    />
  )
}
```

## Data Flow

1. `DashboardDataProvider` fetches data from PayloadCMS
2. Data is shared via React Context to all child components
3. Components automatically re-render when data updates
4. Manual refresh triggers new data fetch

## Components Breakdown

### StatsCards
- Displays key metrics with icons and trends
- Supports loading skeleton states
- Responsive grid layout

### QuickActions
- Common workflow actions
- Animated hover effects
- Configurable action handlers

### OrderQueueCards
- Displays orders in different states
- Responsive card grid
- Click-to-navigate functionality
- Status-based styling

## Migration from Legacy

The new modular system replaces the monolithic `EnhancedStaffDashboard` with:
- Better performance through component splitting
- Easier maintenance and testing
- Improved code reusability
- Better TypeScript support
