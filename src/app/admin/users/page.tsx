'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface User {
  id: number
  name: string
  email: string
  phone: string
  role: string
  isActive: boolean
  isBlacklisted: boolean
  govIdType: string | null
  govIdPhoto: string | null
  facePhoto: string | null
  createdAt: string
}

export default function AdminUsersPage() {
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter') || ''

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [viewingID, setViewingID] = useState<{ type: 'gov' | 'face'; image: string } | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const params = new URLSearchParams()
        if (filter) params.set('filter', filter)

        const response = await fetch(`/api/admin/users?${params.toString()}`)
        const data = await response.json()
        setUsers(data.users || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [filter])

  const handleAction = async (userId: number, action: string) => {
    const confirmMsg =
      action === 'blacklist'
        ? 'Are you sure you want to blacklist this user?'
        : action === 'unblacklist'
        ? 'Remove this user from blacklist?'
        : action === 'activate'
        ? 'Activate this user account?'
        : 'Deactivate this user account?'

    if (!confirm(confirmMsg)) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })

      if (!response.ok) throw new Error('Failed')

      toast.success('Action completed successfully')

      // Update local state
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u
          switch (action) {
            case 'blacklist':
              return { ...u, isBlacklisted: true }
            case 'unblacklist':
              return { ...u, isBlacklisted: false }
            case 'activate':
              return { ...u, isActive: true }
            case 'deactivate':
              return { ...u, isActive: false }
            default:
              return u
          }
        })
      )
    } catch (error) {
      toast.error('Action failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
      </div>
    )
  }

  const filters = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending Verification' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'blacklisted', label: 'Blacklisted' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-600">View and manage user accounts</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={f.value ? `/admin/users?filter=${f.value}` : '/admin/users'}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f.value
                  ? 'bg-ph-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Gov ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <i className="fas fa-users text-4xl mb-2"></i>
                  <p>No users found</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <i className="fas fa-user text-gray-500"></i>
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm">{user.email}</p>
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.govIdPhoto ? (
                        <button
                          onClick={() => setViewingID({ type: 'gov', image: user.govIdPhoto! })}
                          className="text-ph-blue hover:text-blue-800 text-xs font-medium"
                          title={`Government ID: ${user.govIdType}`}
                        >
                          <i className="fas fa-id-card mr-1"></i>
                          View ID
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">No ID</span>
                      )}
                      {user.facePhoto && (
                        <button
                          onClick={() => setViewingID({ type: 'face', image: user.facePhoto! })}
                          className="text-green-600 hover:text-green-800 text-xs font-medium"
                        >
                          <i className="fas fa-camera mr-1"></i>
                          Selfie
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {user.isBlacklisted && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          Blacklisted
                        </span>
                      )}
                      {!user.isBlacklisted && (
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            user.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.isActive ? (
                        <button
                          onClick={() => handleAction(user.id, 'deactivate')}
                          className="text-yellow-600 hover:underline text-xs"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(user.id, 'activate')}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Activate
                        </button>
                      )}
                      {user.isBlacklisted ? (
                        <button
                          onClick={() => handleAction(user.id, 'unblacklist')}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Unblacklist
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(user.id, 'blacklist')}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Blacklist
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ID Viewer Modal */}
      {viewingID && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingID(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {viewingID.type === 'gov' ? 'Government ID' : 'Selfie/Face Photo'}
              </h3>
              <button
                onClick={() => setViewingID(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh]">
              <img
                src={viewingID.image}
                alt={viewingID.type === 'gov' ? 'Government ID' : 'Face Photo'}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
