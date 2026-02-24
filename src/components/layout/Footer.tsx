import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <i className="fas fa-basketball-ball text-ph-yellow text-2xl mr-2"></i>
              <span className="text-xl font-bold">Court Reservation</span>
            </div>
            <p className="text-gray-400 text-sm">
              Book sports courts easily in the Philippines. Basketball, Badminton, Volleyball, and
              more.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/courts" className="hover:text-white transition">
                  Browse Courts
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Sports</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/courts/type/basketball" className="hover:text-white transition">
                  Basketball
                </Link>
              </li>
              <li>
                <Link href="/courts/type/badminton" className="hover:text-white transition">
                  Badminton
                </Link>
              </li>
              <li>
                <Link href="/courts/type/volleyball" className="hover:text-white transition">
                  Volleyball
                </Link>
              </li>
              <li>
                <Link href="/courts/type/pingpong" className="hover:text-white transition">
                  PingPong
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Payment Methods</h3>
            <div className="flex space-x-3 mb-4">
              <span className="bg-white/20 px-3 py-1 rounded text-sm">GCash</span>
              <span className="bg-white/20 px-3 py-1 rounded text-sm">Maya</span>
            </div>
            <p className="text-gray-400 text-sm">We accept QR Ph payments</p>
          </div>
        </div>

        <hr className="border-gray-800 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Court Reservation. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
