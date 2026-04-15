'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Filter,
  Loader2,
  MessageSquare,
  Paperclip,
  Search,
  Send,
  UserPlus,
} from 'lucide-react';
import { ApiError, messagesApi } from '@/lib/api';
import type {
  ConversationItem,
  MessageItem,
  ParticipantItem,
  Role,
} from '@/lib/api/types';
import { getStoredToken, getStoredUser } from '@/lib/auth/storage';
import { connectLearnoSocket } from '@/lib/realtime/socket';

interface MessagesCenterProps {
  title: string;
  subtitle: string;
  expectedPeerRole: Role;
}

const formatTime = (isoDate: string): string => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return '--:--';
  }
};

const formatConversationTime = (isoDate?: string | null): string => {
  if (!isoDate) {
    return 'No messages yet';
  }

  try {
    const timestamp = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
    }).format(timestamp);
  } catch {
    return 'Unknown';
  }
};

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
};

const withFallbackArray = <T,>(value: T[] | undefined | null): T[] => value ?? [];

const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const deduped: T[] = [];

  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (seen.has(item.id)) {
      continue;
    }

    seen.add(item.id);
    deduped.push(item);
  }

  deduped.reverse();
  return deduped;
};

export function MessagesCenter({
  title,
  subtitle,
  expectedPeerRole,
}: MessagesCenterProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ReturnType<typeof getStoredUser>>(null);
  const [authResolved, setAuthResolved] = useState(false);

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [participants, setParticipants] = useState<ParticipantItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [participantSearch, setParticipantSearch] = useState('');
  const [showStartConversation, setShowStartConversation] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConversationIdRef = useRef<string | null>(null);
  const socketRef = useRef<ReturnType<typeof connectLearnoSocket> | null>(null);

  useEffect(() => {
    setToken(getStoredToken());
    setUser(getStoredUser());
    setAuthResolved(true);
  }, []);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError(null);

    try {
      const response = await messagesApi.getConversations();
      const sorted = [...response].sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
      const uniqueSorted = dedupeById(sorted);

      setConversations(uniqueSorted);
      if (!selectedConversationIdRef.current && uniqueSorted.length > 0) {
        setSelectedConversationId(uniqueSorted[0].id);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load conversations.');
      }
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const loadParticipants = useCallback(async () => {
    try {
      const response = await messagesApi.getParticipants();
      setParticipants(dedupeById(response));
    } catch {
      setParticipants([]);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string) => {
      if (!user) {
        return;
      }

      setIsLoadingMessages(true);
      setError(null);

      try {
        const response = await messagesApi.getMessages(conversationId);
        const uniqueMessages = dedupeById(response);

        const unreadIds = uniqueMessages
          .filter(
            (message) =>
              message.senderId !== user.id &&
              message.status !== 'READ',
          )
          .map((message) => message.id);

        if (unreadIds.length > 0) {
          await Promise.all(
            unreadIds.map((id) =>
              messagesApi.markMessageRead(id).catch(() => null),
            ),
          );
        }

        setMessages(
          uniqueMessages.map((message) =>
            unreadIds.includes(message.id)
              ? { ...message, status: 'READ' }
              : message,
          ),
        );

        if (unreadIds.length > 0) {
          loadConversations().catch(() => null);
        }
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Failed to load messages.');
        }
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [loadConversations, user],
  );

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    loadConversations().catch(() => null);
    loadParticipants().catch(() => null);
  }, [loadConversations, loadParticipants, token, user]);

  useEffect(() => {
    if (!selectedConversationId || !token || !user) {
      setMessages([]);
      return;
    }

    loadMessages(selectedConversationId).catch(() => null);
  }, [loadMessages, selectedConversationId, token, user]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = connectLearnoSocket(token);
    socketRef.current = socket;

    const onConnect = () => {
      setSocketConnected(true);

      if (selectedConversationIdRef.current) {
        socket.emit('conversation:join', selectedConversationIdRef.current);
      }
    };
    const onDisconnect = () => setSocketConnected(false);

    const onNewMessage = (payload: MessageItem) => {
      setConversations((prev) => {
        const updated = prev.map((conversation) =>
          conversation.id === payload.conversationId
            ? {
                ...conversation,
                lastMessage: payload,
                lastMessageAt: payload.createdAt,
              }
            : conversation,
        );

        return dedupeById(updated);
      });

      if (payload.conversationId !== selectedConversationIdRef.current) {
        loadConversations().catch(() => null);
        return;
      }

      setMessages((prev) => dedupeById([...prev, payload]));

      if (payload.senderId !== user?.id) {
        messagesApi
          .markMessageRead(payload.id)
          .then(() => {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === payload.id
                  ? { ...message, status: 'READ' }
                  : message,
              ),
            );
          })
          .catch(() => null);
      }
    };

    const onMessageNotification = () => {
      loadConversations().catch(() => null);
    };

    const onMessageRead = (payload: {
      messageId: string;
      conversationId: string;
    }) => {
      if (payload.conversationId !== selectedConversationIdRef.current) {
        return;
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.id === payload.messageId
            ? { ...message, status: 'READ' }
            : message,
        ),
      );
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:new', onNewMessage);
    socket.on('message:notification', onMessageNotification);
    socket.on('message:read', onMessageRead);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', onNewMessage);
      socket.off('message:notification', onMessageNotification);
      socket.off('message:read', onMessageRead);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [loadConversations, token, user]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    if (selectedConversationId) {
      socket.emit('conversation:join', selectedConversationId);
    }

    return () => {
      if (selectedConversationId) {
        socket.emit('conversation:leave', selectedConversationId);
      }
    };
  }, [selectedConversationId]);

  const startConversationWith = async (participantId: string) => {
    setIsStartingConversation(true);
    setError(null);

    try {
      const conversation = await messagesApi.startConversation(participantId);
      await loadConversations();
      setSelectedConversationId(conversation.id);
      setShowStartConversation(false);
      setParticipantSearch('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to start a conversation.');
      }
    } finally {
      setIsStartingConversation(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversationId || !messageText.trim()) {
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      const sent = await messagesApi.sendMessage(
        selectedConversationId,
        messageText.trim(),
      );
      setMessages((prev) => dedupeById([...prev, sent]));
      setMessageText('');
      loadConversations().catch(() => null);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to send message.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const uniqueConversations = useMemo(
    () => dedupeById(conversations),
    [conversations],
  );

  const uniqueParticipants = useMemo(
    () => dedupeById(participants),
    [participants],
  );

  const uniqueMessages = useMemo(
    () => dedupeById(messages),
    [messages],
  );

  const selectedConversation = uniqueConversations.find(
    (conversation) => conversation.id === selectedConversationId,
  );

  const filteredConversations = uniqueConversations.filter((conversation) => {
    if (!search.trim()) {
      return true;
    }

    const term = search.trim().toLowerCase();
    return (
      conversation.otherUser.fullName.toLowerCase().includes(term) ||
      (conversation.lastMessage?.content ?? '').toLowerCase().includes(term)
    );
  });

  const filteredParticipants = uniqueParticipants
    .filter((participant) => participant.role === expectedPeerRole)
    .filter((participant) => {
      if (!participantSearch.trim()) {
        return true;
      }

      const term = participantSearch.trim().toLowerCase();
      return (
        participant.fullName.toLowerCase().includes(term) ||
        withFallbackArray(participant.context?.students)
          .join(' ')
          .toLowerCase()
          .includes(term) ||
        withFallbackArray(participant.context?.classes)
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    });

  if (!authResolved) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">Loading messages...</p>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        <p className="mt-2 text-sm text-slate-500">
          You need to sign in first to load real-time messages.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-[#2C3E50]">{title}</h2>
          <p className="text-gray-600 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600">
          <span
            className={`h-2 w-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-amber-500'}`}
          />
          {socketConnected ? 'Realtime connected' : 'Realtime reconnecting'}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-240px)] min-h-[520px]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowStartConversation((value) => !value)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#2563EB] px-3 py-2 text-sm font-medium text-[#2563EB] hover:bg-[#EBF4FF]"
            >
              <UserPlus size={16} />
              Start New Conversation
            </button>

            {showStartConversation ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />
                  <input
                    type="text"
                    value={participantSearch}
                    onChange={(event) => setParticipantSearch(event.target.value)}
                    placeholder={`Search ${expectedPeerRole.toLowerCase()}...`}
                    className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1">
                  {filteredParticipants.length === 0 ? (
                    <p className="rounded-lg bg-white px-3 py-2 text-xs text-gray-500 border border-gray-200">
                      No available participants.
                    </p>
                  ) : null}

                  {filteredParticipants.map((participant) => (
                    <button
                      type="button"
                      key={participant.id}
                      onClick={() => startConversationWith(participant.id)}
                      disabled={isStartingConversation}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:bg-[#EBF4FF] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <p className="text-sm font-medium text-gray-900">{participant.fullName}</p>
                      <p className="text-xs text-gray-500">
                        {withFallbackArray(participant.context?.students).slice(0, 2).join(', ') ||
                          expectedPeerRole}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="p-4 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Loading conversations...
              </div>
            ) : null}

            {!isLoadingConversations && filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={20} className="mx-auto text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No conversations yet.</p>
              </div>
            ) : null}

            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedConversationId(conversation.id)}
                className={`w-full p-4 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-[#EBF4FF]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#EBF4FF] text-[#2563EB] text-sm font-semibold flex items-center justify-center flex-shrink-0">
                    {initials(conversation.otherUser.fullName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {conversation.otherUser.fullName}
                      </h4>
                      {!conversation.lastMessage ||
                      conversation.lastMessage.senderId === user.id ||
                      conversation.lastMessage.status === 'READ' ? null : (
                        <div className="h-2 w-2 rounded-full bg-[#2563EB]" />
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mb-1">{conversation.otherUser.role}</p>
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage?.content ?? 'Start a conversation'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatConversationTime(conversation.lastMessageAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-0">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-[#EBF4FF] text-[#2563EB] text-sm font-semibold flex items-center justify-center flex-shrink-0">
                      {initials(selectedConversation.otherUser.fullName)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {selectedConversation.otherUser.fullName}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {selectedConversation.otherUser.role}
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-50 rounded-lg">
                    <Filter size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Loading messages...
                  </div>
                ) : null}

                {!isLoadingMessages && uniqueMessages.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    This conversation has no messages yet.
                  </div>
                ) : null}

                {uniqueMessages.map((message) => {
                  const ownMessage = message.senderId === user.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${ownMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${ownMessage ? 'order-2' : ''}`}>
                        <div
                          className={`rounded-lg p-4 ${
                            ownMessage
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        <p
                          className={`text-xs text-gray-500 mt-1 ${
                            ownMessage ? 'text-right' : 'text-left'
                          }`}
                        >
                          {formatTime(message.createdAt)}
                          {ownMessage ? ` • ${message.status.toLowerCase()}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="flex items-end gap-3">
                  <button className="p-2 hover:bg-gray-50 rounded-lg" type="button">
                    <Paperclip size={20} className="text-gray-600" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Type your message..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={isSending || !messageText.trim()}
                    className="px-6 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
                  >
                    {isSending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-6 text-center">
              <div>
                <MessageSquare size={28} className="mx-auto text-gray-300" />
                <p className="mt-3 text-sm text-gray-600">
                  Pick a conversation or start a new one.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
