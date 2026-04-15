import { apiRequest } from "@/lib/api/http";
import type { ConversationItem, MessageItem, ParticipantItem } from "@/lib/api/types";

export const messagesApi = {
  getParticipants() {
    return apiRequest<ParticipantItem[]>("/messages/participants");
  },

  getConversations() {
    return apiRequest<ConversationItem[]>("/messages/conversations");
  },

  startConversation(participantId: string) {
    return apiRequest<{
      id: string;
      participantA: string;
      participantB: string;
      createdAt: string;
      lastMessageAt: string | null;
    }>("/messages/conversations", {
      method: "POST",
      body: { participantId },
    });
  },

  getMessages(conversationId: string) {
    return apiRequest<MessageItem[]>(`/messages/conversations/${conversationId}/messages`);
  },

  sendMessage(conversationId: string, content: string) {
    return apiRequest<MessageItem>(`/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { content },
    });
  },

  markMessageRead(messageId: string) {
    return apiRequest<MessageItem>(`/messages/${messageId}/read`, {
      method: "PATCH",
    });
  },

  getUnreadCount() {
    return apiRequest<{ unreadCount: number }>("/messages/unread-count");
  },
};
