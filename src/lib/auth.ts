import { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    // Google OAuth — production sign-in
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),

    // Credentials — email/password for development & demo
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text', placeholder: 'Your name (for signup)' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email.toLowerCase().trim();

        // Look up existing user
        let user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          // Existing user — verify password
          if (!user.password) return null; // OAuth-only account
          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) return null;
        } else {
          // New user — auto-register
          const hashedPassword = await bcrypt.hash(credentials.password, 10);
          user = await prisma.user.create({
            data: {
              email,
              name: credentials.name || email.split('@')[0],
              password: hashedPassword,
            },
          });
        }

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        (session.user as { id?: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};
