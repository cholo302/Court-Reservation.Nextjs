'use client'

import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import BouncingBallLoader, { BallSpinner } from '@/components/ui/BouncingBallLoader'

interface Settings {
  siteName: string
  siteEmail: string
  sitePhone: string
  siteAddress: string
  bookingStartHour: number
  bookingEndHour: number
  minBookingHours: number
  maxAdvanceBookingDays: number
  cancellationHours: number
  downpaymentPercent: number
  gcashNumber: string
  gcashName: string
  gcashQrImage: string
  maintenanceMode: boolean
  adminAlerts: boolean
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [uploadingQr, setUploadingQr] = useState(false)
  const qrFileInputRef = useRef<HTMLInputElement>(null)
  
  const [settings, setSettings] = useState<Settings>({
    siteName: 'Marikina Sports Center',
    siteEmail: 'contact@marikinasports.ph',
    sitePhone: '+63 912 345 6789',
    siteAddress: 'Shoe Avenue, Marikina City, Metro Manila',
    bookingStartHour: 6,
    bookingEndHour: 22,
    minBookingHours: 1,
    maxAdvanceBookingDays: 30,
    cancellationHours: 24,
    downpaymentPercent: 50,
    gcashNumber: '09123456789',
    gcashName: 'Marikina Sports Center',
    gcashQrImage: '/uploads/qrcodes/gcash-qr.jpg',
    maintenanceMode: false,
    adminAlerts: true,
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        if (res.ok) {
          const data = await res.json()
          setSettings(data.settings)
        }
      } catch (error) {
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setSettings({ ...settings, [name]: (e.target as HTMLInputElement).checked })
    } else if (type === 'number') {
      setSettings({ ...settings, [name]: parseInt(value) || 0 })
    } else {
      setSettings({ ...settings, [name]: value })
    }
  }

  const saveSettings = async (data: Settings) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error('Save failed:', res.status, errData)
        throw new Error('Failed')
      }
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    await saveSettings(settings)
  }

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingQr(true)
    try {
      const formData = new FormData()
      formData.append('qrImage', file)
      const res = await fetch('/api/admin/settings/gcash-qr', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Upload failed')
      }
      const data = await res.json()
      setSettings({ ...settings, gcashQrImage: data.imagePath + '?t=' + Date.now() })
      toast.success('GCash QR code updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload QR code')
    } finally {
      setUploadingQr(false)
      if (qrFileInputRef.current) qrFileInputRef.current.value = ''
    }
  }

  const tabs = [
    { id: 'general', label: 'General', icon: 'fa-cog' },
    { id: 'booking', label: 'Booking', icon: 'fa-calendar' },
    { id: 'payment', label: 'Payment', icon: 'fa-credit-card' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
    { id: 'system', label: 'System', icon: 'fa-server' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <BouncingBallLoader />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Configure system preferences and options</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-48">
          <div className="bg-white rounded-xl shadow-sm p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-3 rounded-lg mb-1 transition flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-ph-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <i className={`fas ${tab.icon} w-5`}></i>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm p-6">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">General Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site Name
                    </label>
                    <input
                      type="text"
                      name="siteName"
                      value={settings.siteName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="siteEmail"
                      value={settings.siteEmail}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="sitePhone"
                      value={settings.sitePhone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="siteAddress"
                      value={settings.siteAddress}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'booking' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Booking Settings</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opening Hour
                      </label>
                      <select
                        name="bookingStartHour"
                        value={settings.bookingStartHour}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, '0')}:00
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Closing Hour
                      </label>
                      <select
                        name="bookingEndHour"
                        value={settings.bookingEndHour}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {i.toString().padStart(2, '0')}:00
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Booking Duration (hours)
                    </label>
                    <input
                      type="number"
                      name="minBookingHours"
                      value={settings.minBookingHours}
                      onChange={handleChange}
                      min={1}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Advance Booking (days)
                    </label>
                    <input
                      type="number"
                      name="maxAdvanceBookingDays"
                      value={settings.maxAdvanceBookingDays}
                      onChange={handleChange}
                      min={1}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cancellation Window (hours before booking)
                    </label>
                    <input
                      type="number"
                      name="cancellationHours"
                      value={settings.cancellationHours}
                      onChange={handleChange}
                      min={0}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Bookings cannot be cancelled within this many hours of the start time
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Payment Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Downpayment (%)
                    </label>
                    <input
                      type="number"
                      name="downpaymentPercent"
                      value={settings.downpaymentPercent}
                      onChange={handleChange}
                      min={0}
                      max={100}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                    />
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-3">GCash Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GCash Number
                        </label>
                        <input
                          type="text"
                          name="gcashNumber"
                          value={settings.gcashNumber}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GCash Account Name
                        </label>
                        <input
                          type="text"
                          name="gcashName"
                          value={settings.gcashName}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          GCash QR Code
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                          Upload your GCash QR code image. This will be shown to customers during payment.
                        </p>
                        <div className="flex items-start gap-4">
                          <div className="w-40 h-40 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {settings.gcashQrImage ? (
                              <img
                                src={settings.gcashQrImage}
                                alt="GCash QR Code"
                                className="w-full h-full object-contain"
                                onError={(e: any) => {
                                  e.currentTarget.style.display = 'none'
                                  e.currentTarget.nextElementSibling.style.display = 'flex'
                                }}
                              />
                            ) : null}
                            <div className={`flex-col items-center justify-center text-center ${settings.gcashQrImage ? 'hidden' : 'flex'}`}>
                              <i className="fas fa-qrcode text-gray-300 text-3xl mb-2"></i>
                              <p className="text-xs text-gray-400">No QR code</p>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <input
                              ref={qrFileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handleQrUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => qrFileInputRef.current?.click()}
                              disabled={uploadingQr}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-ph-blue text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50"
                            >
                              {uploadingQr ? (
                                <>
                                  <BallSpinner />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-upload text-xs"></i>
                                  {settings.gcashQrImage ? 'Change QR Code' : 'Upload QR Code'}
                                </>
                              )}
                            </button>
                            <p className="text-[11px] text-gray-400">JPG, PNG, or WEBP. Max 5MB.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Notification Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Admin Alerts</p>
                      <p className="text-sm text-gray-500">Notify admins of new bookings</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="adminAlerts"
                        checked={settings.adminAlerts}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-ph-blue peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">System Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div>
                      <p className="font-medium text-yellow-800">Maintenance Mode</p>
                      <p className="text-sm text-yellow-600">
                        When enabled, the public site will show a maintenance page
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="maintenanceMode"
                        checked={settings.maintenanceMode}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-yellow-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-3">Database</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        Database: <span className="font-mono">court_reservation.sqlite</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Provider: <span className="font-mono">SQLite</span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-3">Danger Zone</h3>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <p className="text-sm text-red-600 mb-3">
                        These actions are irreversible. Please proceed with caution.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to clear ALL booking data? This will delete all bookings, payments, notifications, and activity logs. This cannot be undone.')) return
                            if (!confirm('This is your FINAL confirmation. All transactional data will be permanently deleted. Continue?')) return
                            try {
                              const res = await fetch('/api/admin/settings/danger', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'clear-data' }),
                              })
                              if (!res.ok) throw new Error('Failed')
                              toast.success('All booking data has been cleared')
                            } catch {
                              toast.error('Failed to clear data')
                            }
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          Clear All Data
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm('Clear expired bookings and old notifications?')) return
                            try {
                              const res = await fetch('/api/admin/settings/danger', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'clear-cache' }),
                              })
                              if (!res.ok) throw new Error('Failed')
                              toast.success('Stale data cleared successfully')
                            } catch {
                              toast.error('Failed to clear cache')
                            }
                          }}
                          className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition text-sm"
                        >
                          Clear Cache
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-ph-blue text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <BallSpinner />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
