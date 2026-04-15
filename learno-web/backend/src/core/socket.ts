import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;

// Payload shape from auth.middleware.ts
interface JwtPayload {
  id: string;
  role: string;
  schoolId: string;
}

export let io: Server;

export const initSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware for Socket.IO
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers["authorization"]?.replace("Bearer ", "");
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
      // Attach user to socket
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    console.log(`🔌 Socket connected: User ${user.id} (${user.role})`);

    // Let user join their own private room for direct events
    socket.join(`user:${user.id}`);

    // Join a conversation room
    socket.on("conversation:join", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${user.id} joined conversation: ${conversationId}`);
    });

    // Leave a conversation room
    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${user.id} left conversation: ${conversationId}`);
    });

    socket.on("class:join", async (classId: string) => {
      if (!classId) {
        return;
      }
      try {
        const row = await prisma.class.findUnique({
          where: { id: classId },
          select: { schoolId: true },
        });

        if (row && row.schoolId === user.schoolId) {
          socket.join(`class:${classId}`);
          console.log(`User ${user.id} joined class: ${classId}`);
        }
      } catch (err) {
        console.error("class:join error:", err);
      }
    });

    socket.on("class:leave", (classId: string) => {
      if (!classId) {
        return;
      }
      socket.leave(`class:${classId}`);
    });

    socket.on("session:join", async (sessionId: string) => {
      if (!sessionId) {
        return;
      }
      try {
        const session = await prisma.session.findUnique({
          where: { id: sessionId },
          select: {
            id: true,
            teacherId: true,
            class: { select: { schoolId: true } },
          },
        });

        if (session && session.class?.schoolId === user.schoolId) {
          socket.join(`session:${sessionId}`);
          console.log(`User ${user.id} joined session: ${sessionId}`);
        }
      } catch (err) {
        console.error("session:join error:", err);
      }
    });

    socket.on("session:leave", (sessionId: string) => {
      if (!sessionId) {
        return;
      }
      socket.leave(`session:${sessionId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: User ${user.id}`);
    });
  });

  return io;
};
