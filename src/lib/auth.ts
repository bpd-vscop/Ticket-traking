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
        emailOrUsername: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrUsername || !credentials.password) {
          return null;
        }

        try {
          const client: MongoClient = await clientPromise;
          const usersCollection: Collection<AppUser> = client.db().collection('users');

          // Search by email or username
          const user = await usersCollection.findOne({
            $or: [
              { email: credentials.emailOrUsername },
              { username: credentials.emailOrUsername }
            ]
          });

          if (user && user.password) {
            const isPasswordValid = await compare(credentials.password, user.password);
            if (isPasswordValid) {
              // Return user object without password
              return {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture,
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Handle sign in - keep token minimal
      if (user) {
        token.id = user.id;
        token.firstName = (user as any).firstName?.substring(0, 20) || ''; // Limit length
        token.lastName = (user as any).lastName?.substring(0, 20) || ''; // Limit length
        token.username = (user as any).username?.substring(0, 20) || ''; // Limit length
        token.role = (user as any).role;
        // Store only a hash or short identifier for profile picture to reduce size
        const profilePic = (user as any).profilePicture;
        token.profilePicture = profilePic ? (profilePic.length > 100 ? profilePic.substring(0, 100) + '...' : profilePic) : '';
      }
      
      // Handle session updates
      if (trigger === "update" && token.id) {
        try {
          const client: MongoClient = await clientPromise;
          const usersCollection: Collection<AppUser> = client.db().collection('users');
          const user = await usersCollection.findOne({ id: token.id as string });
          
          if (user) {
            token.firstName = user.firstName;
            token.lastName = user.lastName;
            token.username = user.username;
            token.role = user.role;
            token.profilePicture = user.profilePicture;
          }
        } catch (error) {
          console.error('Error updating token:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.username = token.username as string;
        session.user.role = token.role as 'admin' | 'user';
        session.user.profilePicture = token.profilePicture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/auth-error',
  },
};
