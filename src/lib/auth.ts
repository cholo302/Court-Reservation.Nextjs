import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        })

        if (!user) {
          throw new Error('Invalid email or password')
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid email or password')
        }

        if (user.isBlacklisted) {
          throw new Error(`Your account has been suspended. Reason: ${user.blacklistReason || 'Contact admin'}`)
        }

        if (!user.isActive) {
          throw new Error('Please verify your email address before logging in. Check your inbox for the verification link.')
        }

        // Derive verification status
        const verificationStatus = user.isIdVerified
          ? 'verified' as const
          : user.isIdInvalid
          ? 'rejected' as const
          : user.govIdPhoto
          ? 'pending' as const
          : 'none' as const

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.profileImage || user.facePhoto,
          isIdVerified: user.isIdVerified,
          verificationStatus,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.picture = user.image
        token.isIdVerified = (user as any).isIdVerified ?? false
        token.verificationStatus = (user as any).verificationStatus ?? 'none'
      }
      
      // Check if user is still active and refresh verification status
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: parseInt(token.id as string) },
          select: { isActive: true, isBlacklisted: true, isIdVerified: true, isIdInvalid: true, govIdPhoto: true, profileImage: true, facePhoto: true },
        })

        // If user is deleted, deactivated, or blacklisted, mark token as invalid
        if (!dbUser || !dbUser.isActive || dbUser.isBlacklisted) {
          token.invalid = true
        }
        // Keep verification status and profile image up to date
        if (dbUser) {
          token.isIdVerified = dbUser.isIdVerified
          token.verificationStatus = dbUser.isIdVerified
            ? 'verified'
            : dbUser.isIdInvalid
            ? 'rejected'
            : dbUser.govIdPhoto
            ? 'pending'
            : 'none'
          token.picture = dbUser.profileImage || dbUser.facePhoto || token.picture
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // Check if token is marked as invalid
      if (token.invalid) {
        return null as any // This will force re-authentication
      }
      
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.image = (token.picture as string) || null
        session.user.isIdVerified = (token.isIdVerified as boolean) ?? false
        session.user.verificationStatus = (token.verificationStatus as any) ?? 'none'
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Handle Google OAuth sign in
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        if (!existingUser) {
          // Create new user from Google
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name!,
              password: '', // No password for OAuth users
              provider: 'google',
              providerId: account.providerAccountId,
              profileImage: user.image,
              isActive: true,
              isIdVerified: false,
            },
          })
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || (() => { if (process.env.NODE_ENV === 'production') throw new Error('NEXTAUTH_SECRET must be set in production'); return 'dev-only-secret-not-for-production'; })(),
}
