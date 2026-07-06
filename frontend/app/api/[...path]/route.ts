import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function getSupabaseToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll() {
            // Not needed for reading session
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

async function proxyRequest(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Forward the full path as-is — backend is mounted at /api (API_V1_STR)
  const targetUrl = `${BACKEND_URL}${pathname}${search}`

  // Get the auth token from Supabase session
  const token = await getSupabaseToken()

  // Build headers to forward
  const headers: Record<string, string> = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Forward content-type for non-GET requests
  const contentType = request.headers.get('content-type')
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  // Forward accept header
  const accept = request.headers.get('accept')
  if (accept) {
    headers['Accept'] = accept
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method: request.method,
    headers,
  }

  // Forward body for non-GET/HEAD requests
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    // For multipart/form-data, forward the raw body and let the browser-set
    // content-type with boundary pass through
    if (contentType?.includes('multipart/form-data')) {
      fetchOptions.body = await request.arrayBuffer()
      // Remove content-type so fetch can set it with proper boundary
      // Actually we need to keep it since we're forwarding the exact boundary
    } else {
      fetchOptions.body = await request.arrayBuffer()
    }
  }

  try {
    const backendResponse = await fetch(targetUrl, fetchOptions)

    // Get response body
    const responseBody = await backendResponse.arrayBuffer()

    // Build response with backend status and headers
    const response = new NextResponse(responseBody, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
    })

    // Forward relevant response headers
    const responseContentType = backendResponse.headers.get('content-type')
    if (responseContentType) {
      response.headers.set('Content-Type', responseContentType)
    }

    const cacheControl = backendResponse.headers.get('cache-control')
    if (cacheControl) {
      response.headers.set('Cache-Control', cacheControl)
    }

    return response
  } catch (error) {
    console.error('API proxy error:', error)
    return NextResponse.json(
      { detail: 'Backend service unavailable' },
      { status: 502 }
    )
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request)
}

export async function POST(request: NextRequest) {
  return proxyRequest(request)
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request)
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request)
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request)
}
