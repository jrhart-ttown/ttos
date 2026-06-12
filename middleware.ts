import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/login', '/api/webhooks/instantly']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow webhook endpoint and login page
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // TODO: Fix auth cookie issue - temporarily allowing all requests for testing
  // const authCookie = request.cookies.get('auth')?.value
  // if (!authCookie) {
  //   return NextResponse.redirect(new URL('/login', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
