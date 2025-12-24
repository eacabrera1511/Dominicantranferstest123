import { useState, useEffect } from 'react';
import { MessageCircle, Clock, Shield, MapPin, DollarSign, Users, Star, CheckCircle, Phone, Menu, X, Sparkles } from 'lucide-react';

interface GoogleAdsLandingProps {
  onBookNowClick: () => void;
  onRouteClick: (airport: string, destination: string) => void;
}

export default function GoogleAdsLanding({ onBookNowClick, onRouteClick }: GoogleAdsLandingProps) {
  const [showCTA, setShowCTA] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const popularRoutes = [
    { from: 'PUJ', to: 'Excellence Resorts', label: 'Punta Cana Airport to Excellence Resorts' },
    { from: 'PUJ', to: 'Hilton La Romana', label: 'Punta Cana Airport to Hilton La Romana' },
    { from: 'PUJ', to: 'Hyatt Zilara Cap Cana', label: 'Punta Cana Airport to Hyatt Zilara Cap Cana' },
    { from: 'PUJ', to: 'Hyatt Ziva Cap Cana', label: 'Punta Cana Airport to Hyatt Ziva Cap Cana' },
    { from: 'PUJ', to: 'Sanctuary Cap Cana', label: 'Punta Cana Airport to Sanctuary Cap Cana' },
    { from: 'PUJ', to: 'Dreams Macao', label: 'Punta Cana Airport to Dreams Macao Resorts' },
    { from: 'PUJ', to: 'Bahia Principe', label: 'Punta Cana Airport to Bahia Principe Resorts' },
    { from: 'PUJ', to: 'Hard Rock Hotel', label: 'Punta Cana Airport to Hard Rock Resort' },
    { from: 'PUJ', to: 'Majestic Resorts', label: 'Punta Cana Airport to Majestic Resorts' },
    { from: 'PUJ', to: 'Royalton', label: 'Punta Cana Airport to Royalton Resorts' },
    { from: 'PUJ', to: 'Airbnb Punta Cana', label: 'Airport Transfers to Airbnb in Punta Cana' },
    { from: 'PUJ', to: 'Airbnb La Romana', label: 'Airport Transfers to Airbnb in La Romana Bayahibe' },
    { from: 'PUJ', to: 'Airbnb Playa Nueva Romana', label: 'Airport Transfers to Airbnb in Playa Nueva Romana' },
    { from: 'PUJ', to: 'Airbnb Samana', label: 'Airport Transfers to Airbnb in Samana' },
    { from: 'PUJ', to: 'Airbnb Sosua', label: 'Airport Transfers to Airbnb in Sosua' },
    { from: 'SDQ', to: 'La Romana Resorts', label: 'Santo Domingo Airport to La Romana Resorts' },
    { from: 'SDQ', to: 'Bahia Principe La Romana', label: 'Santo Domingo Airport to Bahia Principe La Romana Resort' },
    { from: 'SDQ', to: 'Cabarete and Sosua', label: 'Santo Domingo Airport to Cabarete and Sosua All Hotels' },
    { from: 'SDQ', to: 'Cap Cana', label: 'Santo Domingo Airport to Cap Cana All Resorts' },
    { from: 'SDQ', to: 'Casa de Campo', label: 'Santo Domingo Airport to Casa de Campo Resort' },
    { from: 'SDQ', to: 'Dreams Resorts Punta Cana', label: 'Santo Domingo Airport to Dreams Resorts' },
    { from: 'SDQ', to: 'Excellence Punta Cana', label: 'Santo Domingo Airport to Excellence Resorts Punta Cana' },
    { from: 'SDQ', to: 'Hard Rock Punta Cana', label: 'Santo Domingo Airport to Hard Rock Punta Cana' },
    { from: 'SDQ', to: 'Samana and Las Terrenas', label: 'Santo Domingo Airport to Samana and Las Terrenas' },
    { from: 'SDQ', to: 'Puerto Plata', label: 'Santo Domingo to Puerto Plata to all Resorts' },
    { from: 'SDQ', to: 'Airbnb Santo Domingo', label: 'Airport Transfers to Airbnb in Santo Domingo City' },
    { from: 'SDQ', to: 'Airbnb Boca Chica', label: 'Airport Transfers to Airbnb in Boca Chica' },
    { from: 'SDQ', to: 'Airbnb Juan Dolio', label: 'Airport Transfers to Airbnb in Juan Dolio' },
    { from: 'SDQ', to: 'Airbnb Puerto Plata', label: 'Airport Transfers to Airbnb in Puerto Plata' },
    { from: 'SDQ', to: 'Airbnb Cabarete', label: 'Airport Transfers to Airbnb in Cabarete' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.15),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Dominican Transfers</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <a href="#services" className="text-white/80 hover:text-white transition-colors">Services</a>
              <a href="#routes" className="text-white/80 hover:text-white transition-colors">Popular Routes</a>
              <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</a>
              <button
                onClick={onBookNowClick}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
              >
                Book Now
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10">
            <div className="px-4 py-4 space-y-3">
              <a href="#services" className="block text-white/80 hover:text-white py-2 transition-colors">Services</a>
              <a href="#routes" className="block text-white/80 hover:text-white py-2 transition-colors">Popular Routes</a>
              <a href="#how-it-works" className="block text-white/80 hover:text-white py-2 transition-colors">How It Works</a>
              <button
                onClick={onBookNowClick}
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold"
              >
                Book Now
              </button>
            </div>
          </div>
        )}
      </nav>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <header className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm mb-6 animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-300 text-sm font-medium">Limited Time Offer - From $25</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Punta Cana Airport Transfer From $25
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
              Private PUJ Airport Transfers
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-cyan-100/80 mb-10 max-w-3xl mx-auto">
            Private Airport Pickup • No Waiting • Fixed Prices
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onBookNowClick}
              className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 text-white rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 overflow-hidden shadow-2xl hover:shadow-cyan-500/50 animate-gradient bg-[length:200%_auto]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="relative flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Book Your Transfer Now
              </span>
            </button>

            <button
              onClick={onBookNowClick}
              className="group relative w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md text-white rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20 shadow-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
              <span className="relative flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat for Instant Price
              </span>
            </button>
          </div>
        </header>

        <section id="services" className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: 'Private Airport Transfer', desc: 'No shared rides, only your group', color: 'from-cyan-500 to-blue-500' },
              { icon: MapPin, title: 'Meet & Greet at PUJ Airport', desc: 'Driver waits with your name sign', color: 'from-blue-500 to-cyan-500' },
              { icon: DollarSign, title: 'Fixed Prices – No Surprises', desc: 'Pay what you see, no hidden fees', color: 'from-cyan-500 to-blue-500' },
              { icon: Clock, title: '24/7 Availability', desc: 'Book anytime, day or night', color: 'from-blue-500 to-cyan-500' },
              { icon: Star, title: 'Trusted Dominican Transfers', desc: 'Professional licensed drivers', color: 'from-cyan-500 to-blue-500' },
              { icon: Users, title: 'Up to 4 Passengers', desc: 'Perfect for families and groups', color: 'from-blue-500 to-cyan-500' }
            ].map((item, index) => (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-start gap-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300 group-hover:scale-110`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1 group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                    <p className="text-cyan-100/60 text-sm">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
            What is a Punta Cana Airport Transfer?
          </h2>
          <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10"></div>
            <div className="relative space-y-4">
              <p className="text-lg text-cyan-50/90 leading-relaxed">
                A <strong className="text-cyan-300">Punta Cana airport transfer</strong> is a pre-booked <strong className="text-cyan-300">private transportation service</strong> that takes you directly from <strong className="text-cyan-300">Punta Cana Airport (PUJ)</strong> to your hotel, resort, or accommodation in Punta Cana, Bavaro, Cap Cana, or surrounding areas.
              </p>
              <p className="text-lg text-cyan-50/90 leading-relaxed">
                Unlike airport taxis where you wait in line and negotiate prices, a <strong className="text-cyan-300">private airport transfer Punta Cana</strong> means your driver is already waiting for you when you land. You receive a fixed price upfront with no haggling or hidden fees.
              </p>
              <p className="text-lg text-cyan-50/90 leading-relaxed">
                With our <strong className="text-cyan-300">Dominican airport transfers</strong>, you get a comfortable, air-conditioned vehicle, professional English-speaking driver, meet and greet service at arrivals, and peace of mind knowing your <strong className="text-cyan-300">Punta Cana hotel transfer</strong> is secured before you even land.
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center">
            How Punta Cana Airport Pickup Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Land at Punta Cana Airport (PUJ)', desc: 'After clearing customs, head to the arrivals hall. Your driver is already waiting.' },
              { step: 2, title: 'Meet Your Private Driver', desc: 'Look for your name on a sign. Your driver greets you and helps with luggage.' },
              { step: 3, title: 'Transfer Directly to Your Hotel', desc: 'Relax in a comfortable, air-conditioned vehicle as you\'re driven straight to your destination.' }
            ].map((item, index) => (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 hover:border-cyan-500/50 transition-all duration-500 hover:scale-105 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 text-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300 group-hover:scale-110">
                    <span className="text-white text-3xl font-bold">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-cyan-300 transition-colors">{item.title}</h3>
                  <p className="text-cyan-100/70">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-8 text-center">
            Why Choose Private Transfer Punta Cana Over Airport Taxi?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 hover:scale-105 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10"></div>
              <div className="relative">
                <div className="flex items-start gap-3 mb-6">
                  <CheckCircle className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
                  <h3 className="font-bold text-white text-xl">Private Airport Transfers Punta Cana</h3>
                </div>
                <ul className="space-y-3 text-cyan-50/80">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                    Fixed price confirmed at booking
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                    Driver waiting with your name sign
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                    No waiting in taxi lines
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                    Private ride for your group only
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                    Professional English-speaking drivers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                    Flight tracking included
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                    Modern, air-conditioned vehicles
                  </li>
                </ul>
              </div>
            </div>

            <div className="group relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:scale-105 shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10"></div>
              <div className="relative">
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-lg">✕</span>
                  </div>
                  <h3 className="font-bold text-white text-xl">Punta Cana Airport Taxi</h3>
                </div>
                <ul className="space-y-3 text-red-100/70">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    Price negotiated on arrival
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    Long taxi queues after landing
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    No guarantee of availability
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    May share with other passengers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    Variable service quality
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    No flight delay coverage
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                    Older vehicles possible
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16 relative bg-gradient-to-br from-cyan-600 via-blue-600 to-cyan-600 rounded-3xl p-12 text-white shadow-2xl shadow-cyan-500/30 overflow-hidden animate-gradient bg-[length:200%_auto]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]"></div>
          <div className="relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
              <DollarSign className="w-5 h-5" />
              <span className="font-semibold">Best Price Guaranteed</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Punta Cana Airport Transportation From $25
            </h2>
            <p className="text-xl mb-2 opacity-90">One-way private transfer starting at just $25</p>
            <p className="text-lg mb-8 opacity-90">Roundtrip transfers available • Up to 4 passengers per vehicle</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onBookNowClick}
                className="group relative px-8 py-4 bg-white text-cyan-600 rounded-2xl font-semibold text-lg transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-100 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative">Get Instant Quote Now</span>
              </button>
              <button
                onClick={onBookNowClick}
                className="group relative px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-2xl font-semibold text-lg hover:bg-white/20 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Chat for Quick Booking
                </span>
              </button>
            </div>
          </div>
        </section>

        <section id="routes" className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
            Popular Airport Transfers
          </h2>
          <p className="text-center text-cyan-100/80 mb-10 text-lg max-w-3xl mx-auto">
            Click any route to get an instant quote and book your <strong className="text-cyan-300">private airport transfer Punta Cana</strong>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularRoutes.map((route, index) => (
              <button
                key={index}
                onClick={() => onRouteClick(route.from, route.to)}
                className="group relative bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 text-left overflow-hidden hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg group-hover:shadow-cyan-500/50">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-white/90 group-hover:text-cyan-300 transition-colors font-medium text-sm">
                    {route.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
            Punta Cana Airport to Hotel Transfers
          </h2>
          <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5"></div>
            <div className="relative">
              <p className="text-lg text-cyan-50/90 mb-6 leading-relaxed">
                Our <strong className="text-cyan-300">Punta Cana transfers from airport to hotel</strong> service covers all major resort areas including Bavaro, Uvero Alto, Cap Cana, and La Romana. Whether you're staying at an all-inclusive resort, boutique hotel, or private villa, we provide reliable <strong className="text-cyan-300">airport transfers from Punta Cana airport to hotel</strong> destinations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="font-semibold text-cyan-300 mb-4 text-xl flex items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    Punta Cana Hotel Transfers Include:
                  </h3>
                  <ul className="space-y-3 text-cyan-50/80">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                      <span>All major resorts in Bavaro and Punta Cana</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                      <span>Luxury resorts in Cap Cana</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                      <span>Hotels and resorts in Uvero Alto</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                      <span>Private villas and Airbnb properties</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                  <h3 className="font-semibold text-cyan-300 mb-4 text-xl flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Private Transportation Options:
                  </h3>
                  <ul className="space-y-3 text-cyan-50/80">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                      <span>Sedans for couples and small groups</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                      <span>SUVs and minivans for families</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                      <span>Large vans for groups up to 12</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2"></div>
                      <span>Luxury vehicles available</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16 relative bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-600 rounded-3xl p-12 text-white shadow-2xl shadow-cyan-500/30 text-center overflow-hidden animate-gradient bg-[length:200%_auto]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_60%)]"></div>
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Arriving at Punta Cana Airport?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Secure Your Private Airport Transfer Now – Fixed Prices, No Waiting
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onBookNowClick}
                className="group relative px-10 py-5 bg-white text-cyan-600 rounded-2xl font-bold text-xl transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-100 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  Book Punta Cana Transfer Now
                </span>
              </button>
              <button
                onClick={onBookNowClick}
                className="group relative px-10 py-5 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-2xl font-bold text-xl hover:bg-white/20 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <span className="relative flex items-center gap-2">
                  <MessageCircle className="w-6 h-6" />
                  Get Instant Price via Chat
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['/vehicles/image3.jpeg', '/vehicles/image4.jpeg', '/vehicles/image5.jpeg'].map((src, index) => (
              <div
                key={index}
                className="group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-cyan-500/30 transition-all duration-500 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-600/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
                <img
                  src={src}
                  alt={`Private airport transfer vehicle ${index + 1}`}
                  className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
        </section>

        <footer className="text-center py-8 border-t border-white/10">
          <p className="text-cyan-100/80 mb-4">
            <strong className="text-white">Punta Cana Airport Transfer</strong> • Private PUJ Airport Transfers • Dominican Transfers
          </p>
          <p className="text-cyan-100/60 text-sm">
            Professional private airport transfers from Punta Cana Airport (PUJ) to all hotels and resorts
          </p>
        </footer>
      </div>

      {showCTA && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-cyan-500/30 shadow-2xl shadow-cyan-500/20 p-4 z-50 md:hidden">
          <div className="flex gap-2">
            <button
              onClick={onBookNowClick}
              className="group relative flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              <span className="relative">Book Now</span>
            </button>
            <button
              onClick={onBookNowClick}
              className="group relative flex-1 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl font-semibold shadow-lg hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              <span className="relative flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat
              </span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.3);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 0 30px rgba(6, 182, 212, 0.5);
            transform: scale(1.02);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-gradient {
          animation: gradient 8s ease infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
