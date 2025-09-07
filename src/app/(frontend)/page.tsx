import React from 'react'
import { ClientDashboardWrapper } from '@/components/dashboard/ClientDashboardWrapper'

// Server-side page component
export default function HomePage() {
  // This could fetch initial data from the server if needed
  const staffId = 'staff-001'
  const location = 'Main Branch'

  return <ClientDashboardWrapper staffId={staffId} location={location} />
}
