"use client"

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SyncErrorBoundaryProps {
  children: React.ReactNode
}

interface SyncErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class SyncErrorBoundary extends React.Component<
  SyncErrorBoundaryProps,
  SyncErrorBoundaryState
> {
  constructor(props: SyncErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): SyncErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('SyncErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    // Try a soft reload of the page section; if needed, a full reload can be used
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-500/30 rounded bg-red-500/10 text-red-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium">A sync-related error occurred</div>
            {this.state.error && (
              <div className="text-xs opacity-80 mt-1">{this.state.error.message}</div>
            )}
            <div className="mt-3">
              <Button onClick={this.handleReset} variant="outline" size="sm" className="border-red-500/30 text-red-300 hover:bg-red-500/10">
                <RefreshCw className="w-3 h-3 mr-1" /> Retry
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default SyncErrorBoundary

