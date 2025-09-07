// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/dashboard/:path*'],
};

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Protect admin-only routes
    if (
      (pathname.startsWith('/dashboard/users') || pathname.startsWith('/dashboard/tickets')) &&
      token?.role !== 'admin'
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);
