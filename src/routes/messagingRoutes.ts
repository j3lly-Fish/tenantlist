import { Router, Request, Response } from 'express';
import { MessagingController } from '../controllers/MessagingController';
import { RoleGuardMiddleware } from '../middleware/roleGuardMiddleware';

const router = Router();
const messagingController = new MessagingController();
const roleGuard = new RoleGuardMiddleware();

/**
 * Extended Request interface with authenticated user data
 */
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * GET /api/messages/conversations
 * Get all conversations for authenticated user
 */
router.get(
  '/conversations',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const { page, limit } = req.query;

      const result = await messagingController.getConversations(userId, {
        page: page ? parseInt(page as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get conversations error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching conversations',
        },
      });
    }
  }
);

/**
 * GET /api/messages/conversations/:id
 * Get a single conversation with details
 */
router.get(
  '/conversations/:id',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const conversation = await messagingController.getConversation(conversationId, userId);

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conversation not found',
          },
        });
      }

      res.json({
        success: true,
        data: { conversation },
      });
    } catch (error: any) {
      console.error('Get conversation error:', error);

      if (error.message.includes('not a participant')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching the conversation',
        },
      });
    }
  }
);

/**
 * POST /api/messages/conversations
 * Create a new conversation
 */
router.post(
  '/conversations',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const {
        participant_ids,
        subject,
        property_listing_id,
        demand_listing_id,
        initial_message,
      } = req.body;

      if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'At least one participant is required',
          },
        });
      }

      const result = await messagingController.createConversation(userId, {
        participant_ids,
        subject,
        property_listing_id,
        demand_listing_id,
        initial_message,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Create conversation error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating the conversation',
        },
      });
    }
  }
);

/**
 * GET /api/messages/conversations/:id/messages
 * Get messages in a conversation
 */
router.get(
  '/conversations/:id/messages',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const { limit, before } = req.query;

      const result = await messagingController.getMessages(conversationId, userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        before: before as string,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Get messages error:', error);

      if (error.message.includes('not a participant')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching messages',
        },
      });
    }
  }
);

/**
 * POST /api/messages/conversations/:id/messages
 * Send a message in a conversation
 */
router.post(
  '/conversations/:id/messages',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const { content, attachments } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Message content is required',
          },
        });
      }

      const message = await messagingController.sendMessage(conversationId, userId, {
        content,
        attachments,
      });

      res.status(201).json({
        success: true,
        data: { message },
      });
    } catch (error: any) {
      console.error('Send message error:', error);

      if (error.message.includes('not a participant')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      if (error.message.includes('required')) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while sending the message',
        },
      });
    }
  }
);

/**
 * POST /api/messages/conversations/:id/read
 * Mark a conversation as read
 */
router.post(
  '/conversations/:id/read',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      await messagingController.markConversationAsRead(conversationId, userId);

      res.json({
        success: true,
        message: 'Conversation marked as read',
      });
    } catch (error: any) {
      console.error('Mark as read error:', error);

      if (error.message.includes('not a participant')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while marking the conversation as read',
        },
      });
    }
  }
);

/**
 * GET /api/messages/unread-count
 * Get total unread message count for user
 */
router.get(
  '/unread-count',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const count = await messagingController.getTotalUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error: any) {
      console.error('Get unread count error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching unread count',
        },
      });
    }
  }
);

/**
 * DELETE /api/messages/:id
 * Delete a message (soft delete)
 */
router.delete(
  '/:id',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const messageId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      await messagingController.deleteMessage(messageId, userId);

      res.json({
        success: true,
        message: 'Message deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete message error:', error);

      if (error.message === 'Message not found') {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Message not found',
          },
        });
      }

      if (error.message.includes('only delete your own')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while deleting the message',
        },
      });
    }
  }
);

/**
 * GET /api/messages/search
 * Search messages
 */
router.get(
  '/search',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const { q, limit } = req.query;

      if (!q || (q as string).trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Search query must be at least 2 characters',
          },
        });
      }

      const messages = await messagingController.searchMessages(userId, q as string, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.json({
        success: true,
        data: { messages },
      });
    } catch (error: any) {
      console.error('Search messages error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while searching messages',
        },
      });
    }
  }
);

/**
 * PATCH /api/messages/conversations/:id/mute
 * Mute or unmute a conversation
 */
router.patch(
  '/conversations/:id/mute',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      const { muted } = req.body;

      if (typeof muted !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'muted field must be a boolean',
          },
        });
      }

      await messagingController.setConversationMuted(conversationId, userId, muted);

      res.json({
        success: true,
        message: `Conversation ${muted ? 'muted' : 'unmuted'} successfully`,
      });
    } catch (error: any) {
      console.error('Mute conversation error:', error);

      if (error.message.includes('not a participant')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating conversation mute status',
        },
      });
    }
  }
);

/**
 * POST /api/messages/conversations/:id/leave
 * Leave a conversation
 */
router.post(
  '/conversations/:id/leave',
  roleGuard.authenticate(),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User ID not found in token',
          },
        });
      }

      await messagingController.leaveConversation(conversationId, userId);

      res.json({
        success: true,
        message: 'Left conversation successfully',
      });
    } catch (error: any) {
      console.error('Leave conversation error:', error);

      if (error.message.includes('not a participant')) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        });
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while leaving the conversation',
        },
      });
    }
  }
);

export default router;
