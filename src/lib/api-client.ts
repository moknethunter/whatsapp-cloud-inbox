import type {
  Conversation,
  Message,
  SendTextPayload,
  SendTextResponse,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });

  if (!res.ok) {
    let body: unknown = null;
    try { body = await res.json(); } catch { /* ignore */ }
    throw new ApiError(res.status, `HTTP ${res.status}: ${res.statusText}`, body);
  }
  return res.status === 204 ? (undefined as T) : (res.json() as Promise<T>);
}

export const apiClient = {
  getConversations: (): Promise<Conversation[]> =>
    http<Conversation[]>('/api/conversations'),

  getMessages: (conversationId: string, take = 100): Promise<Message[]> =>
    http<Message[]>(`/api/conversations/${conversationId}/messages?take=${take}`),

  sendText: (payload: SendTextPayload): Promise<SendTextResponse> =>
    http<SendTextResponse>('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
