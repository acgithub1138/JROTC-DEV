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

    // Get Google Maps API key
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY')
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Geocoding service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Call Google Maps Geocoding API
    const googleMapsUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=country:US&key=${apiKey}`
    
    const response = await fetch(googleMapsUrl)

    if (!response.ok) {
      console.error('Google Maps API error:', response.status, response.statusText)
      return new Response(
        JSON.stringify({ error: 'Geocoding service error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const googleData = await response.json()
    
    if (googleData.status !== 'OK') {
      console.error('Google Maps API status:', googleData.status)
      return new Response(
        JSON.stringify([]),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Transform Google Maps response to Nominatim-like format
    const data = googleData.results.map((result: any) => {
      const addressComponents = result.address_components
      const getComponent = (type: string) => 
        addressComponents.find((c: any) => c.types.includes(type))?.long_name || ''
      
      return {
        lat: result.geometry.location.lat.toString(),
        lon: result.geometry.location.lng.toString(),
        display_name: result.formatted_address,
        address: {
          road: getComponent('route'),
          house_number: getComponent('street_number'),
          city: getComponent('locality') || getComponent('sublocality'),
          state: getComponent('administrative_area_level_1'),
          postcode: getComponent('postal_code'),
          country: getComponent('country'),
          country_code: addressComponents.find((c: any) => c.types.includes('country'))?.short_name.toLowerCase() || 'us'
        }
      }
    })
    
    console.log('Google Maps response:', data.length, 'results')

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