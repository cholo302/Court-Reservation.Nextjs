'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import BouncingBallLoader from '@/components/ui/BouncingBallLoader'
import toast from 'react-hot-toast'

interface User {
  id: number
  name: string
  email: string
  phone: string
  role: string
  isActive: boolean
  isBlacklisted: boolean
  isIdInvalid: boolean
  isIdVerified: boolean
  govIdType: string | null
  govIdPhoto: string | null
  govIdNumber: string | null
  govIdName: string | null
  govIdBirthdate: string | null
  govIdExpiry: string | null
  govIdAddress: string | null
  facePhoto: string | null
  profileImage: string | null
  createdAt: string
  updatedAt: string
  hasResubmittedDocs: boolean
}

function UsersContent() {
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter') || ''

  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [viewingID, setViewingID] = useState<{ type: 'gov' | 'face'; image: string; updatedAt?: string; createdAt?: string; user?: User } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')



  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
  }

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

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAction = async (userId: number, action: string) => {
    const confirmMsg =
      action === 'blacklist'
        ? 'Are you sure you want to blacklist this user?'
        : action === 'unblacklist'
        ? 'Remove this user from blacklist?'
        : action === 'verify_id'
        ? 'Approve this user\'s ID verification?'
        : action === 'unverify_id'
        ? 'Revoke this user\'s ID verification?'
        : action === 'not_valid_id'
        ? 'Mark this user ID/Selfie as invalid?'
        : action === 'delete'
        ? 'Are you sure you want to PERMANENTLY DELETE this user? This will remove all their bookings, payments, and data. This cannot be undone!'
        : 'Mark this user ID as valid?'

    if (!confirm(confirmMsg)) return

    try {
      const endpoint = action === 'delete'
        ? `/api/admin/users/${userId}?action=delete`
        : '/api/admin/users'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      })

      if (!response.ok) throw new Error('Failed')

      toast.success(action === 'delete' ? 'User deleted successfully' : 'Action completed successfully')
      
      // Update local state immediately
      if (action === 'delete') {
        setUsers((prev) => prev.filter((u) => u.id !== userId))
      } else {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u
            switch (action) {
              case 'blacklist':
                return { ...u, isBlacklisted: true }
              case 'unblacklist':
                return { ...u, isBlacklisted: false }
              case 'not_valid_id':
                return { ...u, isIdInvalid: true, isIdVerified: false }
              case 'valid_id':
                return { ...u, isIdInvalid: false }
              case 'verify_id':
                return { ...u, isIdVerified: true, isIdInvalid: false }
              case 'unverify_id':
                return { ...u, isIdVerified: false, isIdInvalid: true }
              default:
                return u
            }
          })
        )
      }
    } catch (error) {
      toast.error('Action failed')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <BouncingBallLoader />
      </div>
    )
  }

  const filters = [
    { value: '', label: 'All' },
    { value: 'verified', label: 'ID Verified' },
    { value: 'not_verified', label: 'Not Verified' },
    { value: 'pending', label: 'Pending Verification' },
    { value: 'blacklisted', label: 'Blacklisted' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Users</h1>
        <p className="text-gray-500 text-sm mt-1">View and manage user accounts</p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/users?filter=${f.value}` : '/admin/users'}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f.value
                ? 'bg-ph-blue text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ph-blue focus:border-transparent outline-none transition"
            />
          </div>
          <button
            onClick={() => fetchUsers()}
            className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors font-medium text-sm"
            title="Refresh users list to see updated documents"
          >
            <i className="fas fa-refresh"></i>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Mobile card layout */}
        <div className="md:hidden divide-y divide-gray-100">
          {users.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <i className="fas fa-users text-gray-200 text-4xl mb-3"></i>
              <p className="text-sm text-gray-400">No users found</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <i className="fas fa-search text-gray-200 text-4xl mb-3"></i>
              <p className="text-sm text-gray-400">No users match your search</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden">
                    {user.facePhoto || user.profileImage ? (
                      <img src={user.profileImage || user.facePhoto!} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <i className="fas fa-user text-gray-500"></i>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {user.isBlacklisted && (
                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[10px]">Blacklisted</span>
                    )}
                    {user.role === 'admin' && !user.isBlacklisted && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px]"><i className="fas fa-shield-halved mr-0.5"></i>Admin</span>
                    )}
                    {user.role !== 'admin' && user.isIdInvalid && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px]">Invalid ID</span>
                    )}
                    {user.role !== 'admin' && (
                      user.isIdVerified ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px]"><i className="fas fa-check-circle mr-0.5"></i>Verified</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px]"><i className="fas fa-clock mr-0.5"></i>Not Verified</span>
                      )
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {user.role !== 'admin' && user.govIdPhoto && (
                    <button
                      onClick={() => setViewingID({ type: 'gov', image: user.govIdPhoto!, updatedAt: user.updatedAt, createdAt: user.createdAt, user })}
                      className="text-ph-blue hover:text-blue-800 text-xs font-medium inline-flex items-center gap-1"
                    >
                      <i className="fas fa-id-card"></i> View ID
                    </button>
                  )}
                  {user.role !== 'admin' && user.facePhoto && (
                    <button
                      onClick={() => setViewingID({ type: 'face', image: user.facePhoto!, updatedAt: user.updatedAt, createdAt: user.createdAt, user })}
                      className="text-green-600 hover:text-green-800 text-xs font-medium inline-flex items-center gap-1"
                    >
                      <i className="fas fa-camera"></i> Selfie
                    </button>
                  )}
                  {user.hasResubmittedDocs && (
                    <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>New
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {user.isBlacklisted ? (
                    <button onClick={() => handleAction(user.id, 'unblacklist')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium border border-blue-200">
                      <i className="fas fa-undo text-[10px]"></i> Unblacklist
                    </button>
                  ) : (
                    <button onClick={() => handleAction(user.id, 'blacklist')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium border border-red-200">
                      <i className="fas fa-times-circle text-[10px]"></i> Blacklist
                    </button>
                  )}
                  {!user.isIdVerified && user.govIdPhoto && user.role !== 'admin' && (
                    <button onClick={() => handleAction(user.id, 'verify_id')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium border border-emerald-200">
                      <i className="fas fa-shield-check text-[10px]"></i> Verify
                    </button>
                  )}
                  {user.isIdVerified && user.role !== 'admin' && (
                    <button onClick={() => handleAction(user.id, 'unverify_id')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-medium border border-orange-200">
                      <i className="fas fa-times-circle text-[10px]"></i> Unverify
                    </button>
                  )}
                  {user.role !== 'admin' && (user.isIdInvalid ? (
                    <button onClick={() => handleAction(user.id, 'valid_id')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium border border-green-200">
                      <i className="fas fa-check-circle text-[10px]"></i> Valid
                    </button>
                  ) : (
                    <button onClick={() => handleAction(user.id, 'not_valid_id')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-medium border border-orange-200">
                      <i className="fas fa-exclamation-circle text-[10px]"></i> Not Valid
                    </button>
                  ))}
                  <button onClick={() => handleAction(user.id, 'delete')} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-200 text-xs font-medium border border-red-200">
                    <i className="fas fa-trash-alt text-[10px]"></i> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gov ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
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
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <i className="fas fa-search text-4xl mb-2"></i>
                  <p>No users match your search</p>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 overflow-hidden">
                        {user.facePhoto || user.profileImage ? (
                          <img
                            src={user.profileImage || user.facePhoto!}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <i className="fas fa-user text-gray-500"></i>
                          </div>
                        )}
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
                    <div className="flex gap-3">
                      {user.role === 'admin' ? (
                        <span className="text-sm text-gray-400">—</span>
                      ) : user.govIdPhoto ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setViewingID({ type: 'gov', image: user.govIdPhoto!, updatedAt: user.updatedAt, createdAt: user.createdAt, user })}
                            className="text-ph-blue hover:text-blue-800 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <i className="fas fa-id-card"></i>
                            View ID
                          </button>
                          {user.hasResubmittedDocs && (
                            <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                              New
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No ID</span>
                      )}
                      {user.role !== 'admin' && user.facePhoto && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setViewingID({ type: 'face', image: user.facePhoto!, updatedAt: user.updatedAt, createdAt: user.createdAt, user })}
                            className="text-green-600 hover:text-green-800 text-xs font-medium inline-flex items-center gap-1"
                          >
                            <i className="fas fa-camera"></i>
                            Selfie
                          </button>
                          {user.hasResubmittedDocs && (
                            <span className="inline-flex items-center gap-0.5 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                              New
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {user.isBlacklisted && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Blacklisted</span>
                      )}
                      {user.role !== 'admin' && user.isIdInvalid && (
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">Invalid ID</span>
                      )}
                      {user.role !== 'admin' && (
                        user.isIdVerified ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs"><i className="fas fa-check-circle mr-1"></i>ID Verified</span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs"><i className="fas fa-clock mr-1"></i>Not Verified</span>
                        )
                      )}
                      {user.role === 'admin' && !user.isBlacklisted && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"><i className="fas fa-shield-halved mr-1"></i>Admin</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.isBlacklisted ? (
                        <button
                          onClick={() => handleAction(user.id, 'unblacklist')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium border border-blue-200 transition-colors"
                        >
                          <i className="fas fa-undo"></i>
                          Unblacklist
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(user.id, 'blacklist')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium border border-red-200 transition-colors"
                        >
                          <i className="fas fa-times-circle"></i>
                          Blacklist
                        </button>
                      )}
                      {!user.isIdVerified && user.govIdPhoto && user.role !== 'admin' && (
                        <button
                          onClick={() => handleAction(user.id, 'verify_id')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium border border-emerald-200 transition-colors"
                        >
                          <i className="fas fa-shield-check"></i>
                          Verify ID
                        </button>
                      )}
                      {user.isIdVerified && user.role !== 'admin' && (
                        <button
                          onClick={() => handleAction(user.id, 'unverify_id')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-medium border border-orange-200 transition-colors"
                        >
                          <i className="fas fa-times-circle"></i>
                          Unverify ID
                        </button>
                      )}
                      {user.role !== 'admin' && (user.isIdInvalid ? (
                        <button
                          onClick={() => handleAction(user.id, 'valid_id')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium border border-green-200 transition-colors"
                        >
                          <i className="fas fa-check-circle"></i>
                          Valid ID
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(user.id, 'not_valid_id')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-medium border border-orange-200 transition-colors"
                        >
                          <i className="fas fa-exclamation-circle"></i>
                          Not Valid ID
                        </button>
                      ))}
                      <button
                        onClick={() => handleAction(user.id, 'delete')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-200 text-xs font-medium border border-red-200 transition-colors"
                      >
                        <i className="fas fa-trash-alt"></i>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

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
            {viewingID.user?.hasResubmittedDocs && (
              <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-center gap-2">
                <i className="fas fa-info-circle text-blue-600"></i>
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Recently Resubmitted:</span> {formatDate(viewingID.updatedAt ?? '')}
                </p>
              </div>
            )}
            <div className="p-4 overflow-auto max-h-[75vh]">
              <img
                src={viewingID.image}
                alt="Document"
                className="w-full h-auto rounded-lg"
              />
              {/* Show scanned ID details for gov ID */}
              {viewingID.type === 'gov' && viewingID.user && (viewingID.user.govIdNumber || viewingID.user.govIdName || viewingID.user.govIdBirthdate) && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3">
                    <i className="fas fa-info-circle mr-1 text-ph-blue"></i>
                    Scanned ID Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {viewingID.user.govIdNumber && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium">ID Number</p>
                        <p className="text-gray-900 font-medium">{viewingID.user.govIdNumber}</p>
                      </div>
                    )}
                    {viewingID.user.govIdName && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Name on ID</p>
                        <p className="text-gray-900 font-medium">{viewingID.user.govIdName}</p>
                      </div>
                    )}
                    {viewingID.user.govIdBirthdate && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Date of Birth</p>
                        <p className="text-gray-900 font-medium">{viewingID.user.govIdBirthdate}</p>
                      </div>
                    )}
                    {viewingID.user.govIdExpiry && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Expiry Date</p>
                        <p className="text-gray-900 font-medium">{viewingID.user.govIdExpiry}</p>
                      </div>
                    )}
                    {viewingID.user.govIdAddress && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-500 font-medium">Address</p>
                        <p className="text-gray-900 font-medium">{viewingID.user.govIdAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><BouncingBallLoader /></div>}>
      <UsersContent />
    </Suspense>
  )
}
