import { NextResponse } from 'next/server'

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Allow the login page and login API
  if (
    pathname.startsWith('/admin-login') ||
    pathname.startsWith('/api/admin-login')
  ) {
    return NextResponse.next()
  }

  // Allow Stripe webhook
  if (pathname.startsWith('/api/stripe-webhook')) {
    return NextResponse.next()
  }

  // Allow Next.js files
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  const loggedIn = request.cookies.get('topspeed_admin')?.value

  if (!loggedIn) {
    return NextResponse.redirect(new URL('/admin-login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
