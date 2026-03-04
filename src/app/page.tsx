import { Navbar, Footer } from '@/components/layout'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="hero-gradient text-white py-24 md:py-32 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="animate-slide-up">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm text-blue-100 mb-6 border border-white/10">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Courts available now
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
                  Reserve Your
                  <span className="block text-ph-yellow drop-shadow-sm">Perfect Court</span>
                </h1>
                <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-lg leading-relaxed">
                  Basketball, Volleyball, Badminton, and Ping Pong courts at Marikina Sports Center. Book online, pay with GCash.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/courts"
                    className="group bg-white text-ph-blue px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg shadow-black/10 flex items-center gap-2 active:scale-[0.98]"
                  >
                    <i className="fas fa-search"></i>
                    Browse Courts
                    <i className="fas fa-arrow-right text-sm opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"></i>
                  </Link>
                </div>

                <div className="mt-10 flex items-center gap-6">
                  <div className="flex items-center gap-2 text-blue-200 text-sm">
                    <i className="fas fa-shield-halved"></i>
                    <span>Secure Booking</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200 text-sm">
                    <i className="fas fa-bolt"></i>
                    <span>Instant Confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-200 text-sm">
                    <i className="fas fa-qrcode"></i>
                    <span>QR Entry Pass</span>
                  </div>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-3xl blur-2xl"></div>
                  <div className="relative bg-white/[0.08] rounded-2xl p-8 backdrop-blur-sm border border-white/10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-2xl p-5 text-gray-800 card-hover cursor-default">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                          <i className="fas fa-basketball text-orange-500 text-xl"></i>
                        </div>
                        <h3 className="font-semibold text-gray-900">Basketball</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Full & Half Courts</p>
                      </div>
                      <div className="bg-white rounded-2xl p-5 text-gray-800 card-hover cursor-default">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                          <i className="fas fa-table-tennis-paddle-ball text-green-500 text-xl"></i>
                        </div>
                        <h3 className="font-semibold text-gray-900">Ping Pong</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Indoor Tables</p>
                      </div>
                      <div className="bg-white rounded-2xl p-5 text-gray-800 card-hover cursor-default">
                        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-3">
                          <i className="fas fa-volleyball text-yellow-500 text-xl"></i>
                        </div>
                        <h3 className="font-semibold text-gray-900">Volleyball</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Sand & Hard Courts</p>
                      </div>
                      <div className="bg-white rounded-2xl p-5 text-gray-800 card-hover cursor-default">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                          <i className="fas fa-shuttlecock text-blue-500 text-xl"></i>
                        </div>
                        <h3 className="font-semibold text-gray-900">Badminton</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Indoor Courts</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative bottom curve */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 60L1440 60L1440 0C1440 0 1080 40 720 40C360 40 0 0 0 0L0 60Z" fill="#f9fafb"/>
            </svg>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">How It Works</h2>
              <p className="text-gray-500 text-lg">Book a court in 4 easy steps</p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: '1', icon: 'fa-magnifying-glass', title: 'Choose a Court', desc: 'Browse and select from our available sports courts' },
                { step: '2', icon: 'fa-calendar-days', title: 'Pick Date & Time', desc: 'Select your preferred schedule from open slots' },
                { step: '3', icon: 'fa-qrcode', title: 'Pay via GCash', desc: 'Scan QR code and pay online or choose downpayment' },
                { step: '4', icon: 'fa-ticket', title: 'Get QR Entry Pass', desc: 'Show your booking QR code at the venue for entry' },
              ].map((item) => (
                <div key={item.step} className="relative text-center group">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform shadow-sm">
                    <i className={`fas ${item.icon} text-ph-blue text-2xl`}></i>
                  </div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-7 bg-ph-blue text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-ph-blue via-blue-700 to-blue-900"></div>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-10 right-20 w-64 h-64 border-2 border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 w-20 h-20 border-2 border-white rounded-full"></div>
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-5 tracking-tight">Ready to Play?</h2>
            <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
              Start booking your favorite courts today. Hassle-free reservations with secure online payment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/courts"
                className="bg-white text-ph-blue px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-lg shadow-black/20 active:scale-[0.98]"
              >
                <i className="fas fa-search mr-2"></i>
                Browse Courts
              </Link>
              <Link
                href="/register"
                className="border-2 border-white/30 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all active:scale-[0.98]"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
