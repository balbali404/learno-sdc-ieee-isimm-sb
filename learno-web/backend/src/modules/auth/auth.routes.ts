import express from "express";
import {
  login,
  register,
  refreshTokenHandler,
  logout,
  me,
  updateProfile,
  changePassword,
  getMyNotifications,
  markMyNotificationRead,
} from "./auth.controller.js";
import { validate } from "../../core/middleware/validateRequest.js";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { LoginSchema, RegisterGuardianSchema, UpdateProfileSchema } from "../../core/validators/schemas.js";

const route = express.Router();

// Public routes
route.post("/login", validate(LoginSchema), login);
route.post("/register", validate(RegisterGuardianSchema), register);
route.post("/refresh-token", refreshTokenHandler);

// Authenticated routes
route.post("/logout", authenticate, logout);
route.get("/me", authenticate, me);
route.get("/notifications", authenticate, getMyNotifications);
route.patch("/notifications/:id/read", authenticate, markMyNotificationRead);

// Profile management - each user manages their own profile
route.put("/profile", authenticate, validate(UpdateProfileSchema), updateProfile);
route.put("/password", authenticate, changePassword);

export default route;
