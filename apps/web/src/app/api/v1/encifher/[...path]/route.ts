/**
 * Generic API Route to proxy all Encifher SDK requests
 * This bypasses CORS issues by making server-side requests to Encifher's API
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest('GET', request, path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest('POST', request, path)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest('PUT', request, path)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  return proxyRequest('DELETE', request, path)
}

async function proxyRequest(
  method: string,
  request: NextRequest,
  pathSegments: string[]
) {
  try {
    // Reconstruct the path
    const path = pathSegments.join('/')
    const encifherUrl = `https://authority.encrypt.trade/api/v1/${path}`

    console.log(`[Encifher Proxy API] ${method} ${encifherUrl}`)

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WaveSwap-Proxy/1.0'
      }
    }

    // Forward any authentication headers from the original request
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': authHeader
      }
    }

    // Get API key from environment or request
    let apiKeyHeader = request.headers.get('authorization') || request.headers.get('x-api-key')

    console.log('[Encifher Proxy API] Request headers:', {
      authorization: request.headers.get('authorization'),
      xApiKey: request.headers.get('x-api-key'),
      envKeyPresent: !!process.env.NEXT_PUBLIC_ENCIFHER_SDK_KEY,
      envKeyLength: process.env.NEXT_PUBLIC_ENCIFHER_SDK_KEY?.length
    })

    // If no API key in request, try to get from environment
    if (!apiKeyHeader) {
      apiKeyHeader = process.env.NEXT_PUBLIC_ENCIFHER_SDK_KEY || process.env.ENCIFHER_API_KEY || null
    }

    // If still no API key, use the configured key from the client
    if (!apiKeyHeader) {
      console.error('[Encifher Proxy API] No API key found!')
      apiKeyHeader = 'default-key' // This may need to be updated with a real key
    }

    if (apiKeyHeader) {
      // Format as Bearer token if not already formatted
      const authHeader = apiKeyHeader.startsWith('Bearer ') ? apiKeyHeader : `Bearer ${apiKeyHeader}`

      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': authHeader,
        'x-api-key': apiKeyHeader.replace('Bearer ', '') // Also include x-api-key header
      }
      console.log('[Encifher Proxy API] Using API key:', authHeader.substring(0, 12) + '...')
    }

    // Add request body for POST/PUT requests
    if (['POST', 'PUT'].includes(method)) {
      const body = await request.text()
      if (body) {
        requestOptions.body = body
        console.log(`[Encifher Proxy API] Request body:`, body)
      }
    }

    // Make server-side request to Encifher API (bypasses CORS)
    console.log(`[Encifher Proxy API] Making request to: ${encifherUrl}`)
    console.log(`[Encifher Proxy API] Request options:`, {
      method: requestOptions.method,
      headers: requestOptions.headers,
      bodySize: requestOptions.body ? (typeof requestOptions.body === 'string' ? requestOptions.body.length : 'binary') : 0
    })

    const encifherResponse = await fetch(encifherUrl, requestOptions)

    console.log(`[Encifher Proxy API] Response status: ${encifherResponse.status} ${encifherResponse.statusText}`)
    console.log(`[Encifher Proxy API] Response headers:`, Object.fromEntries(encifherResponse.headers.entries()))

    if (!encifherResponse.ok) {
      const errorText = await encifherResponse.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = errorText
      }

      console.error(`[Encifher Proxy API] Encifher API error:`, {
        url: encifherUrl,
        status: encifherResponse.status,
        statusText: encifherResponse.statusText,
        errorText,
        errorData,
        requestHeaders: requestOptions.headers
      })

      return NextResponse.json(
        {
          error: `Encifher API returned ${encifherResponse.status}: ${encifherResponse.statusText}`,
          details: errorData,
          url: encifherUrl
        },
        { status: encifherResponse.status }
      )
    }

    // Get the response from Encifher
    const contentType = encifherResponse.headers.get('content-type')
    let responseData

    if (contentType?.includes('application/json')) {
      responseData = await encifherResponse.json()
    } else {
      responseData = await encifherResponse.text()
    }

    console.log(`[Encifher Proxy API] Successful response from ${encifherUrl}`)

    // Return the Encifher response to the client
    return NextResponse.json(responseData, {
      status: encifherResponse.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, x-api-key',
        'Access-Control-Allow-Credentials': 'true',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })

  } catch (error) {
    console.error('[Encifher Proxy API] Error proxying request:', error)

    return NextResponse.json(
      {
        error: 'Failed to proxy request to Encifher API',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  // Handle CORS preflight requests with comprehensive headers
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, x-api-key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400' // Cache preflight for 24 hours
    }
  })
}