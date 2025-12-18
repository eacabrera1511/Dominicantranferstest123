import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Hotel {
  id: string;
  name: string;
  location: string;
  country: string;
  address: string;
  description: string;
  price_per_night: number;
  rating: number;
  image_url: string;
  amenities: string[];
  coordinates: { lat: number; lng: number };
  created_at: string;
}

export interface Service {
  id: string;
  type: 'airport_transfer' | 'car_rental' | 'flight' | 'attraction' | 'yacht_rental';
  name: string;
  description: string;
  location: string;
  price: number;
  image_url?: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}
