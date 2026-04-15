import { Request, Response } from "express";
import prisma from "../../config/prisma.js";
import { io } from "../../core/socket.js";
import { StartConversationInput, SendMessageInput } from "../../core/validators/schemas.js";

const mapProfileAvatar = (avatarUrl: string | null | undefined) => ({
  avatarUrl: avatarUrl ?? null,
});

const canGuardianMessageSchool = async (
  guardianId: string,
  schoolId: string | null | undefined,
): Promise<boolean> => {
  if (!schoolId) {
    return false;
  }

  const link = await prisma.guardianStudent.findFirst({
    where: {
      guardianId,
      student: {
        schoolId,
      },
    },
    select: { guardianId: true },
  });

  return Boolean(link);
};

// ── GET Conversations ────────────────────────────────
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id; // from authenticate middleware

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participantA: userId }, { participantB: userId }],
      },
      include: {
        userA: { select: { id: true, fullName: true, role: true, profile: { select: { avatarUrl: true } } } },
        userB: { select: { id: true, fullName: true, role: true, profile: { select: { avatarUrl: true } } } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Get latest message
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    const formattedConversations = conversations.map((conv: any) => {
      const isParticipantA = conv.participantA === userId;
      const otherUser = isParticipantA ? conv.userB : conv.userA;
      
      // Determine unread count for this conversation
      // We could optimize this later by fetching unread counts via a group query
      
      return {
        id: conv.id,
        otherUser,
        lastMessage: conv.messages[0] || null,
        lastMessageAt: conv.lastMessageAt,
      };
    });

    res.json(formattedConversations);
  } catch (error) {
    console.error("getConversations error:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// ── POST Start Conversation ──────────────────────────
export const startConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { participantId } = req.body as StartConversationInput;

    if (userId === participantId) {
      res.status(400).json({ message: "You cannot start a conversation with yourself" });
      return;
    }

    // Check if other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: participantId },
      select: {
        id: true,
        role: true,
        schoolId: true,
      },
    });
    if (!otherUser) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Ensure participants are allowed to message each other
    if (req.user!.role !== "SUPER_ADMIN") {
      const sameSchool =
        Boolean(req.user!.schoolId) &&
        Boolean(otherUser.schoolId) &&
        req.user!.schoolId === otherUser.schoolId;

      let guardianLinkedToSchool = false;

      if (!sameSchool) {
        if (req.user!.role === "GUARDIAN") {
          guardianLinkedToSchool = await canGuardianMessageSchool(userId, otherUser.schoolId);
        } else if (otherUser.role === "GUARDIAN") {
          guardianLinkedToSchool = await canGuardianMessageSchool(otherUser.id, req.user!.schoolId);
        }
      }

      if (!sameSchool && !guardianLinkedToSchool) {
        res.status(403).json({ message: "Cross-school messaging is not allowed" });
        return;
      }
    }

    // Sort IDs alphabetically to enforce unique participantA/participantB combinations
    const [participantA, participantB] = [userId, participantId].sort();

    // Upsert conversation to avoid creating duplicate thread
    const conversation = await prisma.conversation.upsert({
      where: {
        participantA_participantB: {
          participantA,
          participantB,
        },
      },
      update: {},
      create: {
        participantA,
        participantB,
      },
    });

    res.status(200).json(conversation);
  } catch (error) {
    console.error("startConversation error:", error);
    res.status(500).json({ message: "Failed to start conversation" });
  }
};

// ── GET Available Participants ───────────────────────
export const getParticipants = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    // Teacher sees guardians linked to students in their classes.
    if (role === "TEACHER") {
      const timetableEntries = await prisma.timetable.findMany({
        where: { teacherId: userId },
        select: {
          classId: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
        },
      });

      if (timetableEntries.length === 0) {
        res.json([]);
        return;
      }

      const classIds = [...new Set(timetableEntries.map((entry) => entry.classId))];
      const subjectsByClassId = new Map<string, Set<string>>();

      timetableEntries.forEach((entry) => {
        if (!subjectsByClassId.has(entry.classId)) {
          subjectsByClassId.set(entry.classId, new Set<string>());
        }

        subjectsByClassId.get(entry.classId)!.add(entry.subject.name);
      });

      const links = await prisma.guardianStudent.findMany({
        where: {
          student: {
            enrollment: {
              classId: {
                in: classIds,
              },
            },
          },
        },
        select: {
          guardian: {
            select: {
              id: true,
              fullName: true,
              role: true,
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
          student: {
            select: {
              fullName: true,
              enrollment: {
                select: {
                  class: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const participantMap = new Map<
        string,
        {
          id: string;
          fullName: string;
          role: string;
          profile: { avatarUrl: string | null };
          context: {
            students: Set<string>;
            classes: Set<string>;
            subjects: Set<string>;
          };
        }
      >();

      links.forEach((link) => {
        const guardian = link.guardian;
        const classInfo = link.student.enrollment?.class;

        if (!participantMap.has(guardian.id)) {
          participantMap.set(guardian.id, {
            id: guardian.id,
            fullName: guardian.fullName,
            role: guardian.role,
            profile: mapProfileAvatar(guardian.profile?.avatarUrl),
            context: {
              students: new Set<string>(),
              classes: new Set<string>(),
              subjects: new Set<string>(),
            },
          });
        }

        const participant = participantMap.get(guardian.id)!;
        participant.context.students.add(link.student.fullName);

        if (classInfo?.name) {
          participant.context.classes.add(classInfo.name);
        }

        if (classInfo?.id) {
          const subjectNames = subjectsByClassId.get(classInfo.id);
          if (subjectNames) {
            subjectNames.forEach((subjectName) => participant.context.subjects.add(subjectName));
          }
        }
      });

      const participants = Array.from(participantMap.values()).map((participant) => ({
        id: participant.id,
        fullName: participant.fullName,
        role: participant.role,
        profile: participant.profile,
        context: {
          students: Array.from(participant.context.students),
          classes: Array.from(participant.context.classes),
          subjects: Array.from(participant.context.subjects),
        },
      }));

      res.json(participants);
      return;
    }

    // Guardian sees teachers linked to the classes of their children.
    if (role === "GUARDIAN") {
      const guardianLinks = await prisma.guardianStudent.findMany({
        where: { guardianId: userId },
        select: {
          student: {
            select: {
              fullName: true,
              enrollment: {
                select: {
                  classId: true,
                  class: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const classIds = guardianLinks
        .map((link) => link.student.enrollment?.classId)
        .filter((classId): classId is string => Boolean(classId));

      if (classIds.length === 0) {
        res.json([]);
        return;
      }

      const studentsByClassId = new Map<string, Set<string>>();
      guardianLinks.forEach((link) => {
        const classId = link.student.enrollment?.classId;
        if (!classId) {
          return;
        }

        if (!studentsByClassId.has(classId)) {
          studentsByClassId.set(classId, new Set<string>());
        }

        studentsByClassId.get(classId)!.add(link.student.fullName);
      });

      const timetableEntries = await prisma.timetable.findMany({
        where: {
          classId: {
            in: [...new Set(classIds)],
          },
        },
        select: {
          classId: true,
          class: {
            select: {
              name: true,
            },
          },
          subject: {
            select: {
              name: true,
            },
          },
          teacher: {
            select: {
              id: true,
              fullName: true,
              role: true,
              profile: {
                select: {
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });

      const participantMap = new Map<
        string,
        {
          id: string;
          fullName: string;
          role: string;
          profile: { avatarUrl: string | null };
          context: {
            students: Set<string>;
            classes: Set<string>;
            subjects: Set<string>;
          };
        }
      >();

      timetableEntries.forEach((entry) => {
        const teacher = entry.teacher;

        if (!participantMap.has(teacher.id)) {
          participantMap.set(teacher.id, {
            id: teacher.id,
            fullName: teacher.fullName,
            role: teacher.role,
            profile: mapProfileAvatar(teacher.profile?.avatarUrl),
            context: {
              students: new Set<string>(),
              classes: new Set<string>(),
              subjects: new Set<string>(),
            },
          });
        }

        const participant = participantMap.get(teacher.id)!;
        participant.context.classes.add(entry.class.name);
        participant.context.subjects.add(entry.subject.name);

        const classStudents = studentsByClassId.get(entry.classId);
        if (classStudents) {
          classStudents.forEach((studentName) => participant.context.students.add(studentName));
        }
      });

      const participants = Array.from(participantMap.values()).map((participant) => ({
        id: participant.id,
        fullName: participant.fullName,
        role: participant.role,
        profile: participant.profile,
        context: {
          students: Array.from(participant.context.students),
          classes: Array.from(participant.context.classes),
          subjects: Array.from(participant.context.subjects),
        },
      }));

      res.json(participants);
      return;
    }

    // Fallback for other roles: same-school users.
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        schoolId: req.user!.schoolId,
      },
      select: {
        id: true,
        fullName: true,
        role: true,
        profile: {
          select: {
            avatarUrl: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    res.json(
      users.map((user) => ({
        ...user,
        profile: mapProfileAvatar(user.profile?.avatarUrl),
        context: {
          students: [],
          classes: [],
          subjects: [],
        },
      })),
    );
  } catch (error) {
    console.error("getParticipants error:", error);
    res.status(500).json({ message: "Failed to fetch participants" });
  }
};

// ── GET Messages in a Conversation ───────────────────
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id as string;

    // Verify user belongs to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || (conversation.participantA !== userId && conversation.participantB !== userId)) {
      res.status(403).json({ message: "You don't have access to this conversation" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// ── POST Send a Message ──────────────────────────────
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const conversationId = req.params.id as string;
    const { content } = req.body as SendMessageInput;

    // Verify user belongs to this conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation || (conversation.participantA !== userId && conversation.participantB !== userId)) {
       res.status(403).json({ message: "You don't have access to this conversation" });
       return;
    }

    const message = await prisma.message.create({
      data: {
        conversationId: conversationId,
        senderId: userId,
        content,
      },
    });

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    // Broadcast the new message via Socket.IO
    if (io) {
      // Broadcast to users in the conversation room
      io.to(`conversation:${conversationId}`).emit("message:new", message);
      
      // We can also notify the other user specifically
      const otherUserId = conversation.participantA === userId ? conversation.participantB : conversation.participantA;
      io.to(`user:${otherUserId}`).emit("message:notification", message);
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// ── PATCH Mark Message Read ──────────────────────────
export const markMessageRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const messageId = req.params.id as string;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      res.status(404).json({ message: "Message not found" });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: message.conversationId },
    });

    // Verify user is in conversation AND is not the sender
    if (
      !conversation ||
      message.senderId === userId ||
      (conversation.participantA !== userId && conversation.participantB !== userId)
    ) {
      res.status(403).json({ message: "Cannot mark this message as read" });
      return;
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { status: "READ" },
    });

    // Notify sender that the message was read
    if (io) {
      io.to(`user:${message.senderId}`).emit("message:read", {
        messageId: updatedMessage.id,
        conversationId: updatedMessage.conversationId,
      });
    }

    res.json(updatedMessage);
  } catch (error) {
    console.error("markMessageRead error:", error);
    res.status(500).json({ message: "Failed to mark message as read" });
  }
};

// ── GET Unread Count ─────────────────────────────────
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Count messages in user's conversations sent by other users with status SENT or DELIVERED
    const unreadCount = await prisma.message.count({
      where: {
        conversation: {
          OR: [{ participantA: userId }, { participantB: userId }],
        },
        senderId: { not: userId },
        status: { in: ["SENT", "DELIVERED"] },
      },
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error("getUnreadCount error:", error);
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
};
