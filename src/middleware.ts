// src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export const config = {
  matcher: ['/dashboard/:path*'],
};

export default withAuth(
  function middleware(req) {
    try {
      const { token } = req.nextauth;
      const { pathname } = req.nextUrl;

      // Check if the request headers are too large
      const headerSize = JSON.stringify(Object.fromEntries(req.headers.entries())).length;
      if (headerSize > 8000) { // 8KB limit
        console.log(`Large headers detected: ${headerSize} bytes`);
        return NextResponse.redirect(new URL('/auth-error', req.url));
      }

      // Protect admin-only routes
      if (
        (pathname.startsWith('/dashboard/users') || pathname.startsWith('/dashboard/tickets')) &&
        token?.role !== 'admin'
      ) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    } catch (error) {
      console.error('Middleware error:', error);
      // If there's any error in middleware, redirect to auth error page
      return NextResponse.redirect(new URL('/auth-error', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        try {
          // Additional check for token size
          if (token) {
            const tokenSize = JSON.stringify(token).length;
            if (tokenSize > 4000) { // 4KB limit for token
              console.log(`Large token detected: ${tokenSize} bytes`);
              return false;
            }
          }
          return !!token;
        } catch (error) {
          console.error('Token validation error:', error);
          return false;
        }
      },
    },
  }
);
