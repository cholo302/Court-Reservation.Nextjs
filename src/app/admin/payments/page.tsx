'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import BouncingBallLoader from '@/components/ui/BouncingBallLoader'
import toast from 'react-hot-toast'

interface Payment {
  id: number
  paymentReference: string
  bookingCode: string
  courtName: string
  userName: string
  userAvatar: string | null
  amount: number
  paymentMethod: string | null
  paymentType: string | null
  status: string
  bookingStatus: string | null
  proofScreenshot: string | null
  transactionId: string | null
  createdAt: string
  paidAt: string | null
}

const statusConfig: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800', icon: 'fa-clock', label: 'Pending' },
  processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'fa-rotate', label: 'Processing' },
  downpayment: { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'fa-coins', label: 'Downpayment' },
  paid: { bg: 'bg-green-100', text: 'text-green-800', icon: 'fa-check-circle', label: 'Paid' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: 'fa-times-circle', label: 'Rejected' },
  refunded: { bg: 'bg-purple-100', text: 'text-purple-800', icon: 'fa-rotate-left', label: 'Refunded' },
}

function PaymentsContent() {
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || ''

  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [viewingProof, setViewingProof] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchPayments = async () => {
    setLoading(true)
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

  useEffect(() => {
    fetchPayments()
  }, [currentStatus])

  const filteredPayments = payments.filter(
    (p) =>
      p.paymentReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bookingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.courtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.transactionId || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleVerify = async (paymentRef: string, action: 'approve' | 'reject') => {
    const confirmMsg = action === 'approve' ? 'Approve this payment?' : 'Reject this payment?'
    if (!confirm(confirmMsg)) return

    const apiAction = action === 'approve' ? 'verify' : 'reject'
    try {
      const response = await fetch(`/api/payments/${paymentRef}?action=${apiAction}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!response.ok) throw new Error('Failed')
      const updatedPayment = await response.json()
      toast.success(`Payment ${action}d successfully`)
      setPayments((prev) =>
        prev.map((p) =>
          p.paymentReference === paymentRef
            ? { ...p, status: updatedPayment.status || (action === 'approve' ? 'paid' : 'rejected') }
            : p
        )
      )
    } catch {
      toast.error('Action failed')
    }
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <BouncingBallLoader />
      </div>
    )
  }

  const statuses = ['', 'processing', 'downpayment', 'paid', 'rejected']
  const processingCount = payments.filter((p) => p.status === 'processing').length
  const paidTotal = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Payments</h1>
        <p className="text-gray-500 text-sm mt-1">Review and verify payment transactions</p>
      </div>

      {/* Mini Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">To Review</p>
          <p className="text-xl font-extrabold text-gray-900">{processingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Total Payments</p>
          <p className="text-xl font-extrabold text-gray-900">{payments.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Revenue (Paid)</p>
          <p className="text-xl font-extrabold text-gray-900">{formatPrice(paidTotal)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6">
        {statuses.map((s) => {
          const isActive = currentStatus === s
          return (
            <Link
              key={s}
              href={s ? `/admin/payments?status=${s}` : '/admin/payments'}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-ph-blue text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900'
              }`}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </Link>
          )
        })}
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fas fa-search text-gray-400"></i>
          </div>
          <input
            type="text"
            placeholder="Search by reference, booking code, court, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-ph-blue focus:border-transparent outline-none transition"
          />
        </div>
        <button
          onClick={() => fetchPayments()}
          className="px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors font-medium text-sm"
          title="Refresh"
        >
          <i className="fas fa-refresh"></i>
        </button>
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Table Header - desktop only */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-2">Reference</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-2">Booking</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-1">GCash Ref</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Proof</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1">Actions</div>
        </div>

        {payments.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <i className="fas fa-receipt text-gray-200 text-4xl mb-3"></i>
            <p className="text-sm text-gray-400">No payments found</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <i className="fas fa-search text-gray-200 text-4xl mb-3"></i>
            <p className="text-sm text-gray-400">No payments match your search</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredPayments.map((payment) => {
              const config = statusConfig[payment.status] || statusConfig.pending
              return (
                <div key={payment.id}>
                  {/* Mobile card */}
                  <div className="md:hidden p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-xs text-gray-900 truncate min-w-0">{payment.paymentReference}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${config.bg} ${config.text}`}>
                        <i className={`fas ${config.icon} text-[10px]`}></i>
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden bg-gray-200 flex items-center justify-center">
                        {payment.userAvatar ? (
                          <img src={payment.userAvatar} alt={payment.userName || ''} className="w-full h-full object-cover" />
                        ) : (
                          <i className="fas fa-user text-gray-400 text-[10px]"></i>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 truncate">{payment.userName || 'N/A'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{payment.bookingCode}</p>
                        <p className="text-xs text-gray-400 truncate">{payment.courtName}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{formatPrice(payment.amount)}</p>
                    </div>
                    {payment.transactionId && (
                      <p className="font-mono text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded truncate w-fit" title={payment.transactionId}>
                        GCash: {payment.transactionId}
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {payment.proofScreenshot ? (
                          <button
                            onClick={() => setViewingProof(payment.proofScreenshot)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-ph-blue/10 text-ph-blue hover:bg-ph-blue/20 text-xs font-medium border border-ph-blue/20"
                          >
                            <i className="fas fa-image text-xs"></i> Proof
                          </button>
                        ) : null}
                        <p className="text-xs text-gray-400">{formatDate(payment.createdAt)}</p>
                      </div>
                    </div>
                    {(payment.status === 'pending' || payment.status === 'processing') && payment.bookingStatus !== 'cancelled' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleVerify(payment.paymentReference, 'approve')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium border border-emerald-200 flex-1 justify-center"
                        >
                          <i className="fas fa-check-circle"></i> Approve
                        </button>
                        <button
                          onClick={() => handleVerify(payment.paymentReference, 'reject')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium border border-red-200 flex-1 justify-center"
                        >
                          <i className="fas fa-times-circle"></i> Reject
                        </button>
                      </div>
                    )}
                    {payment.status === 'downpayment' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-800 text-xs font-medium">
                        <i className="fas fa-clock"></i>Balance pending
                      </span>
                    )}
                    {payment.status === 'paid' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                        <i className="fas fa-check"></i>Complete
                      </span>
                    )}
                  </div>
                  {/* Desktop row */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-50/50 transition">
                    <div className="col-span-2 min-w-0">
                      <p className="font-mono text-xs text-gray-900 truncate">{payment.paymentReference}</p>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-gray-200 flex items-center justify-center">
                          {payment.userAvatar ? (
                            <img src={payment.userAvatar} alt={payment.userName || ''} className="w-full h-full object-cover" />
                          ) : (
                            <i className="fas fa-user text-gray-400 text-xs"></i>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 truncate">{payment.userName || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{payment.bookingCode}</p>
                      <p className="text-xs text-gray-400 truncate">{payment.courtName}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(payment.amount)}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{payment.paymentType || ''}</p>
                    </div>
                    <div className="col-span-1 min-w-0">
                      {payment.transactionId ? (
                        <p className="font-mono text-xs text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded truncate" title={payment.transactionId}>
                          {payment.transactionId}
                        </p>
                      ) : (
                        <span className="text-xs text-gray-300">&mdash;</span>
                      )}
                    </div>
                    <div className="col-span-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
                        <i className={`fas ${config.icon} text-xs`}></i>
                        {config.label}
                      </span>
                    </div>
                    <div className="col-span-1">
                      {payment.proofScreenshot ? (
                        <button
                          onClick={() => setViewingProof(payment.proofScreenshot)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-ph-blue/10 text-ph-blue hover:bg-ph-blue/20 text-xs font-medium border border-ph-blue/20 transition-colors"
                        >
                          <i className="fas fa-image text-xs"></i>
                          View
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300">None</span>
                      )}
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                    </div>
                    <div className="col-span-1 flex flex-col items-start gap-1">
                      {(payment.status === 'pending' || payment.status === 'processing') && payment.bookingStatus !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => handleVerify(payment.paymentReference, 'approve')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium border border-emerald-200 transition-colors w-full justify-center"
                          >
                            <i className="fas fa-check-circle"></i>
                            Approve
                          </button>
                          <button
                            onClick={() => handleVerify(payment.paymentReference, 'reject')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium border border-red-200 transition-colors w-full justify-center"
                          >
                            <i className="fas fa-times-circle"></i>
                            Reject
                          </button>
                        </>
                      )}
                      {payment.status === 'downpayment' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-100 text-orange-800 text-xs font-medium">
                          <i className="fas fa-clock"></i>Balance pending
                        </span>
                      )}
                      {payment.status === 'paid' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-medium">
                          <i className="fas fa-check"></i>Complete
                        </span>
                      )}
                      {payment.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-800 text-xs font-medium">
                          <i className="fas fa-times"></i>Rejected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Proof Viewer Modal */}
      {viewingProof && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingProof(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">Payment Proof</h3>
              <button
                onClick={() => setViewingProof(null)}
                className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-sm"></i>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh]">
              <img
                src={viewingProof}
                alt="Payment Proof"
                className="w-full h-auto rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><BouncingBallLoader /></div>}>
      <PaymentsContent />
    </Suspense>
  )
}
