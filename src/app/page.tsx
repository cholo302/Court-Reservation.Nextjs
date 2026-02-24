import { Navbar, Footer } from '@/components/layout'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="hero-gradient text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  Marikina Sports Center <br />
                  <span className="text-ph-yellow">Court Reservation System</span>
                </h1>
                <p className="text-xl text-blue-100 mb-8">
                  Basketball, Volleyball, Badminton, and more. Pay easily with GCash QR.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/courts"
                    className="bg-white text-ph-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                  >
                    <i className="fas fa-search mr-2"></i>
                    Browse Courts
                  </Link>
                </div>

                {/* Payment Methods */}
                <div className="mt-8 flex items-center space-x-4">
                  <span className="text-blue-200 text-sm">Pay with:</span>
                  <div className="flex space-x-2">
                    <span className="bg-white/20 px-3 py-1 rounded text-sm">GCash</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="relative">
                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4 text-gray-800">
                        <i className="fas fa-basketball-ball text-orange-500 text-3xl mb-2"></i>
                        <h3 className="font-semibold">Basketball</h3>
                        <p className="text-sm text-gray-500">Full Courts</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-gray-800">
                        <i className="fas fa-table-tennis text-green-500 text-3xl mb-2"></i>
                        <h3 className="font-semibold">Ping Pong</h3>
                        <p className="text-sm text-gray-500">Indoor Ping Pong</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-gray-800">
                        <i className="fas fa-volleyball-ball text-yellow-500 text-3xl mb-2"></i>
                        <h3 className="font-semibold">Volleyball</h3>
                        <p className="text-sm text-gray-500">Clay & Hard Courts</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-gray-800">
                        <i className="fas fa-table-tennis text-blue-500 text-3xl mb-2"></i>
                        <h3 className="font-semibold">Badminton</h3>
                        <p className="text-sm text-gray-500">Indoor Courts</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-gray-600">Book a court in 4 easy steps</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-ph-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-ph-blue font-bold text-2xl">1</span>
                </div>
                <h3 className="font-semibold mb-2">Choose a Court</h3>
                <p className="text-gray-500 text-sm">Browse and select from our available courts</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-ph-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-ph-blue font-bold text-2xl">2</span>
                </div>
                <h3 className="font-semibold mb-2">Pick Date & Time</h3>
                <p className="text-gray-500 text-sm">
                  Select your preferred schedule from available slots
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-ph-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-ph-blue font-bold text-2xl">3</span>
                </div>
                <h3 className="font-semibold mb-2">Pay via QR</h3>
                <p className="text-gray-500 text-sm">Scan QR code and pay with GCash</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-ph-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-ph-blue font-bold text-2xl">4</span>
                </div>
                <h3 className="font-semibold mb-2">Get QR Entry Pass</h3>
                <p className="text-gray-500 text-sm">
                  Receive your booking QR code for venue entry
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Play?</h2>
            <p className="text-gray-600 mb-8">
              Start booking your favorite courts today and enjoy hassle-free reservations.
            </p>
            <Link
              href="/courts"
              className="bg-ph-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition inline-block"
            >
              Browse Available Courts
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
