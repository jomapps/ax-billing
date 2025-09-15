'use client'

import React from 'react'
import { useSyncManager, useConnectionHealth } from '@/lib/sync'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'

interface SyncStatusProps {
  showDetails?: boolean
  compact?: boolean
  className?: string
}

/**
 * Reusable connection status component that shows sync health
 * and provides user controls for connection management
 */
export function SyncStatus({
  showDetails = false,
  compact = false,
  className = '',
}: SyncStatusProps) {
  const health = useConnectionHealth()
  const { reconnect, clearEventHistory } = useSyncManager()

  const getStatusIcon = () => {
    switch (health.status) {
      case 'healthy':
        return <Wifi className="w-4 h-4 text-green-400" />
      case 'connecting':
        return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
      case 'polling':
        return <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (health.status) {
      case 'healthy':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'connecting':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'polling':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusText = () => {
    switch (health.status) {
      case 'healthy':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'polling':
        return 'Polling Mode'
      case 'error':
        return 'Error'
      default:
        return 'Disconnected'
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Badge className={getStatusColor()}>
          {getStatusIcon()}
          <span className="ml-1">{getStatusText()}</span>
        </Badge>

        {health.status === 'error' && (
          <Button
            onClick={reconnect}
            size="sm"
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-6 px-2"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Badge className={getStatusColor()}>
        {getStatusIcon()}
        <span className="ml-1">{getStatusText()}</span>
      </Badge>

      {health.status === 'error' && (
        <Button
          onClick={reconnect}
          size="sm"
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}

      {health.status === 'polling' && (
        <Button
          onClick={reconnect}
          size="sm"
          variant="outline"
          className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
        >
          <Wifi className="w-3 h-3 mr-1" />
          Try SSE
        </Button>
      )}

      {health.isConnected && (
        <span className="text-xs text-gray-400">{health.totalEvents} events</span>
      )}

      {showDetails && health.isConnected && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {health.lastConnectedAt && (
            <span>Connected: {new Date(health.lastConnectedAt).toLocaleTimeString()}</span>
          )}
          {health.totalReconnects > 0 && <span>Reconnects: {health.totalReconnects}</span>}
          <Button
            onClick={clearEventHistory}
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-400"
          >
            Clear History
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * Detailed sync status component with expanded metrics
 */
export function DetailedSyncStatus({ className = '' }: { className?: string }) {
  const health = useConnectionHealth()
  const { reconnect, clearEventHistory } = useSyncManager()

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Sync Status</h3>
        <SyncStatus compact />
      </div>

      {health.isConnected && (
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400">Total Events:</span>
            <span className="ml-2 text-white">{health.totalEvents}</span>
          </div>
          <div>
            <span className="text-gray-400">Uptime:</span>
            <span className="ml-2 text-white">{Math.floor(health.uptime / 1000 / 60)}m</span>
          </div>
          <div>
            <span className="text-gray-400">Reconnects:</span>
            <span className="ml-2 text-white">{health.totalReconnects}</span>
          </div>
          <div>
            <span className="text-gray-400">Last Connected:</span>
            <span className="ml-2 text-white">
              {health.lastConnectedAt
                ? new Date(health.lastConnectedAt).toLocaleTimeString()
                : 'Never'}
            </span>
          </div>
        </div>
      )}

      {health.error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-xs text-red-400">
          {health.error}
        </div>
      )}

      {health.eventCounts && Object.keys(health.eventCounts).length > 0 && (
        <div className="space-y-1">
          <span className="text-xs text-gray-400">Event Types:</span>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {Object.entries(health.eventCounts).map(([type, count]) => (
              <div key={type} className="flex justify-between">
                <span className="text-gray-400">{type}:</span>
                <span className="text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {health.status === 'error' && (
          <Button
            onClick={reconnect}
            size="sm"
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 flex-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reconnect
          </Button>
        )}
        <Button
          onClick={clearEventHistory}
          size="sm"
          variant="ghost"
          className="text-gray-500 hover:text-gray-400 flex-1"
        >
          Clear History
        </Button>
      </div>
    </div>
  )
}

export default SyncStatus
