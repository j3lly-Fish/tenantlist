/**
 * Mock messagingWebSocket for Jest tests
 * Avoids import.meta.env issues
 */

export const messagingWebSocket = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  onUnreadUpdate: jest.fn(() => jest.fn()),
  onNewMessage: jest.fn(() => jest.fn()),
  onMessageRead: jest.fn(() => jest.fn()),
  sendMessage: jest.fn(),
  markAsRead: jest.fn(),
};

export default messagingWebSocket;
