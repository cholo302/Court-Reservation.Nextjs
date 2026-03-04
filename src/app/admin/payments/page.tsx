'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
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
  proofScreenshot: string | null
  transactionId: string | null
  createdAt: string
  paidAt: string | null
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', label: 'Pending' },
  processing: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-400', label: 'Processing' },
  downpayment: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400', label: 'Downpayment' },
  paid: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-400', label: 'Paid' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-400', label: 'Rejected' },
  refunded: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-400', label: 'Refunded' },
}

function PaymentsContent() {
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || ''

  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [viewingProof, setViewingProof] = useState<string | null>(null)

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
        <i className="fas fa-spinner fa-spin text-3xl text-ph-blue"></i>
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
      <div className="grid grid-cols-3 gap-4 mb-6">
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

      {/* Payments List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-2">Reference</div>
          <div className="col-span-1">Customer</div>
          <div className="col-span-2">Booking</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-1">GCash Ref</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Proof</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-2">Actions</div>
        </div>

        {payments.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <i className="fas fa-receipt text-gray-200 text-4xl mb-3"></i>
            <p className="text-sm text-gray-400">No payments found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payments.map((payment) => {
              const config = statusConfig[payment.status] || statusConfig.pending
              return (
                <div
                  key={payment.id}
                  className="grid grid-cols-12 gap-4 px-5 py-3.5 items-center hover:bg-gray-50/50 transition"
                >
                  <div className="col-span-2 min-w-0">
                    <p className="font-mono text-xs text-gray-900 truncate">{payment.paymentReference}</p>
                  </div>
                  <div className="col-span-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{payment.userName || 'N/A'}</p>
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
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg} ${config.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
                      {config.label}
                    </span>
                  </div>
                  <div className="col-span-1">
                    {payment.proofScreenshot ? (
                      <button
                        onClick={() => setViewingProof(payment.proofScreenshot)}
                        className="text-ph-blue text-xs font-medium hover:underline"
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-xs text-gray-300">None</span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    {(payment.status === 'pending' || payment.status === 'processing') && (
                      <>
                        <button
                          onClick={() => handleVerify(payment.paymentReference, 'approve')}
                          className="px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerify(payment.paymentReference, 'reject')}
                          className="px-2.5 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {payment.status === 'downpayment' && (
                      <span className="text-xs text-orange-600 font-medium">
                        <i className="fas fa-clock mr-1"></i>Balance pending
                      </span>
                    )}
                    {payment.status === 'paid' && (
                      <span className="text-xs text-green-600 font-medium">
                        <i className="fas fa-check mr-1"></i>Complete
                      </span>
                    )}
                    {payment.status === 'rejected' && (
                      <span className="text-xs text-red-500 font-medium">
                        <i className="fas fa-times mr-1"></i>Rejected
                      </span>
                    )}
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
    <Suspense fallback={<div className="flex items-center justify-center py-20"><i className="fas fa-spinner fa-spin text-3xl text-ph-blue"></i></div>}>
      <PaymentsContent />
    </Suspense>
  )
}
