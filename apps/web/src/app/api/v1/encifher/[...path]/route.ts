/**
 * Generic API Route to proxy all Encifher SDK requests
 * This bypasses CORS issues by making server-side requests to Encifher's API
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest('GET', request, params.path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest('POST', request, params.path)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest('PUT', request, params.path)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return proxyRequest('DELETE', request, params.path)
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

    // Also forward X-API-Key header if present
    let apiKeyHeader = request.headers.get('x-api-key')

    // If no API key in request, try to get from environment
    if (!apiKeyHeader) {
      apiKeyHeader = process.env.ENCIFHER_API_KEY || process.env.NEXT_PUBLIC_ENCIFHER_SDK_KEY || null
    }

    // If still no API key, use the configured key from the client
    if (!apiKeyHeader) {
      apiKeyHeader = 'default-key' // This may need to be updated with a real key
    }

    if (apiKeyHeader) {
      requestOptions.headers = {
        ...requestOptions.headers,
        'X-API-Key': apiKeyHeader
      }
      console.log('[Encifher Proxy API] Using API key:', apiKeyHeader.substring(0, 8) + '...')
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
    const encifherResponse = await fetch(encifherUrl, requestOptions)

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
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
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
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}