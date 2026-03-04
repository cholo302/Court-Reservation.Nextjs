// Type definitions for the Court Reservation System

export interface User {
  id: number
  name: string
  email: string
  phone?: string | null
  role: string
  profileImage?: string | null
  isBlacklisted: boolean
  blacklistReason?: string | null
  isActive: boolean
  govIdType?: string | null
  govIdPhoto?: string | null
  facePhoto?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CourtType {
  id: number
  name: string
  slug: string
  icon?: string | null
}

export interface Court {
  id: number
  courtTypeId: number
  name: string
  description?: string | null
  location?: string | null
  barangay?: string | null
  city?: string | null
  province?: string | null
  hourlyRate: number
  peakHourRate?: number | null
  halfCourtRate?: number | null
  weekendRate?: number | null
  capacity?: number | null
  amenities?: string | null // JSON array string
  thumbnail?: string | null
  rules?: string | null
  operatingHours?: string | null // JSON string
  minBookingHours: number
  maxBookingHours: number
  downpaymentPercent: number
  isActive: boolean
  rating: number
  createdAt: Date
  updatedAt: Date
  courtType?: CourtType
  courtTypeName?: string
  courtTypeSlug?: string
  amenitiesArray?: string[]
}

export interface Booking {
  id: number
  bookingCode: string
  userId: number
  courtId: number
  bookingDate: Date | string
  startTime: string
  endTime: string
  durationHours: number
  isHalfCourt: boolean
  hourlyRate: number
  totalAmount: number
  downpaymentAmount: number
  balanceAmount: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  paymentType?: string | null
  entryQrCode?: string | null
  playerCount?: number | null
  notes?: string | null
  adminNotes?: string | null
  confirmedAt?: Date | null
  paidAt?: Date | null
  cancelledAt?: Date | null
  cancellationReason?: string | null
  expiresAt?: Date | null
  createdAt: Date
  updatedAt: Date
  user?: User
  court?: Court
  courtName?: string
  courtType?: string
  userName?: string
  userEmail?: string
  userPhone?: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled' | 'no_show' | 'expired'
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export interface Payment {
  id: number
  paymentReference: string
  bookingId: number
  userId: number
  amount: number
  paymentMethod?: string | null
  paymentType?: string | null
  qrCodeUrl?: string | null
  qrCodeData?: string | null
  checkoutUrl?: string | null
  transactionId?: string | null
  proofScreenshot?: string | null
  status: string
  verifiedBy?: number | null
  verifiedAt?: Date | null
  paidAt?: Date | null
  createdAt: Date
  updatedAt: Date
  booking?: Booking
}

export interface Review {
  id: number
  bookingId: number
  userId: number
  courtId: number
  rating: number
  comment?: string | null
  createdAt: Date
  updatedAt: Date
  user?: User
  userName?: string
}

export interface Notification {
  id: number
  userId: number
  type: string
  title: string
  message: string
  data?: string | null
  channel: string
  readAt?: Date | null
  createdAt: Date
}

export interface TimeSlot {
  start: string
  end: string
  available: boolean
  isPeak: boolean
  rate: number
}

export interface PriceCalculation {
  hours: number
  subtotal: number
  total: number
  downpayment: number
  balance: number
  breakdown: {
    regularHours: number
    peakHours: number
    regularAmount: number
    peakAmount: number
  }
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
}

export interface DashboardStats {
  today: {
    totalBookings: number
    completed: number
    revenue: number
  }
  week: {
    totalBookings: number
    revenue: number
  }
  month: {
    totalBookings: number
    revenue: number
  }
}
