'use client'

import React from 'react'
import { ModularStaffDashboard } from './ModularStaffDashboard'

interface ClientDashboardWrapperProps {
  staffId: string
  location: string
}

export function ClientDashboardWrapper({ staffId, location }: ClientDashboardWrapperProps) {
  return <ModularStaffDashboard staffId={staffId} location={location} />
}
