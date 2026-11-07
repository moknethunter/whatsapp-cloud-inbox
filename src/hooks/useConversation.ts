'use client';
import { useCallback, useEffect, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Conversation } from '@/lib/types';

export function useConversations(pollMs = 10000) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.getConversations();
      setConversations(data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, pollMs);
    return () => clearInterval(interval);
  }, [load, pollMs]);

  return { conversations, loading, error, refresh: load };
}
