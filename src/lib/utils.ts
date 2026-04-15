import crypto from 'crypto'

// Utility functions for the Court Reservation System

export const APP_NAME = process.env.APP_NAME || 'Court Reservation'
export const BOOKING_ADVANCE_DAYS = parseInt(process.env.BOOKING_ADVANCE_DAYS || '14')
export const RESERVATION_EXPIRY_MINUTES = parseInt(process.env.RESERVATION_EXPIRY_MINUTES || '30')
export const OPERATING_START_HOUR = parseInt(process.env.OPERATING_START_HOUR || '6')
export const OPERATING_END_HOUR = parseInt(process.env.OPERATING_END_HOUR || '22')
export const PEAK_HOURS_START = parseInt(process.env.PEAK_HOURS_START || '17')
export const PEAK_HOURS_END = parseInt(process.env.PEAK_HOURS_END || '21')

// Format price to Philippine Peso
export function formatPrice(amount: number | string | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0)
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

// Format date for display
export function formatDate(date: Date | string, format: 'short' | 'long' | 'full' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
  }
  
  return d.toLocaleDateString('en-PH', optionsMap[format])
}

// Format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

// Generate booking code
export function generateBookingCode(): string {
  const prefix = 'CR'
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const random = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4)
  return `${prefix}${date}${random}`
}

// Generate payment reference
export function generatePaymentReference(): string {
  const prefix = 'PAY'
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const random = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6)
  return `${prefix}${date}${random}`
}

// Check if time is in peak hours
export function isPeakHour(time: string): boolean {
  const hour = parseInt(time.split(':')[0])
  return hour >= PEAK_HOURS_START && hour < PEAK_HOURS_END
}

// Check if date is weekend
export function isWeekend(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDay()
  return day === 0 || day === 6
}

// Calculate duration in hours between two times
export function calculateDuration(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number)
  const [endH, endM] = endTime.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  return (endMinutes - startMinutes) / 60
}

// Get available time slots for a date
export function getTimeSlots(
  startHour: number = OPERATING_START_HOUR,
  endHour: number = OPERATING_END_HOUR
): string[] {
  const slots: string[] = []
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`)
  }
  return slots
}

// Sanitize string
export function sanitize(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}

// Validate Philippine phone number
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return /^(09|\+639|639)\d{9}$/.test(cleaned) || /^0\d{10}$/.test(cleaned)
}

// Get amenity icon class
export function getAmenityIcon(amenity: string): string {
  const icons: Record<string, string> = {
    parking: 'fa-parking',
    shower: 'fa-shower',
    locker: 'fa-lock',
    lights: 'fa-lightbulb',
    aircon: 'fa-snowflake',
    wifi: 'fa-wifi',
    restroom: 'fa-restroom',
    'drinking-water': 'fa-tint',
  }
  return icons[amenity] || 'fa-check'
}

// Get status badge class
export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-600',
    processing: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// ID Types
export const ID_TYPES: Record<string, string> = {
  lto_license: "LTO Driver's License",
  passport: 'Philippine Passport',
  nbi: 'NBI Clearance',
  national_id: 'National ID',
  barangay_id: 'Barangay ID',
  sss_id: 'SSS ID',
  tin_id: 'TIN ID',
  prc_id: 'PRC License',
  postal_id: 'Postal ID',
}

export function getIDTypeName(type: string): string {
  return ID_TYPES[type] || type
}
