"use client";

import { useEffect } from 'react';

export function SessionCleanup() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Function to calculate total cookie size
    const getCookieSize = () => {
      return document.cookie.length;
    };

    // Function to clear all cookies
    const clearAllCookies = () => {
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
    };

    // Check cookie size on mount
    const cookieSize = getCookieSize();
    console.log(`Current cookie size: ${cookieSize} bytes`);

    // If cookies are too large, clear them
    if (cookieSize > 3000) { // 3KB limit
      console.log('Large cookies detected, clearing all cookies...');
      clearAllCookies();
      localStorage.clear();
      sessionStorage.clear();
      
      // Redirect to login
      window.location.href = '/auth-error';
    }

    // Listen for storage events to detect when cookies might be getting too large
    const handleStorageChange = () => {
      const currentSize = getCookieSize();
      if (currentSize > 3000) {
        console.log('Cookie size exceeded limit during session, clearing...');
        clearAllCookies();
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth-error';
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return null; // This component doesn't render anything
}