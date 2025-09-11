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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-3 sm:p-4">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-6 h-6 bg-gray-700 rounded"></div>
                  <div className="w-12 h-3 bg-gray-700 rounded"></div>
                </div>
                <div className="w-16 h-6 bg-gray-700 rounded mb-1"></div>
                <div className="w-20 h-3 bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn('p-1.5 rounded-lg', stat.bgColor)}>
                  <stat.icon className={cn('w-4 h-4 sm:w-5 sm:h-5', stat.color)} />
                </div>
                {stat.trend && (
                  <div
                    className={cn(
                      'text-responsive-xs font-medium',
                      stat.trend.isPositive ? 'text-green-400' : 'text-red-400',
                    )}
                  >
                    {stat.trend.isPositive ? '+' : ''}
                    {stat.trend.value}%
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <p className="text-responsive-lg font-bold text-white leading-tight">
                  {stat.value}
                </p>
                <p className="text-responsive-xs text-gray-400 leading-tight">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
