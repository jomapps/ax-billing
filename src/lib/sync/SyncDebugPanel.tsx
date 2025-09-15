'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSyncManager } from './useSyncManager'
import { syncLogger, LogLevel, LogCategory } from './debug'
import { ConnectionState } from './types'

interface SyncDebugPanelProps {
  debug?: boolean
  className?: string
}

export function SyncDebugPanel({ debug = false, className = '' }: SyncDebugPanelProps) {
  const {
    connectionState,
    events,
    error,
    metrics,
    configuration,
    nextSseRetryAt,
    isConnected,
    isConnecting,
    isPollingFallback,
  } = useSyncManager()

  const [logs, setLogs] = useState(syncLogger.getLogs())
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'ALL'>('ALL')
  const [selectedLevel, setSelectedLevel] = useState<LogLevel>(LogLevel.DEBUG)
  const [autoScroll, setAutoScroll] = useState(true)

  // Update logs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(syncLogger.getLogs())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Filter logs based on selection
  const filteredLogs = useMemo(() => {
    let filtered = logs

    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(log => log.category === selectedCategory)
    }

    filtered = filtered.filter(log => log.level <= selectedLevel)

    return filtered.slice(-100) // Show only last 100 logs
  }, [logs, selectedCategory, selectedLevel])

  // Don't render in production unless debug is explicitly enabled
  if (!debug && process.env.NODE_ENV === 'production') {
    return null
  }

  const getConnectionStateColor = (state: ConnectionState) => {
    switch (state) {
      case ConnectionState.CONNECTED:
        return 'text-green-600'
      case ConnectionState.CONNECTING:
      case ConnectionState.RECONNECTING:
        return 'text-yellow-600'
      case ConnectionState.POLLING_FALLBACK:
        return 'text-blue-600'
      case ConnectionState.ERROR:
        return 'text-red-600'
      case ConnectionState.DISCONNECTED:
      default:
        return 'text-gray-600'
    }
  }

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return 'text-red-600'
      case LogLevel.WARN:
        return 'text-yellow-600'
      case LogLevel.INFO:
        return 'text-blue-600'
      case LogLevel.DEBUG:
      default:
        return 'text-gray-600'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sync Debug Panel</h3>
        
        {/* Connection Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Connection State</div>
            <div className={`font-semibold ${getConnectionStateColor(connectionState)}`}>
              {connectionState.toUpperCase()}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Events</div>
            <div className="font-semibold text-gray-900">{events.length}</div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Uptime</div>
            <div className="font-semibold text-gray-900">
              {formatUptime(metrics.uptime)}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Reconnects</div>
            <div className="font-semibold text-gray-900">{metrics.totalReconnects}</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Polling Sessions</div>
            <div className="font-semibold text-gray-900">{metrics.pollingSessions || 0}</div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Next SSE Retry</div>
            <div className="font-semibold text-gray-900">
              {nextSseRetryAt ? formatTimestamp(nextSseRetryAt) : 'N/A'}
            </div>
          </div>
          
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Polling Interval</div>
            <div className="font-semibold text-gray-900">
              {configuration.pollingInterval ? `${configuration.pollingInterval}ms` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
            <div className="text-sm text-red-600 font-medium">Error</div>
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex gap-4 mb-4">
          <div className={`px-2 py-1 rounded text-xs ${isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {isConnected ? '🟢 Connected' : '⚫ Disconnected'}
          </div>
          {isConnecting && (
            <div className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
              🟡 Connecting
            </div>
          )}
          {isPollingFallback && (
            <div className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
              🔄 Polling Fallback
            </div>
          )}
        </div>
      </div>

      {/* Log Controls */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as LogCategory | 'ALL')}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="ALL">All Categories</option>
          {Object.values(LogCategory).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(Number(e.target.value) as LogLevel)}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value={LogLevel.ERROR}>Error</option>
          <option value={LogLevel.WARN}>Warning</option>
          <option value={LogLevel.INFO}>Info</option>
          <option value={LogLevel.DEBUG}>Debug</option>
        </select>

        <button
          onClick={() => syncLogger.clearLogs()}
          className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
        >
          Clear Logs
        </button>

        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            className="mr-1"
          />
          Auto-scroll
        </label>
      </div>

      {/* Live Event List */}
      <div className="bg-white border border-gray-200 rounded">
        <div className="p-2 border-b border-gray-200 bg-gray-50">
          <h4 className="font-medium text-gray-900">Live Events ({filteredLogs.length})</h4>
        </div>
        <div 
          className="h-64 overflow-y-auto p-2 text-xs font-mono"
          ref={(el) => {
            if (el && autoScroll) {
              el.scrollTop = el.scrollHeight
            }
          }}
        >
          {filteredLogs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No logs to display</div>
          ) : (
            filteredLogs.map((log, index) => (
              <div key={index} className="mb-1 flex gap-2">
                <span className="text-gray-400 shrink-0">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className={`shrink-0 ${getLogLevelColor(log.level)}`}>
                  [{LogLevel[log.level]}]
                </span>
                <span className="text-purple-600 shrink-0">
                  [{log.category}]
                </span>
                <span className="text-gray-900">{log.message}</span>
                {log.data && (
                  <span className="text-gray-500">
                    {JSON.stringify(log.data)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
