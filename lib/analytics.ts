// Analytics and monitoring utilities
import { logger, PerformanceMonitor } from './logger'

// Event types for analytics
export enum AnalyticsEvent {
  // User events
  USER_REGISTRATION = 'user_registration',
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_PROFILE_UPDATE = 'user_profile_update',
  
  // Appointment events
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  
  // Email events
  EMAIL_SENT = 'email_sent',
  EMAIL_FAILED = 'email_failed',
  EMAIL_OPENED = 'email_opened',
  
  // System events
  API_REQUEST = 'api_request',
  ERROR_OCCURRED = 'error_occurred',
  RATE_LIMIT_HIT = 'rate_limit_hit',
  
  // Business events
  BOOKING_FLOW_STARTED = 'booking_flow_started',
  BOOKING_FLOW_COMPLETED = 'booking_flow_completed',
  BOOKING_FLOW_ABANDONED = 'booking_flow_abandoned'
}

// Analytics event interface
interface AnalyticsEventData {
  event: AnalyticsEvent
  userId?: string
  sessionId?: string
  timestamp: string
  properties: Record<string, any>
  metadata?: {
    userAgent?: string
    ip?: string
    referrer?: string
    path?: string
  }
}

// Performance metrics interface
interface PerformanceMetrics {
  endpoint: string
  method: string
  duration: number
  statusCode: number
  timestamp: string
  userId?: string
  errorType?: string
}

// User behavior tracking interface
interface UserBehavior {
  userId: string
  action: string
  timestamp: string
  properties: Record<string, any>
  sessionId?: string
}

// Analytics store interface
interface AnalyticsStore {
  events: AnalyticsEventData[]
  performance: PerformanceMetrics[]
  userBehavior: UserBehavior[]
  aggregates: {
    dailyActiveUsers: Map<string, Set<string>>
    eventCounts: Map<string, number>
    errorCounts: Map<string, number>
    performanceStats: Map<string, { total: number; count: number; avg: number }>
  }
}

// Analytics class
class Analytics {
  private static instance: Analytics
  private store: AnalyticsStore
  private maxEvents: number = 10000
  private retentionDays: number = 30

  private constructor() {
    this.store = {
      events: [],
      performance: [],
      userBehavior: [],
      aggregates: {
        dailyActiveUsers: new Map(),
        eventCounts: new Map(),
        errorCounts: new Map(),
        performanceStats: new Map()
      }
    }

    // Cleanup old data every hour
    setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000)
  }

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics()
    }
    return Analytics.instance
  }

  // Track analytics event
  public track(event: AnalyticsEvent, properties: Record<string, any> = {}, userId?: string, sessionId?: string): void {
    const eventData: AnalyticsEventData = {
      event,
      userId,
      sessionId,
      timestamp: new Date().toISOString(),
      properties
    }

    this.store.events.push(eventData)
    this.updateAggregates(eventData)
    this.trimEvents()

    logger.debug('Analytics event tracked', {
      event,
      userId,
      properties
    })
  }

  // Track performance metrics
  public trackPerformance(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    const performanceData: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date().toISOString()
    }

    this.store.performance.push(performanceData)
    this.updatePerformanceStats(performanceData)
    this.trimPerformance()

    // Log slow requests
    if (metrics.duration > 1000) {
      logger.warn('Slow API request detected', {
        endpoint: metrics.endpoint,
        method: metrics.method,
        duration: `${metrics.duration}ms`,
        statusCode: metrics.statusCode
      })
    }
  }

  // Track user behavior
  public trackUserBehavior(userId: string, action: string, properties: Record<string, any> = {}, sessionId?: string): void {
    const behaviorData: UserBehavior = {
      userId,
      action,
      timestamp: new Date().toISOString(),
      properties,
      sessionId
    }

    this.store.userBehavior.push(behaviorData)
    this.trimUserBehavior()

    // Track daily active users
    const today = new Date().toISOString().split('T')[0]
    if (!this.store.aggregates.dailyActiveUsers.has(today)) {
      this.store.aggregates.dailyActiveUsers.set(today, new Set())
    }
    this.store.aggregates.dailyActiveUsers.get(today)!.add(userId)
  }

  // Get analytics summary
  public getSummary(days: number = 7): any {
    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    const recentEvents = this.store.events.filter(
      event => new Date(event.timestamp) >= startDate
    )

    const recentPerformance = this.store.performance.filter(
      metric => new Date(metric.timestamp) >= startDate
    )

    const recentBehavior = this.store.userBehavior.filter(
      behavior => new Date(behavior.timestamp) >= startDate
    )

    // Calculate metrics
    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const avgResponseTime = recentPerformance.length > 0 
      ? recentPerformance.reduce((sum, metric) => sum + metric.duration, 0) / recentPerformance.length
      : 0

    const errorRate = recentPerformance.length > 0
      ? recentPerformance.filter(metric => metric.statusCode >= 400).length / recentPerformance.length
      : 0

    const uniqueUsers = new Set(recentEvents.filter(e => e.userId).map(e => e.userId)).size

    return {
      period: `${days} days`,
      summary: {
        totalEvents: recentEvents.length,
        uniqueUsers,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: Math.round(errorRate * 100),
        totalRequests: recentPerformance.length
      },
      eventsByType,
      topEndpoints: this.getTopEndpoints(recentPerformance),
      dailyActiveUsers: this.getDailyActiveUsers(days),
      errorBreakdown: this.getErrorBreakdown(recentPerformance)
    }
  }

  // Get real-time metrics
  public getRealTimeMetrics(): any {
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000)
    
    const recentEvents = this.store.events.filter(
      event => new Date(event.timestamp) >= last5Minutes
    )

    const recentPerformance = this.store.performance.filter(
      metric => new Date(metric.timestamp) >= last5Minutes
    )

    return {
      timestamp: new Date().toISOString(),
      last5Minutes: {
        events: recentEvents.length,
        requests: recentPerformance.length,
        errors: recentPerformance.filter(m => m.statusCode >= 400).length,
        avgResponseTime: recentPerformance.length > 0 
          ? Math.round(recentPerformance.reduce((sum, m) => sum + m.duration, 0) / recentPerformance.length)
          : 0
      },
      activeUsers: this.getActiveUsers(5), // Last 5 minutes
      systemHealth: this.getSystemHealth()
    }
  }

  // Private helper methods
  private updateAggregates(event: AnalyticsEventData): void {
    // Update event counts
    const currentCount = this.store.aggregates.eventCounts.get(event.event) || 0
    this.store.aggregates.eventCounts.set(event.event, currentCount + 1)

    // Track errors
    if (event.event === AnalyticsEvent.ERROR_OCCURRED) {
      const errorType = event.properties.errorType || 'unknown'
      const currentErrorCount = this.store.aggregates.errorCounts.get(errorType) || 0
      this.store.aggregates.errorCounts.set(errorType, currentErrorCount + 1)
    }
  }

  private updatePerformanceStats(metric: PerformanceMetrics): void {
    const key = `${metric.method} ${metric.endpoint}`
    const current = this.store.aggregates.performanceStats.get(key) || { total: 0, count: 0, avg: 0 }
    
    current.total += metric.duration
    current.count += 1
    current.avg = current.total / current.count
    
    this.store.aggregates.performanceStats.set(key, current)
  }

  private getTopEndpoints(performance: PerformanceMetrics[], limit: number = 5): any[] {
    const endpointStats = performance.reduce((acc, metric) => {
      const key = `${metric.method} ${metric.endpoint}`
      if (!acc[key]) {
        acc[key] = { count: 0, totalDuration: 0, errors: 0 }
      }
      acc[key].count++
      acc[key].totalDuration += metric.duration
      if (metric.statusCode >= 400) {
        acc[key].errors++
      }
      return acc
    }, {} as Record<string, any>)

    return Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        requests: stats.count,
        avgDuration: Math.round(stats.totalDuration / stats.count),
        errorRate: Math.round((stats.errors / stats.count) * 100)
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit)
  }

  private getDailyActiveUsers(days: number): any[] {
    const result = []
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const users = this.store.aggregates.dailyActiveUsers.get(date)
      result.push({
        date,
        activeUsers: users ? users.size : 0
      })
    }
    return result.reverse()
  }

  private getErrorBreakdown(performance: PerformanceMetrics[]): any[] {
    const errors = performance.filter(m => m.statusCode >= 400)
    const errorStats = errors.reduce((acc, metric) => {
      const key = metric.statusCode.toString()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(errorStats)
      .map(([statusCode, count]) => ({ statusCode: parseInt(statusCode), count }))
      .sort((a, b) => b.count - a.count)
  }

  private getActiveUsers(minutes: number): number {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000)
    const activeUserIds = new Set(
      this.store.events
        .filter(event => event.userId && new Date(event.timestamp) >= cutoff)
        .map(event => event.userId!)
    )
    return activeUserIds.size
  }

  private getSystemHealth(): any {
    const memUsage = process.memoryUsage()
    return {
      uptime: process.uptime(),
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024)
      },
      eventQueueSize: this.store.events.length,
      performanceQueueSize: this.store.performance.length
    }
  }

  private cleanup(): void {
    const cutoff = new Date(Date.now() - this.retentionDays * 24 * 60 * 60 * 1000)
    
    this.store.events = this.store.events.filter(
      event => new Date(event.timestamp) >= cutoff
    )
    
    this.store.performance = this.store.performance.filter(
      metric => new Date(metric.timestamp) >= cutoff
    )
    
    this.store.userBehavior = this.store.userBehavior.filter(
      behavior => new Date(behavior.timestamp) >= cutoff
    )

    // Clean up daily active users
    const cutoffDate = cutoff.toISOString().split('T')[0]
    for (const [date] of this.store.aggregates.dailyActiveUsers) {
      if (date < cutoffDate) {
        this.store.aggregates.dailyActiveUsers.delete(date)
      }
    }
  }

  private trimEvents(): void {
    if (this.store.events.length > this.maxEvents) {
      this.store.events = this.store.events.slice(-this.maxEvents)
    }
  }

  private trimPerformance(): void {
    if (this.store.performance.length > this.maxEvents) {
      this.store.performance = this.store.performance.slice(-this.maxEvents)
    }
  }

  private trimUserBehavior(): void {
    if (this.store.userBehavior.length > this.maxEvents) {
      this.store.userBehavior = this.store.userBehavior.slice(-this.maxEvents)
    }
  }

  // Export data for external analytics services
  public exportData(startDate?: Date, endDate?: Date): any {
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const end = endDate || new Date()

    return {
      events: this.store.events.filter(
        event => {
          const eventDate = new Date(event.timestamp)
          return eventDate >= start && eventDate <= end
        }
      ),
      performance: this.store.performance.filter(
        metric => {
          const metricDate = new Date(metric.timestamp)
          return metricDate >= start && metricDate <= end
        }
      ),
      userBehavior: this.store.userBehavior.filter(
        behavior => {
          const behaviorDate = new Date(behavior.timestamp)
          return behaviorDate >= start && behaviorDate <= end
        }
      )
    }
  }
}

// Export analytics instance
export const analytics = Analytics.getInstance()

// Convenience functions
export const trackEvent = (event: AnalyticsEvent, properties?: Record<string, any>, userId?: string, sessionId?: string) => {
  analytics.track(event, properties, userId, sessionId)
}

export const trackPerformance = (metrics: Omit<PerformanceMetrics, 'timestamp'>) => {
  analytics.trackPerformance(metrics)
}

export const trackUserBehavior = (userId: string, action: string, properties?: Record<string, any>, sessionId?: string) => {
  analytics.trackUserBehavior(userId, action, properties, sessionId)
}

// Middleware for automatic API tracking
export const createAnalyticsMiddleware = () => {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now()
    const originalSend = res.send

    res.send = function(data: any) {
      const duration = Date.now() - startTime
      
      trackPerformance({
        endpoint: req.path || req.url,
        method: req.method,
        duration,
        statusCode: res.statusCode,
        userId: req.user?.id
      })

      return originalSend.call(this, data)
    }

    next()
  }
}

export default {
  analytics,
  AnalyticsEvent,
  trackEvent,
  trackPerformance,
  trackUserBehavior,
  createAnalyticsMiddleware
}