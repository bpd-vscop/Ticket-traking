// src/lib/auth.ts
import type { NextAuthOptions, User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import clientPromise from '@/lib/mongodb';
import { compare } from 'bcryptjs';
import { Collection, MongoClient } from 'mongodb';
import { User as AppUser } from './types';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const client: MongoClient = await clientPromise;
          const usersCollection: Collection<AppUser> = client.db().collection('users');

          const user = await usersCollection.findOne({ email: credentials.email });

          if (user && user.password) {
            const isPasswordValid = await compare(credentials.password, user.password);
            if (isPasswordValid) {
              // Return user object without password
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
              } as User;
            }
          }
          return null;
        } catch (e) {
          console.error('Error authorizing user:', e);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'admin' | 'user';
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/',
  },
};
