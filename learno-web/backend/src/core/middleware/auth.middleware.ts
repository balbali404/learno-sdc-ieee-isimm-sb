import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;

// Payload shape stored in the JWT
export interface JwtPayload {
  id: string;
  role: string;
  schoolId: string;
}

// Extend Express Request so controllers can access req.user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Verify the Bearer token and attach the decoded payload to req.user
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
    return;
  }
};
