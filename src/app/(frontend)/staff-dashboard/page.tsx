import React from 'react'
import { EnhancedStaffDashboard } from '@/components/dashboard/EnhancedStaffDashboard'

export default function StaffDashboardPage() {
  return (
    <div className="min-h-screen">
      <EnhancedStaffDashboard 
        staffId="staff-001"
        location="Main Branch"
      />
    </div>
  )
}
