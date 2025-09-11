'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { CompactCard, CompactCardContent } from '@/components/ui/compact-card'
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

interface CompactStatsCardsProps {
  stats: StatCard[]
  loading?: boolean
}

export function CompactStatsCards({ stats, loading = false }: CompactStatsCardsProps) {
  if (loading) {
    return (
      <div className="grid-responsive-stats">
        {[...Array(4)].map((_, i) => (
          <CompactCard key={i}>
            <CompactCardContent className="p-2 sm:p-3">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-1">
                  <div className="w-5 h-5 bg-gray-700 rounded"></div>
                  <div className="w-8 h-2 bg-gray-700 rounded"></div>
                </div>
                <div className="w-12 h-4 bg-gray-700 rounded mb-1"></div>
                <div className="w-16 h-2 bg-gray-700 rounded"></div>
              </div>
            </CompactCardContent>
          </CompactCard>
        ))}
      </div>
    )
  }

  return (
    <div className="grid-responsive-stats">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <CompactCard className="hover:scale-[1.02] transition-transform">
            <CompactCardContent className="p-2 sm:p-3">
              <div className="flex items-start justify-between mb-1">
                <div className={cn('p-1 rounded', stat.bgColor)}>
                  <stat.icon className={cn('w-3 h-3 sm:w-4 sm:h-4', stat.color)} />
                </div>
                {stat.trend && (
                  <div
                    className={cn(
                      'text-[10px] sm:text-responsive-xs font-medium',
                      stat.trend.isPositive ? 'text-green-400' : 'text-red-400',
                    )}
                  >
                    {stat.trend.isPositive ? '+' : ''}
                    {stat.trend.value}%
                  </div>
                )}
              </div>

              <div className="space-y-0.5">
                <p className="text-responsive-sm sm:text-responsive-base font-bold text-white leading-none">
                  {stat.value}
                </p>
                <p className="text-[10px] sm:text-responsive-xs text-gray-400 leading-tight">
                  {stat.title}
                </p>
              </div>
            </CompactCardContent>
          </CompactCard>
        </motion.div>
      ))}
    </div>
  )
}
