import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-9 h-9 bg-gradient-to-br from-ph-yellow to-yellow-400 rounded-lg flex items-center justify-center">
                <i className="fas fa-basketball text-ph-blue text-sm"></i>
              </div>
              <span className="text-xl font-extrabold tracking-tight">CourtReserve</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Book sports courts at Marikina Sports Center. Basketball, Badminton, Volleyball, and Ping Pong.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/profile" className="text-gray-300 hover:text-white transition text-sm">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Sports</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/courts?type=basketball" className="text-gray-300 hover:text-white transition text-sm flex items-center gap-2">
                  <i className="fas fa-basketball text-orange-400 text-xs w-4"></i> Basketball
                </Link>
              </li>
              <li>
                <Link href="/courts?type=badminton" className="text-gray-300 hover:text-white transition text-sm flex items-center gap-2">
                  <i className="fas fa-shuttlecock text-blue-400 text-xs w-4"></i> Badminton
                </Link>
              </li>
              <li>
                <Link href="/courts?type=volleyball" className="text-gray-300 hover:text-white transition text-sm flex items-center gap-2">
                  <i className="fas fa-volleyball text-yellow-400 text-xs w-4"></i> Volleyball
                </Link>
              </li>
              <li>
                <Link href="/courts?type=pingpong" className="text-gray-300 hover:text-white transition text-sm flex items-center gap-2">
                  <i className="fas fa-table-tennis-paddle-ball text-green-400 text-xs w-4"></i> Ping Pong
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Payment</h3>
            <div className="flex gap-2 mb-3">
              <span className="bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-lg text-xs font-semibold">GCash</span>
              <span className="bg-green-500/20 text-green-300 px-3 py-1.5 rounded-lg text-xs font-semibold">Maya</span>
            </div>
            <p className="text-gray-500 text-xs">Secure QR Ph payments accepted</p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} CourtReserve. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-gray-500 hover:text-gray-300 text-sm transition">
              Terms
            </Link>
            <Link href="/privacy" className="text-gray-500 hover:text-gray-300 text-sm transition">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
