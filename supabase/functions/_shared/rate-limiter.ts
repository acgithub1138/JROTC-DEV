interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  keyPrefix?: string
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  limit: number
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (resets on function cold start)
const rateLimitStore: RateLimitStore = {}

export class RateLimiter {
  private config: RateLimitConfig
  
  constructor(config: RateLimitConfig) {
    this.config = config
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now()
    const key = `${this.config.keyPrefix || 'default'}:${identifier}`
    
    // Clean up expired entries periodically
    this.cleanupExpired(now)
    
    const existing = rateLimitStore[key]
    
    if (!existing || now > existing.resetTime) {
      // Create new window
      const resetTime = now + this.config.windowMs
      rateLimitStore[key] = {
        count: 1,
        resetTime
      }
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime,
        limit: this.config.maxRequests
      }
    }
    
    // Check if within limit
    if (existing.count < this.config.maxRequests) {
      existing.count++
      return {
        allowed: true,
        remaining: this.config.maxRequests - existing.count,
        resetTime: existing.resetTime,
        limit: this.config.maxRequests
      }
    }
    
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: existing.resetTime,
      limit: this.config.maxRequests
    }
  }

  private cleanupExpired(now: number) {
    // Only cleanup occasionally to avoid performance impact
    if (Math.random() > 0.01) return
    
    for (const [key, data] of Object.entries(rateLimitStore)) {
      if (now > data.resetTime) {
        delete rateLimitStore[key]
      }
    }
  }
}

// Rate limit configurations for different function types
export const RATE_LIMITS = {
  // Public functions - moderate limits
  PUBLIC: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100
  },
  
  // Email processing - strict limits to prevent spam
  EMAIL_PROCESSING: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10
  },
  
  // User management - moderate limits for authenticated users
  USER_MANAGEMENT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20
  },
  
  // Webhooks - higher limits for system integration
  WEBHOOK: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000
  },
  
  // Global per-IP limit to prevent abuse
  GLOBAL_IP: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 500
  }
}

export function getClientIP(req: Request): string {
  // Try various headers for IP detection
  const headers = req.headers
  
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    headers.get('x-client-ip') ||
    'unknown'
  )
}

export function createRateLimitResponse(result: RateLimitResult, corsHeaders: Record<string, string>) {
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
    'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
  }

  return new Response(
    JSON.stringify({ 
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
      retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
    }),
    {
      status: 429,
      headers
    }
  )
}

export function addRateLimitHeaders(
  response: Response, 
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers)
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())
  
  return new Response(response.body, {
    status: response.status,
    headers
  })
}