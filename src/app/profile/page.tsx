'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BouncingBallLoader, { BallSpinner } from '@/components/ui/BouncingBallLoader'
import toast from 'react-hot-toast'
import { Footer } from '@/components/layout'

interface UserProfile {
  id: number
  name: string
  firstName: string
  middleName: string | null
  lastName: string
  email: string
  phone: string
  avatar: string | null
  govIdType: string | null
  createdAt: string
  preferences: {
    sms: boolean
    email: boolean
  }
}

interface Stats {
  totalBookings: number
  completed: number
  totalSpent: number
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const isAdmin = session?.user?.role === 'admin'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    password: '',
    passwordConfirmation: '',
  })

  const [preferences, setPreferences] = useState({
    sms: true,
    email: true,
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        const data = await response.json()

        setUser(data.user)
        setStats(data.stats)
        setFormData({
          firstName: data.user.firstName || '',
          middleName: data.user.middleName || '',
          lastName: data.user.lastName || '',
          phone: data.user.phone || '',
        })
        setPreferences(data.user.preferences || { sms: true, email: true })
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [session, status, router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to update profile')

      toast.success('Profile updated successfully')
      const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ')
      update({ name: fullName })
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.password !== passwordData.passwordConfirmation) {
      toast.error('Passwords do not match')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      setPasswordData({ currentPassword: '', password: '', passwordConfirmation: '' })
    } catch (error: any) {
      toast.error(error?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const handlePreferencesUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/profile/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) throw new Error('Failed to update preferences')

      toast.success('Preferences updated successfully')
    } catch (error) {
      toast.error('Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(price)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BouncingBallLoader />
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-ph-blue hover:text-blue-700 font-medium mb-8 transition-colors"
      >
        <i className="fas fa-arrow-left"></i>
        Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-24 h-24 bg-ph-blue/10 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile Photo"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <i className="fas fa-user text-ph-blue text-3xl"></i>
              )}
            </div>

            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>

            {user.phone && (
              <p className="text-gray-500 mt-1">
                <i className="fas fa-phone mr-1"></i>
                {user.phone}
              </p>
            )}

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            {/* ID Status - hidden for admins */}
            {!isAdmin && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <i className="fas fa-id-card text-gray-400"></i> ID Status
              </span>
              {session?.user?.verificationStatus === 'verified' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  <i className="fas fa-circle-check"></i> Verified
                </span>
              ) : session?.user?.verificationStatus === 'pending' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                  <i className="fas fa-clock"></i> Pending
                </span>
              ) : session?.user?.verificationStatus === 'rejected' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 px-3 py-1 rounded-full">
                  <i className="fas fa-xmark"></i> Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                  <i className="fas fa-minus"></i> Not Verified
                </span>
              )}
            </div>
            )}
          </div>

          {/* Stats */}
          {stats && (
            <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
              <h3 className="font-semibold mb-4">Booking Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Bookings</span>
                  <span className="font-semibold">{isAdmin ? 0 : stats.totalBookings}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed</span>
                  <span className="font-semibold text-green-600">{isAdmin ? 0 : stats.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Spent</span>
                  <span className="font-semibold text-ph-blue">
                    {isAdmin ? formatPrice(0) : formatPrice(stats.totalSpent)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Profile</h3>

            <form onSubmit={handleProfileUpdate}>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    placeholder="Juan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    placeholder="Dela Cruz"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Middle Name <span className="text-xs text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    placeholder="Santos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09XX XXX XXXX"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-ph-blue text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? (
                  <BallSpinner className="mr-2" />
                ) : (
                  <i className="fas fa-save mr-2"></i>
                )}
                Save Changes
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>

            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    value={passwordData.password}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, password: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="password_confirmation"
                    required
                    value={passwordData.passwordConfirmation}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        passwordConfirmation: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-4 bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
              >
                {saving ? (
                  <BallSpinner className="mr-2" />
                ) : (
                  <i className="fas fa-key mr-2"></i>
                )}
                Update Password
              </button>
            </form>
          </div>

          
             
            
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
