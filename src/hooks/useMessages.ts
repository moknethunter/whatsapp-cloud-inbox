'use client';
import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Message } from '@/lib/types';

export function useMessages(conversationId: string | null, pollMs = 5000) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!conversationId) { setMessages([]); return; }
    try {
      const data = await apiClient.getMessages(conversationId);
      setMessages(data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) { setMessages([]); return; }
    setLoading(true);
    load();
    const interval = setInterval(load, pollMs);
    return () => clearInterval(interval);
  }, [conversationId, load, pollMs]);

  return { messages, loading, error, refresh: load };
}
