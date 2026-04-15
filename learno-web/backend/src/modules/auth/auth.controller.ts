import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma.js";
import { generateAccessToken, generateRefreshToken } from "../../utils/generateToken.js";
import { calculateAge } from "../../utils/calculateAge.js";
import type { LoginInput, RegisterGuardianInput } from "../../core/validators/schemas.js";
import type { JwtPayload } from "../../core/middleware/auth.middleware.js";

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "12", 10);

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const normalizeFullName = (fullName: string): string => fullName.trim().replace(/\s+/g, " ");

// ── POST /auth/login ───────────────────────────────
// Login with email/password and infer role from user record
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as LoginInput;
    const normalizedEmail = normalizeEmail(email);

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const payload: JwtPayload = { id: user.id, role: user.role, schoolId: user.schoolId || "" };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload, res);

    // Store hashed refresh token in DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    res.json({
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/register (Guardian self-registration) ──
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, password } = req.body as RegisterGuardianInput;
    const normalizedEmail = normalizeEmail(email);
    const normalizedFullName = normalizeFullName(fullName);

    if (normalizedFullName.length < 2) {
      res.status(400).json({ message: "Full name must be at least 2 characters." });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      res.status(409).json({ message: "Email already in use." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        fullName: normalizedFullName,
        email: normalizedEmail,
        password: hashedPassword,
        role: "GUARDIAN",
      },
    });

    const payload: JwtPayload = { id: user.id, role: user.role, schoolId: user.schoolId || "" };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload, res);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/refresh-token ───────────────────────
export const refreshTokenHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      res.status(401).json({ message: "No refresh token provided." });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      res.status(401).json({ message: "Invalid or expired refresh token." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.refreshToken) {
      res.status(401).json({ message: "Refresh token revoked or user not found." });
      return;
    }

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) {
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      res.status(401).json({ message: "Refresh token reuse detected. All sessions revoked." });
      return;
    }

    // Rotate tokens
    const payload: JwtPayload = { id: user.id, role: user.role, schoolId: user.schoolId || "" };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload, res);

    const hashedRefreshToken = await bcrypt.hash(newRefreshToken, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

// ── POST /auth/logout ──────────────────────────────
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { refreshToken: null },
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
};

// ── GET /auth/me ───────────────────────────────────
export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        dateOfBirth: true,
        schoolId: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
        profile: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Calculate age from dateOfBirth
    const age = calculateAge(user.dateOfBirth);

    res.json({ user: { ...user, age } });
  } catch (err) {
    next(err);
  }
};

// ── GET /auth/notifications ─────────────────────────
export const getMyNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const unreadOnly = req.query.unreadOnly === "true";
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(100, Math.floor(limitRaw))) : 25;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId: req.user!.id,
          ...(unreadOnly ? { read: false } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId: req.user!.id,
          read: false,
        },
      }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /auth/notifications/:id/read ──────────────
export const markMyNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationId = req.params.id as string;

    const updated = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: req.user!.id,
      },
      data: {
        read: true,
      },
    });

    if (updated.count === 0) {
      res.status(404).json({ message: "Notification not found." });
      return;
    }

    res.json({ success: true, notificationId });
  } catch (err) {
    next(err);
  }
};

// ── PUT /auth/profile ─────────────────────────────
// Update the authenticated user's profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, dateOfBirth, avatarUrl, phone, bio } = req.body;
    const userId = req.user!.id;

    // Update user's fullName and dateOfBirth if provided
    const userData: { fullName?: string; dateOfBirth?: Date | null } = {};
    if (fullName) userData.fullName = fullName;
    if (dateOfBirth !== undefined) {
      userData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    // Update or create profile data (avatarUrl, phone, bio)
    const profileData: { avatarUrl?: string | null; phone?: string | null; bio?: string | null } = {};
    if (avatarUrl !== undefined) profileData.avatarUrl = avatarUrl;
    if (phone !== undefined) profileData.phone = phone;
    if (bio !== undefined) profileData.bio = bio;

    if (Object.keys(profileData).length > 0) {
      await prisma.userProfile.upsert({
        where: { userId },
        update: profileData,
        create: { userId, ...profileData },
      });
    }

    // Fetch updated user with profile
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        dateOfBirth: true,
        schoolId: true,
        createdAt: true,
        school: { select: { id: true, name: true } },
        profile: true,
      },
    });

    // Calculate age from dateOfBirth
    const age = updatedUser ? calculateAge(updatedUser.dateOfBirth) : null;

    res.json({ message: "Profile updated successfully.", user: updatedUser ? { ...updatedUser, age } : null });
  } catch (err) {
    next(err);
  }
};

// ── PUT /auth/password ────────────────────────────
// Change the authenticated user's password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Current password is incorrect." });
      return;
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword, refreshToken: null },
    });

    // Clear refresh token cookie to force re-login
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Password changed successfully. Please log in again." });
  } catch (err) {
    next(err);
  }
};
