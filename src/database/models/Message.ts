import { Pool } from 'pg';
import pool from '../../config/database';
import { Message, MessageStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class MessageModel {
  private pool: Pool;

  constructor(customPool?: Pool) {
    this.pool = customPool || pool;
  }

  /**
   * Create a new message
   */
  async create(data: {
    conversation_id: string;
    sender_id: string;
    content: string;
    attachments?: Array<{ name: string; url: string; type?: string; size?: number }>;
  }): Promise<Message> {
    const result = await this.pool.query(
      `INSERT INTO messages (id, conversation_id, sender_id, content, attachments)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        uuidv4(),
        data.conversation_id,
        data.sender_id,
        data.content,
        JSON.stringify(data.attachments || []),
      ]
    );

    return result.rows[0];
  }

  /**
   * Find message by ID
   */
  async findById(id: string): Promise<Message | null> {
    const result = await this.pool.query(
      'SELECT * FROM messages WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find message by ID with sender info
   */
  async findByIdWithSender(id: string): Promise<Message | null> {
    const result = await this.pool.query(
      `SELECT m.*,
              u.id as sender_user_id, u.email as sender_email, u.role as sender_role,
              up.first_name as sender_first_name, up.last_name as sender_last_name, up.photo_url as sender_photo_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE m.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      content: row.content,
      attachments: row.attachments || [],
      status: row.status,
      is_deleted: row.is_deleted,
      deleted_at: row.deleted_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sender: {
        id: row.sender_user_id,
        email: row.sender_email,
        role: row.sender_role,
        profile: row.sender_first_name ? {
          first_name: row.sender_first_name,
          last_name: row.sender_last_name,
          photo_url: row.sender_photo_url,
        } : undefined,
      },
    };
  }

  /**
   * Find messages in a conversation with pagination
   */
  async findByConversationId(
    conversationId: string,
    options?: { page?: number; limit?: number; before?: string }
  ): Promise<{ messages: Message[]; total: number; hasMore: boolean }> {
    const limit = options?.limit || 50;
    const before = options?.before;

    // Build query
    let query = `
      SELECT m.*,
             u.id as sender_user_id, u.email as sender_email, u.role as sender_role,
             up.first_name as sender_first_name, up.last_name as sender_last_name, up.photo_url as sender_photo_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE m.conversation_id = $1 AND m.is_deleted = FALSE
    `;

    const params: any[] = [conversationId];

    if (before) {
      query += ` AND m.created_at < (SELECT created_at FROM messages WHERE id = $${params.length + 1})`;
      params.push(before);
    }

    query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit + 1); // Fetch one extra to check hasMore

    const result = await this.pool.query(query, params);

    // Get total count
    const countResult = await this.pool.query(
      `SELECT COUNT(*) as total FROM messages
       WHERE conversation_id = $1 AND is_deleted = FALSE`,
      [conversationId]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Check if there are more messages
    const hasMore = result.rows.length > limit;
    const messages = result.rows.slice(0, limit);

    // Map results to Message type with sender info
    const mappedMessages: Message[] = messages.map((row) => ({
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      content: row.content,
      attachments: row.attachments || [],
      status: row.status,
      is_deleted: row.is_deleted,
      deleted_at: row.deleted_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sender: {
        id: row.sender_user_id,
        email: row.sender_email,
        role: row.sender_role,
        profile: row.sender_first_name ? {
          first_name: row.sender_first_name,
          last_name: row.sender_last_name,
          photo_url: row.sender_photo_url,
        } : undefined,
      },
    }));

    // Reverse to show oldest first (for chat display)
    return {
      messages: mappedMessages.reverse(),
      total,
      hasMore,
    };
  }

  /**
   * Update message status
   */
  async updateStatus(id: string, status: MessageStatus): Promise<void> {
    await this.pool.query(
      `UPDATE messages
       SET status = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, status]
    );
  }

  /**
   * Soft delete a message
   */
  async delete(id: string): Promise<void> {
    await this.pool.query(
      `UPDATE messages
       SET is_deleted = TRUE, deleted_at = NOW(), content = '[Message deleted]', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Get read receipts for a message
   */
  async getReadReceipts(messageId: string): Promise<Array<{ user_id: string; read_at: Date }>> {
    const result = await this.pool.query(
      `SELECT user_id, read_at FROM message_read_receipts WHERE message_id = $1`,
      [messageId]
    );
    return result.rows;
  }

  /**
   * Check if a message has been read by a user
   */
  async isReadByUser(messageId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT 1 FROM message_read_receipts WHERE message_id = $1 AND user_id = $2`,
      [messageId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * Mark a single message as read
   */
  async markAsRead(messageId: string, userId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO message_read_receipts (id, message_id, user_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id) DO NOTHING`,
      [uuidv4(), messageId, userId]
    );
  }

  /**
   * Get unread message count for a user in a conversation
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const result = await this.pool.query(
      `SELECT COUNT(*) as count FROM messages m
       WHERE m.conversation_id = $1
         AND m.sender_id != $2
         AND m.is_deleted = FALSE
         AND NOT EXISTS (
           SELECT 1 FROM message_read_receipts mrr
           WHERE mrr.message_id = m.id AND mrr.user_id = $2
         )`,
      [conversationId, userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Search messages by content
   */
  async search(
    userId: string,
    searchQuery: string,
    options?: { limit?: number }
  ): Promise<Message[]> {
    const limit = options?.limit || 20;

    const result = await this.pool.query(
      `SELECT m.*,
              u.id as sender_user_id, u.email as sender_email, u.role as sender_role,
              up.first_name as sender_first_name, up.last_name as sender_last_name, up.photo_url as sender_photo_url
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN user_profiles up ON u.id = up.user_id
       JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
       WHERE cp.user_id = $1
         AND cp.left_at IS NULL
         AND m.is_deleted = FALSE
         AND m.content ILIKE $2
       ORDER BY m.created_at DESC
       LIMIT $3`,
      [userId, `%${searchQuery}%`, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      conversation_id: row.conversation_id,
      sender_id: row.sender_id,
      content: row.content,
      attachments: row.attachments || [],
      status: row.status,
      is_deleted: row.is_deleted,
      deleted_at: row.deleted_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      sender: {
        id: row.sender_user_id,
        email: row.sender_email,
        role: row.sender_role,
        profile: row.sender_first_name ? {
          first_name: row.sender_first_name,
          last_name: row.sender_last_name,
          photo_url: row.sender_photo_url,
        } : undefined,
      },
    }));
  }
}
