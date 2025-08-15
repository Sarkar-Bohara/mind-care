// Comprehensive logging and error handling utility
import { performance } from 'perf_hooks'

// Log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

// Log entry interface
interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
  requestId?: string
  userId?: string
  duration?: number
  stack?: string
}

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  DATABASE = 'DATABASE_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  EMAIL = 'EMAIL_ERROR',
  RATE_LIMIT = 'RATE_LIMIT_ERROR',
  EXTERNAL_API = 'EXTERNAL_API_ERROR',
  INTERNAL = 'INTERNAL_ERROR'
}

// Custom error class
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any>
  public readonly timestamp: string

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    this.timestamp = new Date().toISOString()

    Error.captureStackTrace(this, this.constructor)
  }
}

// Logger class
class Logger {
  private static instance: Logger
  private logLevel: LogLevel
  private logs: LogEntry[] = []
  private maxLogs: number = 1000

  private constructor() {
    this.logLevel = this.getLogLevelFromEnv()
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase()
    switch (level) {
      case 'ERROR': return LogLevel.ERROR
      case 'WARN': return LogLevel.WARN
      case 'INFO': return LogLevel.INFO
      case 'DEBUG': return LogLevel.DEBUG
      default: return LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level]
    const contextStr = entry.context ? ` | Context: ${JSON.stringify(entry.context)}` : ''
    const durationStr = entry.duration ? ` | Duration: ${entry.duration.toFixed(2)}ms` : ''
    const requestIdStr = entry.requestId ? ` | RequestID: ${entry.requestId}` : ''
    const userIdStr = entry.userId ? ` | UserID: ${entry.userId}` : ''
    
    return `[${entry.timestamp}] ${levelName}: ${entry.message}${requestIdStr}${userIdStr}${durationStr}${contextStr}`
  }

  private addLog(entry: LogEntry): void {
    // Add to memory store
    this.logs.push(entry)
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Output to console
    const formattedMessage = this.formatMessage(entry)
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedMessage)
        if (entry.error?.stack) {
          console.error('Stack trace:', entry.error.stack)
        }
        break
      case LogLevel.WARN:
        console.warn(formattedMessage)
        break
      case LogLevel.INFO:
        console.info(formattedMessage)
        break
      case LogLevel.DEBUG:
        console.debug(formattedMessage)
        break
    }
  }

  public error(
    message: string, 
    error?: Error, 
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ): void {
    if (!this.shouldLog(LogLevel.ERROR)) return

    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      error,
      context,
      requestId,
      userId,
      stack: error?.stack
    })
  }

  public warn(
    message: string, 
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ): void {
    if (!this.shouldLog(LogLevel.WARN)) return

    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      requestId,
      userId
    })
  }

  public info(
    message: string, 
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ): void {
    if (!this.shouldLog(LogLevel.INFO)) return

    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      requestId,
      userId
    })
  }

  public debug(
    message: string, 
    context?: Record<string, any>,
    requestId?: string,
    userId?: string
  ): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return

    this.addLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
      requestId,
      userId
    })
  }

  public logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    requestId?: string,
    userId?: string
  ): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO
    if (!this.shouldLog(level)) return

    this.addLog({
      timestamp: new Date().toISOString(),
      level,
      message: `${method} ${url} - ${statusCode}`,
      duration,
      requestId,
      userId,
      context: { method, url, statusCode }
    })
  }

  public getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs
    
    if (level !== undefined) {
      filteredLogs = this.logs.filter(log => log.level === level)
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit)
    }
    
    return filteredLogs
  }

  public getStats() {
    const stats = {
      total: this.logs.length,
      errors: 0,
      warnings: 0,
      info: 0,
      debug: 0
    }

    this.logs.forEach(log => {
      switch (log.level) {
        case LogLevel.ERROR: stats.errors++; break
        case LogLevel.WARN: stats.warnings++; break
        case LogLevel.INFO: stats.info++; break
        case LogLevel.DEBUG: stats.debug++; break
      }
    })

    return stats
  }

  public clearLogs(): void {
    this.logs = []
  }
}

// Export logger instance
export const logger = Logger.getInstance()

// Performance monitoring utility
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map()

  public static start(label: string): void {
    this.timers.set(label, performance.now())
  }

  public static end(label: string, context?: Record<string, any>): number {
    const startTime = this.timers.get(label)
    if (!startTime) {
      logger.warn(`Performance timer '${label}' was not started`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(label)

    logger.debug(`Performance: ${label} completed`, { 
      duration: `${duration.toFixed(2)}ms`,
      ...context 
    })

    return duration
  }

  public static measure<T>(label: string, fn: () => Promise<T>): Promise<T>
  public static measure<T>(label: string, fn: () => T): T
  public static measure<T>(label: string, fn: () => T | Promise<T>): T | Promise<T> {
    this.start(label)
    
    try {
      const result = fn()
      
      if (result instanceof Promise) {
        return result.finally(() => this.end(label))
      } else {
        this.end(label)
        return result
      }
    } catch (error) {
      this.end(label)
      throw error
    }
  }
}

// Error handling utilities
export const errorHandler = {
  // Handle and log application errors
  handleError(error: Error | AppError, context?: Record<string, any>): AppError {
    if (error instanceof AppError) {
      logger.error(error.message, error, { ...error.context, ...context })
      return error
    }

    // Convert unknown errors to AppError
    const appError = new AppError(
      error.message || 'An unexpected error occurred',
      ErrorType.INTERNAL,
      500,
      false,
      context
    )

    logger.error(appError.message, error, context)
    return appError
  },

  // Create specific error types
  validation(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, ErrorType.VALIDATION, 400, true, context)
  },

  database(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, ErrorType.DATABASE, 500, true, context)
  },

  authentication(message: string = 'Authentication failed', context?: Record<string, any>): AppError {
    return new AppError(message, ErrorType.AUTHENTICATION, 401, true, context)
  },

  authorization(message: string = 'Access denied', context?: Record<string, any>): AppError {
    return new AppError(message, ErrorType.AUTHORIZATION, 403, true, context)
  },

  rateLimit(message: string = 'Too many requests', context?: Record<string, any>): AppError {
    return new AppError(message, ErrorType.RATE_LIMIT, 429, true, context)
  },

  email(message: string, context?: Record<string, any>): AppError {
    return new AppError(message, ErrorType.EMAIL, 500, true, context)
  }
}

// Request ID generator
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      throw errorHandler.handleError(error as Error)
    }
  }
}

export default {
  logger,
  AppError,
  ErrorType,
  LogLevel,
  PerformanceMonitor,
  errorHandler,
  generateRequestId,
  asyncHandler
}