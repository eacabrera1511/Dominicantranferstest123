export type Language = 'en' | 'nl' | 'es';

export interface Translations {
  // Navigation
  nav: {
    home: string;
    bookings: string;
    services: string;
    language: string;
  };

  // Welcome/Hero
  welcome: {
    title: string;
    subtitle: string;
    bookNow: string;
    learnMore: string;
  };

  // Chat
  chat: {
    placeholder: string;
    typeMessage: string;
    send: string;
    listening: string;
    languageChanged: string;
  };

  // Booking Flow
  booking: {
    title: string;
    airport: string;
    hotel: string;
    destination: string;
    passengers: string;
    luggage: string;
    date: string;
    time: string;
    flightNumber: string;
    tripType: string;
    oneWay: string;
    roundTrip: string;
    returnDate: string;
    returnTime: string;
    confirm: string;
    cancel: string;
    back: string;
    next: string;
    bookTransfer: string;
    loading: string;
    selectOption: string;
  };

  // Services
  services: {
    title: string;
    airportTransfer: string;
    privateTransfer: string;
    groupTransfer: string;
    luxuryTransfer: string;
    viewDetails: string;
    bookNow: string;
  };

  // Common
  common: {
    yes: string;
    no: string;
    ok: string;
    continue: string;
    startOver: string;
    error: string;
    success: string;
    processing: string;
    pleaseWait: string;
  };

  // Agent responses - key phrases
  agent: {
    greeting: string;
    askAirport: string;
    askHotel: string;
    askPassengers: string;
    askLuggage: string;
    askTripType: string;
    priceQuote: string;
    bookingConfirmed: string;
    needHelp: string;
    continueBooking: string;
    anotherQuestion: string;
    moreQuestions: string;
    oneWayOrRound: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: 'Home',
      bookings: 'Bookings',
      services: 'Services',
      language: 'Language'
    },
    welcome: {
      title: 'Welcome to Dominican Transfers',
      subtitle: 'Your reliable airport transfer service in the Dominican Republic',
      bookNow: 'Book Now',
      learnMore: 'Learn More'
    },
    chat: {
      placeholder: 'Ask or book a transfer...',
      typeMessage: 'Type your message...',
      send: 'Send',
      listening: 'Listening...',
      languageChanged: 'Language changed to English'
    },
    booking: {
      title: 'Book Your Transfer',
      airport: 'Airport',
      hotel: 'Hotel/Destination',
      destination: 'Destination',
      passengers: 'Passengers',
      luggage: 'Luggage',
      date: 'Date',
      time: 'Time',
      flightNumber: 'Flight Number',
      tripType: 'Trip Type',
      oneWay: 'One Way',
      roundTrip: 'Round Trip',
      returnDate: 'Return Date',
      returnTime: 'Return Time',
      confirm: 'Confirm',
      cancel: 'Cancel',
      back: 'Back',
      next: 'Next',
      bookTransfer: 'Book Transfer',
      loading: 'Loading...',
      selectOption: 'Please select an option'
    },
    services: {
      title: 'Our Services',
      airportTransfer: 'Airport Transfer',
      privateTransfer: 'Private Transfer',
      groupTransfer: 'Group Transfer',
      luxuryTransfer: 'Luxury Transfer',
      viewDetails: 'View Details',
      bookNow: 'Book Now'
    },
    common: {
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      continue: 'Continue',
      startOver: 'Start Over',
      error: 'Error',
      success: 'Success',
      processing: 'Processing...',
      pleaseWait: 'Please wait...'
    },
    agent: {
      greeting: 'Hello! Welcome to Dominican Transfers. How can I help you today?',
      askAirport: 'Which airport are you flying into?',
      askHotel: 'Where would you like us to take you?',
      askPassengers: 'How many passengers will be traveling?',
      askLuggage: 'How many pieces of luggage do you have?',
      askTripType: 'Is this a one-way or round trip?',
      priceQuote: 'Here\'s your price quote',
      bookingConfirmed: 'Your booking has been confirmed!',
      needHelp: 'How can I help you?',
      continueBooking: 'Continue booking',
      anotherQuestion: 'Another question',
      moreQuestions: 'More questions',
      oneWayOrRound: 'Will you need a one-way transfer or a round trip?'
    }
  },
  nl: {
    nav: {
      home: 'Home',
      bookings: 'Boekingen',
      services: 'Diensten',
      language: 'Taal'
    },
    welcome: {
      title: 'Welkom bij Dominican Transfers',
      subtitle: 'Uw betrouwbare luchthaven transfer service in de Dominicaanse Republiek',
      bookNow: 'Boek Nu',
      learnMore: 'Meer Informatie'
    },
    chat: {
      placeholder: 'Vraag of boek transfer...',
      typeMessage: 'Typ uw bericht...',
      send: 'Verstuur',
      listening: 'Luisteren...',
      languageChanged: 'Taal gewijzigd naar Nederlands'
    },
    booking: {
      title: 'Boek Uw Transfer',
      airport: 'Luchthaven',
      hotel: 'Hotel/Bestemming',
      destination: 'Bestemming',
      passengers: 'Passagiers',
      luggage: 'Bagage',
      date: 'Datum',
      time: 'Tijd',
      flightNumber: 'Vlucht Nummer',
      tripType: 'Type Reis',
      oneWay: 'Enkele Reis',
      roundTrip: 'Retour',
      returnDate: 'Retour Datum',
      returnTime: 'Retour Tijd',
      confirm: 'Bevestigen',
      cancel: 'Annuleren',
      back: 'Terug',
      next: 'Volgende',
      bookTransfer: 'Boek Transfer',
      loading: 'Laden...',
      selectOption: 'Selecteer een optie'
    },
    services: {
      title: 'Onze Diensten',
      airportTransfer: 'Luchthaven Transfer',
      privateTransfer: 'Privé Transfer',
      groupTransfer: 'Groep Transfer',
      luxuryTransfer: 'Luxe Transfer',
      viewDetails: 'Bekijk Details',
      bookNow: 'Boek Nu'
    },
    common: {
      yes: 'Ja',
      no: 'Nee',
      ok: 'OK',
      continue: 'Doorgaan',
      startOver: 'Opnieuw Beginnen',
      error: 'Fout',
      success: 'Succes',
      processing: 'Verwerken...',
      pleaseWait: 'Een moment geduld...'
    },
    agent: {
      greeting: 'Hallo! Welkom bij Dominican Transfers. Hoe kan ik u helpen?',
      askAirport: 'Naar welke luchthaven vliegt u?',
      askHotel: 'Waar wilt u naartoe gebracht worden?',
      askPassengers: 'Hoeveel passagiers reizen er mee?',
      askLuggage: 'Hoeveel koffers heeft u?',
      askTripType: 'Is dit een enkele reis of retour?',
      priceQuote: 'Hier is uw prijsopgave',
      bookingConfirmed: 'Uw boeking is bevestigd!',
      needHelp: 'Hoe kan ik u helpen?',
      continueBooking: 'Doorgaan met boeken',
      anotherQuestion: 'Nog een vraag',
      moreQuestions: 'Meer vragen',
      oneWayOrRound: 'Heeft u een enkele reis of retour nodig?'
    }
  },
  es: {
    nav: {
      home: 'Inicio',
      bookings: 'Reservas',
      services: 'Servicios',
      language: 'Idioma'
    },
    welcome: {
      title: 'Bienvenido a Dominican Transfers',
      subtitle: 'Su servicio confiable de transporte al aeropuerto en República Dominicana',
      bookNow: 'Reservar Ahora',
      learnMore: 'Más Información'
    },
    chat: {
      placeholder: 'Pregunta o reserva...',
      typeMessage: 'Escribe tu mensaje...',
      send: 'Enviar',
      listening: 'Escuchando...',
      languageChanged: 'Idioma cambiado a Español'
    },
    booking: {
      title: 'Reserve Su Traslado',
      airport: 'Aeropuerto',
      hotel: 'Hotel/Destino',
      destination: 'Destino',
      passengers: 'Pasajeros',
      luggage: 'Equipaje',
      date: 'Fecha',
      time: 'Hora',
      flightNumber: 'Número de Vuelo',
      tripType: 'Tipo de Viaje',
      oneWay: 'Solo Ida',
      roundTrip: 'Ida y Vuelta',
      returnDate: 'Fecha de Regreso',
      returnTime: 'Hora de Regreso',
      confirm: 'Confirmar',
      cancel: 'Cancelar',
      back: 'Atrás',
      next: 'Siguiente',
      bookTransfer: 'Reservar Traslado',
      loading: 'Cargando...',
      selectOption: 'Por favor seleccione una opción'
    },
    services: {
      title: 'Nuestros Servicios',
      airportTransfer: 'Traslado al Aeropuerto',
      privateTransfer: 'Traslado Privado',
      groupTransfer: 'Traslado Grupal',
      luxuryTransfer: 'Traslado de Lujo',
      viewDetails: 'Ver Detalles',
      bookNow: 'Reservar Ahora'
    },
    common: {
      yes: 'Sí',
      no: 'No',
      ok: 'OK',
      continue: 'Continuar',
      startOver: 'Empezar de Nuevo',
      error: 'Error',
      success: 'Éxito',
      processing: 'Procesando...',
      pleaseWait: 'Por favor espere...'
    },
    agent: {
      greeting: '¡Hola! Bienvenido a Dominican Transfers. ¿Cómo puedo ayudarte hoy?',
      askAirport: '¿A qué aeropuerto llegas?',
      askHotel: '¿A dónde quieres que te llevemos?',
      askPassengers: '¿Cuántos pasajeros van a viajar?',
      askLuggage: '¿Cuántas maletas tienes?',
      askTripType: '¿Es un viaje de ida o ida y vuelta?',
      priceQuote: 'Aquí está tu cotización',
      bookingConfirmed: '¡Tu reserva ha sido confirmada!',
      needHelp: '¿Cómo puedo ayudarte?',
      continueBooking: 'Continuar reserva',
      anotherQuestion: 'Otra pregunta',
      moreQuestions: 'Más preguntas',
      oneWayOrRound: '¿Necesitas un traslado de ida o ida y vuelta?'
    }
  }
};

export const getTranslations = (lang: Language): Translations => {
  return translations[lang] || translations.en;
};

export const detectLanguage = (text: string): Language | null => {
  const lower = text.toLowerCase().trim();

  // English triggers
  if (lower === 'english' || lower === 'engels' || lower.includes('switch to english') || lower.includes('change to english')) {
    return 'en';
  }

  // Dutch triggers
  if (lower === 'dutch' || lower === 'nederlands' || lower === 'flemish' || lower === 'vlaams' ||
      lower.includes('switch to dutch') || lower.includes('change to dutch') ||
      lower.includes('wissel naar nederlands') || lower.includes('verander naar nederlands')) {
    return 'nl';
  }

  // Spanish triggers
  if (lower === 'spanish' || lower === 'español' || lower === 'espanol' || lower === 'spaans' ||
      lower.includes('switch to spanish') || lower.includes('change to spanish') ||
      lower.includes('cambiar a español') || lower.includes('cambia a español')) {
    return 'es';
  }

  return null;
};

export const getLanguageName = (lang: Language, displayLang: Language): string => {
  const names: Record<Language, Record<Language, string>> = {
    en: { en: 'English', nl: 'Engels', es: 'Inglés' },
    nl: { en: 'Dutch', nl: 'Nederlands', es: 'Holandés' },
    es: { en: 'Spanish', nl: 'Spaans', es: 'Español' }
  };

  return names[lang][displayLang];
};
