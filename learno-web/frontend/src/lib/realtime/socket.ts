import { io, type Socket } from "socket.io-client";
import { SOCKET_BASE_URL } from "@/lib/config";

export const connectLearnoSocket = (token: string): Socket => {
  return io(SOCKET_BASE_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });
};
