import jwt from "jsonwebtoken";
import { Response } from "express";
import type { JwtPayload } from "../core/middleware/auth.middleware.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
const COOKIE_MAX_AGE_MS = parseInt(process.env.COOKIE_MAX_AGE_MS || "604800000", 10);

if (!JWT_ACCESS_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("FATAL: JWT Secrets are missing from .env");
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN as any });
};

export const generateRefreshToken = (payload: JwtPayload, res: Response): string => {
  const token = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as any });

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: COOKIE_MAX_AGE_MS,
  });

  return token;
};
