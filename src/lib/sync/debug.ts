/**
 * Debug utilities for the sync system
 * Provides leveled logging with categories for better debugging
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export enum LogCategory {
  CONNECTION = 'Connection',
  EVENTS = 'Events',
  POLLING = 'Polling',
  STORAGE = 'Storage',
  GENERAL = 'General',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  data?: any
}

class SyncLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private currentLevel: LogLevel = LogLevel.INFO

  constructor() {
    // Set log level based on environment
    if (typeof window !== 'undefined') {
      const debugMode = localStorage.getItem('ax-billing-debug-mode')
      if (debugMode === 'true' || process.env.NODE_ENV === 'development') {
        this.currentLevel = LogLevel.DEBUG
      }
    }
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level
  }

  getLevel(): LogLevel {
    return this.currentLevel
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: any) {
    if (level > this.currentLevel) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    }

    this.logs.push(entry)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output with styling
    const levelName = LogLevel[level]
    const prefix = `[${levelName}] [${category}]`
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message, data || '')
        break
      case LogLevel.WARN:
        console.warn(prefix, message, data || '')
        break
      case LogLevel.INFO:
        console.info(prefix, message, data || '')
        break
      case LogLevel.DEBUG:
        console.debug(prefix, message, data || '')
        break
    }
  }

  error(category: LogCategory, message: string, data?: any) {
    this.log(LogLevel.ERROR, category, message, data)
  }

  warn(category: LogCategory, message: string, data?: any) {
    this.log(LogLevel.WARN, category, message, data)
  }

  info(category: LogCategory, message: string, data?: any) {
    this.log(LogLevel.INFO, category, message, data)
  }

  debug(category: LogCategory, message: string, data?: any) {
    this.log(LogLevel.DEBUG, category, message, data)
  }

  getLogs(category?: LogCategory, level?: LogLevel): LogEntry[] {
    let filteredLogs = this.logs

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level <= level)
    }

    return filteredLogs
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

// Singleton instance
export const syncLogger = new SyncLogger()

// Convenience functions for common logging patterns
export const logConnection = {
  connecting: (url: string) => 
    syncLogger.info(LogCategory.CONNECTION, `Connecting to ${url}`),
  connected: (clientId?: string) => 
    syncLogger.info(LogCategory.CONNECTION, `Connected successfully`, { clientId }),
  disconnected: (reason?: string) => 
    syncLogger.info(LogCategory.CONNECTION, `Disconnected`, { reason }),
  error: (error: any) => 
    syncLogger.error(LogCategory.CONNECTION, `Connection error`, error),
  reconnecting: (attempt: number, maxAttempts: number) => 
    syncLogger.info(LogCategory.CONNECTION, `Reconnecting (${attempt}/${maxAttempts})`),
  pollingFallback: () => 
    syncLogger.warn(LogCategory.CONNECTION, `Switched to polling fallback`),
}

export const logEvents = {
  received: (eventType: string, orderID?: string) => 
    syncLogger.debug(LogCategory.EVENTS, `Event received: ${eventType}`, { orderID }),
  processed: (eventId: string, eventType: string) => 
    syncLogger.debug(LogCategory.EVENTS, `Event processed: ${eventType}`, { eventId }),
  filtered: (eventType: string, reason: string) => 
    syncLogger.debug(LogCategory.EVENTS, `Event filtered: ${eventType}`, { reason }),
  acknowledged: (eventId: string) => 
    syncLogger.debug(LogCategory.EVENTS, `Event acknowledged`, { eventId }),
}

export const logPolling = {
  started: (intervalMs: number) => 
    syncLogger.info(LogCategory.POLLING, `Polling started`, { intervalMs }),
  stopped: () => 
    syncLogger.info(LogCategory.POLLING, `Polling stopped`),
  success: (callbackId: string) => 
    syncLogger.debug(LogCategory.POLLING, `Polling callback success`, { callbackId }),
  error: (callbackId: string, error: any) => 
    syncLogger.error(LogCategory.POLLING, `Polling callback error`, { callbackId, error }),
  circuitOpen: (callbackId: string) => 
    syncLogger.warn(LogCategory.POLLING, `Circuit breaker opened`, { callbackId }),
}

export const logStorage = {
  saved: (key: string, size: number) => 
    syncLogger.debug(LogCategory.STORAGE, `Data saved to localStorage`, { key, size }),
  loaded: (key: string, size: number) => 
    syncLogger.debug(LogCategory.STORAGE, `Data loaded from localStorage`, { key, size }),
  cleared: (key: string) => 
    syncLogger.debug(LogCategory.STORAGE, `localStorage cleared`, { key }),
  error: (key: string, error: any) => 
    syncLogger.error(LogCategory.STORAGE, `localStorage error`, { key, error }),
}
