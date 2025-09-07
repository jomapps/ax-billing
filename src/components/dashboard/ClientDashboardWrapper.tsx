'use client'

import React from 'react'
import { EnhancedStaffDashboard } from './EnhancedStaffDashboard'

interface ClientDashboardWrapperProps {
  staffId: string
  location: string
}

export function ClientDashboardWrapper({ staffId, location }: ClientDashboardWrapperProps) {
  return <EnhancedStaffDashboard staffId={staffId} location={location} />
}
