'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QuickActionsProps {
  onNewOrder: () => void
  onViewInitiated: () => void
  onOpenWhatsApp?: () => void
}

export function QuickActions({ 
  onNewOrder, 
  onViewInitiated, 
  onOpenWhatsApp 
}: QuickActionsProps) {
  const actions = [
    {
      title: 'New Order',
      description: 'Create a new car wash order',
      icon: Plus,
      onClick: onNewOrder,
      className: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'View Initiated',
      description: 'Check initiated orders queue',
      icon: Clock,
      onClick: onViewInitiated,
      className: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'WhatsApp Hub',
      description: 'Open WhatsApp integration',
      icon: MessageSquare,
      onClick: onOpenWhatsApp || (() => window.open('/whatsapp-demo', '_blank')),
      className: 'bg-purple-500 hover:bg-purple-600',
    },
  ]

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-400" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={action.onClick}
                className={`w-full h-20 ${action.className} text-white`}
                size="lg"
              >
                <div className="flex flex-col items-center gap-2">
                  <action.icon className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-semibold">{action.title}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
