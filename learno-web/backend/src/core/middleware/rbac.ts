import { Request, Response, NextFunction } from "express";

// ── Middleware: Check Role ───────────────────────────
/**
 * Allow only if the user has one of the allowed roles.
 * Usage: checkRole("SUPER_ADMIN", "SCHOOL_ADMIN")
 */
export const checkRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated." });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden. Insufficient role." });
      return;
    }

    next();
  };
};

// ── Middleware: Same School Only ─────────────────────
/**
 * Ensures user belongs to the same school as the target resource.
 * SUPER_ADMIN bypasses this check.
 * Reads schoolId from req.params.schoolId or req.body.schoolId
 */
export const sameSchoolOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role === "SUPER_ADMIN") {
    next();
    return;
  }

  const targetSchoolId = req.params.schoolId || req.body.schoolId;

  if (targetSchoolId && targetSchoolId !== req.user.schoolId) {
    res.status(403).json({ message: "Forbidden. Cross-school access denied." });
    return;
  }

  next();
};
