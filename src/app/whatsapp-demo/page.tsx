import { WhatsAppStaffDashboard } from '@/components/whatsapp/WhatsAppStaffDashboard'

export default function WhatsAppDemoPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp Integration Demo
          </h1>
          <p className="text-gray-600">
            Complete WhatsApp integration for AX Billing car wash management system
          </p>
        </div>

        <WhatsAppStaffDashboard 
          staffId="demo-staff-001"
          location="Main Branch"
        />
      </div>
    </div>
  )
}
