// src/lib/next-auth.d.ts
import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'user';
    } & DefaultSession['user'];
  }
}
