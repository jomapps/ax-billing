'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCard {
  title: string
  value: string | number
  icon: LucideIcon
  color: string
  bgColor: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

interface StatsCardsProps {
  stats: StatCard[]
  loading?: boolean
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-8 h-8 bg-gray-700 rounded"></div>
                  <div className="w-16 h-4 bg-gray-700 rounded"></div>
                </div>
                <div className="w-20 h-8 bg-gray-700 rounded mb-2"></div>
                <div className="w-24 h-4 bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('w-6 h-6', stat.color)} />
                </div>
                {stat.trend && (
                  <div className={cn(
                    'text-sm font-medium',
                    stat.trend.isPositive ? 'text-green-400' : 'text-red-400'
                  )}>
                    {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                  </div>
                )}
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
