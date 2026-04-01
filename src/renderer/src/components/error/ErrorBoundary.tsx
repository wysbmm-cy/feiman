import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  private handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack}`
    navigator.clipboard.writeText(errorText)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-[#0f1117]">
          <div className="max-w-md w-full mx-4">
            <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10 p-6 backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 border border-red-500/30">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-100">出错了</h2>
                  <p className="text-xs text-red-400">系统遇到意外问题</p>
                </div>
              </div>

              <div className="mb-4 p-3 rounded-lg bg-black/40 border border-red-500/20">
                <p className="text-sm text-red-300 font-mono break-all">
                  {this.state.error?.message || '未知错误'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={this.handleReset}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-black font-medium hover:bg-red-400 transition-colors"
                >
                  <RefreshCw size={16} />
                  重新加载
                </button>
                <button
                  onClick={this.handleCopyError}
                  className="px-3 rounded-xl bg-black/40 text-red-300 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                  title="复制错误信息"
                >
                  <Bug size={18} />
                </button>
              </div>

              {(window as any).__DEV__ !== undefined && (window as any).__DEV__ && this.state.errorInfo && (
                <details className="mt-4 text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-400">开发者详情</summary>
                  <pre className="mt-2 p-2 bg-black/60 rounded overflow-auto max-h-48 text-[10px] text-gray-400">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
