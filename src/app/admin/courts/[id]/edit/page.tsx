'use client'

import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import BouncingBallLoader, { BallSpinner } from '@/components/ui/BouncingBallLoader'

interface CourtType {
  id: number
  name: string
  slug: string
}

export default function EditCourtPage() {
  const router = useRouter()
  const params = useParams()
  const courtId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [courtTypes, setCourtTypes] = useState<CourtType[]>([])
  const [thumbnailUploading, setThumbnailUploading] = useState(false)
  
  const [form, setForm] = useState({
    name: '',
    courtTypeId: '',
    customCourtTypeName: '',
    description: '',
    location: '',
    hourlyRate: '',
    thumbnail: '',
    rules: '',
    downpaymentPercent: '50',
    isActive: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch court types
        const typesResponse = await fetch('/api/court-types')
        const typesData = await typesResponse.json()
        setCourtTypes(typesData.courtTypes || [
          { id: 1, name: 'Basketball', slug: 'basketball' },
          { id: 2, name: 'Badminton', slug: 'badminton' },
          { id: 3, name: 'Volleyball', slug: 'volleyball' },
          { id: 4, name: 'Tennis', slug: 'tennis' },
        ])

        // Fetch court data
        const courtResponse = await fetch(`/api/courts/${courtId}`)
        const courtData = await courtResponse.json()
        const court = courtData.court

        if (court) {
          setForm({
            name: court.name || '',
            courtTypeId: court.courtTypeId?.toString() || '',
            customCourtTypeName: '',
            description: court.description || '',
            location: court.location || '',
            hourlyRate: court.hourlyRate?.toString() || '',
            thumbnail: court.thumbnail || '',
            rules: court.rules || '',
            downpaymentPercent: court.downpaymentPercent?.toString() || '50',
            isActive: court.isActive ?? true,
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load court data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [courtId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setThumbnailUploading(true)
    try {
      const fd = new FormData()
      fd.append('thumbnail', file)
      const res = await fetch('/api/courts/upload-thumbnail', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setForm((f) => ({ ...f, thumbnail: data.url }))
      toast.success('Image uploaded')
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setThumbnailUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!form.name || !form.courtTypeId || !form.hourlyRate) {
      toast.error('Please fill in required fields')
      return
    }

    if (form.courtTypeId === 'other' && !form.customCourtTypeName.trim()) {
      toast.error('Please specify the court type name')
      return
    }

    setSaving(true)

    try {
      let resolvedCourtTypeId = parseInt(form.courtTypeId)

      if (form.courtTypeId === 'other') {
        const ctRes = await fetch('/api/court-types', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.customCourtTypeName.trim() }),
        })
        if (!ctRes.ok) {
          const ctErr = await ctRes.json()
          throw new Error(ctErr.error || 'Failed to create court type')
        }
        const ctData = await ctRes.json()
        resolvedCourtTypeId = ctData.courtType.id
      }

      const response = await fetch(`/api/courts/${courtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          courtTypeId: resolvedCourtTypeId,
          description: form.description || null,
          location: form.location || null,
          hourlyRate: parseFloat(form.hourlyRate),
          thumbnail: form.thumbnail || null,
          rules: form.rules || null,
          downpaymentPercent: parseInt(form.downpaymentPercent),
          isActive: form.isActive,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update court')
      }

      toast.success('Court updated successfully')
      router.push('/admin/courts')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update court')
    } finally {
      setSaving(false)
    }
  }

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
        <Link href="/admin/courts" className="text-ph-blue hover:underline mb-4 inline-block">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Courts
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Court</h1>
        <p className="text-gray-600">Update court information</p>
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
                <option value="other">Other (specify below)</option>
              </select>
              {form.courtTypeId === 'other' && (
                <div className="mt-2">
                  <input
                    type="text"
                    name="customCourtTypeName"
                    value={form.customCourtTypeName}
                    onChange={handleChange}
                    placeholder="Enter court type name..."
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                  />
                </div>
              )}
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
                Thumbnail
              </label>
              <label className="flex items-center gap-2 cursor-pointer w-fit mb-2">
                <span className="px-3 py-1.5 bg-ph-blue text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5">
                  {thumbnailUploading ? (
                    <><BallSpinner /> Uploading...</>
                  ) : (
                    <><i className="fas fa-upload"></i> Upload Photo</>
                  )}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailUpload}
                  disabled={thumbnailUploading}
                />
              </label>
              <input
                type="text"
                name="thumbnail"
                value={form.thumbnail}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
                placeholder="Or paste image URL..."
              />
              {form.thumbnail && (
                <div className="mt-2 relative w-full h-36 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={form.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, thumbnail: '' }))}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="w-4 h-4 text-ph-blue rounded focus:ring-ph-blue"
                />
                <span className="text-sm font-medium text-gray-700">Court is Active</span>
              </label>
              <p className="text-sm text-gray-500 ml-6">Inactive courts won't appear in search results</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Location</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-ph-blue focus:border-transparent"
              placeholder="e.g., 123 Sports Ave, Marikina Sports Center"
            />
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
            disabled={saving}
            className="bg-ph-blue text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
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
