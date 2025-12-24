import { useState } from 'react';
import { MessageCircle, Clock, Shield, MapPin, DollarSign, Users, Star, CheckCircle, Phone } from 'lucide-react';

interface GoogleAdsLandingProps {
  onBookNowClick: () => void;
  onRouteClick: (airport: string, destination: string) => void;
}

export default function GoogleAdsLanding({ onBookNowClick, onRouteClick }: GoogleAdsLandingProps) {
  const [showCTA, setShowCTA] = useState(true);

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
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            Punta Cana Airport Transfer From $25 – Private PUJ Airport Transfers
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 mb-8">
            Private Airport Pickup • No Waiting • Fixed Prices
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onBookNowClick}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Book Your Punta Cana Transfer Now
            </button>
            <button
              onClick={onBookNowClick}
              className="w-full sm:w-auto px-8 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Chat for Instant Price
            </button>
          </div>
        </header>

        <section className="mb-16 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Private Airport Transfer</h3>
                <p className="text-gray-600 text-sm">No shared rides, only your group</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Meet & Greet at PUJ Airport</h3>
                <p className="text-gray-600 text-sm">Driver waits with your name sign</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Fixed Prices – No Surprises</h3>
                <p className="text-gray-600 text-sm">Pay what you see, no hidden fees</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">24/7 Availability</h3>
                <p className="text-gray-600 text-sm">Book anytime, day or night</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Trusted Dominican Airport Transfers</h3>
                <p className="text-gray-600 text-sm">Professional licensed drivers</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Up to 4 Passengers</h3>
                <p className="text-gray-600 text-sm">Perfect for families and groups</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
            What is a Punta Cana Airport Transfer?
          </h2>
          <div className="bg-gray-50 rounded-2xl p-8 shadow-md">
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              A <strong>Punta Cana airport transfer</strong> is a pre-booked <strong>private transportation service</strong> that takes you directly from <strong>Punta Cana Airport (PUJ)</strong> to your hotel, resort, or accommodation in Punta Cana, Bavaro, Cap Cana, or surrounding areas.
            </p>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              Unlike airport taxis where you wait in line and negotiate prices, a <strong>private airport transfer Punta Cana</strong> means your driver is already waiting for you when you land. You receive a fixed price upfront with no haggling or hidden fees.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              With our <strong>Dominican airport transfers</strong>, you get a comfortable, air-conditioned vehicle, professional English-speaking driver, meet and greet service at arrivals, and peace of mind knowing your <strong>Punta Cana hotel transfer</strong> is secured before you even land.
            </p>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
            How Punta Cana Airport Pickup Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 rounded-2xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Land at Punta Cana Airport (PUJ)</h3>
              <p className="text-gray-700">
                After clearing customs, head to the arrivals hall. Your driver is already waiting.
              </p>
            </div>
            <div className="bg-green-50 rounded-2xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Meet Your Private Driver</h3>
              <p className="text-gray-700">
                Look for your name on a sign. Your driver greets you and helps with luggage.
              </p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Transfer Directly to Your Hotel</h3>
              <p className="text-gray-700">
                Relax in a comfortable, air-conditioned vehicle as you're driven straight to your destination.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
            Why Choose Private Transfer Punta Cana Over Airport Taxi?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-xl p-6 shadow-md">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">Private Airport Transfers Punta Cana</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✓ Fixed price confirmed at booking</li>
                    <li>✓ Driver waiting with your name sign</li>
                    <li>✓ No waiting in taxi lines</li>
                    <li>✓ Private ride for your group only</li>
                    <li>✓ Professional English-speaking drivers</li>
                    <li>✓ Flight tracking included</li>
                    <li>✓ Modern, air-conditioned vehicles</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 shadow-md">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-sm">✕</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">Punta Cana Airport Taxi</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>✗ Price negotiated on arrival</li>
                    <li>✗ Long taxi queues after landing</li>
                    <li>✗ No guarantee of availability</li>
                    <li>✗ May share with other passengers</li>
                    <li>✗ Variable service quality</li>
                    <li>✗ No flight delay coverage</li>
                    <li>✗ Older vehicles possible</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Punta Cana Airport Transportation From $25
            </h2>
            <p className="text-xl mb-2 opacity-90">One-way private transfer starting at just $25</p>
            <p className="text-lg mb-6 opacity-90">Roundtrip transfers available • Up to 4 passengers per vehicle</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onBookNowClick}
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Instant Quote Now
              </button>
              <button
                onClick={onBookNowClick}
                className="px-8 py-4 bg-green-700 text-white rounded-lg font-semibold text-lg hover:bg-green-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Phone className="w-5 h-5" />
                Chat for Quick Booking
              </button>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
            Popular Airport Transfers
          </h2>
          <p className="text-center text-gray-600 mb-8 text-lg">
            Click any route to get an instant quote and book your <strong>private airport transfer Punta Cana</strong>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularRoutes.map((route, index) => (
              <button
                key={index}
                onClick={() => onRouteClick(route.from, route.to)}
                className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-gray-900 group-hover:text-blue-600 transition-colors font-medium">
                    {route.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 text-center">
            Punta Cana Airport to Hotel Transfers
          </h2>
          <div className="bg-gray-50 rounded-2xl p-8 shadow-md">
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              Our <strong>Punta Cana transfers from airport to hotel</strong> service covers all major resort areas including Bavaro, Uvero Alto, Cap Cana, and La Romana. Whether you're staying at an all-inclusive resort, boutique hotel, or private villa, we provide reliable <strong>airport transfers from Punta Cana airport to hotel</strong> destinations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-xl">Punta Cana Hotel Transfers Include:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>All major resorts in Bavaro and Punta Cana</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Luxury resorts in Cap Cana</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Hotels and resorts in Uvero Alto</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Private villas and Airbnb properties</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 text-xl">Private Transportation Punta Cana Airport:</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Sedans for couples and small groups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>SUVs and minivans for families</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Large vans for groups up to 12</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Luxury vehicles available</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-12 text-white shadow-xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Arriving at Punta Cana Airport?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Secure Your Private Airport Transfer Now – Fixed Prices, No Waiting
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onBookNowClick}
              className="px-10 py-5 bg-white text-green-600 rounded-lg font-bold text-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Book Punta Cana Transfer Now
            </button>
            <button
              onClick={onBookNowClick}
              className="px-10 py-5 bg-blue-700 text-white rounded-lg font-bold text-xl hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-6 h-6" />
              Get Instant Price via Chat
            </button>
          </div>
        </section>

        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <img
              src="/vehicles/image3.jpeg"
              alt="Private airport transfer vehicle Punta Cana"
              className="w-full h-64 object-cover rounded-xl shadow-lg"
            />
            <img
              src="/vehicles/image4.jpeg"
              alt="Punta Cana airport transportation"
              className="w-full h-64 object-cover rounded-xl shadow-lg"
            />
            <img
              src="/vehicles/image5.jpeg"
              alt="Dominican airport transfers fleet"
              className="w-full h-64 object-cover rounded-xl shadow-lg"
            />
          </div>
        </section>

        <footer className="text-center py-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">
            <strong>Punta Cana Airport Transfer</strong> • Private PUJ Airport Transfers • Dominican Transfers
          </p>
          <p className="text-gray-500 text-sm">
            Professional private airport transfers from Punta Cana Airport (PUJ) to all hotels and resorts
          </p>
        </footer>
      </div>

      {showCTA && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-600 shadow-2xl p-4 z-50 md:hidden">
          <div className="flex gap-2">
            <button
              onClick={onBookNowClick}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg"
            >
              Book Now
            </button>
            <button
              onClick={onBookNowClick}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
