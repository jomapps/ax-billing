'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { CompactCard, CompactCardContent } from '@/components/ui/compact-card'
import { ProgressiveDisclosure, InlineDisclosure } from '@/components/ui/progressive-disclosure'
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
  variant?: 'default' | 'mobile-first' | 'compact' | 'detailed'
  showTrends?: boolean
  enableProgressive?: boolean
}

export function CompactStatsCards({
  stats,
  loading = false,
  variant = 'default',
  showTrends = true,
  enableProgressive = true,
}: CompactStatsCardsProps) {
  const getGridClass = () => {
    switch (variant) {
      case 'mobile-first':
        return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3'
      case 'compact':
        return 'grid-responsive-compact'
      case 'detailed':
        return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4'
      default:
        return 'grid-responsive-stats'
    }
  }

  if (loading) {
    return (
      <div className={getGridClass()}>
        {[...Array(4)].map((_, i) => (
          <CompactCard key={i} variant="default" size="mobile">
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

  const renderStatCard = (stat: StatCard, index: number) => {
    return (
      <motion.div
        key={stat.title}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <CompactCard
          className="hover:scale-[1.02] transition-transform touch-target"
          variant="default"
          size={variant === 'mobile-first' ? 'mobile' : 'default'}
        >
          <CompactCardContent className="p-2 sm:p-3">
            {/* Primary Information */}
            <div className="flex items-start justify-between mb-1">
              <div className={cn('p-1 rounded', stat.bgColor)}>
                <stat.icon className={cn('w-3 h-3 sm:w-4 sm:h-4', stat.color)} />
              </div>

              {/* Trend Display */}
              {stat.trend && showTrends && (
                <div className="flex items-center gap-1">
                  {stat.trend.isPositive ? (
                    <TrendingUp className="w-3 h-3 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  )}
                  <div
                    className={cn(
                      'text-[10px] sm:text-responsive-xs font-medium',
                      stat.trend.isPositive ? 'text-green-400' : 'text-red-400',
                    )}
                  >
                    {stat.trend.isPositive ? '+' : ''}
                    {stat.trend.value}%
                  </div>
                </div>
              )}
            </div>

            {/* Main Value and Title */}
            <div className="space-y-0.5 mb-2">
              <p className="text-responsive-sm sm:text-responsive-base font-bold text-white leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] sm:text-responsive-xs text-gray-400 leading-tight">
                {stat.title}
              </p>
            </div>

            {/* Progressive Disclosure for Additional Details */}
            {enableProgressive && stat.trend && variant !== 'compact' && (
              <InlineDisclosure
                trigger={
                  <div className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Info className="w-3 h-3" />
                    <span>Details</span>
                  </div>
                }
                priority="low"
                className="mt-2"
              >
                <div className="space-y-1 text-[10px] text-gray-400">
                  <div className="flex justify-between">
                    <span>Trend:</span>
                    <span className={stat.trend.isPositive ? 'text-green-400' : 'text-red-400'}>
                      {stat.trend.isPositive ? 'Increasing' : 'Decreasing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change:</span>
                    <span>{stat.trend.value}% vs last period</span>
                  </div>
                </div>
              </InlineDisclosure>
            )}
          </CompactCardContent>
        </CompactCard>
      </motion.div>
    )
  }

  return (
    <div className={getGridClass()}>{stats.map((stat, index) => renderStatCard(stat, index))}</div>
  )
}
