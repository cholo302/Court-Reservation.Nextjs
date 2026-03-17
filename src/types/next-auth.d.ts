import 'next-auth'
import { DefaultSession } from 'next-auth'

type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      isIdVerified: boolean
      verificationStatus: VerificationStatus
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    isIdVerified?: boolean
    verificationStatus?: VerificationStatus
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    isIdVerified?: boolean
    verificationStatus?: VerificationStatus
  }
}
