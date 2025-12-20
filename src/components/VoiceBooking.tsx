import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, MessageSquare, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VoiceBookingProps {
  conversationId?: string;
  conversationHistory: Array<{ role: string; content: string }>;
  isInBookingFlow: boolean;
  onModeSwitch: () => void;
  onTranscriptUpdate: (text: string, isUser: boolean) => void;
}

interface VoiceMessage {
  text: string;
  isUser: boolean;
  audio?: string;
  timestamp: Date;
}

export function VoiceBooking({
  conversationId,
  conversationHistory,
  isInBookingFlow,
  onModeSwitch,
  onTranscriptUpdate
}: VoiceBookingProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      setError(null);
      return true;
    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions to use voice booking.');
      return false;
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach(track => track.stop());
        await processVoiceInput(audioBlob);
      };

      if (recognitionRef.current) {
        recognitionRef.current.onresult = async (event: any) => {
          const transcript = event.results[0][0].transcript;
          await sendVoiceMessage(transcript);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setError('Could not recognize speech. Please try again.');
          setIsRecording(false);
        };

        recognitionRef.current.start();
      }

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please check your microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    console.log('Audio recorded, waiting for transcription...');
  };

  const sendVoiceMessage = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);
    setError(null);

    setVoiceMessages(prev => [...prev, {
      text,
      isUser: true,
      timestamp: new Date()
    }]);

    onTranscriptUpdate(text, true);

    try {
      const { data, error: apiError } = await supabase.functions.invoke('elevenlabs-voice', {
        body: {
          text,
          conversationId,
          conversationHistory,
          isInBookingFlow
        }
      });

      if (apiError) throw apiError;

      if (data.success && data.text) {
        const assistantMessage: VoiceMessage = {
          text: data.text,
          isUser: false,
          audio: data.audio,
          timestamp: new Date()
        };

        setVoiceMessages(prev => [...prev, assistantMessage]);
        onTranscriptUpdate(data.text, false);

        if (data.audio) {
          playAudioResponse(data.audio);
        }
      }
    } catch (err) {
      console.error('Error sending voice message:', err);
      setError('Failed to process your message. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudioResponse = (base64Audio: string) => {
    try {
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
        console.error('Error playing audio');
      };

      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setIsPlaying(false);
      });
    } catch (err) {
      console.error('Error processing audio:', err);
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
            <Mic className="w-6 h-6 text-blue-600 dark:text-blue-400 relative z-10" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Voice Booking</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Speak to book your transfer</p>
          </div>
        </div>
        <button
          onClick={onModeSwitch}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Switch to Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {voiceMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mb-6">
              <Mic className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Start Voice Booking
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
              Tap the microphone button below to start speaking. Book your entire transfer using just your voice!
            </p>
            <div className="grid grid-cols-2 gap-4 text-left max-w-md">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Tap to speak</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Press the mic button</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Tell us your needs</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Airport, hotel, passengers</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Get instant quote</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Best prices, no typing</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">4</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Confirm booking</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Complete by voice</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {voiceMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-2">
                {!message.isUser && message.audio && (
                  <Volume2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                )}
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
              <p className={`text-xs mt-1 ${message.isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Processing...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mx-4 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleRecordClick}
            disabled={isProcessing || isPlaying}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-lg shadow-red-500/50'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-xl'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording && (
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
            )}
            {isRecording ? (
              <MicOff className="w-8 h-8 text-white relative z-10" />
            ) : (
              <Mic className="w-8 h-8 text-white relative z-10" />
            )}
          </button>

          <div className="text-center">
            {isRecording && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400 animate-pulse">
                Listening... Tap to stop
              </p>
            )}
            {isProcessing && (
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Processing your request...
              </p>
            )}
            {isPlaying && (
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Playing response...
              </p>
            )}
            {!isRecording && !isProcessing && !isPlaying && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tap the microphone to speak
              </p>
            )}
          </div>

          {isInBookingFlow && (
            <div className="mt-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
                Currently in booking flow - ask questions anytime!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
