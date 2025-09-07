"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const router = useRouter();

  React.useEffect(() => {
    const handleError = async (event: ErrorEvent) => {
      // Check for 431 Request Header Fields Too Large error
      if (event.message?.includes('431') || event.message?.includes('Request Header Fields Too Large')) {
        console.log('Detected 431 error, clearing session and redirecting...');
        
        // Clear session cookies
        document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;';
        
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Sign out and redirect
        await signOut({ callbackUrl: '/', redirect: false });
        router.push('/auth-error');
      }
    };

    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      
      // Check for 431 error in promise rejections
      if (reason?.status === 431 || 
          (typeof reason === 'string' && reason.includes('431')) ||
          (reason?.message && reason.message.includes('431'))) {
        console.log('Detected 431 error in promise rejection, clearing session...');
        
        // Clear session cookies
        document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;';
        
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Sign out and redirect
        await signOut({ callbackUrl: '/', redirect: false });
        router.push('/auth-error');
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [router]);

  return <>{children}</>;
}