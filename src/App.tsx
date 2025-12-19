import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, Phone, ChevronDown, Star, Sun, Moon, History } from 'lucide-react';
import { supabase, Message } from './lib/supabase';
import { TravelAgent, BookingAction } from './lib/travelAgent';
import { ChatMessage } from './components/ChatMessage';
import { SuggestionChips } from './components/SuggestionChips';
import { TransferBookingModal } from './components/TransferBookingModal';
import { ChatHistory, getDeviceId } from './components/ChatHistory';
import { PartnerPortal } from './components/partner/PartnerPortal';
import AgentPortal from './components/agent/AgentPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CancellationPage } from './components/CancellationPage';
import { useLanguage } from './contexts/LanguageContext';
import { getTranslations } from './lib/translations';
import { CompactGallery } from './components/CompactGallery';
import Gallery from './components/Gallery';
import { initializeChatConversation, saveChatMessage, getCurrentChatConversationId, resetChatConversation } from './lib/chatTranscripts';
import { logGoogleAdsStatus } from './lib/gtagVerification';

declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config?: any) => void;
    dataLayer?: any[];
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

function App() {
  const { language, setLanguage } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [agent] = useState(() => new TravelAgent());
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showExtrasSection, setShowExtrasSection] = useState(false);
  const [showChatBooking, setShowChatBooking] = useState(false);
  const [chatBookingData, setChatBookingData] = useState<BookingAction | null>(null);
  const [pendingBookingData, setPendingBookingData] = useState<BookingAction | null>(null);
  const [bookingModalKey, setBookingModalKey] = useState(0);
  const [messageVehicleImages, setMessageVehicleImages] = useState<Map<string, { url: string; alt: string; caption: string }>>(new Map());
  const [messageGalleryImages, setMessageGalleryImages] = useState<Map<string, { url: string; title: string; description: string }[]>>(new Map());
  const [messagePriceScanner, setMessagePriceScanner] = useState<Map<string, any>>(new Map());
  const [messagePriceComparison, setMessagePriceComparison] = useState<Map<string, any>>(new Map());
  const [currentPriceScanData, setCurrentPriceScanData] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showPartnerPortal, setShowPartnerPortal] = useState(false);
  const [showAgentPortal, setShowAgentPortal] = useState(false);
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showCancellationPage, setShowCancellationPage] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [paymentBookingRef, setPaymentBookingRef] = useState<string>('');
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [deviceId] = useState(() => getDeviceId());
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastResponseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const status = logGoogleAdsStatus();
      if (!status.isLoaded) {
        console.warn('⚠️ Google Ads tracking not fully loaded after 2 seconds');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    agent.setLanguage(language);
  }, [language, agent]);

  useEffect(() => {
    if (showPaymentSuccess && paymentBookingRef) {
      const fetchBookingAndTrackConversion = async () => {
        try {
          const { data } = await supabase
            .from('bookings')
            .select('total_price, id')
            .eq('reference', paymentBookingRef)
            .maybeSingle();

          if (data && window.gtag) {
            console.log('🎯 Firing Google Ads conversion:', {
              value: data.total_price,
              transaction_id: paymentBookingRef
            });

            window.gtag('event', 'conversion', {
              'send_to': 'AW-17810479345',
              'value': data.total_price || 0,
              'currency': 'USD',
              'transaction_id': paymentBookingRef
            });

            console.log('✅ Conversion event sent successfully');
          } else if (!window.gtag) {
            console.error('❌ gtag function not available');
          }
        } catch (error) {
          console.error('Error tracking conversion:', error);
        }
      };

      fetchBookingAndTrackConversion();
    }
  }, [showPaymentSuccess, paymentBookingRef]);

  useEffect(() => {
    let mounted = true;

    const generateDynamicWelcome = (arrival?: string | null, destination?: string | null): { message: string; suggestions: string[] } => {
      const cleanDestination = destination
        ? destination.replace(/\+/g, ' ').replace(/-/g, ' ').trim()
        : null;

      let welcomeMsg = '';
      let suggestions: string[] = [];

      if (arrival && cleanDestination) {
        const arrivalName = arrival.toLowerCase() === 'puj' ? 'Punta Cana Airport' : arrival.toUpperCase();
        welcomeMsg = `Welcome 👋\nPrivate airport transfer from ${arrivalName} to ${cleanDestination}.`;
        suggestions = [
          `PUJ → ${cleanDestination}`,
          'One-Way Transfer',
          'Roundtrip Transfer',
          'See vehicle options',
          'Get instant quote'
        ];
      } else if (arrival) {
        const arrivalName = arrival.toLowerCase() === 'puj' ? 'Punta Cana Airport' : arrival.toUpperCase();
        welcomeMsg = `Welcome 👋\nPrivate airport transfers from ${arrivalName}.`;
        suggestions = [
          'PUJ → Hotel / Resort',
          'One-Way Transfer',
          'Roundtrip Transfer',
          'See prices',
          'View all vehicles'
        ];
      } else {
        welcomeMsg = `Welcome 👋\nPrivate airport transfers in the Dominican Republic.`;
        suggestions = [
          'PUJ → Punta Cana Hotel',
          'Airport Transfer Quote',
          'See prices',
          'View vehicles',
          'Ask a question'
        ];
      }

      return { message: welcomeMsg, suggestions };
    };

    const initialize = async () => {
      if (!mounted) return;

      await agent.initialize();
      agent.setLanguage(language);
      if (!mounted) return;

      const urlParams = new URLSearchParams(window.location.search);
      const arrival = urlParams.get('arrival');
      const destination = urlParams.get('destination');

      const dynamicWelcome = generateDynamicWelcome(arrival, destination);

      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: '',
        role: 'assistant',
        content: dynamicWelcome.message,
        created_at: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
      setCurrentSuggestions(dynamicWelcome.suggestions);

      try {
        const { data, error } = await supabase
          .from('conversations')
          .insert({ title: 'New Airport Transfer Request', device_id: deviceId })
          .select()
          .single();

        if (data && !error && mounted) {
          setConversationId(data.id);
        }

        await initializeChatConversation(deviceId, language);

        const chatConvId = getCurrentChatConversationId();
        if (chatConvId && mounted) {
          await saveChatMessage(chatConvId, 'assistant', greeting.message, 'greeting');
        }
      } catch (err) {
        console.error('Failed to create conversation:', err);
      }
    };

    const handleBookingReference = async (bookingId: string) => {
      if (!mounted) return;
      const { data } = await supabase
        .from('bookings')
        .select('details')
        .eq('id', bookingId)
        .maybeSingle();

      if (data?.details?.bookingReference && mounted) {
        setPaymentBookingRef(data.details.bookingReference);
        setShowPaymentSuccess(true);
      }
    };

    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment');
    const bookingSuccess = urlParams.get('booking_success');
    const ref = urlParams.get('ref');
    const bookingId = urlParams.get('booking_id');
    const cancelToken = urlParams.get('token');

    if (window.location.pathname === '/cancel-booking' || cancelToken) {
      setShowCancellationPage(true);
      return;
    }

    if (paymentSuccess === 'success' && ref) {
      setPaymentBookingRef(ref);
      setShowPaymentSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (bookingSuccess === 'true' && bookingId) {
      handleBookingReference(bookingId);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('payment') === 'cancelled') {
      alert('Payment was cancelled. You can try again anytime.');
      window.history.replaceState({}, '', window.location.pathname);
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [agent, deviceId]);

  const fetchBookingReference = useCallback(async (bookingId: string) => {
    const { data } = await supabase
      .from('bookings')
      .select('details')
      .eq('id', bookingId)
      .maybeSingle();

    if (data?.details?.bookingReference) {
      setPaymentBookingRef(data.details.bookingReference);
      setShowPaymentSuccess(true);
    }
  }, []);

  const scrollToResponse = () => {
    setTimeout(() => {
      if (lastResponseRef.current) {
        lastResponseRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const scrollTop = chatContainerRef.current.scrollTop;
        setScrolled(scrollTop > 20);
        setShowExtrasSection(scrollTop > 300);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const initializeAgent = useCallback(async () => {
    await agent.initialize();
    const greeting = await agent.processQuery('hello');
    const welcomeMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: '',
      role: 'assistant',
      content: greeting.message,
      created_at: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
    if (greeting.suggestions) {
      setCurrentSuggestions(greeting.suggestions);
    }
  }, [agent]);

  const createConversation = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ title: 'New Airport Transfer Request', device_id: deviceId })
        .select()
        .single();

      if (data && !error) {
        setConversationId(data.id);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
    }
  }, [deviceId]);

  const showReviewsInChat = async () => {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    let reviewsContent = "Here's what our happy travelers are saying:\n\n";

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      reviewsContent += `Average Rating: ${avgRating.toFixed(1)}/5 stars\n\n`;

      reviews.forEach((review, index) => {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        reviewsContent += `${stars} - ${review.name}\n`;
        reviewsContent += `"${review.comment}"\n`;
        if (index < reviews.length - 1) reviewsContent += '\n';
      });

      reviewsContent += "\nWe're proud to be rated #1 on TripAdvisor! Would you like to book your transfer now?";
    } else {
      reviewsContent = "We're building our review collection! We're proud to maintain excellent service with professional drivers and comfortable vehicles.\n\nWould you like to be one of our first reviewers? Book a transfer today!";
    }

    const reviewMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || '',
      role: 'assistant',
      content: reviewsContent,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, reviewMessage]);
    setCurrentSuggestions(['Book a transfer', 'See prices', 'Ask a question']);
    scrollToResponse();
  };

  const loadConversation = async (convId: string) => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (msgs) {
      setMessages(msgs);
      setConversationId(convId);
    }
  };

  const startNewConversation = async () => {
    setMessages([]);
    setConversationId(null);
    setCurrentSuggestions([]);
    agent.resetContext();
    await createConversation();
    await initializeAgent();
  };

  const handleSend = async (message?: string) => {
    const textToSend = message || input.trim();
    if (!textToSend || loading) return;

    if (textToSend.toLowerCase() === 'continue booking' && pendingBookingData) {
      setInput('');
      setChatBookingData(pendingBookingData);
      setBookingModalKey(prev => prev + 1);
      setShowChatBooking(true);
      return;
    }

    if (textToSend.toLowerCase() === 'start over') {
      setInput('');
      setPendingBookingData(null);
      agent.resetContext();
      const response = await agent.processMessage('start over');
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        role: 'assistant',
        content: response.message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (response.suggestions) {
        setCurrentSuggestions(response.suggestions);
      }
      return;
    }

    if (textToSend.toLowerCase() === 'open admin') {
      setInput('');
      setShowAdminPortal(true);
      return;
    }

    if (textToSend.toLowerCase() === 'open agent') {
      setInput('');
      setShowAgentPortal(true);
      return;
    }

    if (textToSend.toLowerCase() === 'open partner') {
      setInput('');
      setShowPartnerPortal(true);
      return;
    }

    if (textToSend.toLowerCase().includes('download backup')) {
      setInput('');
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        role: 'user',
        content: textToSend,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setTimeout(() => {
        const backupMessage: Message = {
          id: crypto.randomUUID(),
          conversation_id: conversationId || '',
          role: 'assistant',
          content: `Here are the available backups for download:\n\n📦 Latest Backup (December 16, 2024):\n• ZIP format: Click here to download\n• TAR.GZ format: Click here to download\n\n📦 Previous Backup (December 15, 2024):\n• ZIP format: Available\n• TAR.GZ format: Available\n\nClick the buttons below to download your preferred format.`,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, backupMessage]);
        setCurrentSuggestions([
          '⬇️ Download Latest ZIP',
          '⬇️ Download Latest TAR.GZ',
          'Ask a question'
        ]);
        scrollToResponse();
      }, 500);
      return;
    }

    if (textToSend.toLowerCase().includes('⬇️ download latest zip')) {
      setInput('');
      window.open('/backups/travelsmart-backup-20251216-230436.zip', '_blank');
      const confirmMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        role: 'assistant',
        content: 'Your backup download has started! The ZIP file should begin downloading shortly.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
      setCurrentSuggestions(['Download TAR.GZ version', 'Ask a question']);
      return;
    }

    if (textToSend.toLowerCase().includes('⬇️ download latest tar.gz')) {
      setInput('');
      window.open('/backups/travelsmart-backup-20251216-230436.tar.gz', '_blank');
      const confirmMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        role: 'assistant',
        content: 'Your backup download has started! The TAR.GZ file should begin downloading shortly.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
      setCurrentSuggestions(['Download ZIP version', 'Ask a question']);
      return;
    }

    if (textToSend.toLowerCase().includes('jo5 lelystad')) {
      setInput('');
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        role: 'user',
        content: textToSend,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      setTimeout(() => {
        const escobarMessageId = crypto.randomUUID();
        const escobarMessage: Message = {
          id: escobarMessageId,
          conversation_id: conversationId || '',
          role: 'assistant',
          content: '"Plata o plomo" - The legend himself 🚁💰',
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, escobarMessage]);
        setMessageVehicleImages((prev) => {
          const newMap = new Map(prev);
          newMap.set(escobarMessageId, {
            url: '/image0.jpeg',
            alt: 'Pablo Escobar',
            caption: 'El Patrón del Mal'
          });
          return newMap;
        });
        scrollToResponse();
      }, 500);
      return;
    }

    setInput('');
    setLoading(true);
    setCurrentSuggestions([]);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || '',
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (conversationId) {
      supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: textToSend,
      }).then(({ error }) => {
        if (error) console.error('Failed to save user message:', error);
      });
    }

    const chatConvId = getCurrentChatConversationId();
    if (chatConvId) {
      saveChatMessage(chatConvId, 'user', textToSend);
    }

    setTimeout(async () => {
      const response = await agent.processQuery(textToSend);

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        role: 'assistant',
        content: response.message,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.languageSwitch) {
        setLanguage(response.languageSwitch);
        agent.setLanguage(response.languageSwitch);
      }

      if (response.bookingAction) {
        setPendingBookingData(null);
        setChatBookingData(response.bookingAction);
        setBookingModalKey(prev => prev + 1);
        setShowChatBooking(true);
      } else if (response.priceScanRequest) {
        setCurrentPriceScanData(response.priceScanRequest);
        setMessagePriceScanner((prev) => {
          const newMap = new Map(prev);
          newMap.set(assistantMessage.id, {
            basePrice: response.priceScanRequest?.basePrice || 0,
            route: response.priceScanRequest?.route || '',
            scanData: response.priceScanRequest
          });
          return newMap;
        });
      } else if (response.vehicleImage) {
        setMessageVehicleImages((prev) => {
          const newMap = new Map(prev);
          newMap.set(assistantMessage.id, response.vehicleImage!);
          return newMap;
        });
      }

      if (response.galleryImages && response.galleryImages.length > 0) {
        setMessageGalleryImages((prev) => {
          const newMap = new Map(prev);
          newMap.set(assistantMessage.id, response.galleryImages!);
          return newMap;
        });
      }

      if (response.suggestions) {
        setCurrentSuggestions(response.suggestions);
      }

      if (conversationId) {
        try {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: response.message,
          });
        } catch (err) {
          console.error('Failed to save message:', err);
        }
      }

      const chatConvId = getCurrentChatConversationId();
      if (chatConvId) {
        const messageType = response.bookingAction ? 'booking_action' :
                           response.priceScanRequest ? 'price_scan' :
                           'text';
        const metadata = {
          bookingAction: response.bookingAction || undefined,
          priceScanRequest: response.priceScanRequest || undefined,
          suggestions: response.suggestions || undefined
        };
        await saveChatMessage(chatConvId, 'assistant', response.message, messageType, metadata);
      }

      scrollToResponse();

      if (textToSend.toLowerCase().includes('call') &&
          (textToSend.toLowerCase().includes('agent') ||
           textToSend.toLowerCase().includes('live') ||
           textToSend.toLowerCase().includes('support'))) {
        setTimeout(() => handleCallAgent(), 1000);
      }

      if ((textToSend.toLowerCase().includes('email') ||
           textToSend.toLowerCase().includes('mail')) &&
          (textToSend.toLowerCase().includes('support') ||
           textToSend.toLowerCase().includes('contact'))) {
        setTimeout(() => handleEmailAgent(), 1000);
      }

      setLoading(false);
    }, 800);
  };

  const handleCallAgent = () => {
    if (typeof window.gtag_report_conversion === 'function') {
      window.gtag_report_conversion();
    }
    window.open('tel:+31625584645', '_self');
    setShowAgentMenu(false);
  };

  const handleEmailAgent = () => {
    if (typeof window.gtag_report_conversion === 'function') {
      window.gtag_report_conversion();
    }
    window.open('mailto:info@dominicantransfers.com?subject=Transfer Inquiry', '_self');
    setShowAgentMenu(false);
  };

  const handlePriceScanComplete = (messageId: string, competitors: any[]) => {
    const scanData = messagePriceScanner.get(messageId);
    if (!scanData) return;
  };

  const handleVehicleSelect = async (messageId: string, vehicle: any) => {
    const scanData = messagePriceScanner.get(messageId);
    if (!scanData || !scanData.scanData) return;

    setLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || '',
      role: 'user',
      content: `I'll take the ${vehicle.name}`,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (conversationId) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage.content,
      });
    }

    agent.setContextForPriceScan({
      airport: scanData.scanData.airport,
      hotel: scanData.scanData.hotel,
      region: scanData.scanData.region,
      passengers: scanData.scanData.passengers,
      luggage: scanData.scanData.luggage
    });

    const response = await agent.processMessage(vehicle.name);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || '',
      role: 'assistant',
      content: response.message,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    if (response.suggestions) {
      setCurrentSuggestions(response.suggestions);
    }

    if (response.bookingAction) {
      if (typeof window.gtag_report_conversion === 'function') {
        window.gtag_report_conversion();
      }
      setChatBookingData(response.bookingAction);
      setBookingModalKey(prev => prev + 1);
      setShowChatBooking(true);
    }

    if (conversationId) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: response.message,
      });
    }

    scrollToResponse();
    setLoading(false);
  };

  const handleBookNow = async (messageId: string) => {
    const compData = messagePriceComparison.get(messageId);
    if (!compData || !compData.scanData) return;

    setLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || '',
      role: 'user',
      content: `Yes, book at $${compData.basePrice}`,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (conversationId) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage.content,
      });
    }

    (agent as any).context = {
      step: 'AWAITING_PASSENGERS',
      airport: compData.scanData.airport,
      hotel: compData.scanData.hotel,
      region: compData.scanData.region,
      priceSource: 'standard',
      originalPrice: compData.basePrice
    };

    setTimeout(async () => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        role: 'assistant',
        content: "Perfect! Let's continue with your booking.\n\nHow many travelers will be in your group?",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentSuggestions(['1 passenger', '2 passengers', '4 passengers', '6 passengers']);

      if (conversationId) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantMessage.content,
        });
      }

      scrollToResponse();
      setLoading(false);
    }, 800);
  };

  const handlePriceMatch = async (messageId: string, price: number) => {
    const compData = messagePriceComparison.get(messageId);
    if (!compData || !compData.scanData) return;

    setLoading(true);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId || '',
      role: 'user',
      content: `I found a lower price at $${price}`,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (conversationId) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        role: 'user',
        content: userMessage.content,
      });
    }

    (agent as any).context = {
      step: 'AWAITING_PASSENGERS',
      airport: compData.scanData.airport,
      hotel: compData.scanData.hotel,
      region: compData.scanData.region,
      priceSource: 'price_match',
      originalPrice: compData.basePrice,
      matchedPrice: price
    };

    setTimeout(async () => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        conversation_id: conversationId || '',
        role: 'assistant',
        content: `Great! I'll honor that $${price} price for you. Let's complete your booking.\n\nHow many travelers will be in your group?`,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentSuggestions(['1 passenger', '2 passengers', '4 passengers', '6 passengers']);

      if (conversationId) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantMessage.content,
        });
      }

      scrollToResponse();
      setLoading(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (showPartnerPortal) {
    return <PartnerPortal onExit={() => setShowPartnerPortal(false)} />;
  }

  if (showCancellationPage) {
    return <CancellationPage />;
  }

  if (showAgentPortal) {
    return <AgentPortal />;
  }

  if (showAdminPortal) {
    return <AdminDashboard onExit={() => setShowAdminPortal(false)} />;
  }

  if (showGallery) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div className="relative">
          <button
            onClick={() => setShowGallery(false)}
            className="fixed top-4 left-4 z-50 p-3 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full transition-colors shadow-lg"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Gallery />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-gradient-to-br from-slate-50 via-teal-50/30 to-cyan-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDAsIDAsIDAsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50"></div>

      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div className="relative max-w-4xl mx-auto h-full flex flex-col">
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-2 xs:px-3 sm:px-4 ${
          scrolled ? 'pt-1 xs:pt-1.5 sm:pt-2 pb-1 xs:pb-1.5 sm:pb-2' : 'pt-2 xs:pt-2.5 sm:pt-3 md:pt-4 pb-2 xs:pb-2 sm:pb-2.5 md:pb-3'
        }`} style={{ paddingTop: `max(env(safe-area-inset-top), ${scrolled ? '4px' : '8px'})` }}>
          <div className={`max-w-4xl mx-auto rounded-xl xs:rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
            scrolled
              ? 'bg-white/90 dark:bg-slate-800/90 border-slate-200/50 dark:border-slate-700/50 p-2 xs:p-2.5 sm:p-3 shadow-lg'
              : 'bg-white/70 dark:bg-slate-800/70 border-slate-200/30 dark:border-slate-700/30 p-2 xs:p-2.5 sm:p-3 md:p-4 shadow-xl'
          }`}>
            <div className="flex items-center gap-2 xs:gap-2.5 sm:gap-3">
              <div className={`rounded-lg xs:rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg flex-shrink-0 transition-all duration-300 ${
                scrolled ? 'w-7 h-7 xs:w-8 xs:h-8 text-base xs:text-lg' : 'w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 text-lg xs:text-xl sm:text-2xl'
              }`}>
                <span role="img" aria-label="taxi">&#128661;</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={`font-bold text-slate-900 dark:text-white truncate transition-all duration-300 ${
                  scrolled ? 'text-sm xs:text-base' : 'text-base xs:text-lg sm:text-xl'
                }`}>Dominican Transfers</h1>
                <p className={`text-slate-500 dark:text-slate-400 truncate transition-all duration-300 ${
                  scrolled ? 'text-[10px] xs:text-xs' : 'text-[11px] xs:text-xs sm:text-sm'
                }`}>#1 Rated Private Airport Transfers</p>
                {!scrolled && (
                  <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 mt-1 xs:mt-1.5 overflow-x-auto scrollbar-hide pb-0.5">
                    <div className="flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded whitespace-nowrap flex-shrink-0">
                      <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-semibold text-green-700 dark:text-green-300">SSL</span>
                    </div>
                    <div className="flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded whitespace-nowrap flex-shrink-0">
                      <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-semibold text-blue-700 dark:text-blue-300">Licensed</span>
                    </div>
                    <div className="flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 rounded whitespace-nowrap flex-shrink-0">
                      <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-semibold text-amber-700 dark:text-amber-300">5-Star</span>
                    </div>
                    <div className="flex items-center gap-0.5 xs:gap-1 px-1.5 xs:px-2 py-0.5 bg-teal-100 dark:bg-teal-900/30 rounded whitespace-nowrap flex-shrink-0">
                      <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-semibold text-teal-700 dark:text-teal-300">Insured</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className={`rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all active:scale-95 ${
                    scrolled ? 'w-7 h-7 xs:w-8 xs:h-8' : 'w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10'
                  }`}
                  title="Chat History"
                >
                  <History className={`${scrolled ? 'w-3 h-3 xs:w-3.5 xs:h-3.5' : 'w-3.5 h-3.5 xs:w-4 xs:h-4'}`} />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowAgentMenu(!showAgentMenu)}
                    className={`rounded-full bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center justify-center text-white shadow-lg transition-all hover:shadow-green-500/30 active:scale-95 ${
                      scrolled ? 'w-7 h-7 xs:w-8 xs:h-8' : 'w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10'
                    }`}
                    title="Contact Us"
                  >
                    <Phone className={`${scrolled ? 'w-3 h-3 xs:w-3.5 xs:h-3.5' : 'w-3.5 h-3.5 xs:w-4 xs:h-4'}`} />
                  </button>

                  {showAgentMenu && (
                    <div className="absolute top-full right-0 mt-2 w-56 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700 animate-slideDown">
                      <div className="p-2">
                        <button
                          onClick={handleCallAgent}
                          className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">Call Now</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Speak with an expert</div>
                          </div>
                        </button>
                        <button
                          onClick={handleEmailAgent}
                          className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-600 flex items-center justify-center">
                            <Send className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">Send Email</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Get help via email</div>
                          </div>
                        </button>
                        <button
                          onClick={() => {
                            setShowGallery(true);
                            setShowAgentMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-3 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center">
                            <Star className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-semibold text-sm text-slate-900 dark:text-white">Our Gallery</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">See our photos & stories</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all active:scale-95 ${
                    scrolled ? 'w-7 h-7 xs:w-8 xs:h-8' : 'w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10'
                  }`}
                >
                  {darkMode ? <Sun className={`${scrolled ? 'w-3 h-3 xs:w-3.5 xs:h-3.5' : 'w-3.5 h-3.5 xs:w-4 xs:h-4'}`} /> : <Moon className={`${scrolled ? 'w-3 h-3 xs:w-3.5 xs:h-3.5' : 'w-3.5 h-3.5 xs:w-4 xs:h-4'}`} />}
                </button>
              </div>
            </div>
          </div>
        </header>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-2 xs:px-3 sm:px-4 pt-24 xs:pt-28 sm:pt-32 md:pt-36 pb-2 xs:pb-3 sm:pb-4" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-3 xs:space-y-4">
            {messages.map((message, index) => {
              const isLastAssistantMessage = message.role === 'assistant' && index === messages.length - 1;
              const scannerData = messagePriceScanner.get(message.id);
              const comparisonData = messagePriceComparison.get(message.id);

              return (
                <div key={message.id} ref={isLastAssistantMessage ? lastResponseRef : undefined}>
                  <ChatMessage
                    role={message.role}
                    content={message.content}
                    vehicleImage={messageVehicleImages.get(message.id)}
                    galleryImages={messageGalleryImages.get(message.id)}
                    priceScanner={scannerData ? {
                      basePrice: scannerData.basePrice,
                      route: scannerData.route,
                      passengers: scannerData.scanData?.passengers,
                      luggage: scannerData.scanData?.luggage,
                      vehicleOptions: scannerData.scanData?.vehicleOptions,
                      onComplete: (competitors) => handlePriceScanComplete(message.id, competitors),
                      onSelectVehicle: (vehicle) => handleVehicleSelect(message.id, vehicle),
                      onBookNow: () => handleBookNow(message.id),
                      onBetterRate: (price) => handlePriceMatch(message.id, price)
                    } : undefined}
                    priceComparison={comparisonData ? {
                      basePrice: comparisonData.basePrice,
                      competitors: comparisonData.competitors,
                      route: comparisonData.route,
                      onBookNow: () => handleBookNow(message.id),
                      onPriceMatch: (price) => handlePriceMatch(message.id, price)
                    } : undefined}
                  />
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start mb-4">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl px-5 py-3">
                  <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
                </div>
              </div>
            )}

            {currentSuggestions.length > 0 && !loading && (
              <SuggestionChips suggestions={currentSuggestions} onSelect={handleSend} />
            )}

            {messages.length > 0 && showExtrasSection && (
              <>
                <div className="flex justify-center mb-4 animate-fadeIn">
                  <button
                    onClick={showReviewsInChat}
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/40 dark:border-slate-700/40 rounded-xl p-3 max-w-xs w-full hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-md hover:scale-[1.01] transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center justify-center gap-0.5 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
                      ))}
                    </div>
                    <p className="text-slate-900 dark:text-white text-center text-xs font-medium mb-0.5">
                      TripAdvisor Travelers' Choice
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-center text-[10px]">
                      Trusted by travelers
                    </p>
                  </button>
                </div>
                <div className="animate-fadeIn">
                  <CompactGallery onViewFull={() => setShowGallery(true)} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-2 xs:p-2.5 sm:p-3 md:p-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}>
          <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl xs:rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-2 xs:p-2.5 sm:p-3">
            <div className="flex gap-2 xs:gap-2.5 sm:gap-3 items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={getTranslations(language).chat.placeholder}
                disabled={loading}
                className="flex-1 min-w-0 bg-slate-100/80 dark:bg-slate-700/80 border-0 rounded-lg xs:rounded-xl px-3 xs:px-3.5 sm:px-4 py-2.5 xs:py-3 text-slate-900 dark:text-white text-xs xs:text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50 transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 xs:w-11 xs:h-11 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-600 dark:disabled:to-slate-700 rounded-lg xs:rounded-xl flex items-center justify-center text-white transition-all hover:shadow-lg hover:shadow-teal-500/30 disabled:cursor-not-allowed disabled:hover:shadow-none flex-shrink-0 active:scale-95"
              >
                <Send className="w-4 h-4 xs:w-5 xs:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAgentMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowAgentMenu(false)} />
      )}

      {showChatBooking && chatBookingData && (
        <TransferBookingModal
          key={bookingModalKey}
          isOpen={showChatBooking}
          onClose={() => {
            setShowChatBooking(false);
            setPendingBookingData(chatBookingData);
            setChatBookingData(null);

            const reminderMessage: Message = {
              id: crypto.randomUUID(),
              conversation_id: conversationId || '',
              role: 'assistant',
              content: `No problem! Your booking details are saved. Click "Continue Booking" below whenever you're ready to complete your reservation.`,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, reminderMessage]);
            setCurrentSuggestions(['Continue Booking', 'Start over', 'Ask a question']);
          }}
          bookingData={chatBookingData}
          onComplete={(reference) => {
            setShowChatBooking(false);
            setChatBookingData(null);
            setPendingBookingData(null);
            const confirmationMessage: Message = {
              id: crypto.randomUUID(),
              conversation_id: conversationId || '',
              role: 'assistant',
              content: `Your transfer is confirmed!\n\nYour booking reference is: ${reference}\n\nA confirmation email has been sent to your email address.\nYou can manage or update your booking anytime using your booking link.\n\nWould you like help with anything else?`,
              created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, confirmationMessage]);
            setCurrentSuggestions(['Book another transfer', 'Ask a question', 'Contact support']);
            agent.resetContext();
          }}
        />
      )}

      <ChatHistory
        currentConversationId={conversationId}
        onSelectConversation={loadConversation}
        onNewConversation={startNewConversation}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        deviceId={deviceId}
      />

      {showPaymentSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Payment Successful!
              </h2>

              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Your transfer has been confirmed and paid for.
              </p>

              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6 mb-6">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Booking Reference</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 font-mono tracking-wider">
                  {paymentBookingRef}
                </p>
              </div>

              <div className="space-y-3 text-left mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Confirmation email sent to your inbox
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Driver will be assigned soon
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Track your booking using the reference number
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowPaymentSuccess(false);
                  setPaymentBookingRef('');
                }}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-xl transition-all hover:shadow-lg hover:shadow-teal-500/30 active:scale-95"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
