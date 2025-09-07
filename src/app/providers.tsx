"use client";

import { SessionProvider } from "next-auth/react";
import { ErrorBoundary } from "@/components/error-boundary";
import { useEffect } from "react";
import { initializeFetchInterceptor, interceptXHR } from "@/lib/fetch-interceptor";

type Props = {
  children?: React.ReactNode;
};

export const NextAuthProvider = ({ children }: Props) => {
  useEffect(() => {
    // Initialize fetch interceptor on client side
    initializeFetchInterceptor();
    interceptXHR();
  }, []);

  return (
    <SessionProvider>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </SessionProvider>
  );
};
