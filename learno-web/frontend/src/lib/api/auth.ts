import { apiRequest } from "@/lib/api/http";
import type { BasicUser, NotificationItem } from "@/lib/api/types";
import {
  clearStoredAuth,
  setStoredToken,
  setStoredUser,
  type StoredUser,
} from "@/lib/auth/storage";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: BasicUser;
}

export interface MeResponse {
  user: BasicUser & {
    dateOfBirth?: string | null;
    createdAt?: string;
    school?: { id: string; name: string } | null;
    profile?: {
      avatarUrl: string | null;
      phone?: string | null;
      bio?: string | null;
    } | null;
    age?: number | null;
  };
}

export interface UpdateAuthProfileInput {
  fullName?: string;
  dateOfBirth?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  bio?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface GetMyNotificationsQuery {
  unreadOnly?: boolean;
  limit?: number;
}

type NotificationQueryParams = {
  unreadOnly?: boolean;
  limit?: number;
};

const persistAuth = (auth: AuthResponse) => {
  const normalizedUser: StoredUser = {
    id: auth.user.id,
    fullName: auth.user.fullName,
    email: auth.user.email ?? "",
    role: auth.user.role,
    schoolId: auth.user.schoolId ?? null,
  };

  setStoredToken(auth.accessToken);
  setStoredUser(normalizedUser);
};

export const authApi = {
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: input,
    });

    persistAuth(response);
    return response;
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      auth: false,
      body: input,
    });

    persistAuth(response);
    return response;
  },

  async refreshToken(): Promise<{ accessToken: string }> {
    const response = await apiRequest<{ accessToken: string }>("/auth/refresh-token", {
      method: "POST",
      auth: false,
    });

    setStoredToken(response.accessToken);
    return response;
  },

  async logout(): Promise<{ message: string }> {
    try {
      const response = await apiRequest<{ message: string }>("/auth/logout", {
        method: "POST",
      });
      return response;
    } finally {
      clearStoredAuth();
    }
  },

  me() {
    return apiRequest<MeResponse>("/auth/me");
  },

  getMyNotifications(query?: GetMyNotificationsQuery) {
    return apiRequest<{ notifications: NotificationItem[]; unreadCount: number }>("/auth/notifications", {
      query: query as NotificationQueryParams | undefined,
    });
  },

  markMyNotificationRead(notificationId: string) {
    return apiRequest<{ success: boolean; notificationId: string }>(`/auth/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
  },

  updateProfile(input: UpdateAuthProfileInput) {
    return apiRequest<{ message: string; user: MeResponse["user"] }>("/auth/profile", {
      method: "PUT",
      body: input,
    });
  },

  changePassword(input: ChangePasswordInput) {
    return apiRequest<{ message: string }>("/auth/password", {
      method: "PUT",
      body: input,
    });
  },
};
