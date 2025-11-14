// Message service for user-to-user messaging
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message_at: string;
  last_message_id: string | null;
  created_at: string;
  updated_at: string;
  // Populated fields
  other_user?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
  last_message?: Message;
  unread_count?: number;
}

export interface CreateMessageInput {
  recipientId: string;
  content: string;
  conversationId?: string; // Optional - will create conversation if not provided
}

export const messageService = {
  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(
    userId1: string,
    userId2: string
  ): Promise<Conversation> {
    // Ensure consistent ordering (smaller ID first)
    const [participant1, participant2] = [userId1, userId2].sort();

    // Try to find existing conversation
    const { data: existing, error: findError } = await supabase
      .from("conversations")
      .select("*")
      .eq("participant_1_id", participant1)
      .eq("participant_2_id", participant2)
      .single();

    if (existing && !findError) {
      return existing as Conversation;
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from("conversations")
      .insert({
        participant_1_id: participant1,
        participant_2_id: participant2,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return newConversation as Conversation;
  },

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Enrich conversations with other user info and unread count
    const enriched = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId =
          conv.participant_1_id === userId
            ? conv.participant_2_id
            : conv.participant_1_id;

        // Get other user's profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url")
          .eq("id", otherUserId)
          .single();

        // Get unread count
        const unreadCount = await this.getUnreadCount(conv.id, userId);

        // Get last message if exists
        let lastMessage: Message | undefined;
        if (conv.last_message_id) {
          const { data: msg } = await supabase
            .from("messages")
            .select("*")
            .eq("id", conv.last_message_id)
            .single();
          lastMessage = msg as Message | undefined;
        }

        return {
          ...conv,
          other_user: profile
            ? {
                id: profile.id,
                full_name: profile.full_name,
                email: profile.email,
                avatar_url: profile.avatar_url,
              }
            : undefined,
          unread_count: unreadCount,
          last_message: lastMessage,
        } as Conversation;
      })
    );

    return enriched;
  },

  /**
   * Get conversations where user sent the last message (sent conversations)
   */
  async getSentConversations(userId: string): Promise<Conversation[]> {
    const conversations = await this.getUserConversations(userId);
    
    // Filter conversations where the last message was sent by the current user
    return conversations.filter((conv) => {
      if (!conv.last_message) return false;
      return conv.last_message.sender_id === userId;
    });
  },

  /**
   * Get conversations where user received the last message (received conversations)
   */
  async getReceivedConversations(userId: string): Promise<Conversation[]> {
    const conversations = await this.getUserConversations(userId);
    
    // Filter conversations where the last message was received by the current user
    return conversations.filter((conv) => {
      if (!conv.last_message) return false;
      return conv.last_message.recipient_id === userId;
    });
  },

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return (data || []) as Message[];
  },

  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    input: CreateMessageInput
  ): Promise<Message> {
    let conversationId = input.conversationId;

    // Get or create conversation if not provided
    if (!conversationId) {
      const conversation = await this.getOrCreateConversation(
        senderId,
        input.recipientId
      );
      conversationId = conversation.id;
    }

    // Create message
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        recipient_id: input.recipientId,
        content: input.content,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data as Message;
  },

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("recipient_id", userId)
      .is("read_at", null);

    if (error) {
      throw error;
    }
  },

  /**
   * Get unread message count for a conversation
   */
  async getUnreadCount(
    conversationId: string,
    userId: string
  ): Promise<number> {
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("recipient_id", userId)
      .is("read_at", null);

    if (error) {
      throw error;
    }

    return count || 0;
  },

  /**
   * Get total unread message count for a user
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    // Get all conversations for user
    const conversations = await this.getUserConversations(userId);

    // Sum unread counts
    const unreadCounts = await Promise.all(
      conversations.map((conv) => this.getUnreadCount(conv.id, userId))
    );

    return unreadCounts.reduce((sum, count) => sum + count, 0);
  },

  /**
   * Delete a message (soft delete by sender)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    // Check if user is the sender
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("sender_id")
      .eq("id", messageId)
      .single();

    if (fetchError || !message) {
      throw new Error("Message not found");
    }

    if (message.sender_id !== userId) {
      throw new Error("You can only delete your own messages");
    }

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (error) {
      throw error;
    }
  },
};

