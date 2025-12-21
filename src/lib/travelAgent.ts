import { supabase, Hotel, Service } from './supabase';
import { detectLanguage, getTranslations, Language } from './translations';

export interface BookingAction {
  action: 'START_BOOKING';
  airport: string;
  hotel: string;
  region: string;
  vehicle: string;
  passengers: number;
  suitcases: number;
  tripType: string;
  price: number;
  currency: string;
  paymentProvider: string;
  paymentMethods: string[];
  priceSource?: string;
  originalPrice?: number;
}

export interface VehicleOption {
  name: string;
  capacity: number;
  luggageCapacity: number;
  oneWayPrice: number;
  roundTripPrice: number;
  recommended?: boolean;
}

export interface PriceScanRequest {
  type: 'PRICE_SCAN';
  airport: string;
  hotel: string;
  region: string;
  basePrice: number;
  route: string;
  passengers: number;
  luggage: number;
  vehicleOptions: VehicleOption[];
}

export interface AgentResponse {
  message: string;
  hotels?: Hotel[];
  services?: Service[];
  suggestions?: string[];
  bookingAction?: BookingAction;
  priceScanRequest?: PriceScanRequest;
  vehicleImage?: {
    url: string;
    alt: string;
    caption: string;
  };
  galleryImages?: {
    url: string;
    title: string;
    description: string;
  }[];
  languageSwitch?: 'en' | 'nl' | 'es';
}

type BookingStep =
  | 'IDLE'
  | 'AWAITING_AIRPORT'
  | 'AWAITING_HOTEL'
  | 'AWAITING_PROPERTY_RESOLUTION'
  | 'AWAITING_PASSENGERS'
  | 'AWAITING_LUGGAGE'
  | 'AWAITING_VEHICLE_SELECTION'
  | 'AWAITING_TRIP_TYPE'
  | 'AWAITING_CONFIRMATION';

interface BookingContext {
  step: BookingStep;
  airport?: string;
  hotel?: string;
  region?: string;
  resort_property_id?: string;
  property_resolved?: boolean;
  pending_brand?: string;
  pending_properties?: HotelZone[];
  vehicle?: string;
  passengers?: number;
  suitcases?: number;
  tripType?: 'One-way' | 'Round trip';
  price?: number;
  priceSource?: string;
  originalPrice?: number;
  matchedPrice?: number;
}

const AIRPORTS: Record<string, string> = {
  'PUJ': 'Punta Cana International Airport (PUJ)',
  'SDQ': 'Santo Domingo Las Americas (SDQ)',
  'LRM': 'La Romana International Airport (LRM)',
  'POP': 'Puerto Plata Gregorio Luperon (POP)'
};

const ROUNDTRIP_MULTIPLIER = 1.9;

const FALLBACK_VEHICLE_PRICING: Record<string, { base: number; perKm: number; capacity: number; luggage: number }> = {
  'Sedan': { base: 25, perKm: 0.8, capacity: 3, luggage: 3 },
  'SUV': { base: 35, perKm: 1.0, capacity: 4, luggage: 4 },
  'Minivan': { base: 45, perKm: 1.2, capacity: 6, luggage: 6 },
  'Suburban': { base: 65, perKm: 1.4, capacity: 5, luggage: 5 },
  'Sprinter': { base: 95, perKm: 1.8, capacity: 12, luggage: 12 },
  'Mini Bus': { base: 150, perKm: 2.5, capacity: 20, luggage: 20 }
};

const DISTANCE_KEYWORDS: Record<string, { km: number; zone: string }> = {
  'downtown': { km: 15, zone: 'City Center' },
  'centro': { km: 15, zone: 'City Center' },
  'city center': { km: 15, zone: 'City Center' },
  'beach': { km: 25, zone: 'Beach Area' },
  'playa': { km: 25, zone: 'Beach Area' },
  'resort': { km: 30, zone: 'Resort Area' },
  'hotel': { km: 25, zone: 'Hotel Zone' },
  'villa': { km: 35, zone: 'Villa Area' },
  'airbnb': { km: 30, zone: 'Rental Area' },
  'apartment': { km: 20, zone: 'Residential' },
  'house': { km: 30, zone: 'Residential' },
  'marina': { km: 35, zone: 'Marina Area' },
  'golf': { km: 30, zone: 'Golf Resort' },
  'all inclusive': { km: 30, zone: 'All-Inclusive Resort' },
  'boutique': { km: 25, zone: 'Boutique Hotel' }
};

const AIRPORT_DEFAULT_DISTANCES: Record<string, number> = {
  'PUJ': 25,
  'SDQ': 30,
  'LRM': 20,
  'POP': 25
};

interface VehicleType {
  id: string;
  name: string;
  passenger_capacity: number;
  luggage_capacity: number;
}

interface PricingRule {
  id: string;
  origin: string;
  destination: string;
  vehicle_type_id: string;
  base_price: number;
  zone: string;
}

interface FleetVehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  color: string;
  capacity: number;
  luggage_capacity: number;
  image_url: string;
  amenities: string[];
  vehicle_type_id: string;
}

interface HotelZone {
  id: string;
  hotel_name: string;
  zone_code: string;
  zone_name: string;
  search_terms: string[];
  is_active: boolean;
  brand_name?: string;
  requires_resolution?: boolean;
}

export class TravelAgent {
  private context: BookingContext = { step: 'IDLE' };
  private hotels: Hotel[] = [];
  private services: Service[] = [];
  private vehicleTypes: VehicleType[] = [];
  private pricingRules: PricingRule[] = [];
  private fleetVehicles: FleetVehicle[] = [];
  private hotelZones: HotelZone[] = [];
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private currentLanguage: Language = 'en';
  private globalDiscountPercentage: number = 0;

  async initialize(): Promise<void> {
    try {
      const [hotelsResult, servicesResult, vehicleTypesResult, pricingRulesResult, vehiclesResult, hotelZonesResult, discountResult] = await Promise.all([
        supabase.from('hotels').select('*'),
        supabase.from('services').select('*'),
        supabase.from('vehicle_types').select('id, name, passenger_capacity, luggage_capacity').eq('is_active', true),
        supabase.from('pricing_rules').select('id, origin, destination, vehicle_type_id, base_price, zone').eq('is_active', true),
        supabase.from('fleet_vehicles').select('id, make, model, year, color, capacity, luggage_capacity, image_url, amenities, vehicle_type_id').eq('status', 'available'),
        supabase.from('hotel_zones').select('*').eq('is_active', true),
        supabase.from('global_discount_settings').select('discount_percentage').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);
      if (hotelsResult.data) this.hotels = hotelsResult.data;
      if (servicesResult.data) this.services = servicesResult.data;
      if (vehicleTypesResult.data) this.vehicleTypes = vehicleTypesResult.data;
      if (pricingRulesResult.data) this.pricingRules = pricingRulesResult.data;
      if (vehiclesResult.data) this.fleetVehicles = vehiclesResult.data;
      if (hotelZonesResult.data) this.hotelZones = hotelZonesResult.data;
      if (discountResult.data) this.globalDiscountPercentage = Number(discountResult.data.discount_percentage) || 0;
    } catch (error) {
      console.error('Failed to initialize TravelAgent:', error);
    }
  }

  setLanguage(lang: Language): void {
    this.currentLanguage = lang;
  }

  isInBookingFlow(): boolean {
    return this.context.step !== 'IDLE';
  }

  async processQuery(userMessage: string): Promise<AgentResponse> {
    return this.processMessage(userMessage);
  }

  async processMessage(userMessage: string): Promise<AgentResponse> {
    const query = userMessage.toLowerCase().trim();

    const detectedLang = detectLanguage(userMessage);
    if (detectedLang) {
      this.currentLanguage = detectedLang;
      const t = getTranslations(detectedLang);
      return {
        message: t.chat.languageChanged,
        suggestions: [t.services.bookNow, t.agent.anotherQuestion, 'Tell me about services'],
        languageSwitch: detectedLang
      };
    }

    if (query === 'start over' || query === 'reset' || query === 'cancel booking') {
      this.context = { step: 'IDLE' };
      this.conversationHistory = [];
      return this.getWelcomeMessage();
    }

    if (this.context.step !== 'IDLE') {
      return await this.handleBookingFlow(query, userMessage);
    }

    if (this.isGreeting(query)) {
      return this.getWelcomeMessage();
    }

    if (query.includes('landing page') || query.includes('landing pages') || (query.includes('landing') && query.includes('link')) || query.includes('google ads url')) {
      return this.generateLandingPageLinks();
    }

    // Extract booking information from natural language queries FIRST (before FAQ/general questions)
    // This ensures "I'm flying into punta cana with 4 adults" is treated as booking, not general chat
    const extractedInfo = this.extractBookingInformation(query);
    if (extractedInfo.hasInfo) {
      return this.handleExtractedBookingInfo(extractedInfo, query);
    }

    // Check for FAQ queries
    if (this.isFAQQuery(query)) {
      return this.handleFAQ(query);
    }

    // Check for general questions ONLY if no booking info was extracted
    if (this.isGeneralQuestion(query)) {
      return this.handleGeneralQuestion(userMessage);
    }

    // Check for transfer queries (route-based like "PUJ to Hard Rock")
    const transferQuery = this.detectTransferQuery(query);
    if (transferQuery) {
      return transferQuery;
    }

    if (this.isBookingRelated(query)) {
      return this.startGuidedBooking();
    }

    if (query.includes('fun facts') || query.includes('about dominican')) {
      return this.showDominicanFunFacts();
    }

    if (this.isAskingForPhotos(query)) {
      return this.showInstagramPhotos();
    }

    if (this.isAskingAboutVehiclesOrDrivers(query)) {
      return await this.showVehicleGallery();
    }

    if (query.includes('pickup procedure') || query.includes('how does pickup work') || query.includes('real human')) {
      return this.showPickupProcedure();
    }

    return this.handleGeneralQuestion(userMessage);
  }

  private async handleBookingFlow(query: string, originalMessage: string): Promise<AgentResponse> {
    try {
      if (query.includes('fun facts') || query.includes('about dominican')) {
        const response = this.showDominicanFunFacts();
        return this.addBookingContextToResponse(response);
      }

      if (this.isAskingForPhotos(query)) {
        const response = this.showInstagramPhotos();
        return this.addBookingContextToResponse(response);
      }

      if (this.isAskingAboutVehiclesOrDrivers(query)) {
        const response = await this.showVehicleGallery();
        return this.addBookingContextToResponse(response);
      }

      if (query.includes('pickup procedure') || query.includes('how does pickup work') || query.includes('real human')) {
        const response = this.showPickupProcedure();
        return this.addBookingContextToResponse(response);
      }

      if (this.isFAQQuery(query)) {
        return this.handleFAQ(query);
      }

      if (this.isGeneralQuestion(query)) {
        return await this.handleGeneralQuestion(originalMessage);
      }

      if (query.includes('continue') || query.includes('resume') || query.includes('back to booking') || query.includes('proceed')) {
        const stepMessages: Record<BookingStep, string> = {
          'IDLE': 'Ready to start a new booking?',
          'AWAITING_AIRPORT': 'Which airport will you be arriving at?',
          'AWAITING_HOTEL': 'Where would you like to go? Tell me your hotel name or destination.',
          'AWAITING_PASSENGERS': 'How many passengers will be traveling?',
          'AWAITING_LUGGAGE': 'How many pieces of luggage will you have?',
          'AWAITING_VEHICLE_SELECTION': 'Which vehicle would you like to book?',
          'AWAITING_TRIP_TYPE': 'Would you like a one-way or round trip?',
          'AWAITING_CONFIRMATION': 'Ready to confirm your booking?'
        };

        const parts = [];
        if (this.context.airport) parts.push(`✓ Airport: ${this.context.airport}`);
        if (this.context.hotel) parts.push(`✓ Hotel: ${this.context.hotel}`);
        if (this.context.passengers) parts.push(`✓ ${this.context.passengers} passengers`);
        if (this.context.suitcases !== undefined) parts.push(`✓ ${this.context.suitcases} suitcases`);
        if (this.context.vehicle) parts.push(`✓ Vehicle: ${this.context.vehicle}`);
        if (this.context.tripType) parts.push(`✓ ${this.context.tripType}`);

        const progressMessage = parts.length > 0
          ? `\n\nYour booking so far:\n${parts.join('\n')}\n\n`
          : '';

        return {
          message: `Perfect! Let's continue with your booking.${progressMessage}${stepMessages[this.context.step] || 'How can I help?'}`,
          suggestions: this.getSuggestionsForStep(this.context.step)
        };
      }

      let response: AgentResponse;

      switch (this.context.step) {
        case 'AWAITING_AIRPORT':
          response = this.handleAirportInput(query);
          break;
        case 'AWAITING_HOTEL':
          response = await this.handleHotelInput(query);
          break;
        case 'AWAITING_PROPERTY_RESOLUTION':
          response = this.handlePropertyResolution(query);
          break;
        case 'AWAITING_PASSENGERS':
          response = this.handlePassengersInput(query);
          break;
        case 'AWAITING_LUGGAGE':
          response = this.handleLuggageInput(query);
          break;
        case 'AWAITING_VEHICLE_SELECTION':
          response = this.handleVehicleSelection(query);
          break;
        case 'AWAITING_TRIP_TYPE':
          response = this.handleTripTypeInput(query);
          break;
        case 'AWAITING_CONFIRMATION':
          response = this.handleConfirmationInput(query);
          break;
        default:
          response = this.getWelcomeMessage();
          break;
      }

      if (!response || !response.message || response.message === 'undefined' || response.message.includes('undefined')) {
        return await this.handleGeneralQuestion(originalMessage);
      }

      return response;
    } catch (error) {
      console.error('Error in handleBookingFlow:', error);
      return await this.handleGeneralQuestion(originalMessage);
    }
  }

  private isGeneralQuestion(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    const trimmedQuery = query.trim();

    const explicitQuestionTriggers = [
      'ask a question',
      'ask another question',
      'another question',
      'tell me about',
      'more questions',
      'i have a question',
      'quick question',
      'can i ask'
    ];

    if (explicitQuestionTriggers.some(trigger => lowerQuery.includes(trigger))) {
      return true;
    }

    // Check for numbers alone (like "2" or "3 passengers") - these are booking inputs
    if (/^\d+\s*(passenger|people|person|suitcase|bag|luggage)?s?$/i.test(trimmedQuery)) {
      return false;
    }

    // Check for simple confirmation responses - NOT general questions
    const simpleResponses = /^(yes|no|ok|okay|sure|nope|yep|yeah|nah|alright|continue|proceed|go ahead|next|back)$/i;
    if (simpleResponses.test(trimmedQuery)) {
      return false;
    }

    // Check for simple location inputs - NOT general questions
    const simpleLocationPattern = /^(puj|sdq|lrm|pop|punta cana|santo domingo|la romana|puerto plata)$/i;
    if (simpleLocationPattern.test(trimmedQuery)) {
      return false;
    }

    // Check for hotel name patterns - NOT general questions (unless they have question words)
    const hasQuestionWord = /\b(what|where|when|why|how|who|which|can|do|does|is|are|will|should|could|would|may)\b/i.test(lowerQuery);
    const hasHotelKeywords = /\b(hotel|resort|iberostar|hard rock|dreams|hyatt|marriott|hilton|now|secrets|excellence|bahia|majestic|riu)\b/i.test(lowerQuery);
    if (hasHotelKeywords && !hasQuestionWord && trimmedQuery.length < 50) {
      return false;
    }

    // Check for simple vehicle selections - NOT general questions
    const vehicleSelectionPattern = /^(sedan|minivan|suv|suburban|sprinter|mini bus|bus|van|car)$/i;
    if (vehicleSelectionPattern.test(trimmedQuery)) {
      return false;
    }

    // Check for simple trip type selections - NOT general questions
    const tripTypePattern = /^(one-way|round trip|roundtrip|one way|both ways|return|just one way)$/i;
    if (tripTypePattern.test(trimmedQuery)) {
      return false;
    }

    // Professional Airport Transportation specific questions - ALWAYS treat as general questions
    const airportTransportationQuestions = [
      // Pickup & Meeting Point Questions
      'where will the driver', 'where does the driver', 'where do i meet', 'where can i meet',
      'where to meet', 'where will i meet', 'where should i meet', 'how do i find',
      'how will i find', 'where will you pick', 'where do you pick up',
      'what is the pickup location', 'what is the meeting point', 'meeting point',
      'where exactly', 'which terminal', 'arrivals hall', 'after customs', 'after immigration',

      // Driver & Service Questions
      'will the driver wait', 'does the driver wait', 'how long will driver wait',
      'what if i cant find driver', 'driver contact', 'how to contact driver',
      'will i receive driver info', 'driver details', 'driver name',
      'speak english', 'english speaking', 'language', 'driver speaks',
      'professional driver', 'licensed driver', 'experienced driver',

      // Flight Delay Questions
      'what if flight delayed', 'what if my flight', 'if flight is late',
      'delayed flight', 'late flight', 'flight delay', 'plane delayed',
      'do you track flight', 'flight tracking', 'monitor my flight',
      'what if immigration', 'what if customs', 'long immigration line',

      // Vehicle & Comfort Questions
      'what type of vehicle', 'what kind of car', 'vehicle type', 'what vehicle',
      'air conditioned', 'air conditioning', 'ac in car', 'clean vehicle',
      'comfortable', 'modern vehicle', 'new vehicle', 'vehicle condition',
      'size of vehicle', 'how big is', 'vehicle capacity',

      // Luggage & Extra Items
      'child seat', 'baby seat', 'car seat', 'booster seat', 'infant seat',
      'golf clubs', 'surfboard', 'oversized luggage', 'extra luggage',
      'wheelchair', 'accessibility', 'special needs', 'assistance',

      // Pricing & Payment Questions
      'is price per person', 'per person or per vehicle', 'price per passenger',
      'per vehicle', 'total price', 'final price', 'fixed price',
      'hidden fees', 'extra charges', 'additional cost', 'price change',
      'surge pricing', 'night charge', 'weekend charge',
      'how to pay', 'payment method', 'accept card', 'credit card',
      'debit card', 'cash', 'pay online', 'pay driver', 'prepay',
      'secure payment', 'payment secure', 'safe to pay',

      // Service Type Questions
      'private transfer', 'shared transfer', 'is it private', 'is it shared',
      'shuttle service', 'shared shuttle', 'private ride', 'just us',
      'other passengers', 'alone in car', 'only my group',

      // Tipping Questions
      'tip included', 'is tip included', 'should i tip', 'do i tip',
      'how much to tip', 'tipping', 'gratuity', 'tip driver',
      'tip expected', 'tip mandatory', 'tips required',

      // Safety & Insurance Questions
      'is it safe', 'are you safe', 'safe to use', 'safety',
      'insured', 'insurance', 'vehicle insurance', 'liability',
      'licensed', 'legal', 'registered', 'authorized',
      'background check', 'vetted driver', 'trusted',

      // Cancellation & Changes Questions
      'cancellation policy', 'can i cancel', 'cancel booking', 'refund',
      'free cancellation', 'cancellation fee', 'change booking',
      'modify booking', 'reschedule', 'change date', 'change time',

      // Service Area & Availability Questions
      'what airports', 'which airports', 'do you cover', 'service area',
      'available at', 'operate at', '24 hour', '24/7', 'all day',
      'late night', 'early morning', 'midnight', 'available when',

      // Booking Process Questions
      'how to book', 'how do i book', 'booking process', 'when to book',
      'how far in advance', 'book ahead', 'last minute', 'same day',
      'book now or later', 'when should i book',

      // Wait Time & Duration Questions
      'how long does transfer take', 'how long is drive', 'drive time',
      'transfer duration', 'journey time', 'travel time', 'how many minutes',
      'waiting time', 'free waiting', 'will you wait for me',

      // Communication Questions
      'will you contact me', 'how will i know', 'confirmation',
      'will i get details', 'booking confirmation', 'email confirmation',
      'whatsapp', 'sms', 'text message', 'phone number',

      // Comparison Questions
      'vs taxi', 'versus taxi', 'better than taxi', 'compared to taxi',
      'vs uber', 'versus uber', 'difference between', 'why choose you',

      // Round Trip Questions
      'can i book round trip', 'both ways', 'return transfer', 'round trip discount',
      'cheaper round trip', 'return journey', 'back to airport',

      // Group & Special Requests
      'large group', 'big group', 'many people', 'group discount',
      'wedding', 'corporate', 'business', 'event', 'special request',
      'special requirements', 'multiple stops', 'stop along way'
    ];

    // Check for airport transportation specific questions
    if (airportTransportationQuestions.some(pattern => lowerQuery.includes(pattern))) {
      return true;
    }

    // Strong question indicators - informational queries
    const strongQuestionIndicators = [
      'what is', 'what are', 'what does', 'what if', 'what about', 'what should', 'what would',
      'who is', 'who are', 'who do', 'who will', 'who can',
      'when is', 'when do', 'when does', 'when will', 'when should', 'when can',
      'where is', 'where are', 'where do', 'where will', 'where should', 'where can',
      'why is', 'why do', 'why does', 'why should', 'why would', 'why cant',
      'how does', 'how do', 'how can', 'how will', 'how should', 'how long', 'how much does', 'how many',
      'can you tell', 'could you explain', 'could you tell', 'would you explain',
      'tell me about', 'tell me more', 'explain to me', 'let me know',
      'i want to know', 'i would like to know', 'i need to know',
      'is it safe', 'is it possible', 'is there', 'is this',
      'are you', 'are there', 'are these',
      'do you', 'does it', 'does this', 'do i need',
      'will you', 'will it', 'will i', 'will there',
      'should i', 'should we', 'would you', 'would it'
    ];

    // If contains strong question indicators, it's likely a general question
    if (strongQuestionIndicators.some(indicator => lowerQuery.includes(indicator))) {
      // EXCEPTION: If it's a very short query with booking keywords, might be booking input
      const containsBookingKeyword = /\b(puj|sdq|lrm|pop|passenger|suitcase|luggage|bag)\b/i.test(lowerQuery);
      if (containsBookingKeyword && trimmedQuery.length < 25) {
        return false;
      }
      return true;
    }

    // Check if query ends with question mark - strong indicator
    if (trimmedQuery.endsWith('?')) {
      // EXCEPTION: Very short queries with just location might be booking inputs
      if (trimmedQuery.length < 15 && /^(puj|sdq|lrm|pop)/i.test(trimmedQuery)) {
        return false;
      }
      return true;
    }

    // Check for booking flow continuation keywords - NOT general questions
    const continuationKeywords = [
      'continue', 'resume', 'proceed', 'back to booking', 'keep going',
      'go on', 'next step', 'continue booking', 'finish booking'
    ];
    if (continuationKeywords.some(keyword => lowerQuery.includes(keyword))) {
      return false;
    }

    // Booking input patterns - NOT general questions
    const bookingInputPatterns = [
      /^\d+\s+(passenger|people|person|guest|adult|child|kid)s?$/i,
      /^(couple|solo|alone|just me|two of us|family)$/i,
      /^\d+\s+(suitcase|luggage|bag)s?$/i,
      /^[a-z\s]{3,40}\s+(hotel|resort)$/i,  // "Hard Rock Hotel"
      /^(one-way|round trip|roundtrip|one way)$/i,
      /^(puj|sdq|lrm|pop)(\s+to\s+|\s+-\s+|\s+airport)?/i
    ];

    if (bookingInputPatterns.some(pattern => pattern.test(trimmedQuery))) {
      return false;
    }

    // Dominican Republic tourism/culture questions - general questions
    const dominicanQuestionKeywords = [
      'dominican', 'punta cana', 'santo domingo', 'weather', 'climate',
      'temperature', 'season', 'rain', 'sunny', 'beach', 'beaches',
      'restaurant', 'restaurants', 'food', 'dining', 'eat',
      'attraction', 'attractions', 'things to do', 'activities',
      'excursion', 'tour', 'sightseeing', 'visit',
      'culture', 'history', 'people', 'language', 'currency',
      'merengue', 'bachata', 'baseball', 'fun facts'
    ];

    const hasDominicanKeyword = dominicanQuestionKeywords.some(k => lowerQuery.includes(k));
    if (hasDominicanKeyword && (hasQuestionWord || trimmedQuery.endsWith('?') || trimmedQuery.length > 20)) {
      return true;
    }

    // If longer than 50 characters and has question-like structure, treat as general question
    if (trimmedQuery.length > 50 && (hasQuestionWord || trimmedQuery.endsWith('?'))) {
      return true;
    }

    return false;
  }

  private getSuggestionsForStep(step: BookingStep): string[] {
    switch (step) {
      case 'AWAITING_AIRPORT':
        return ['PUJ - Punta Cana', 'SDQ - Santo Domingo', 'LRM - La Romana', 'Ask a question'];
      case 'AWAITING_HOTEL':
        return ['Hard Rock Hotel', 'Iberostar Bavaro', 'Dreams Macao', 'Ask a question'];
      case 'AWAITING_PROPERTY_RESOLUTION':
        return this.context.pending_properties?.slice(0, 4).map(p => p.hotel_name) || ['Ask a question'];
      case 'AWAITING_PASSENGERS':
        return ['1 passenger', '2 passengers', '3-4 passengers', 'Ask a question'];
      case 'AWAITING_LUGGAGE':
        return ['2 suitcases', '4 suitcases', '6 suitcases', 'Ask a question'];
      case 'AWAITING_VEHICLE_SELECTION':
        return [...this.vehicleTypes.slice(0, 3).map(v => v.name), 'Ask a question'];
      case 'AWAITING_TRIP_TYPE':
        return ['One-way', 'Round trip', 'Ask a question'];
      case 'AWAITING_CONFIRMATION':
        return ['Yes, book now!', 'Change vehicle', 'Start over', 'Ask a question'];
      default:
        return ['Book a transfer', 'See prices', 'Ask a question'];
    }
  }

  private detectTransferQuery(query: string): AgentResponse | null {
    const airport = this.extractAirport(query);
    if (!airport) return null;

    const hotelMatch = this.findHotelInDatabase(query);
    let region: string | null = null;
    let hotelName: string = '';
    let useFallback = false;

    if (hotelMatch) {
      region = hotelMatch.zone_name;
      hotelName = hotelMatch.hotel_name;
      this.context.resort_property_id = hotelMatch.id;
      this.context.property_resolved = true;
    } else {
      region = this.detectRegionFromQuery(query);
      if (region) {
        hotelName = this.extractHotelName(query) || `Hotel in ${region}`;
      } else {
        hotelName = this.extractHotelName(query);
        if (hotelName && hotelName.length > 3) {
          const estimated = this.estimateDistanceFromQuery(query);
          region = estimated.zone;
          useFallback = true;
        }
      }
    }

    if (!region || !hotelName) return null;

    const pricingRules = this.pricingRules.filter(
      rule => rule.origin === airport && rule.destination === region
    );

    if (pricingRules.length === 0 && !useFallback) {
      const estimated = this.estimateDistanceFromQuery(query);
      region = estimated.zone;
      useFallback = true;
    }

    this.context = {
      step: 'AWAITING_PASSENGERS',
      airport,
      hotel: hotelName,
      region,
      priceSource: useFallback ? 'estimated' : 'standard'
    };

    const airportName = AIRPORTS[airport]?.split(' (')[0] || airport;

    const message = useFallback
      ? `I'll help you with a transfer from ${airportName} to ${hotelName}.\n\nHow many passengers will be traveling? (including children)`
      : `Perfect! Transfer from ${airportName} to ${hotelName}.\n\nHow many passengers will be traveling? (including children)`;

    return {
      message,
      suggestions: ['1 passenger', '2 passengers', '3-4 passengers', '5-6 passengers', '7+ passengers']
    };
  }

  private getWelcomeMessage(): AgentResponse {
    return {
      message: `Welcome to Dominican Transfers!\n\nI'll help you book a comfortable ride to your destination.\n\nWhat's included:\n\n✓ Private airport pickups\n✓ Meet & greet at arrivals\n✓ Free flight tracking\n✓ English-speaking drivers\n✓ 24/7 support\n\nJust tell me your route (like "PUJ to Hard Rock Hotel") or ask me anything!`,
      suggestions: [
        'PUJ to Hard Rock Hotel',
        'PUJ to Iberostar Bavaro',
        'SDQ to JW Marriott',
        'What if my flight is delayed?',
        'How does pickup work?'
      ]
    };
  }

  private extractBookingInformation(query: string) {
    const info: {
      hasInfo: boolean;
      airport?: string;
      hotel?: string;
      region?: string;
      passengers?: number;
      luggage?: number;
      tripType?: 'One-way' | 'Round trip';
      date?: string;
      isPriceInquiry?: boolean;
      acknowledgedInfo: string[];
    } = {
      hasInfo: false,
      acknowledgedInfo: []
    };

    const lowerQuery = query.toLowerCase();

    // Detect BOOKING INTENT first - any mention of travel/arrival with airport
    const bookingIntentPatterns = [
      /(?:i am|i'm|we are|we're)\s+(?:flying|coming|arriving|landing|getting|traveling)/i,
      /(?:will be|going to be)\s+(?:flying|coming|arriving|landing|getting|traveling)/i,
      /(?:flying|coming|arriving|landing|getting|traveling)\s+(?:in|into|to|at)/i,
      /(?:need|want|looking for)\s+(?:a\s+)?(?:transfer|ride|pickup|transport)/i,
      /(?:book|booking|reserve|reserving)\s+(?:a\s+)?(?:transfer|ride|pickup|transport)/i
    ];

    let hasBookingIntent = false;
    for (const pattern of bookingIntentPatterns) {
      if (pattern.test(query)) {
        hasBookingIntent = true;
        break;
      }
    }

    // Detect landing page suggestion patterns and extract hotel name
    const landingPageSuggestionPatterns = [
      /(?:quote for|best price to|vehicle options to|transfer to)\s+(.+?)(?:\s+transfer)?$/i,
      /(?:price for|cost for|rate for)\s+(.+?)(?:\s+transfer)?$/i
    ];

    for (const pattern of landingPageSuggestionPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const destination = match[1].trim();
        // Set the hotel from the suggestion
        const hotelMatch = this.findHotelInDatabase(destination);
        if (hotelMatch) {
          info.hotel = hotelMatch.hotel_name;
          info.region = hotelMatch.zone_name;
          info.acknowledgedInfo.push(hotelMatch.hotel_name);
        } else {
          info.hotel = destination;
          info.acknowledgedInfo.push(destination);
        }
        info.isPriceInquiry = true;
        info.hasInfo = true;
        hasBookingIntent = true;
        break;
      }
    }

    // Detect price inquiries
    const priceInquiryPatterns = [
      /(?:how much|what(?:'s| is) the (?:price|cost|rate))/i,
      /(?:i (?:would like to|want to|need to) know (?:the )?(?:price|cost|rate))/i,
      /(?:can you (?:tell me|give me) (?:the )?(?:price|cost|rate))/i,
      /(?:what (?:does|do) (?:it|transfers?) cost)/i,
      /(?:price(?:s)? (?:for|of))/i,
      /(?:cost(?:s)? (?:for|of))/i,
      /(?:rate(?:s)? (?:for|of))/i,
      /(?:quote(?:s)? (?:for|of))/i
    ];

    for (const pattern of priceInquiryPatterns) {
      if (pattern.test(query)) {
        info.isPriceInquiry = true;
        info.hasInfo = true;
        hasBookingIntent = true;
        break;
      }
    }

    // Enhanced airport extraction with context patterns
    const airportPatterns = [
      // Direct mentions
      { pattern: /\b(puj|punta cana(?:\s+airport)?)\b/i, code: 'PUJ' },
      { pattern: /\b(sdq|santo domingo(?:\s+airport)?)\b/i, code: 'SDQ' },
      { pattern: /\b(lrm|la romana(?:\s+airport)?)\b/i, code: 'LRM' },
      { pattern: /\b(pop|puerto plata(?:\s+airport)?)\b/i, code: 'POP' },

      // Contextual patterns - arriving/flying/landing
      { pattern: /(?:arriving|landing|flying|getting)\s+(?:at|into|to|in)\s+(?:the\s+)?(?:puj|punta cana(?:\s+airport)?)/i, code: 'PUJ' },
      { pattern: /(?:arriving|landing|flying|getting)\s+(?:at|into|to|in)\s+(?:the\s+)?(?:sdq|santo domingo(?:\s+airport)?)/i, code: 'SDQ' },
      { pattern: /(?:arriving|landing|flying|getting)\s+(?:at|into|to|in)\s+(?:the\s+)?(?:lrm|la romana(?:\s+airport)?)/i, code: 'LRM' },
      { pattern: /(?:arriving|landing|flying|getting)\s+(?:at|into|to|in)\s+(?:the\s+)?(?:pop|puerto plata(?:\s+airport)?)/i, code: 'POP' },

      // From airport patterns
      { pattern: /(?:from|pickup at|leaving)\s+(?:the\s+)?(?:puj|punta cana(?:\s+airport)?)/i, code: 'PUJ' },
      { pattern: /(?:from|pickup at|leaving)\s+(?:the\s+)?(?:sdq|santo domingo(?:\s+airport)?)/i, code: 'SDQ' },
      { pattern: /(?:from|pickup at|leaving)\s+(?:the\s+)?(?:lrm|la romana(?:\s+airport)?)/i, code: 'LRM' },
      { pattern: /(?:from|pickup at|leaving)\s+(?:the\s+)?(?:pop|puerto plata(?:\s+airport)?)/i, code: 'POP' }
    ];

    for (const { pattern, code } of airportPatterns) {
      if (pattern.test(lowerQuery)) {
        info.airport = code;
        info.acknowledgedInfo.push(`${AIRPORTS[code]?.split(' (')[0] || code} airport`);
        info.hasInfo = true;
        break;
      }
    }

    // Enhanced passenger extraction with context
    const passengerPatterns = [
      // Standard patterns
      /(\d+)\s*(?:adults?|passengers?|people|persons?|pax)/i,
      /(?:family|group)\s+of\s+(\d+)/i,
      /(\d+)\s+in\s+(?:my|our)\s+(?:party|group)/i,
      /(?:we|us|there)\s+(?:are|will be)\s+(\d+)/i,
      /(\d+)\s+traveling/i,

      // New contextual patterns - "with X adults"
      /(?:with|bringing|traveling with)\s+(\d+)\s+(?:adults?|people|passengers?|persons?)/i,
      /(?:party of|group of)\s+(\d+)/i,
      /(?:for|booking for)\s+(\d+)\s+(?:adults?|people|passengers?|persons?)/i,
      /(?:total of|total)\s+(\d+)\s+(?:adults?|people|passengers?|persons?)/i,
      /(\d+)\s+(?:adults?|people|passengers?|persons?)\s+(?:total|in total)/i
    ];

    for (const pattern of passengerPatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const count = parseInt(match[1]);
        if (count >= 1 && count <= 50) {
          info.passengers = count;
          info.acknowledgedInfo.push(`${count} passenger${count !== 1 ? 's' : ''}`);
          info.hasInfo = true;
          break;
        }
      }
    }

    // Enhanced luggage extraction
    const luggagePatterns = [
      /(\d+)\s*(?:suitcases?|bags?|luggage|pieces?)/i,
      /with\s+(\d+)\s+(?:checked\s+)?(?:bag|luggage)/i,
      /(\d+)\s+(?:pieces? of )?luggage/i,
      /(?:bringing|carrying|have)\s+(\d+)\s+(?:suitcases?|bags?)/i
    ];

    for (const pattern of luggagePatterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        const count = parseInt(match[1]);
        if (count >= 0 && count <= 50) {
          info.luggage = count;
          info.acknowledgedInfo.push(`${count} suitcase${count !== 1 ? 's' : ''}`);
          info.hasInfo = true;
          break;
        }
      }
    }

    // Enhanced trip type detection
    if (/\b(round\s*trip|return|both\s*ways?|two\s*ways?|back and forth)\b/i.test(lowerQuery)) {
      info.tripType = 'Round trip';
      info.acknowledgedInfo.push('round trip');
      info.hasInfo = true;
    } else if (/\b(one\s*way|single|just\s+(?:there|to)|drop off only)\b/i.test(lowerQuery)) {
      info.tripType = 'One-way';
      info.acknowledgedInfo.push('one-way');
      info.hasInfo = true;
    }

    // Enhanced date extraction with more formats
    const datePatterns = [
      // Month + Day patterns
      /(?:on|arriving|coming|landing|getting\s+in|flying\s+in)\s+(?:on\s+)?(?:the\s+)?([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      /(?:on|arriving|coming|landing|flying\s+in)\s+(?:the\s+)?(\d{1,2}(?:st|nd|rd|th)?(?:\s+(?:of\s+)?)[A-Za-z]+)/i,

      // Named month patterns
      /(?:on|arriving|coming|landing|flying in|getting in)\s+(?:the\s+)?(\d{1,2})\s+(january|februari|february|march|april|may|june|july|august|september|october|november|december)/i,
      /(january|februari|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}(?:st|nd|rd|th)?)/i,
      /(\d{1,2})\s+(january|januari|februari|february|march|april|may|june|july|august|september|october|november|december)/i,

      // "the 2 january" pattern
      /(?:the\s+)?(\d{1,2})\s+(january|januari|februari|february|march|april|may|june|july|august|september|october|november|december)/i,

      // Just date mention
      /(?:on|arriving)\s+(?:the\s+)?(\d{1,2}(?:st|nd|rd|th)?)/i
    ];

    for (const pattern of datePatterns) {
      const match = query.match(pattern);
      if (match) {
        if (match[2]) {
          // Month + day (like "2 january")
          info.date = `${match[2]} ${match[1]}`;
        } else {
          info.date = match[1] || match[0];
        }
        info.acknowledgedInfo.push(`arriving ${info.date}`);
        info.hasInfo = true;
        break;
      }
    }

    // Extract hotel/destination
    const hotelMatch = this.findHotelInDatabase(query);
    if (hotelMatch) {
      info.hotel = hotelMatch.hotel_name;
      info.region = hotelMatch.zone_name;
      info.acknowledgedInfo.push(`${hotelMatch.hotel_name}`);
      info.hasInfo = true;
    } else {
      // Check for region mentions
      const regionPatterns = [
        { pattern: /\b(bavaro|punta cana beach|arena gorda)\b/i, region: 'Zone A - Bavaro' },
        { pattern: /\b(uvero alto)\b/i, region: 'Zone B - Uvero Alto' },
        { pattern: /\b(cap cana|cabo)\b/i, region: 'Zone C - Cap Cana' },
        { pattern: /\b(la romana|bayahibe)\b/i, region: 'Zone D - La Romana' }
      ];

      for (const { pattern, region } of regionPatterns) {
        if (pattern.test(lowerQuery)) {
          info.region = region;
          info.acknowledgedInfo.push(region);
          info.hasInfo = true;
          break;
        }
      }
    }

    // CRITICAL: If we detected booking intent (flying, arriving, etc.) AND have an airport,
    // treat this as a booking query even if other info is missing
    if (hasBookingIntent && info.airport) {
      info.hasInfo = true;
    }

    // Also mark as booking if we have airport + passengers (clear booking intent)
    if (info.airport && info.passengers) {
      info.hasInfo = true;
    }

    // Or if we have airport + date (planning a transfer)
    if (info.airport && info.date) {
      info.hasInfo = true;
    }

    return info;
  }

  private handleExtractedBookingInfo(extractedInfo: ReturnType<typeof this.extractBookingInformation>, originalQuery: string): AgentResponse {
    // Pre-fill context with extracted information
    if (extractedInfo.airport) {
      this.context.airport = extractedInfo.airport;
    }
    if (extractedInfo.hotel) {
      this.context.hotel = extractedInfo.hotel;
    }
    if (extractedInfo.region) {
      this.context.region = extractedInfo.region;
    }
    if (extractedInfo.passengers) {
      this.context.passengers = extractedInfo.passengers;
    }
    if (extractedInfo.luggage !== undefined) {
      this.context.suitcases = extractedInfo.luggage;
    }
    if (extractedInfo.tripType) {
      this.context.tripType = extractedInfo.tripType;
    }

    // Build comprehensive recap message
    const recapParts: string[] = [];
    if (this.context.airport) {
      const airportName = AIRPORTS[this.context.airport]?.split(' (')[0] || this.context.airport;
      recapParts.push(`✓ ${airportName}`);
    }
    if (extractedInfo.date) {
      recapParts.push(`✓ Arriving ${extractedInfo.date}`);
    }
    if (this.context.passengers) {
      recapParts.push(`✓ ${this.context.passengers} passenger${this.context.passengers !== 1 ? 's' : ''}`);
    }
    if (this.context.hotel) {
      recapParts.push(`✓ ${this.context.hotel}`);
    } else if (this.context.region) {
      recapParts.push(`✓ ${this.context.region}`);
    }
    if (this.context.suitcases !== undefined) {
      recapParts.push(`✓ ${this.context.suitcases} suitcase${this.context.suitcases !== 1 ? 's' : ''}`);
    }
    if (this.context.tripType) {
      recapParts.push(`✓ ${this.context.tripType}`);
    }

    const recapMessage = recapParts.length > 0
      ? `Perfect! Here's what I have:\n\n${recapParts.join('\n')}\n\n`
      : '';

    // Handle price inquiries specially
    if (extractedInfo.isPriceInquiry) {
      if (!this.context.airport) {
        this.context.step = 'AWAITING_AIRPORT';
        return {
          message: "I'd be happy to help you with pricing for airport transfers!\n\nTo give you accurate prices, which airport will you be arriving at?",
          suggestions: ['PUJ - Punta Cana', 'SDQ - Santo Domingo', 'LRM - La Romana', 'POP - Puerto Plata']
        };
      }

      if (!this.context.hotel && !this.context.region) {
        this.context.step = 'AWAITING_HOTEL';
        return {
          message: recapMessage + "Where would you like to go? Tell me your hotel name or destination.",
          suggestions: ['Hard Rock Hotel', 'Iberostar Bavaro', 'Dreams Macao', 'Hyatt Zilara Cap Cana']
        };
      }

      if (!this.context.passengers) {
        this.context.step = 'AWAITING_PASSENGERS';
        return {
          message: recapMessage + "How many passengers will be traveling?",
          suggestions: ['1 passenger', '2 passengers', '3-4 passengers', '5-6 passengers', '7+ passengers']
        };
      }

      if (this.context.suitcases === undefined) {
        this.context.step = 'AWAITING_LUGGAGE';
        return {
          message: recapMessage + "And how many suitcases will you have?",
          suggestions: ['1-2 suitcases', '3-4 suitcases', '5-6 suitcases', 'No luggage']
        };
      }
    }

    // Determine next step based on what's missing
    if (!this.context.airport) {
      this.context.step = 'AWAITING_AIRPORT';
      return {
        message: recapMessage + "Which airport will you be arriving at?",
        suggestions: ['PUJ - Punta Cana', 'SDQ - Santo Domingo', 'LRM - La Romana', 'POP - Puerto Plata']
      };
    }

    if (!this.context.hotel && !this.context.region) {
      this.context.step = 'AWAITING_HOTEL';
      return {
        message: recapMessage + "Where would you like to go? Tell me your hotel name or destination.",
        suggestions: ['Hard Rock Hotel', 'Iberostar Bavaro', 'Dreams Macao', 'Hyatt Zilara Cap Cana']
      };
    }

    if (!this.context.passengers) {
      this.context.step = 'AWAITING_PASSENGERS';
      return {
        message: recapMessage + "How many passengers will be traveling? (including children)",
        suggestions: ['1 passenger', '2 passengers', '3-4 passengers', '5-6 passengers']
      };
    }

    if (this.context.suitcases === undefined) {
      this.context.step = 'AWAITING_LUGGAGE';
      return {
        message: recapMessage + "How many suitcases will you have in total?",
        suggestions: ['1-2 suitcases', '3-4 suitcases', '5-6 suitcases', 'No luggage']
      };
    }

    // If we have airport, hotel/region, passengers, and luggage, trigger price scan
    if (this.context.airport && (this.context.hotel || this.context.region) && this.context.passengers && this.context.suitcases !== undefined) {
      this.context.step = 'AWAITING_VEHICLE_SELECTION';

      const airport = this.context.airport;
      const region = this.context.region!;
      const hotelName = this.context.hotel || `Hotel in ${region}`;
      const passengers = this.context.passengers;
      const luggage = this.context.suitcases;

      const pricingRules = this.pricingRules.filter(
        rule => rule.origin === airport && rule.destination === region
      );

      let vehicleOptions: VehicleOption[] = [];
      let lowestPrice = Infinity;
      let recommendedVehicle: string | null = null;

      if (pricingRules.length === 0) {
        const estimatedDistance = this.estimateDistanceFromQuery(hotelName);
        vehicleOptions = this.generateFallbackPricing(airport, estimatedDistance.km);
        this.context.priceSource = 'estimated';

        for (const option of vehicleOptions) {
          const canFit = passengers <= option.capacity && luggage <= option.luggageCapacity;
          if (canFit && option.oneWayPrice < lowestPrice) {
            lowestPrice = option.oneWayPrice;
            recommendedVehicle = option.name;
          }
        }
      } else {
        for (const rule of pricingRules) {
          const vehicle = this.vehicleTypes.find(v => v.id === rule.vehicle_type_id);
          if (vehicle) {
            let oneWayPrice = Number(rule.base_price);

            if (this.globalDiscountPercentage > 0) {
              const discountMultiplier = 1 - (this.globalDiscountPercentage / 100);
              oneWayPrice = Math.round(oneWayPrice * discountMultiplier);
            }

            const roundTripPrice = Math.round(oneWayPrice * ROUNDTRIP_MULTIPLIER);
            const canFit = passengers <= vehicle.passenger_capacity && luggage <= vehicle.luggage_capacity;

            const option: VehicleOption = {
              name: vehicle.name,
              capacity: vehicle.passenger_capacity,
              luggageCapacity: vehicle.luggage_capacity,
              oneWayPrice,
              roundTripPrice,
              recommended: false
            };

            vehicleOptions.push(option);

            if (canFit && oneWayPrice < lowestPrice) {
              lowestPrice = oneWayPrice;
              recommendedVehicle = vehicle.name;
            }
          }
        }
      }

      vehicleOptions.sort((a, b) => a.oneWayPrice - b.oneWayPrice);

      if (recommendedVehicle) {
        const recOption = vehicleOptions.find(v => v.name === recommendedVehicle);
        if (recOption) recOption.recommended = true;
      }

      const airportName = AIRPORTS[airport]?.split(' (')[0] || airport;
      const routeDescription = `${airportName} → ${hotelName}`;

      return {
        message: recapMessage + `Scanning live market rates for your transfer...\n\n${routeDescription}`,
        priceScanRequest: {
          type: 'PRICE_SCAN',
          airport,
          hotel: hotelName,
          region,
          basePrice: lowestPrice,
          route: routeDescription,
          passengers,
          luggage,
          vehicleOptions
        },
        suggestions: []
      };
    }

    // Fallback
    return this.startGuidedBooking();
  }

  private startGuidedBooking(): AgentResponse {
    if (this.context.airport && this.context.hotel) {
      this.context.step = 'AWAITING_PASSENGERS';
      return {
        message: `Perfect! I see you're looking for a transfer from ${this.context.airport} to ${this.context.hotel}.\n\nHow many passengers will be traveling?`,
        suggestions: ['1 passenger', '2 passengers', '3 passengers', '4 passengers', '6 passengers']
      };
    } else if (this.context.airport) {
      this.context.step = 'AWAITING_HOTEL';
      return {
        message: `Great! I see you're arriving at ${this.context.airport}.\n\nWhere would you like to go? Tell me your hotel name or destination.`,
        suggestions: ['Hard Rock Hotel', 'Iberostar', 'Dreams Resort', 'Excellence Resort', 'Bavaro area']
      };
    } else if (this.context.hotel) {
      this.context.step = 'AWAITING_AIRPORT';
      return {
        message: `I see you're going to ${this.context.hotel}.\n\nWhich airport will you be arriving at?`,
        suggestions: ['PUJ - Punta Cana', 'SDQ - Santo Domingo', 'LRM - La Romana', 'POP - Puerto Plata']
      };
    } else {
      this.context.step = 'AWAITING_AIRPORT';
      return {
        message: `Let's get your transfer booked!\n\nWhich airport will you be arriving at?`,
        suggestions: ['PUJ - Punta Cana', 'SDQ - Santo Domingo', 'LRM - La Romana', 'POP - Puerto Plata']
      };
    }
  }

  private handleAirportInput(query: string): AgentResponse {
    const airport = this.extractAirport(query);

    if (airport) {
      this.context.airport = airport;
      this.context.step = 'AWAITING_HOTEL';
      const airportName = AIRPORTS[airport]?.split(' (')[0] || airport;
      return {
        message: `Great, ${airportName}!\n\nWhere would you like to go? Just tell me your hotel name or destination.`,
        suggestions: ['Hard Rock Hotel', 'Iberostar Bavaro', 'Dreams Macao', 'Hyatt Zilara Cap Cana']
      };
    }

    return {
      message: "I didn't catch that. Which airport will you be arriving at?",
      suggestions: ['PUJ - Punta Cana', 'SDQ - Santo Domingo', 'LRM - La Romana', 'POP - Puerto Plata']
    };
  }

  private async handleHotelInput(query: string): Promise<AgentResponse> {
    const brandCheck = await this.checkBrandResolution(query);

    if (brandCheck.requiresResolution && brandCheck.properties) {
      this.context.step = 'AWAITING_PROPERTY_RESOLUTION';
      this.context.pending_brand = brandCheck.brand;
      this.context.pending_properties = brandCheck.properties;

      const propertyNames = brandCheck.properties.map(p => `${p.hotel_name} (${p.zone_name})`).join('\n• ');

      return {
        message: `I found multiple ${brandCheck.brand?.toUpperCase()} properties in the Dominican Republic. Which one are you going to?\n\n• ${propertyNames}\n\nPlease select one of the properties above.`,
        suggestions: brandCheck.properties.slice(0, 4).map(p => p.hotel_name)
      };
    }

    const hotelMatch = this.findHotelInDatabase(query);

    if (hotelMatch) {
      this.context.hotel = hotelMatch.hotel_name;
      this.context.region = hotelMatch.zone_name;
      this.context.resort_property_id = hotelMatch.id;
      this.context.property_resolved = true;
      this.context.step = 'AWAITING_PASSENGERS';
      return this.askForPassengers();
    }

    const region = this.detectRegionFromQuery(query);
    const hotelName = this.extractHotelName(query);

    if (region) {
      this.context.hotel = hotelName.length > 3 ? hotelName : `Hotel in ${region}`;
      this.context.region = region;
      this.context.step = 'AWAITING_PASSENGERS';
      return this.askForPassengers();
    }

    const selectedRegion = this.detectRegionDirect(query);
    if (selectedRegion) {
      this.context.region = selectedRegion;
      this.context.hotel = `Hotel in ${selectedRegion}`;
      this.context.step = 'AWAITING_PASSENGERS';
      return this.askForPassengers();
    }

    if (hotelName && hotelName.length > 2) {
      const estimatedDistance = this.estimateDistanceFromQuery(query);
      this.context.hotel = hotelName;
      this.context.region = estimatedDistance.zone;
      this.context.priceSource = 'estimated';
      this.context.step = 'AWAITING_PASSENGERS';

      const airportName = AIRPORTS[this.context.airport!]?.split(' (')[0] || this.context.airport;
      return {
        message: `Got it, ${hotelName}!\n\nHow many passengers will be traveling? (including children)`,
        suggestions: ['1 passenger', '2 passengers', '3-4 passengers', '5-6 passengers', '7+ passengers']
      };
    }

    return {
      message: "Where will you be staying? You can tell me your hotel name, address, or the general area.",
      suggestions: ['Hard Rock Hotel', 'Iberostar Bavaro', 'Dreams Macao', 'My hotel is not listed']
    };
  }

  private handlePropertyResolution(query: string): AgentResponse {
    if (!this.context.pending_properties) {
      return {
        message: "I'm sorry, there was an error. Please tell me your hotel name again.",
        suggestions: ['Hard Rock Hotel', 'Dreams Macao', 'RIU Palace Bavaro']
      };
    }

    const lowerQuery = query.toLowerCase();

    for (const property of this.context.pending_properties) {
      if (lowerQuery.includes(property.hotel_name.toLowerCase()) ||
          property.search_terms.some(term => lowerQuery.includes(term.toLowerCase()))) {
        this.context.hotel = property.hotel_name;
        this.context.region = property.zone_name;
        this.context.resort_property_id = property.id;
        this.context.property_resolved = true;
        this.context.step = 'AWAITING_PASSENGERS';
        this.context.pending_brand = undefined;
        this.context.pending_properties = undefined;

        return this.askForPassengers();
      }
    }

    const propertyNames = this.context.pending_properties.map(p => `${p.hotel_name} (${p.zone_name})`).join('\n• ');
    return {
      message: `I didn't recognize that property. Please select one of these ${this.context.pending_brand?.toUpperCase()} properties:\n\n• ${propertyNames}`,
      suggestions: this.context.pending_properties.slice(0, 4).map(p => p.hotel_name)
    };
  }

  private estimateDistanceFromQuery(query: string): { km: number; zone: string } {
    const lowerQuery = query.toLowerCase();

    for (const [keyword, data] of Object.entries(DISTANCE_KEYWORDS)) {
      if (lowerQuery.includes(keyword)) {
        return data;
      }
    }

    const defaultKm = AIRPORT_DEFAULT_DISTANCES[this.context.airport!] || 25;
    return { km: defaultKm, zone: 'General Area' };
  }

  private generateFallbackPricing(airport: string, estimatedKm: number): VehicleOption[] {
    const vehicleOptions: VehicleOption[] = [];

    for (const [vehicleName, pricing] of Object.entries(FALLBACK_VEHICLE_PRICING)) {
      let oneWayPrice = Math.round(pricing.base + (estimatedKm * pricing.perKm));

      // Apply global discount
      if (this.globalDiscountPercentage > 0) {
        const discountMultiplier = 1 - (this.globalDiscountPercentage / 100);
        oneWayPrice = Math.round(oneWayPrice * discountMultiplier);
      }

      const roundTripPrice = Math.round(oneWayPrice * ROUNDTRIP_MULTIPLIER);

      vehicleOptions.push({
        name: vehicleName,
        capacity: pricing.capacity,
        luggageCapacity: pricing.luggage,
        oneWayPrice,
        roundTripPrice,
        recommended: false
      });
    }

    return vehicleOptions.sort((a, b) => a.oneWayPrice - b.oneWayPrice);
  }

  private askForPassengers(): AgentResponse {
    const airportName = AIRPORTS[this.context.airport!]?.split(' (')[0] || this.context.airport;
    return {
      message: `Excellent! Transfer from ${airportName} to ${this.context.hotel}.\n\nHow many passengers will be traveling? (including children)`,
      suggestions: ['1 passenger', '2 passengers', '3-4 passengers', '5-6 passengers', '7+ passengers']
    };
  }

  private handlePassengersInput(query: string): AgentResponse {
    let passengers = this.extractNumber(query);

    if (query.includes('solo') || query.includes('alone') || query.includes('just me')) {
      passengers = 1;
    } else if (query.includes('couple') || query.includes('two of us')) {
      passengers = 2;
    } else if (query.includes('3-4') || query.includes('3 to 4')) {
      passengers = 4;
    } else if (query.includes('5-6') || query.includes('5 to 6')) {
      passengers = 6;
    } else if (query.includes('7+') || query.includes('7 or more')) {
      passengers = 8;
    }

    if (passengers && passengers > 0 && passengers <= 30) {
      this.context.passengers = passengers;
      this.context.step = 'AWAITING_LUGGAGE';

      const luggageSuggestions = passengers <= 2
        ? ['1 suitcase', '2 suitcases', '3 suitcases']
        : passengers <= 4
          ? ['2 suitcases', '4 suitcases', '6 suitcases']
          : ['4 suitcases', '6 suitcases', '8+ suitcases'];

      return {
        message: `Got it, ${passengers} passenger${passengers > 1 ? 's' : ''}.\n\nHow many pieces of luggage? (suitcases, large bags, golf clubs)`,
        suggestions: luggageSuggestions
      };
    }

    return {
      message: "How many passengers will be traveling? This helps me recommend the right vehicle.",
      suggestions: ['1 passenger', '2 passengers', '3-4 passengers', '5-6 passengers', '7+ passengers']
    };
  }

  private handleLuggageInput(query: string): AgentResponse {
    let suitcases = this.extractNumber(query);

    if (query.includes('8+') || query.includes('8 or more') || query.includes('lots')) {
      suitcases = 10;
    }

    if (suitcases !== null && suitcases >= 0 && suitcases <= 30) {
      this.context.suitcases = suitcases;
      return this.triggerPriceScanWithAllVehicles();
    }

    return {
      message: "How many pieces of luggage will you have? Include checked bags and large carry-ons.",
      suggestions: ['2 suitcases', '4 suitcases', '6 suitcases', '8+ suitcases']
    };
  }

  private triggerPriceScanWithAllVehicles(): AgentResponse {
    const airport = this.context.airport!;
    const region = this.context.region!;
    const hotelName = this.context.hotel!;
    const passengers = this.context.passengers!;
    const luggage = this.context.suitcases!;
    const airportName = AIRPORTS[airport]?.split(' (')[0] || airport;

    const pricingRules = this.pricingRules.filter(
      rule => rule.origin === airport && rule.destination === region
    );

    let vehicleOptions: VehicleOption[] = [];
    let recommendedVehicle: string | null = null;
    let lowestPrice = Infinity;
    let usingFallback = false;

    if (pricingRules.length === 0) {
      usingFallback = true;
      const estimatedDistance = this.estimateDistanceFromQuery(hotelName);
      vehicleOptions = this.generateFallbackPricing(airport, estimatedDistance.km);
      this.context.priceSource = 'estimated';

      for (const option of vehicleOptions) {
        const canFit = passengers <= option.capacity && luggage <= option.luggageCapacity;
        if (canFit && option.oneWayPrice < lowestPrice) {
          lowestPrice = option.oneWayPrice;
          recommendedVehicle = option.name;
        }
      }
    } else {
      for (const rule of pricingRules) {
        const vehicle = this.vehicleTypes.find(v => v.id === rule.vehicle_type_id);
        if (vehicle) {
          let oneWayPrice = Number(rule.base_price);

          // Apply global discount
          if (this.globalDiscountPercentage > 0) {
            const discountMultiplier = 1 - (this.globalDiscountPercentage / 100);
            oneWayPrice = Math.round(oneWayPrice * discountMultiplier);
          }

          const roundTripPrice = Math.round(oneWayPrice * ROUNDTRIP_MULTIPLIER);
          const canFit = passengers <= vehicle.passenger_capacity && luggage <= vehicle.luggage_capacity;

          const option: VehicleOption = {
            name: vehicle.name,
            capacity: vehicle.passenger_capacity,
            luggageCapacity: vehicle.luggage_capacity,
            oneWayPrice,
            roundTripPrice,
            recommended: false
          };

          vehicleOptions.push(option);

          if (canFit && oneWayPrice < lowestPrice) {
            lowestPrice = oneWayPrice;
            recommendedVehicle = vehicle.name;
          }
        }
      }
    }

    vehicleOptions.sort((a, b) => a.oneWayPrice - b.oneWayPrice);

    if (recommendedVehicle) {
      const recOption = vehicleOptions.find(v => v.name === recommendedVehicle);
      if (recOption) recOption.recommended = true;
    }

    const scanMessage = usingFallback
      ? `Calculating estimated rates for your transfer to ${hotelName}...`
      : `Scanning live market rates for your transfer...`;

    this.context.step = 'AWAITING_VEHICLE_SELECTION';

    return {
      message: scanMessage,
      priceScanRequest: {
        type: 'PRICE_SCAN',
        airport,
        hotel: hotelName,
        region: usingFallback ? 'Estimated Zone' : region,
        basePrice: lowestPrice === Infinity ? 45 : lowestPrice,
        route: `${airportName} to ${hotelName}`,
        passengers,
        luggage,
        vehicleOptions
      },
      suggestions: []
    };
  }

  private handleVehicleSelection(query: string): AgentResponse {
    const allVehicleNames = [
      ...this.vehicleTypes.map(v => v.name),
      ...Object.keys(FALLBACK_VEHICLE_PRICING)
    ];
    const uniqueVehicles = [...new Set(allVehicleNames)];

    for (const vehicleName of uniqueVehicles) {
      if (query.toLowerCase().includes(vehicleName.toLowerCase())) {
        this.context.vehicle = vehicleName;
        this.context.tripType = 'one-way';

        const dbVehicle = this.vehicleTypes.find(v => v.name === vehicleName);
        if (dbVehicle) {
          const pricingRule = this.pricingRules.find(
            r => r.origin === this.context.airport &&
                 r.destination === this.context.region &&
                 r.vehicle_type_id === dbVehicle.id
          );

          if (pricingRule) {
            this.context.originalPrice = Number(pricingRule.base_price);
          }
        } else if (FALLBACK_VEHICLE_PRICING[vehicleName]) {
          const fallback = FALLBACK_VEHICLE_PRICING[vehicleName];
          const estimatedDistance = this.estimateDistanceFromQuery(this.context.hotel || '');
          this.context.originalPrice = Math.round(fallback.base + (estimatedDistance.km * fallback.perKm));
        }

        this.calculatePrice();
        return this.triggerBooking();
      }
    }

    if (query.includes('book') || query.includes('select') || query.includes('choose')) {
      return {
        message: "Which vehicle would you like to book? Please select from the options shown above.",
        suggestions: uniqueVehicles.slice(0, 4)
      };
    }

    return {
      message: "Please select a vehicle to continue with your booking.",
      suggestions: uniqueVehicles.slice(0, 4)
    };
  }

  private handleTripTypeInput(query: string): AgentResponse {
    if (query.includes('round') || query.includes('both') || query.includes('return')) {
      this.context.tripType = 'Round trip';
    } else if (query.includes('one') || query.includes('single') || query.includes('only')) {
      this.context.tripType = 'One-way';
    } else {
      return {
        message: "Would you prefer a one-way transfer or round trip?\n\n✓ One-way: Airport to hotel\n✓ Round trip: Both ways (best value!)",
        suggestions: ['One-way', 'Round trip']
      };
    }

    this.calculatePrice();
    this.context.step = 'AWAITING_CONFIRMATION';
    return this.showBookingSummary();
  }

  private showBookingSummary(): AgentResponse {
    const airportCode = this.context.airport || 'PUJ';
    const airportName = AIRPORTS[airportCode]?.split(' (')[0] || airportCode;

    return {
      message: `Booking Summary\n\nRoute: ${airportName} → ${this.context.hotel}\nVehicle: ${this.context.vehicle}\nPassengers: ${this.context.passengers}\nLuggage: ${this.context.suitcases} piece${this.context.suitcases !== 1 ? 's' : ''}\nService: ${this.context.tripType}\n\nTotal: $${this.context.price} USD\n\nIncluded:\n\n✓ Meet & greet at arrivals\n✓ Flight tracking\n✓ Professional driver\n✓ All taxes & fees\n✓ Free cancellation (24hrs)\n\nReady to book?`,
      suggestions: ['Yes, book now!', 'Change vehicle', 'Start over']
    };
  }

  private handleConfirmationInput(query: string): AgentResponse {
    const positiveResponses = ['yes', 'book', 'confirm', 'proceed', 'sounds good', 'perfect', 'ok', 'okay', 'sure', 'yep', 'yeah', 'go ahead', 'do it', 'absolutely', 'definitely', 'please', 'ready'];

    if (query.includes('start over') || query.includes('cancel') || query === 'no') {
      this.context = { step: 'IDLE' };
      return this.getWelcomeMessage();
    }

    if (query.includes('change vehicle') || query.includes('different vehicle')) {
      this.context.step = 'AWAITING_VEHICLE_SELECTION';
      return {
        message: "Which vehicle would you prefer?",
        suggestions: this.vehicleTypes.slice(0, 4).map(v => v.name)
      };
    }

    for (const vehicle of this.vehicleTypes) {
      if (query.toLowerCase() === vehicle.name.toLowerCase()) {
        this.context.vehicle = vehicle.name;
        this.calculatePrice();
        return this.showBookingSummary();
      }
    }

    if (positiveResponses.some(r => query.includes(r))) {
      return this.triggerBooking();
    }

    return {
      message: "Would you like to proceed with this booking?",
      suggestions: ['Yes, book now!', 'Change vehicle', 'Start over']
    };
  }

  private triggerBooking(): AgentResponse {
    const bookingAction: BookingAction = {
      action: 'START_BOOKING',
      airport: this.context.airport!,
      hotel: this.context.hotel!,
      region: this.context.region!,
      vehicle: this.context.vehicle!,
      passengers: this.context.passengers!,
      suitcases: this.context.suitcases!,
      tripType: this.context.tripType!,
      price: this.context.price!,
      currency: 'USD',
      paymentProvider: 'Stripe',
      paymentMethods: ['iDEAL', 'Card'],
      priceSource: this.context.priceSource || 'standard',
      originalPrice: this.context.originalPrice || this.context.price
    };

    this.context = { step: 'IDLE' };

    return {
      message: "Opening your secure booking form...\n\nYou're just a few clicks away from a stress-free arrival!",
      bookingAction,
      suggestions: []
    };
  }

  private calculatePrice(): void {
    if (this.context.matchedPrice) {
      this.context.price = this.context.matchedPrice;
      return;
    }

    if (!this.context.airport || !this.context.vehicle || !this.context.tripType) return;

    const vehicle = this.vehicleTypes.find(v => v.name === this.context.vehicle);
    let basePrice: number | null = null;

    if (vehicle && this.context.region) {
      const rule = this.pricingRules.find(
        r => r.origin === this.context.airport &&
             r.destination === this.context.region &&
             r.vehicle_type_id === vehicle.id
      );

      if (rule) {
        basePrice = Number(rule.base_price);
      }
    }

    if (basePrice === null) {
      const fallback = FALLBACK_VEHICLE_PRICING[this.context.vehicle!];
      if (fallback) {
        const estimatedDistance = this.estimateDistanceFromQuery(this.context.hotel || '');
        basePrice = Math.round(fallback.base + (estimatedDistance.km * fallback.perKm));
        this.context.priceSource = 'estimated';
      } else {
        basePrice = 45;
      }
    }

    let calculatedPrice = this.context.tripType === 'Round trip' ? Math.round(basePrice * ROUNDTRIP_MULTIPLIER) : basePrice;

    if (!this.context.originalPrice) {
      this.context.originalPrice = calculatedPrice;
    }

    if (this.globalDiscountPercentage > 0) {
      const discountMultiplier = 1 - (this.globalDiscountPercentage / 100);
      calculatedPrice = Math.round(calculatedPrice * discountMultiplier);
    }

    this.context.price = calculatedPrice;
  }

  private async checkBrandResolution(query: string): Promise<{ requiresResolution: boolean; brand?: string; properties?: HotelZone[] }> {
    const lowerQuery = query.toLowerCase();

    const brandMappings: Record<string, string[]> = {
      'Bahia Principe': ['bahia principe', 'bahia'],
      'Dreams Resorts & Spa': ['dreams'],
      'Secrets Resorts & Spas': ['secrets'],
      'RIU Hotels & Resorts': ['riu'],
      'Barceló Hotels & Resorts': ['barcelo', 'barceló'],
      'Iberostar Hotels & Resorts': ['iberostar'],
      'Palladium Hotel Group': ['palladium', 'grand palladium', 'trs'],
      'Excellence Collection': ['excellence'],
      'Meliá Hotels International': ['melia', 'meliá', 'paradisus'],
      'Occidental Hotels & Resorts': ['occidental'],
      'Catalonia Hotels & Resorts': ['catalonia'],
      'Royalton': ['royalton'],
      'Lopesan': ['lopesan'],
      'Majestic Resorts': ['majestic'],
      'Viva Wyndham': ['viva wyndham', 'viva'],
      'Nickelodeon Hotels & Resorts': ['nickelodeon']
    };

    for (const [brandName, keywords] of Object.entries(brandMappings)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          const matchingProperties = this.hotelZones.filter(h =>
            h.brand_name === brandName && h.is_active
          );

          if (matchingProperties.length > 1) {
            let hasExactPropertyMatch = false;

            for (const property of matchingProperties) {
              const propertyNameLower = property.hotel_name.toLowerCase();
              const propertyParts = propertyNameLower.split(' ');

              const hasAllPropertyParts = propertyParts.every(part =>
                part.length > 2 && lowerQuery.includes(part)
              );

              if (hasAllPropertyParts || lowerQuery.includes(propertyNameLower)) {
                hasExactPropertyMatch = true;
                break;
              }

              for (const searchTerm of property.search_terms) {
                if (lowerQuery.includes(searchTerm.toLowerCase())) {
                  hasExactPropertyMatch = true;
                  break;
                }
              }

              if (hasExactPropertyMatch) break;
            }

            if (!hasExactPropertyMatch) {
              return {
                requiresResolution: true,
                brand: brandName,
                properties: matchingProperties.sort((a, b) => a.hotel_name.localeCompare(b.hotel_name))
              };
            }
          }
        }
      }
    }

    return { requiresResolution: false };
  }

  private findHotelInDatabase(query: string): HotelZone | null {
    const lowerQuery = query.toLowerCase();

    for (const hotel of this.hotelZones) {
      if (lowerQuery.includes(hotel.hotel_name.toLowerCase())) {
        return hotel;
      }
      if (hotel.search_terms.some(term => lowerQuery.includes(term.toLowerCase()))) {
        return hotel;
      }
    }

    return null;
  }

  private extractAirport(query: string): string | null {
    const lower = query.toLowerCase();

    // Use word boundaries to avoid false matches (e.g., "pop" in "population")
    if (lower.includes('puj') || lower.includes('punta cana')) return 'PUJ';
    if (lower.includes('sdq') || lower.includes('santo domingo')) return 'SDQ';
    if (lower.includes('lrm') || lower.includes('la romana')) return 'LRM';

    // Only match POP if it's a standalone word or with airport context
    if (/\bpop\b/.test(lower) || lower.includes('puerto plata')) return 'POP';

    return null;
  }

  private detectRegionFromQuery(query: string): string | null {
    const hotelMatch = this.findHotelInDatabase(query);
    if (hotelMatch) {
      return hotelMatch.zone_name;
    }
    return this.detectRegionDirect(query);
  }

  private detectRegionDirect(query: string): string | null {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('bavaro') || (lowerQuery.includes('punta cana') && !lowerQuery.includes('cap'))) {
      return 'Bavaro / Punta Cana';
    }
    if (lowerQuery.includes('cap cana')) {
      return 'Cap Cana';
    }
    if (lowerQuery.includes('uvero alto') || lowerQuery.includes('macao')) {
      return 'Uvero Alto';
    }
    if (lowerQuery.includes('santo domingo') || lowerQuery.includes('sdq')) {
      return 'Santo Domingo';
    }
    if (lowerQuery.includes('la romana') || lowerQuery.includes('bayahibe') || lowerQuery.includes('dominicus')) {
      return 'Bayahibe';
    }
    if (lowerQuery.includes('puerto plata') || lowerQuery.includes('playa dorada') || lowerQuery.includes('cofresi')) {
      return 'Puerto Plata / Playa Dorada';
    }
    if (lowerQuery.includes('samana') || lowerQuery.includes('las terrenas')) {
      return 'Samana / Las Terrenas';
    }
    if (lowerQuery.includes('sosua') || lowerQuery.includes('cabarete')) {
      return 'Sosua / Cabarete';
    }
    if (lowerQuery.includes('juan dolio') || lowerQuery.includes('boca chica')) {
      return 'Juan Dolio / Boca Chica';
    }
    return null;
  }

  private extractHotelName(query: string): string {
    const stopWords = ['to', 'from', 'the', 'a', 'an', 'at', 'in', 'for', 'puj', 'sdq', 'lrm', 'pop', 'price', 'transfer', 'how', 'much', 'is', 'what'];
    const words = query.split(/\s+/).filter(w => !stopWords.includes(w.toLowerCase()));
    const capitalizedWords = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    return capitalizedWords.join(' ');
  }

  private extractNumber(query: string): number | null {
    const match = query.match(/(\d+)/);
    if (match) return parseInt(match[1]);
    const wordNumbers: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12
    };
    for (const [word, num] of Object.entries(wordNumbers)) {
      if (query.includes(word)) return num;
    }
    return null;
  }

  private isGreeting(query: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'hola', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings', 'start'];
    return greetings.some(g => query === g || query.startsWith(g + ' ') || query.startsWith(g + ','));
  }

  private isBookingRelated(query: string): boolean {
    const bookingKeywords = [
      'book', 'transfer', 'airport', 'price', 'cost', 'how much',
      'quote', 'rate', 'reservation', 'ride', 'taxi', 'transport', 'pickup',
      'vehicle', 'car', 'van', 'suv', 'shuttle'
    ];
    return bookingKeywords.some(keyword => query.includes(keyword));
  }

  private isAskingForPhotos(query: string): boolean {
    const photoKeywords = [
      'photo', 'photos', 'picture', 'pictures', 'pic', 'pics',
      'image', 'images', 'gallery', 'see your', 'show me',
      'instagram', 'insta', 'look like', 'what do your',
      'vehicle photos', 'car photos', 'fleet photos'
    ];
    return photoKeywords.some(keyword => query.includes(keyword));
  }

  private isAskingAboutVehiclesOrDrivers(query: string): boolean {
    const vehicleDriverKeywords = [
      'what does the van look like',
      'what does the car look like',
      'what do the vans look like',
      'what do the cars look like',
      'show me the van',
      'show me the car',
      'show me the vehicle',
      'show me the fleet',
      'see the van',
      'see the car',
      'see the vehicle',
      'see the fleet',
      'who is going to pick me up',
      'who will pick me up',
      'who picks me up',
      'meet my driver',
      'see my driver',
      'show me the driver',
      'show me my driver',
      'what does your driver look like',
      'picture of the van',
      'picture of the car',
      'picture of the vehicle',
      'picture of the driver'
    ];
    return vehicleDriverKeywords.some(keyword => query.includes(keyword));
  }

  private async showVehicleGallery(): Promise<AgentResponse> {
    try {
      const { data: galleryItems, error } = await supabase
        .from('experience_gallery')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;

      const galleryImages = galleryItems && galleryItems.length > 0
        ? galleryItems.map(item => ({
            url: item.media_url,
            title: item.title,
            description: item.description || ''
          }))
        : [];

      const message = `Here are our vehicles and team! 📸\n\nAll our vehicles are professionally maintained and cleaned after every trip. Our drivers are experienced, licensed, and friendly - ready to make your transfer comfortable and safe!\n\nWould you like to book a transfer?`;

      return {
        message,
        galleryImages,
        suggestions: [
          'Book a transfer',
          'Check prices',
          'View destinations',
          'Ask another question'
        ]
      };
    } catch (error) {
      console.error('Error loading vehicle gallery:', error);
      return {
        message: 'Let me tell you about our fleet! We have modern, well-maintained vehicles ranging from comfortable sedans to spacious vans. All our drivers are professional, experienced, and dedicated to making your trip safe and comfortable.\n\nWould you like to book a transfer?',
        suggestions: [
          'Book a transfer',
          'Check prices',
          'Ask another question'
        ]
      };
    }
  }

  private isFAQQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();

    const faqPatterns = [
      // Pickup & Meeting Point FAQs
      'where can i meet', 'where do i meet', 'where will i meet', 'where to meet',
      'meet my driver', 'meet the driver', 'find my driver', 'find the driver',
      'driver meet me', 'driver location', 'pickup location', 'pickup point',
      'where driver', 'driver where', 'driver wait', 'driver waiting',
      'arrivals hall', 'arrivals area', 'after customs', 'baggage claim',
      'exit from airport', 'leaving airport', 'where exactly will',
      'which exit', 'terminal exit', 'arrivals door',

      // Flight Delay & Tracking FAQs
      'flight delay', 'flight delayed', 'flight late', 'plane late',
      'delayed flight', 'late flight', 'flight arrives late',
      'will driver wait', 'driver wait for me', 'wait for delayed',
      'track my flight', 'flight tracking', 'monitor flight',
      'do you track flights', 'automatic tracking', 'flight monitor',
      'what if late', 'arrive late', 'plane delayed',

      // Pickup Process FAQs
      'how does pickup work', 'how pickup works', 'pickup process',
      'airport pickup', 'pickup procedure', 'how to get picked up',
      'what happens after i land', 'what happens when i arrive',
      'after landing', 'upon arrival', 'when i arrive',
      'step by step', 'pickup instructions', 'how do i',

      // Vehicle & Comfort FAQs
      'air conditioned', 'air conditioning', 'ac in car', 'vehicles modern',
      'what type of vehicle', 'what kind of car', 'vehicle type',
      'comfortable vehicle', 'clean vehicle', 'vehicle condition',
      'modern fleet', 'new cars', 'well maintained',
      'vehicle amenities', 'wifi in car', 'bottled water',

      // Child Seats & Special Equipment FAQs
      'child seat', 'baby seat', 'car seat', 'booster seat',
      'infant seat', 'child safety', 'kids seat',
      'wheelchair', 'wheelchair accessible', 'disability',
      'special needs', 'accessibility', 'walker',

      // Pricing FAQs
      'per person', 'per passenger', 'price per person', 'cost per person',
      'private transfer', 'shared transfer', 'is it private', 'is it shared',
      'hidden fee', 'hidden charge', 'extra fee', 'additional cost',
      'price change', 'price increase', 'surge pricing',
      'final price', 'fixed price', 'guaranteed price',
      'night surcharge', 'weekend rate', 'holiday pricing',
      'per vehicle pricing', 'total cost', 'all inclusive',

      // Tipping FAQs
      'tip driver', 'tipping', 'gratuity', 'should i tip',
      'tip included', 'is tip included', 'how much to tip',
      'tip expected', 'tip mandatory', 'tips required',
      'do i need to tip', 'tipping culture', 'gratuity included',

      // Safety & Insurance FAQs
      'is it safe', 'are transfers safe', 'safe to use', 'safety',
      'licensed driver', 'insured vehicle', 'insurance', 'safer than taxi',
      'background check', 'vetted drivers', 'professional drivers',
      'driver credentials', 'certified drivers', 'registered company',
      'liability insurance', 'vehicle insurance', 'passenger insurance',

      // Service Area & Availability FAQs
      'what airport', 'which airport', 'what cities', 'service area',
      'operate at night', 'late night', 'early morning', '24 hour',
      'do you operate', 'available at', 'service available',
      'which destinations', 'where do you go', 'coverage area',
      '24/7 service', 'midnight pickup', 'red-eye flight',

      // Cancellation & Changes FAQs
      'cancellation', 'cancel booking', 'refund', 'cancel policy',
      'cancellation policy', 'free cancellation', 'cancellation fee',
      'change booking', 'modify booking', 'reschedule',
      'change date', 'change time', 'update booking',
      'refund policy', 'money back', 'cancel for free',

      // Payment FAQs
      'payment method', 'how to pay', 'accept card', 'credit card',
      'secure payment', 'payment secure', 'stripe payment',
      'debit card', 'cash payment', 'pay online', 'prepayment',
      'pay driver', 'payment options', 'apple pay', 'google pay',
      'ideal payment', 'bank transfer', 'paypal',

      // Communication & Confirmation FAQs
      'how will i know', 'confirmation', 'booking confirmation',
      'will i get confirmation', 'email confirmation', 'sms',
      'whatsapp', 'text message', 'driver details',
      'will you contact', 'how do you contact', 'notification',
      'contact information', 'phone number', 'driver phone',

      // Service Type FAQs
      'private or shared', 'just my group', 'only us',
      'shuttle service', 'shared shuttle', 'private ride',
      'other passengers', 'alone in car', 'exclusive',
      'direct transfer', 'no stops', 'straight to hotel',

      // Luggage FAQs
      'luggage space', 'how much luggage', 'suitcase limit',
      'oversized luggage', 'golf clubs', 'surfboard',
      'sports equipment', 'extra bags', 'trunk space',

      // Wait Time FAQs
      'waiting time', 'free waiting', 'will you wait for me',
      'how long will driver wait', 'complimentary waiting',
      'wait at airport', 'patience', 'delayed passenger',

      // Duration FAQs
      'how long does transfer take', 'how long is drive', 'drive time',
      'transfer duration', 'journey time', 'travel time',
      'how many minutes', 'distance to', 'time to get',

      // Round Trip FAQs
      'can i book round-trip', 'can i book pickup and drop-off',
      'is round-trip cheaper', 'round trip discount',
      'both ways', 'return transfer', 'return journey',
      'back to airport', 'round trip savings',

      // Group & Corporate FAQs
      'large group', 'big group', 'many people', 'group discount',
      'wedding', 'corporate', 'business', 'event',
      'multiple stops', 'stop along way', 'detour',

      // Driver FAQs
      'speak english', 'english speaking', 'driver language',
      'professional driver', 'experienced driver', 'trained driver',
      'driver uniform', 'how will i recognize', 'driver badge',

      // Booking Process FAQs
      'how does airport pickup work', 'how does airport transfer work',
      'how do i get picked up', 'what is the airport pickup process',
      'how will driver find me', 'where will driver meet',
      'is driver waiting in arrivals', 'what airports do you',
      'do you pick up from', 'which airports', 'is pickup available from',
      'what if flight is delayed', 'will driver leave if',
      'is there a waiting time', 'what if immigration takes',
      'is airport pickup available', 'do you operate at night',
      'can i get picked up after midnight', 'are vehicles air-conditioned',
      'do you have ac in', 'can you accommodate large groups',
      'do you have vans for groups', 'do you transport big families',
      'do you have child seats', 'is price per person',
      'do i pay per person', 'is transfer price shared',
      'how is transfer price calculated', 'are airport pickup prices fixed',
      'are there hidden fees', 'will price change after',
      'is price guaranteed', 'do prices increase at night',
      'can i book round-trip', 'can i book pickup and drop-off',
      'is round-trip cheaper', 'is tipping expected',
      'do i need to tip driver', 'is gratuity included',
      'how much should i tip', 'are tips mandatory',
      'is airport pickup safe', 'is airport transfer safe',
      'are drivers licensed', 'is it safe to use private transfers',
      'are vehicles insured', 'is this safer than taxi',
      'how do i book airport pickup', 'can i book before arriving',
      'how far in advance should i book',
      'what should i do if i cant find my driver',
      'what if i dont see my driver', 'who do i contact if driver missing',
      'customer support', 'help line', 'emergency contact'
    ];

    if (faqPatterns.some(pattern => lowerQuery.includes(pattern))) {
      return true;
    }

    const faqKeywords = [
      'private', 'shared', 'shuttle', 'delay', 'delayed',
      'meet driver', 'find driver', 'driver wait',
      'per person', 'per vehicle', 'included',
      'tip', 'tipping', 'gratuity',
      'child seat', 'baby seat', 'car seat',
      'cancel', 'refund', 'cancellation',
      'payment', 'secure', 'stripe',
      'safe', 'safety', 'licensed', 'insured',
      'track', 'waiting', 'pickup procedure',
      'confirmation', 'whatsapp', 'sms',
      'round trip', 'round-trip', 'return',
      'baggage', 'luggage space', 'trunk',
      'accessibility', 'wheelchair', 'special needs'
    ];

    return faqKeywords.some(k => lowerQuery.includes(k));
  }

  private showDominicanFunFacts(): AgentResponse {
    const funFacts = [
      "The Dominican Republic was the first place Columbus landed in 1492 - and he loved it so much he's buried in Santo Domingo!",
      "Baseball is basically a religion here. The DR has produced more MLB players per capita than any other country!",
      "Pico Duarte is the highest peak in the Caribbean at 3,098m!",
      "The merengue dance was invented here!",
      "Larimar, a beautiful blue stone, is found ONLY in the Dominican Republic.",
      "Santo Domingo has the first cathedral, hospital, and university in the Americas!",
      "Dominican coffee was once used as currency!",
      "The DR shares the island of Hispaniola with Haiti."
    ];

    const randomFacts = funFacts.sort(() => Math.random() - 0.5).slice(0, 3);

    return {
      message: `Fun Facts about the Dominican Republic:\n\n${randomFacts.map((fact, i) => `${i + 1}. ${fact}`).join('\n\n')}\n\nWant to explore this amazing island? I can help you book your transfer!`,
      suggestions: ['Book a transfer', 'More fun facts', 'PUJ to Hard Rock Hotel']
    };
  }

  private showInstagramPhotos(): AgentResponse {
    return {
      message: `Check out our Instagram for photos of our fleet and happy customers!\n\n@dominicantransfers\nhttps://www.instagram.com/dominicantransfers/\n\nYou'll find:\n\n✓ Our premium vehicles\n✓ Happy travelers\n✓ Beautiful Dominican destinations\n\nFollow us for travel tips and special offers!`,
      suggestions: ['Book a transfer', 'See vehicles', 'PUJ - Punta Cana']
    };
  }

  private showPickupProcedure(): AgentResponse {
    return {
      message: `How Your Pickup Works:\n\n1. Before You Land - Your driver tracks your flight\n\n2. At Arrivals - Driver waits with a sign showing YOUR NAME\n\n3. Easy to Spot - Branded shirts in the pickup zone\n\n4. Full Assistance - Help with luggage to your vehicle\n\n5. Direct Transfer - Straight to your hotel!\n\nYou'll get a WhatsApp with your driver's name, photo, and contact before pickup.`,
      suggestions: ['Book now', 'What if my flight is delayed?', 'See prices']
    };
  }

  private addBookingContextToResponse(response: AgentResponse): AgentResponse {
    const isInBookingFlow = this.context.step !== 'IDLE';
    const isAtConfirmationStep = this.context.step === 'AWAITING_CONFIRMATION';

    if (!isInBookingFlow) {
      return response;
    }

    const parts = [];
    if (this.context.airport) parts.push(`Airport: ${this.context.airport}`);
    if (this.context.hotel) parts.push(`Hotel: ${this.context.hotel}`);
    if (this.context.passengers) parts.push(`${this.context.passengers} passengers`);
    if (this.context.suitcases !== undefined) parts.push(`${this.context.suitcases} suitcases`);
    if (this.context.vehicle) parts.push(`Vehicle: ${this.context.vehicle}`);
    if (this.context.tripType) parts.push(`${this.context.tripType}`);
    if (this.context.price) parts.push(`$${this.context.price}`);

    let bookingContext = '';
    if (parts.length > 0) {
      if (isAtConfirmationStep) {
        bookingContext = `\n\n📋 Your booking is ready to confirm:\n${parts.join(', ')}`;
      } else {
        bookingContext = `\n\n📋 Your booking in progress: ${parts.join(', ')}`;
      }
    }

    const suggestions = isAtConfirmationStep
      ? ['Yes, book now!', 'Ask another question', 'Change vehicle']
      : ['Continue booking', 'Ask another question', 'Start over'];

    let finalMessage = response.message;
    if (isAtConfirmationStep) {
      finalMessage = `${response.message}${bookingContext}\n\n✅ Ready to book? Type "Yes, book now!" to complete your reservation.`;
    } else {
      finalMessage = `${response.message}${bookingContext}\n\nType "Continue booking" when you're ready to proceed with your transfer.`;
    }

    return {
      ...response,
      message: finalMessage,
      suggestions
    };
  }

  private handleFAQ(query: string): AgentResponse {
    const isInBookingFlow = this.context.step !== 'IDLE';
    const isAtConfirmationStep = this.context.step === 'AWAITING_CONFIRMATION';

    // Build booking context message if in booking flow
    let bookingContext = '';
    if (isInBookingFlow) {
      const parts = [];
      if (this.context.airport) parts.push(`Airport: ${this.context.airport}`);
      if (this.context.hotel) parts.push(`Hotel: ${this.context.hotel}`);
      if (this.context.passengers) parts.push(`${this.context.passengers} passengers`);
      if (this.context.suitcases !== undefined) parts.push(`${this.context.suitcases} suitcases`);
      if (this.context.vehicle) parts.push(`Vehicle: ${this.context.vehicle}`);
      if (this.context.tripType) parts.push(`${this.context.tripType}`);
      if (this.context.price) parts.push(`$${this.context.price}`);

      if (parts.length > 0) {
        if (isAtConfirmationStep) {
          bookingContext = `\n\n📋 Your booking is ready to confirm:\n${parts.join(', ')}`;
        } else {
          bookingContext = `\n\n📋 Your booking in progress: ${parts.join(', ')}`;
        }
      }
    }

    // Dynamic suggestions based on booking state
    const suggestions = isAtConfirmationStep
      ? ['Yes, book now!', 'Ask another question', 'Change vehicle']
      : isInBookingFlow
      ? ['Continue booking', 'Ask another question', 'Start over']
      : ['Book a transfer', 'See prices', 'More questions'];

    let faqMessage = '';

    // Handle specific FAQ queries
    if (query.includes('delay') || query.includes('late flight') || query.includes('track')) {
      faqMessage = `Flight Delays? No Problem!\n\n✓ We track your flight in real-time\n✓ Driver adjusts automatically to delays\n✓ No extra charges ever\n✓ 30 minutes or 3 hours late - same price\n\nYou'll never be stranded!`;
    } else if (query.includes('meet') || query.includes('find') || query.includes('driver') || query.includes('pickup')) {
      faqMessage = `How Your Pickup Works:\n\n1. Driver waits at arrivals with YOUR NAME on a sign\n2. Free flight tracking - no rush!\n3. Easy to spot in branded shirts\n4. Help with all your luggage\n5. Direct to your hotel\n\nYou'll get driver details via WhatsApp before pickup!`;
    } else if (query.includes('private') || query.includes('shared') || query.includes('shuttle')) {
      faqMessage = "All our transfers are 100% private - just you and your party in the vehicle.\n\nNo shared rides, no waiting. Direct to your destination!";
    } else if (query.includes('per person') || query.includes('per vehicle') || query.includes('include')) {
      faqMessage = "Our prices are per vehicle, not per person!\n\nEvery booking includes:\n\n✓ Meet & greet service\n✓ Flight tracking\n✓ Luggage assistance\n✓ All taxes and fees\n✓ No hidden charges";
    } else if (query.includes('cancel') || query.includes('refund')) {
      faqMessage = "Free Cancellation up to 24 hours before your transfer.\n\nPlans change - we understand! Full details in your confirmation email.";
    } else if (query.includes('payment') || query.includes('secure') || query.includes('stripe')) {
      faqMessage = "Secure Payments via Stripe\n\nYour card details are encrypted and never stored. Pay with:\n\n✓ Credit/Debit Card\n✓ iDEAL\n✓ Apple Pay\n✓ Google Pay";
    } else if (query.includes('tip') || query.includes('tipping') || query.includes('gratuity')) {
      faqMessage = "Tipping is appreciated but not required!\n\nOur drivers are well-paid professionals. If you'd like to tip for exceptional service, 10-15% is customary.";
    } else if (query.includes('child seat') || query.includes('baby seat') || query.includes('car seat')) {
      faqMessage = "Child Seats Available!\n\nWe provide complimentary child seats upon request. Just mention it in your special requests when booking!";
    } else if (query.includes('safe') || query.includes('safety') || query.includes('licensed') || query.includes('insured')) {
      faqMessage = "Your Safety is Our Priority!\n\n✓ Licensed, background-checked drivers\n✓ Fully insured vehicles\n✓ Modern, well-maintained fleet\n✓ GPS-tracked for your security\n✓ 24/7 customer support\n\nSafer than taxis, more reliable than rideshares!";
    } else {
      faqMessage = "Why Choose Dominican Transfers?\n\n✓ 100% private transfers\n✓ English-speaking drivers\n✓ Free flight tracking\n✓ Prices per vehicle\n✓ All taxes included\n✓ Free cancellation (24hrs)\n✓ Secure Stripe payments\n✓ 24/7 support\n\nHow can I help you today?";
    }

    // Add booking context reminder if in booking flow
    let finalMessage = faqMessage;
    if (isAtConfirmationStep) {
      finalMessage = `${faqMessage}${bookingContext}\n\n✅ Ready to book? Type "Yes, book now!" to complete your reservation.`;
    } else if (isInBookingFlow) {
      finalMessage = `${faqMessage}${bookingContext}\n\nType "Continue booking" when you're ready to proceed with your transfer.`;
    }

    return {
      message: finalMessage,
      suggestions
    };
  }

  private async handleGeneralQuestion(userMessage: string): Promise<AgentResponse> {
    const isInBookingFlow = this.context.step !== 'IDLE';
    const isAtConfirmationStep = this.context.step === 'AWAITING_CONFIRMATION';

    // Build booking context message if in booking flow
    let bookingContext = '';
    if (isInBookingFlow) {
      const parts = [];
      if (this.context.airport) parts.push(`Airport: ${this.context.airport}`);
      if (this.context.hotel) parts.push(`Hotel: ${this.context.hotel}`);
      if (this.context.passengers) parts.push(`${this.context.passengers} passengers`);
      if (this.context.suitcases !== undefined) parts.push(`${this.context.suitcases} suitcases`);
      if (this.context.vehicle) parts.push(`Vehicle: ${this.context.vehicle}`);
      if (this.context.tripType) parts.push(`${this.context.tripType}`);
      if (this.context.price) parts.push(`$${this.context.price}`);

      if (parts.length > 0) {
        if (isAtConfirmationStep) {
          bookingContext = `\n\n📋 Your booking is ready to confirm:\n${parts.join(', ')}`;
        } else {
          bookingContext = `\n\n📋 Your booking in progress: ${parts.join(', ')}`;
        }
      }
    }

    const suggestions = isAtConfirmationStep
      ? ['Yes, book now!', 'Ask another question', 'Change vehicle']
      : isInBookingFlow
      ? ['Continue booking', 'Start over', 'Ask another question']
      : ['Book a transfer', 'See prices', 'Ask another question'];

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${supabaseUrl}/functions/v1/gpt-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: this.conversationHistory,
          isInBookingFlow: isInBookingFlow,
          bookingContext: this.context
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          message: `I'd be happy to help! For questions about Dominican Republic travel, bookings, or our services, just ask. Or tell me your route to get started with a transfer quote!${bookingContext}`,
          suggestions
        };
      }

      const data = await response.json();

      if (!data.response) {
        return {
          message: `I'd be happy to help! For questions about Dominican Republic travel, bookings, or our services, just ask. Or tell me your route to get started with a transfer quote!${bookingContext}`,
          suggestions
        };
      }

      this.conversationHistory.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: data.response }
      );

      if (this.conversationHistory.length > 12) {
        this.conversationHistory = this.conversationHistory.slice(-8);
      }

      // Add booking context reminder if in booking flow
      let finalMessage = data.response;
      if (isAtConfirmationStep) {
        finalMessage = `${data.response}${bookingContext}\n\n✅ Ready to book? Type "Yes, book now!" to complete your reservation.`;
      } else if (isInBookingFlow) {
        finalMessage = `${data.response}${bookingContext}\n\nType "Continue booking" when you're ready to proceed with your transfer.`;
      }

      return {
        message: finalMessage,
        suggestions
      };
    } catch {
      return {
        message: `I'd be happy to help! For questions about Dominican Republic travel, bookings, or our services, just ask. Or tell me your route to get started with a transfer quote!${bookingContext}`,
        suggestions
      };
    }
  }

  getGreeting(): AgentResponse {
    return this.getWelcomeMessage();
  }

  resetContext(): void {
    this.context = { step: 'IDLE' };
    this.conversationHistory = [];
  }

  setContextForPriceScan(data: { airport: string; hotel: string; region: string; passengers: number; luggage: number }): void {
    this.context = {
      step: 'AWAITING_VEHICLE_SELECTION',
      airport: data.airport,
      hotel: data.hotel,
      region: data.region,
      passengers: data.passengers,
      suitcases: data.luggage
    };
  }

  setLandingPageContext(data: { airport?: string; destination?: string }): void {
    if (data.airport) {
      this.context.airport = data.airport.toUpperCase();
    }
    if (data.destination) {
      const hotelMatch = this.findHotelInDatabase(data.destination);
      if (hotelMatch) {
        this.context.hotel = hotelMatch.hotel_name;
        this.context.region = hotelMatch.zone_name;
      } else {
        this.context.hotel = data.destination;
        const estimatedDistance = this.estimateDistanceFromQuery(data.destination);
        this.context.region = estimatedDistance.zone;
      }
    }
  }

  hasLandingPageContext(): boolean {
    return !!(this.context.airport || this.context.hotel);
  }

  private generateLandingPageLinks(): AgentResponse {
    const baseUrl = 'https://www.dominicantransfers.com';

    const popularHotels = [
      { name: 'Hard Rock Hotel', param: 'hard+rock+hotel' },
      { name: 'Iberostar Bavaro', param: 'iberostar+bavaro' },
      { name: 'Dreams Punta Cana', param: 'dreams+punta+cana' },
      { name: 'Excellence Punta Cana', param: 'excellence+punta+cana' },
      { name: 'Secrets Cap Cana', param: 'secrets+cap+cana' },
      { name: 'Bavaro Princess', param: 'bavaro+princess' }
    ];

    const airports = [
      { code: 'puj', name: 'Punta Cana' },
      { code: 'sdq', name: 'Santo Domingo' }
    ];

    let message = `Here are your Google Ads landing page URLs:\n\n`;

    message += `📍 **Specific Hotel Pages (Highest Quality Score)**\n`;
    popularHotels.forEach(hotel => {
      const url = `${baseUrl}/?arrival=puj&destination=${hotel.param}`;
      message += `\n${hotel.name}:\n${url}\n`;
    });

    message += `\n\n✈️ **Airport-Only Pages**\n`;
    airports.forEach(airport => {
      const url = `${baseUrl}/?arrival=${airport.code}`;
      message += `\n${airport.name} Airport:\n${url}\n`;
    });

    message += `\n\n🎯 **Dynamic URL Template (Use in Google Ads)**\n`;
    message += `${baseUrl}/?arrival=puj&destination={keyword}\n`;
    message += `\nGoogle will replace {keyword} with the search term automatically.\n`;

    message += `\n\n📊 **Test Page**\n`;
    message += `${baseUrl}/landing-page-test.html\n`;
    message += `\nInteractive test page with all scenarios and copy buttons.`;

    return {
      message,
      suggestions: [
        'Test a landing page',
        'Google Ads setup help',
        'How to improve Quality Score',
        'Ask a question'
      ]
    };
  }
}
