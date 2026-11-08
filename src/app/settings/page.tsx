'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Check, Loader2, RefreshCw, Save, Settings, Smartphone,
} from 'lucide-react';
import { CONVERSATIONS_QUERY_KEY } from '@/lib/inbox-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { InboxSettingsResponse, WhatsAppTenant } from '@/types/settings';

const SETTINGS_QUERY_KEY = ['inbox-settings'] as const;

async function fetchInboxSettings(): Promise<InboxSettingsResponse> {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to load settings');
  return res.json();
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [defaultId, setDefaultId] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchInboxSettings,
  });

  useEffect(() => {
    if (!data || dirty) return;
    setSelectedIds(data.selectedPhoneNumberIds);
    setDefaultId(data.defaultPhoneNumberId);
  }, [data, dirty]);

  const tenants = useMemo(() => data?.tenants ?? [], [data?.tenants]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const toggle = (id: string) => {
    setMessage(null);
    setError(null);
    setDirty(true);
    setSelectedIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((x) => x !== id) : [...prev, id];
      setDefaultId((cur) => (!next.length ? undefined : !cur || (cur === id && exists) ? next[0] : cur));
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedPhoneNumberIds: selectedIds, defaultPhoneNumberId: defaultId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to save');
      queryClient.setQueryData(SETTINGS_QUERY_KEY, payload);
      await queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      setDirty(false);
      setMessage('Saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-dvh min-h-dvh overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-[var(--chat-border-strong)] bg-[var(--chat-toolbar)] px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Button asChild variant="ghost" size="icon" className="size-10 rounded-md">
              <Link href="/"><ArrowLeft className="size-4" /></Link>
            </Button>
            <Settings className="size-4 text-[var(--chat-presence)]" />
            <h1 className="truncate text-base font-semibold">Inbox settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching || saving} className="h-10 rounded-md">
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button onClick={handleSave} disabled={!dirty || saving} className="h-10 rounded-md">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              <span>Save</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Connected WhatsApp numbers</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedIds.length} selected{tenants.length ? ` of ${tenants.length}` : ''}
            </p>
          </div>
          {message && (
            <span className="inline-flex items-center gap-1.5 text-sm text-[var(--chat-presence)]">
              <Check className="size-3.5" /> {message}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {isPending ? (
          <div className="flex h-60 items-center justify-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="rounded-md border border-[var(--chat-border-strong)] bg-[var(--chat-surface)] px-4 py-8 text-center text-sm text-muted-foreground">
            No WhatsApp numbers connected yet. Use the &quot;Connect with Meta&quot; button to add one.
          </div>
        ) : (
          <div className="space-y-2 pb-8">
            {tenants.map((t: WhatsAppTenant) => {
              const selected = selectedSet.has(t.phoneNumberId);
              const isDefault = defaultId === t.phoneNumberId;
              return (
                <div key={t.phoneNumberId} className={cn(
                  'grid gap-3 rounded-md border border-[var(--chat-border-strong)] bg-[var(--chat-surface)] p-3 sm:grid-cols-[minmax(0,1fr)_auto]',
                  selected && 'border-primary/50 bg-primary/5',
                )}>
                  <label className="flex min-w-0 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggle(t.phoneNumberId)}
                      className="mt-1 size-4 rounded accent-primary"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="truncate text-sm font-semibold">{t.displayName}</span>
                      <span className="mt-1 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                        <Smartphone className="size-3.5" />
                        <span className="font-mono">{t.phoneNumberId}</span>
                      </span>
                    </span>
                  </label>
                  <label className={cn(
                    'inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-[var(--chat-border-strong)] px-3 text-xs font-medium',
                    isDefault && 'border-primary/50 bg-primary/10',
                    !selected && 'cursor-not-allowed opacity-50',
                  )}>
                    <input
                      type="radio"
                      name="defaultPhoneNumberId"
                      checked={isDefault}
                      disabled={!selected}
                      onChange={() => { setDirty(true); setDefaultId(t.phoneNumberId); }}
                      className="size-3.5 accent-primary"
                    />
                    Default
                  </label>
                </div>
              );
            })}
            <Separator />
          </div>
        )}
      </main>
    </div>
  );
}
