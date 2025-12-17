import { ConversationModel, MessageModel } from '../database/models';
import { Conversation, Message, ConversationWithDetails } from '../types';
import { notificationService } from '../services/NotificationService';

/**
 * MessagingController
 *
 * Handles all messaging-related business logic:
 * - Creating and fetching conversations
 * - Sending and fetching messages
 * - Read receipts and unread counts
 * - Message search
 */
export class MessagingController {
  private conversationModel: ConversationModel;
  private messageModel: MessageModel;

  constructor() {
    this.conversationModel = new ConversationModel();
    this.messageModel = new MessageModel();
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(
    userId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ conversations: ConversationWithDetails[]; total: number; hasMore: boolean }> {
    return this.conversationModel.findByUserId(userId, options);
  }

  /**
   * Get a single conversation with details
   */
  async getConversation(
    conversationId: string,
    userId: string
  ): Promise<ConversationWithDetails | null> {
    // Verify user is a participant
    const isParticipant = await this.conversationModel.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new Error('You are not a participant in this conversation');
    }

    return this.conversationModel.findByIdWithDetails(conversationId, userId);
  }

  /**
   * Create a new conversation or get existing one
   */
  async createConversation(
    creatorId: string,
    data: {
      participant_ids: string[];
      subject?: string;
      property_listing_id?: string;
      demand_listing_id?: string;
      initial_message?: string;
    }
  ): Promise<{ conversation: Conversation; message?: Message }> {
    // For 1-on-1 chats, check if conversation already exists
    if (data.participant_ids.length === 1) {
      const existingConversation = await this.conversationModel.getOrCreateDirectConversation(
        creatorId,
        data.participant_ids[0],
        {
          property_listing_id: data.property_listing_id,
          demand_listing_id: data.demand_listing_id,
        }
      );

      let message: Message | undefined;

      // Send initial message if provided
      if (data.initial_message) {
        message = await this.messageModel.create({
          conversation_id: existingConversation.id,
          sender_id: creatorId,
          content: data.initial_message,
        });

        // Send email notifications to other participants (async, don't wait)
        notificationService.notifyConversationParticipants(
          existingConversation.id,
          creatorId,
          data.initial_message
        ).catch((err) => console.error('Failed to send message notifications:', err));
      }

      return { conversation: existingConversation, message };
    }

    // Create new group conversation
    const conversation = await this.conversationModel.create({
      created_by: creatorId,
      participant_ids: data.participant_ids,
      subject: data.subject,
      property_listing_id: data.property_listing_id,
      demand_listing_id: data.demand_listing_id,
    });

    let message: Message | undefined;

    // Send initial message if provided
    if (data.initial_message) {
      message = await this.messageModel.create({
        conversation_id: conversation.id,
        sender_id: creatorId,
        content: data.initial_message,
      });

      // Send email notifications to other participants (async, don't wait)
      notificationService.notifyConversationParticipants(
        conversation.id,
        creatorId,
        data.initial_message
      ).catch((err) => console.error('Failed to send message notifications:', err));
    }

    return { conversation, message };
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    conversationId: string,
    userId: string,
    options?: { limit?: number; before?: string }
  ): Promise<{ messages: Message[]; total: number; hasMore: boolean }> {
    // Verify user is a participant
    const isParticipant = await this.conversationModel.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new Error('You are not a participant in this conversation');
    }

    return this.messageModel.findByConversationId(conversationId, options);
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    data: {
      content: string;
      attachments?: Array<{ name: string; url: string; type?: string; size?: number }>;
    }
  ): Promise<Message> {
    // Verify sender is a participant
    const isParticipant = await this.conversationModel.isParticipant(conversationId, senderId);
    if (!isParticipant) {
      throw new Error('You are not a participant in this conversation');
    }

    // Validate content
    if (!data.content || data.content.trim().length === 0) {
      throw new Error('Message content is required');
    }

    // Create the message
    const message = await this.messageModel.create({
      conversation_id: conversationId,
      sender_id: senderId,
      content: data.content.trim(),
      attachments: data.attachments,
    });

    // Send email notifications to other participants (async, don't wait)
    notificationService.notifyConversationParticipants(
      conversationId,
      senderId,
      data.content.trim()
    ).catch((err) => console.error('Failed to send message notifications:', err));

    // Return message with sender info
    return this.messageModel.findByIdWithSender(message.id) as Promise<Message>;
  }

  /**
   * Mark a conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    // Verify user is a participant
    const isParticipant = await this.conversationModel.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new Error('You are not a participant in this conversation');
    }

    await this.conversationModel.markAsRead(conversationId, userId);
  }

  /**
   * Get total unread message count for a user
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    return this.conversationModel.getTotalUnreadCount(userId);
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    // Only sender can delete their message
    if (message.sender_id !== userId) {
      throw new Error('You can only delete your own messages');
    }

    await this.messageModel.delete(messageId);
  }

  /**
   * Search messages
   */
  async searchMessages(
    userId: string,
    searchQuery: string,
    options?: { limit?: number }
  ): Promise<Message[]> {
    if (!searchQuery || searchQuery.trim().length < 2) {
      throw new Error('Search query must be at least 2 characters');
    }

    return this.messageModel.search(userId, searchQuery.trim(), options);
  }

  /**
   * Mute/unmute a conversation
   */
  async setConversationMuted(
    conversationId: string,
    userId: string,
    isMuted: boolean
  ): Promise<void> {
    // Verify user is a participant
    const isParticipant = await this.conversationModel.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new Error('You are not a participant in this conversation');
    }

    await this.conversationModel.setMuted(conversationId, userId, isMuted);
  }

  /**
   * Leave a conversation
   */
  async leaveConversation(conversationId: string, userId: string): Promise<void> {
    // Verify user is a participant
    const isParticipant = await this.conversationModel.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new Error('You are not a participant in this conversation');
    }

    await this.conversationModel.removeParticipant(conversationId, userId);
  }
}
