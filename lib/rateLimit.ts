// Rate limiting middleware and utilities
import { NextRequest, NextResponse } from 'next/server'
import { logger, errorHandler } from './logger'

// Rate limit configuration interface
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum number of requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (req: NextRequest) => string // Custom key generator
  onLimitReached?: (req: NextRequest, key: string) => void // Callback when limit is reached
}

// Rate limit store interface
interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>
  set(key: string, value: { count: number; resetTime: number }): Promise<void>
  delete(key: string): Promise<void>
  cleanup(): Promise<void>
}

// In-memory rate limit store
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    // Check if entry has expired
    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      return null
    }

    return entry
  }

  async set(key: string, value: { count: number; resetTime: number }): Promise<void> {
    this.store.set(key, value)
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key)
  }

  async cleanup(): Promise<void> {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// Rate limiter class
class RateLimiter {
  private config: Required<RateLimitConfig>
  private store: RateLimitStore

  constructor(config: RateLimitConfig, store?: RateLimitStore) {
    this.config = {
      windowMs: config.windowMs,
      max: config.max,
      message: config.message || 'Too many requests, please try again later.',
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      onLimitReached: config.onLimitReached || (() => {})
    }
    this.store = store || new MemoryRateLimitStore()
  }

  private defaultKeyGenerator(req: NextRequest): string {
    // Use IP address as default key
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
    return `rate_limit:${ip}`
  }

  private getClientInfo(req: NextRequest): { ip: string; userAgent: string } {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    return { ip, userAgent }
  }

  async checkLimit(req: NextRequest): Promise<{
    allowed: boolean
    limit: number
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const key = this.config.keyGenerator(req)
    const now = Date.now()
    const resetTime = now + this.config.windowMs

    let entry = await this.store.get(key)

    if (!entry) {
      // First request in window
      entry = { count: 1, resetTime }
      await this.store.set(key, entry)
      
      return {
        allowed: true,
        limit: this.config.max,
        remaining: this.config.max - 1,
        resetTime: entry.resetTime
      }
    }

    // Increment count
    entry.count++
    await this.store.set(key, entry)

    const remaining = Math.max(0, this.config.max - entry.count)
    const allowed = entry.count <= this.config.max

    if (!allowed) {
      const clientInfo = this.getClientInfo(req)
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      
      logger.warn('Rate limit exceeded', {
        key,
        count: entry.count,
        limit: this.config.max,
        ip: clientInfo.ip,
        userAgent: clientInfo.userAgent,
        retryAfter
      })

      this.config.onLimitReached(req, key)

      return {
        allowed: false,
        limit: this.config.max,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter
      }
    }

    return {
      allowed: true,
      limit: this.config.max,
      remaining,
      resetTime: entry.resetTime
    }
  }

  // Middleware function
  middleware() {
    return async (req: NextRequest): Promise<NextResponse | null> => {
      try {
        const result = await this.checkLimit(req)

        // Add rate limit headers
        const headers = new Headers()
        headers.set('X-RateLimit-Limit', result.limit.toString())
        headers.set('X-RateLimit-Remaining', result.remaining.toString())
        headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())

        if (!result.allowed) {
          headers.set('Retry-After', result.retryAfter!.toString())
          
          return new NextResponse(
            JSON.stringify({
              error: 'Rate limit exceeded',
              message: this.config.message,
              retryAfter: result.retryAfter
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                ...Object.fromEntries(headers.entries())
              }
            }
          )
        }

        // Request is allowed, add headers to response
        const response = NextResponse.next()
        headers.forEach((value, key) => {
          response.headers.set(key, value)
        })

        return response
      } catch (error) {
        logger.error('Rate limiting error', error as Error)
        // Allow request to proceed if rate limiting fails
        return NextResponse.next()
      }
    }
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many API requests, please try again later.'
  },

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true
  },

  // Registration endpoint
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registration attempts per hour
    message: 'Too many registration attempts, please try again later.'
  },

  // Email sending endpoints
  email: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 emails per hour
    message: 'Too many email requests, please try again later.'
  },

  // Appointment booking
  booking: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 booking attempts per hour
    message: 'Too many booking attempts, please try again later.'
  },

  // Password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 password reset attempts per hour
    message: 'Too many password reset attempts, please try again later.'
  }
}

// Create rate limiter instances
export const createRateLimiter = (config: RateLimitConfig, store?: RateLimitStore): RateLimiter => {
  return new RateLimiter(config, store)
}

// Default rate limiters
export const rateLimiters = {
  api: createRateLimiter(rateLimitConfigs.api),
  auth: createRateLimiter(rateLimitConfigs.auth),
  register: createRateLimiter(rateLimitConfigs.register),
  email: createRateLimiter(rateLimitConfigs.email),
  booking: createRateLimiter(rateLimitConfigs.booking),
  passwordReset: createRateLimiter(rateLimitConfigs.passwordReset)
}

// Rate limit decorator for API routes
export const withRateLimit = (limiter: RateLimiter) => {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (req: NextRequest): Promise<NextResponse> => {
      const rateLimitResponse = await limiter.middleware()(req)
      
      if (rateLimitResponse && rateLimitResponse.status === 429) {
        return rateLimitResponse
      }

      return handler(req)
    }
  }
}

// IP-based rate limiting
export const createIPRateLimiter = (config: Omit<RateLimitConfig, 'keyGenerator'>) => {
  return createRateLimiter({
    ...config,
    keyGenerator: (req: NextRequest) => {
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
      return `ip:${ip}`
    }
  })
}

// User-based rate limiting (requires authentication)
export const createUserRateLimiter = (config: Omit<RateLimitConfig, 'keyGenerator'>) => {
  return createRateLimiter({
    ...config,
    keyGenerator: (req: NextRequest) => {
      // Extract user ID from token or session
      const authHeader = req.headers.get('authorization')
      const userId = extractUserIdFromAuth(authHeader) || 'anonymous'
      return `user:${userId}`
    }
  })
}

// Helper function to extract user ID from authorization header
function extractUserIdFromAuth(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    // This would typically decode a JWT token
    // For now, return a placeholder
    const token = authHeader.substring(7)
    // TODO: Implement JWT decoding to extract user ID
    return null
  } catch (error) {
    return null
  }
}

// Rate limit status endpoint
export const getRateLimitStatus = async (req: NextRequest, limiter: RateLimiter) => {
  const result = await limiter.checkLimit(req)
  
  return {
    limit: result.limit,
    remaining: result.remaining,
    resetTime: new Date(result.resetTime).toISOString(),
    retryAfter: result.retryAfter
  }
}

export default {
  RateLimiter,
  createRateLimiter,
  rateLimiters,
  rateLimitConfigs,
  withRateLimit,
  createIPRateLimiter,
  createUserRateLimiter,
  getRateLimitStatus
}