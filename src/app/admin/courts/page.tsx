'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Court {
  id: number
  name: string
  courtType: { name: string }
  location: string | null
  hourlyRate: number
  isActive: boolean
  rating: number
  thumbnail: string | null
}

export default function AdminCourtsPage() {
  const [loading, setLoading] = useState(true)
  const [courts, setCourts] = useState<Court[]>([])

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const response = await fetch('/api/courts')
        const data = await response.json()
        setCourts(data.courts || [])
      } catch (error) {
        console.error('Error fetching courts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourts()
  }, [])

  const handleToggleStatus = async (courtId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this court?`)) return

    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      })

      if (!response.ok) throw new Error('Failed')

      toast.success(`Court ${action}d successfully`)
      setCourts((prev) =>
        prev.map((c) => (c.id === courtId ? { ...c, isActive: !currentStatus } : c))
      )
    } catch (error) {
      toast.error('Action failed')
    }
  }

  const handleDelete = async (courtId: number) => {
    if (!confirm('Are you sure you want to delete this court? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/courts/${courtId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed')

      toast.success('Court deleted successfully')
      setCourts((prev) => prev.filter((c) => c.id !== courtId))
    } catch (error) {
      toast.error('Failed to delete court')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Courts</h1>
          <p className="text-gray-500 text-sm mt-1">Add, edit, and manage court facilities</p>
        </div>
        <Link
          href="/admin/courts/create"
          className="bg-ph-blue text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          Add Court
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Courts</p>
              <p className="text-2xl font-bold">{courts.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-basketball text-blue-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Courts</p>
              <p className="text-2xl font-bold text-green-600">
                {courts.filter((c) => c.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-check-circle text-green-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inactive Courts</p>
              <p className="text-2xl font-bold text-gray-600">
                {courts.filter((c) => !c.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-pause-circle text-gray-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Courts Grid */}
      {courts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <i className="fas fa-basketball text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500 mb-4">No courts found</p>
          <Link
            href="/admin/courts/create"
            className="text-ph-blue hover:underline"
          >
            Add your first court
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map((court) => (
            <div
              key={court.id}
              className={`bg-white rounded-xl shadow-sm overflow-hidden ${
                !court.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Thumbnail */}
              <div className="h-40 bg-gray-100 relative">
                {court.thumbnail ? (
                  <img
                    src={court.thumbnail}
                    alt={court.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i className="fas fa-image text-4xl text-gray-300"></i>
                  </div>
                )}
                {!court.isActive && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Inactive
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{court.name}</h3>
                    <p className="text-sm text-gray-500">{court.courtType?.name}</p>
                  </div>
                  <span className="text-ph-blue font-semibold">
                    {formatPrice(Number(court.hourlyRate))}/hr
                  </span>
                </div>

                {court.location && (
                  <p className="text-sm text-gray-500 mb-2">
                    <i className="fas fa-location-dot mr-1"></i>
                    {court.location}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Link
                    href={`/courts/${court.id}`}
                    className="flex-1 text-center py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  >
                    <i className="fas fa-eye mr-1"></i>
                    View
                  </Link>
                  <Link
                    href={`/admin/courts/${court.id}/edit`}
                    className="flex-1 text-center py-2 text-sm text-ph-blue hover:bg-blue-50 rounded-lg transition"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(court.id, court.isActive)}
                    className={`flex-1 text-center py-2 text-sm rounded-lg transition ${
                      court.isActive
                        ? 'text-yellow-600 hover:bg-yellow-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    <i className={`fas fa-${court.isActive ? 'pause' : 'play'} mr-1`}></i>
                    {court.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDelete(court.id)}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
