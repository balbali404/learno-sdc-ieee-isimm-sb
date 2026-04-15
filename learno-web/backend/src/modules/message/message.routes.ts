import express from "express";
import {
  getConversations,
  getParticipants,
  startConversation,
  getMessages,
  sendMessage,
  markMessageRead,
  getUnreadCount,
} from "./message.controller.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { validate } from "../../core/middleware/validateRequest.js";
import { StartConversationSchema, SendMessageSchema } from "../../core/validators/schemas.js";

const route = express.Router();

// All message routes require authentication
route.use(authenticate);

route.get("/participants", getParticipants);
route.get("/conversations", getConversations);
route.post("/conversations", validate(StartConversationSchema), startConversation);

route.get("/conversations/:id/messages", getMessages);
route.post("/conversations/:id/messages", validate(SendMessageSchema), sendMessage);

route.patch("/:id/read", markMessageRead);
route.get("/unread-count", getUnreadCount);

export default route;
