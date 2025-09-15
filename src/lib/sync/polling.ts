/*
 * Lightweight polling utilities for SyncManager fallback
 */

export type BackoffOptions = {
  baseDelayMs: number
  factor: number
  maxDelayMs: number
}

export type CircuitBreakerOptions = {
  failureThreshold: number
  cooldownMs: number
}

export type PollerOptions = {
  jitter?: number
  backoff?: BackoffOptions
  circuitBreaker?: CircuitBreakerOptions
  onSuccess?: () => void
  onFailure?: (error: any) => void
}

export type Poller = {
  start: () => void
  stop: () => void
  isRunning: () => boolean
  getConsecutiveFailures: () => number
  isCircuitOpen: () => boolean
}

export function createPoller(
  fn: () => void | Promise<void>,
  intervalMs: number,
  options: PollerOptions = {},
): Poller {
  let timer: ReturnType<typeof setTimeout> | null = null
  let running = false
  let consecutiveFailures = 0
  let circuitOpenUntil = 0

  const { jitter, backoff, circuitBreaker, onSuccess, onFailure } = options

  const isCircuitOpen = () => {
    if (!circuitBreaker) return false
    return Date.now() < circuitOpenUntil
  }

  const openCircuit = () => {
    if (!circuitBreaker) return
    circuitOpenUntil = Date.now() + circuitBreaker.cooldownMs
  }

  const getCurrentDelay = () => {
    let delay = intervalMs

    // Apply exponential backoff if configured
    if (backoff && consecutiveFailures > 0) {
      const backoffDelay = Math.min(
        backoff.baseDelayMs * Math.pow(backoff.factor, consecutiveFailures - 1),
        backoff.maxDelayMs,
      )
      delay = Math.max(delay, backoffDelay)
    }

    // Apply jitter
    if (jitter) {
      const jitterAmount = Math.random() * jitter
      delay += Math.random() < 0.5 ? -jitterAmount : jitterAmount
    }

    return Math.max(0, delay)
  }

  const schedule = () => {
    timer = setTimeout(async () => {
      // Check circuit breaker
      if (isCircuitOpen()) {
        if (running) schedule()
        return
      }

      try {
        await fn()
        consecutiveFailures = 0
        onSuccess?.()
      } catch (error) {
        consecutiveFailures++
        onFailure?.(error)

        // Open circuit if threshold reached
        if (circuitBreaker && consecutiveFailures >= circuitBreaker.failureThreshold) {
          openCircuit()
        }
      } finally {
        if (running) schedule()
      }
    }, getCurrentDelay())
  }

  return {
    start() {
      if (running) return
      running = true
      schedule()
    },
    stop() {
      running = false
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
    isRunning() {
      return running
    },
    getConsecutiveFailures() {
      return consecutiveFailures
    },
    isCircuitOpen() {
      return isCircuitOpen()
    },
  }
}

export type PollingCallback = {
  id: string
  fn: () => void | Promise<void>
  intervalMs: number
  poller: Poller
  options?: PollerOptions
}

export class PollingManager {
  private callbacks = new Map<string, PollingCallback>()

  register(fn: () => void | Promise<void>, intervalMs: number, options?: PollerOptions): string {
    const id = `poll_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const defaultOptions: PollerOptions = {
      jitter: Math.floor(intervalMs * 0.1),
      ...options,
    }
    const poller = createPoller(fn, intervalMs, defaultOptions)
    this.callbacks.set(id, { id, fn, intervalMs, poller, options: defaultOptions })
    return id
  }

  updateInterval(id: string, newIntervalMs: number): boolean {
    const cb = this.callbacks.get(id)
    if (!cb) return false

    const wasRunning = cb.poller.isRunning()
    cb.poller.stop()

    // Create new poller with updated interval
    const newPoller = createPoller(cb.fn, newIntervalMs, cb.options)
    cb.intervalMs = newIntervalMs
    cb.poller = newPoller

    // Restart if it was running
    if (wasRunning) {
      cb.poller.start()
    }

    return true
  }

  start(id?: string) {
    if (id) {
      const cb = this.callbacks.get(id)
      cb?.poller.start()
    } else {
      this.callbacks.forEach((c) => c.poller.start())
    }
  }

  stop(id?: string) {
    if (id) {
      const cb = this.callbacks.get(id)
      cb?.poller.stop()
    } else {
      this.callbacks.forEach((c) => c.poller.stop())
    }
  }

  unregister(id: string) {
    const cb = this.callbacks.get(id)
    if (cb) {
      cb.poller.stop()
      this.callbacks.delete(id)
    }
  }

  stopAllAndClear() {
    this.stop()
    this.callbacks.clear()
  }

  getMetrics() {
    const metrics = {
      totalCallbacks: this.callbacks.size,
      runningCallbacks: 0,
      failureStats: new Map<string, number>(),
      circuitBreakerStats: new Map<string, boolean>(),
    }

    this.callbacks.forEach((cb, id) => {
      if (cb.poller.isRunning()) {
        metrics.runningCallbacks++
      }
      metrics.failureStats.set(id, cb.poller.getConsecutiveFailures())
      metrics.circuitBreakerStats.set(id, cb.poller.isCircuitOpen())
    })

    return metrics
  }
}
