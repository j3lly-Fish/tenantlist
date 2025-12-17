import { EmailService, EmailType } from './email/EmailService';
import { NotificationPreferencesModel } from '../database/models/NotificationPreferences';
import pool from '../config/database';

/**
 * NotificationService
 * Handles sending email notifications with preference checking
 */
export class NotificationService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Get user's display name
   */
  private async getUserDisplayName(userId: string): Promise<string> {
    try {
      // Try to get from profile first
      const profileResult = await pool.query(
        'SELECT first_name FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      if (profileResult.rows[0]?.first_name) {
        return profileResult.rows[0].first_name;
      }

      // Fall back to email username
      const userResult = await pool.query(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );
      return userResult.rows[0]?.email?.split('@')[0] || 'User';
    } catch {
      return 'User';
    }
  }

  /**
   * Get user's email
   */
  private async getUserEmail(userId: string): Promise<string | null> {
    try {
      const result = await pool.query(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );
      return result.rows[0]?.email || null;
    } catch {
      return null;
    }
  }

  /**
   * Send new message notification
   */
  async sendNewMessageNotification(
    recipientUserId: string,
    senderUserId: string,
    messageContent: string,
    conversationId: string
  ): Promise<void> {
    try {
      // Check if user wants email notifications for messages
      const shouldSend = await NotificationPreferencesModel.shouldSendEmail(
        recipientUserId,
        EmailType.NEW_MESSAGE
      );

      if (!shouldSend) {
        console.log(`User ${recipientUserId} has disabled message notifications`);
        return;
      }

      // Get recipient and sender info
      const [recipientEmail, recipientName, senderName] = await Promise.all([
        this.getUserEmail(recipientUserId),
        this.getUserDisplayName(recipientUserId),
        this.getUserDisplayName(senderUserId),
      ]);

      if (!recipientEmail) {
        console.error(`No email found for user ${recipientUserId}`);
        return;
      }

      // Truncate message preview
      const messagePreview = messageContent.length > 150
        ? messageContent.substring(0, 147) + '...'
        : messageContent;

      await this.emailService.sendNewMessageEmail(
        recipientEmail,
        recipientName,
        senderName,
        messagePreview,
        conversationId
      );
    } catch (error) {
      console.error('Failed to send new message notification:', error);
      // Don't throw - email failures shouldn't break the main flow
    }
  }

  /**
   * Send new matches notification
   */
  async sendNewMatchesNotification(
    userId: string,
    matches: Array<{
      id: string;
      match_score: number;
      property: {
        title: string;
        city: string;
        state: string;
      };
    }>
  ): Promise<void> {
    try {
      if (matches.length === 0) return;

      // Check if user wants email notifications for matches
      const shouldSend = await NotificationPreferencesModel.shouldSendEmail(
        userId,
        EmailType.NEW_MATCH
      );

      if (!shouldSend) {
        console.log(`User ${userId} has disabled match notifications`);
        return;
      }

      const [email, name] = await Promise.all([
        this.getUserEmail(userId),
        this.getUserDisplayName(userId),
      ]);

      if (!email) {
        console.error(`No email found for user ${userId}`);
        return;
      }

      const topMatch = matches[0];

      await this.emailService.sendNewMatchEmail(
        email,
        name,
        matches.length,
        topMatch.property.title,
        Math.round(topMatch.match_score),
        `${topMatch.property.city}, ${topMatch.property.state}`
      );
    } catch (error) {
      console.error('Failed to send new matches notification:', error);
    }
  }

  /**
   * Send business invite notification
   */
  async sendBusinessInviteNotification(
    inviteeEmail: string,
    inviterUserId: string,
    businessName: string,
    role: string,
    inviteToken: string
  ): Promise<void> {
    try {
      const inviterName = await this.getUserDisplayName(inviterUserId);

      await this.emailService.sendBusinessInviteEmail(
        inviteeEmail,
        inviterName,
        businessName,
        role,
        inviteToken
      );
    } catch (error) {
      console.error('Failed to send business invite notification:', error);
    }
  }

  /**
   * Send tour reminder notification
   */
  async sendTourReminderNotification(
    userId: string,
    propertyTitle: string,
    propertyAddress: string,
    tourDate: Date,
    contactName: string
  ): Promise<void> {
    try {
      // Check if user wants email notifications for tour reminders
      const shouldSend = await NotificationPreferencesModel.shouldSendEmail(
        userId,
        EmailType.TOUR_REMINDER
      );

      if (!shouldSend) {
        console.log(`User ${userId} has disabled tour reminder notifications`);
        return;
      }

      const [email, name] = await Promise.all([
        this.getUserEmail(userId),
        this.getUserDisplayName(userId),
      ]);

      if (!email) {
        console.error(`No email found for user ${userId}`);
        return;
      }

      await this.emailService.sendTourReminderEmail(
        email,
        name,
        propertyTitle,
        propertyAddress,
        tourDate,
        contactName
      );
    } catch (error) {
      console.error('Failed to send tour reminder notification:', error);
    }
  }

  /**
   * Send account update notification
   */
  async sendAccountUpdateNotification(
    userId: string,
    updateType: string,
    details: string
  ): Promise<void> {
    try {
      // Check if user wants email notifications for account updates
      const shouldSend = await NotificationPreferencesModel.shouldSendEmail(
        userId,
        EmailType.ACCOUNT_UPDATE
      );

      if (!shouldSend) {
        console.log(`User ${userId} has disabled account update notifications`);
        return;
      }

      const [email, name] = await Promise.all([
        this.getUserEmail(userId),
        this.getUserDisplayName(userId),
      ]);

      if (!email) {
        console.error(`No email found for user ${userId}`);
        return;
      }

      await this.emailService.sendAccountUpdateEmail(
        email,
        name,
        updateType,
        details
      );
    } catch (error) {
      console.error('Failed to send account update notification:', error);
    }
  }

  /**
   * Send notification to all participants in a conversation except the sender
   */
  async notifyConversationParticipants(
    conversationId: string,
    senderUserId: string,
    messageContent: string
  ): Promise<void> {
    try {
      // Get all participants except the sender
      const result = await pool.query<{ user_id: string }>(
        `SELECT user_id FROM conversation_participants
         WHERE conversation_id = $1 AND user_id != $2`,
        [conversationId, senderUserId]
      );

      // Send notifications in parallel
      await Promise.all(
        result.rows.map((row) =>
          this.sendNewMessageNotification(
            row.user_id,
            senderUserId,
            messageContent,
            conversationId
          )
        )
      );
    } catch (error) {
      console.error('Failed to notify conversation participants:', error);
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
