"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Image from "next/image";

export default function AuthErrorPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear any corrupted session data
    if (typeof window !== 'undefined') {
      document.cookie = 'next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = '__Secure-next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure;';
      localStorage.clear();
      sessionStorage.clear();
    }
  }, []);

  const handleReturnToLogin = async () => {
    await signOut({ callbackUrl: '/', redirect: false });
    router.push('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logo.svg" alt="TicketWise Logo" width={48} height={48} className="w-12 h-12" />
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Session Error
          </CardTitle>
          <CardDescription>
            Your session has expired or become corrupted. Please log in again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            This can happen when the server restarts while you're logged in.
            Your session data has been cleared.
          </div>
          <Button 
            onClick={handleReturnToLogin}
            className="w-full"
          >
            Return to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}