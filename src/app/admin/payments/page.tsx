'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface Payment {
  id: number
  paymentReference: string
  bookingCode: string
  courtName: string
  userName: string
  amount: number
  paymentMethod: string | null
  paymentType: string | null
  status: string
  createdAt: string
  paidAt: string | null
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800' },
  paid: { bg: 'bg-green-100', text: 'text-green-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  refunded: { bg: 'bg-purple-100', text: 'text-purple-800' },
}

export default function AdminPaymentsPage() {
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || ''

  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const params = new URLSearchParams()
        if (currentStatus) params.set('status', currentStatus)

        const response = await fetch(`/api/payments?${params.toString()}`)
        const data = await response.json()
        setPayments(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching payments:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [currentStatus])

  const handleVerify = async (paymentRef: string, action: 'approve' | 'reject') => {
    const confirmMsg = action === 'approve' 
      ? 'Approve this payment?' 
      : 'Reject this payment?'
    
    if (!confirm(confirmMsg)) return

    const apiAction = action === 'approve' ? 'verify' : 'reject'

    try {
      const response = await fetch(`/api/payments/${paymentRef}?action=${apiAction}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) throw new Error('Failed')

      toast.success(`Payment ${action}d successfully`)
      setPayments((prev) =>
        prev.map((p) =>
          p.paymentReference === paymentRef
            ? { ...p, status: action === 'approve' ? 'paid' : 'rejected' }
            : p
        )
      )
    } catch (error) {
      toast.error('Action failed')
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-ph-blue"></i>
      </div>
    )
  }

  const statuses = ['', 'pending', 'processing', 'paid', 'rejected', 'refunded']

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Payments</h1>
        <p className="text-gray-600">View and verify payment transactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Payments</p>
              <p className="text-2xl font-bold">{payments.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-credit-card text-blue-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {payments.filter((p) => p.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-clock text-yellow-600"></i>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-2xl font-bold text-green-600">
                {payments.filter((p) => p.status === 'paid').length}
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
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-ph-blue">
                {formatPrice(
                  payments
                    .filter((p) => p.status === 'paid')
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <i className="fas fa-peso-sign text-ph-blue"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((s) => (
            <Link
              key={s}
              href={s ? `/admin/payments?status=${s}` : '/admin/payments'}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                currentStatus === s
                  ? 'bg-ph-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </Link>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Booking
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  <i className="fas fa-credit-card text-4xl mb-2"></i>
                  <p>No payments found</p>
                </td>
              </tr>
            ) : (
              payments.map((payment) => {
                const config = statusConfig[payment.status] || statusConfig.pending
                return (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm">{payment.paymentReference}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{payment.userName || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{payment.bookingCode}</p>
                        <p className="text-sm text-gray-500">{payment.courtName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-ph-blue">{formatPrice(payment.amount)}</p>
                        <p className="text-xs text-gray-500">{payment.paymentType || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize">{payment.paymentMethod || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`${config.bg} ${config.text} px-3 py-1 rounded-full text-xs font-medium`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{formatDate(payment.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {payment.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(payment.paymentReference, 'approve')}
                              className="text-green-600 hover:text-green-700 text-sm font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerify(payment.paymentReference, 'reject')}
                              className="text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {payment.status === 'paid' && (
                          <span className="text-gray-400 text-sm">Verified</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
