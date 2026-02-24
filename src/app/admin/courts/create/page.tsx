'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface CourtType {
  id: number
  name: string
  slug: string
}

export default function CreateCourtPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [courtTypes, setCourtTypes] = useState<CourtType[]>([])
  const [amenityInput, setAmenityInput] = useState('')
  
  const [form, setForm] = useState({
    name: '',
    courtTypeId: '',
    description: '',
    location: '',
    barangay: '',
    city: '',
    province: '',
    hourlyRate: '',
    peakHourRate: '',
    halfCourtRate: '',
    weekendRate: '',
    capacity: '',
    amenities: [] as string[],
    thumbnail: '',
    rules: '',
    minBookingHours: '1',
    maxBookingHours: '4',
    downpaymentPercent: '50',
  })

  useEffect(() => {
    // Fetch court types
    const fetchCourtTypes = async () => {
      try {
        const response = await fetch('/api/court-types')
        const data = await response.json()
        setCourtTypes(data.courtTypes || [])
      } catch (error) {
        console.error('Error fetching court types:', error)
        // Fallback court types
        setCourtTypes([
          { id: 1, name: 'Basketball', slug: 'basketball' },
          { id: 2, name: 'Badminton', slug: 'badminton' },
          { id: 3, name: 'Volleyball', slug: 'volleyball' },
          { id: 4, name: 'Tennis', slug: 'tennis' },
        ])
      }
    }
    fetchCourtTypes()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const addAmenity = () => {
    if (amenityInput.trim() && !form.amenities.includes(amenityInput.trim())) {
      setForm({ ...form, amenities: [...form.amenities, amenityInput.trim()] })
      setAmenityInput('')
    }
  }

  const removeAmenity = (amenity: string) => {
    setForm({ ...form, amenities: form.amenities.filter((a) => a !== amenity) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name || !form.courtTypeId || !form.hourlyRate) {
      toast.error('Please fill in required fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          courtTypeId: parseInt(form.courtTypeId),
          description: form.description || null,
          location: form.location || null,
          barangay: form.barangay || null,
          city: form.city || null,
          province: form.province || null,
          hourlyRate: parseFloat(form.hourlyRate),
          peakHourRate: form.peakHourRate ? parseFloat(form.peakHourRate) : null,
          halfCourtRate: form.halfCourtRate ? parseFloat(form.halfCourtRate) : null,
          weekendRate: form.weekendRate ? parseFloat(form.weekendRate) : null,
          capacity: form.capacity ? parseInt(form.capacity) : null,
          amenities: form.amenities.length > 0 ? form.amenities : null,
          thumbnail: form.thumbnail || null,
          rules: form.rules || null,
          minBookingHours: parseInt(form.minBookingHours),
          maxBookingHours: parseInt(form.maxBookingHours),
          downpaymentPercent: parseInt(form.downpaymentPercent),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create court')
      }

      toast.success('Court created successfully')
      router.push('/admin/courts')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create court')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/courts" className="text-ph-blue hover:underline mb-4 inline-block">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Courts
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Court</h1>
        <p className="text-gray-600">Add a new court facility to the system</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Court Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="e.g., Basketball Court A"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Court Type <span className="text-red-500">*</span>
              </label>
              <select
                name="courtTypeId"
                value={form.courtTypeId}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                required
              >
                <option value="">Select type...</option>
                {courtTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="Describe the court facilities..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thumbnail URL
              </label>
              <input
                type="text"
                name="thumbnail"
                value={form.thumbnail}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacity (players)
              </label>
              <input
                type="number"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="e.g., 10"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Address
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="e.g., 123 Sports Ave, Marikina Sports Center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Barangay
              </label>
              <input
                type="text"
                name="barangay"
                value={form.barangay}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="e.g., Sto. Niño"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="e.g., Marikina City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province
              </label>
              <input
                type="text"
                name="province"
                value={form.province}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="e.g., Metro Manila"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate (₱) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="hourlyRate"
                value={form.hourlyRate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="e.g., 500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peak Hour Rate (₱)
              </label>
              <input
                type="number"
                name="peakHourRate"
                value={form.peakHourRate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="e.g., 700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Half Court Rate (₱)
              </label>
              <input
                type="number"
                name="halfCourtRate"
                value={form.halfCourtRate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="e.g., 300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weekend Rate (₱)
              </label>
              <input
                type="number"
                name="weekendRate"
                value={form.weekendRate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="e.g., 600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Downpayment % <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="downpaymentPercent"
                value={form.downpaymentPercent}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Booking Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Booking Hours
              </label>
              <input
                type="number"
                name="minBookingHours"
                value={form.minBookingHours}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Booking Hours
              </label>
              <input
                type="number"
                name="maxBookingHours"
                value={form.maxBookingHours}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Amenities</h2>
          
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
              placeholder="e.g., Shower rooms, Parking, Scoreboard..."
            />
            <button
              type="button"
              onClick={addAmenity}
              className="px-4 py-2 bg-ph-blue text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {form.amenities.map((amenity) => (
              <span
                key={amenity}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(amenity)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <i className="fas fa-times"></i>
                </button>
              </span>
            ))}
            {form.amenities.length === 0 && (
              <p className="text-gray-500 text-sm">No amenities added yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Rules & Guidelines</h2>
          
          <textarea
            name="rules"
            value={form.rules}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
            placeholder="Enter court rules and guidelines..."
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-ph-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i>
                Create Court
              </>
            )}
          </button>
          <Link
            href="/admin/courts"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
