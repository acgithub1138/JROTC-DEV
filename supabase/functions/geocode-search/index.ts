import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import {
  RateLimiter,
  RATE_LIMITS,
  getClientIP,
  createRateLimitResponse,
  addRateLimitHeaders
} from '../_shared/rate-limiter.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
}

// Rate limiters
const globalLimiter = new RateLimiter({ ...RATE_LIMITS.GLOBAL_IP, keyPrefix: 'global' })
const publicLimiter = new RateLimiter({ ...RATE_LIMITS.PUBLIC, keyPrefix: 'geocode' })

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting - Global IP check
    const clientIP = getClientIP(req)
    const globalResult = globalLimiter.check(clientIP)
    if (!globalResult.allowed) {
      return createRateLimitResponse(globalResult, corsHeaders)
    }

    // Rate limiting - Function-specific check
    const functionResult = publicLimiter.check(clientIP)
    if (!functionResult.allowed) {
      return createRateLimitResponse(functionResult, corsHeaders)
    }
    const { query } = await req.json()
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Geocoding search for query:', query)

    // Call Nominatim API
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=us`
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'JROTC-Management-App/1.0'
      }
    })

    if (!response.ok) {
      console.error('Nominatim API error:', response.status, response.statusText)
      return new Response(
        JSON.stringify({ error: 'Geocoding service error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await response.json()
    console.log('Nominatim response:', data.length, 'results')

    const httpResponse = new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
    return addRateLimitHeaders(httpResponse, functionResult)

  } catch (error) {
    console.error('Error in geocode-search function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})