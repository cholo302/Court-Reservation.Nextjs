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
  createdAt: string
}

export default function AdminUsersPage() {
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter') || ''

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])

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
        : action === 'deactivate'
        ? 'Deactivate this user account?'
        : 'Verify this user ID?'

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
            case 'verify':
              return { ...u, isActive: true }
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
                    {user.govIdType ? (
                      <div>
                        <p className="text-sm capitalize">
                          {user.govIdType.replace('_', ' ')}
                        </p>
                        {user.isActive ? (
                          <span className="text-xs text-green-600">
                            <i className="fas fa-check-circle mr-1"></i>Verified
                          </span>
                        ) : (
                          <span className="text-xs text-yellow-600">
                            <i className="fas fa-clock mr-1"></i>Pending
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No ID</span>
                    )}
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
                      {!user.isActive && user.govIdType && (
                        <button
                          onClick={() => handleAction(user.id, 'verify')}
                          className="text-green-600 hover:underline text-xs"
                        >
                          Verify ID
                        </button>
                      )}
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
    </div>
  )
}
