import { supabase } from './supabase';

export interface ChatConversation {
  id: string;
  device_id: string;
  started_at: string;
  last_message_at: string;
  language: string;
  booking_created: boolean;
  booking_id: string | null;
  session_metadata: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

let currentChatConversationId: string | null = null;

export async function initializeChatConversation(deviceId: string, language: string = 'en'): Promise<string | null> {
  if (currentChatConversationId) {
    return currentChatConversationId;
  }

  try {
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({
        device_id: deviceId,
        language: language,
        session_metadata: {
          user_agent: navigator.userAgent,
          screen_width: window.innerWidth,
          screen_height: window.innerHeight
        }
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('Failed to create chat conversation:', error);
      return null;
    }

    if (data) {
      currentChatConversationId = data.id;
      return data.id;
    }

    return null;
  } catch (error) {
    console.error('Error initializing chat conversation:', error);
    return null;
  }
}

export async function saveChatMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  messageType: string = 'text',
  metadata: Record<string, any> = {}
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        message_type: messageType,
        metadata
      });

    if (error) {
      console.error('Failed to save chat message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving chat message:', error);
    return false;
  }
}

export async function linkConversationToBooking(conversationId: string, bookingId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('link_conversation_to_booking', {
      p_conversation_id: conversationId,
      p_booking_id: bookingId
    });

    if (error) {
      console.error('Failed to link conversation to booking:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error linking conversation to booking:', error);
    return false;
  }
}

export function resetChatConversation(): void {
  currentChatConversationId = null;
}

export function getCurrentChatConversationId(): string | null {
  return currentChatConversationId;
}
