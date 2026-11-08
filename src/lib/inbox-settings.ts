import { cookies } from 'next/headers';
import type {
  InboxSettings,
  InboxSettingsResponse,
  WhatsAppTenant,
} from '@/types/settings';

export const INBOX_SETTINGS_COOKIE = 'whatsapp-cloud-inbox-settings';

const CHATPLATFORM_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════
// Fetch tenants from ChatPlatform
// ═══════════════════════════════════════════════════════════

export async function fetchTenants(): Promise<WhatsAppTenant[]> {
  const res = await fetch(`${CHATPLATFORM_BASE}/api/whatsapp/tenants`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch tenants: HTTP ${res.status}`);
  }
  const data = (await res.json()) as WhatsAppTenant[];
  return Array.isArray(data) ? data : [];
}

// ═══════════════════════════════════════════════════════════
// Cookie management
// ═══════════════════════════════════════════════════════════

function uniqueIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  return Array.from(
    new Set(
      ids
        .filter((id): id is string => typeof id === 'string')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

export function serializeInboxSettings(settings: InboxSettings): string {
  return encodeURIComponent(JSON.stringify(settings));
}

export function parseInboxSettingsCookie(value?: string): InboxSettings | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<InboxSettings>;
    const selectedPhoneNumberIds = uniqueIds(parsed.selectedPhoneNumberIds);
    const defaultPhoneNumberId =
      typeof parsed.defaultPhoneNumberId === 'string' &&
      parsed.defaultPhoneNumberId.trim()
        ? parsed.defaultPhoneNumberId.trim()
        : undefined;
    return {
      selectedPhoneNumberIds,
      ...(defaultPhoneNumberId ? { defaultPhoneNumberId } : {}),
    };
  } catch {
    return null;
  }
}

export async function readStoredInboxSettings(): Promise<InboxSettings | null> {
  const store = await cookies();
  return parseInboxSettingsCookie(store.get(INBOX_SETTINGS_COOKIE)?.value);
}

export async function writeStoredInboxSettings(settings: InboxSettings): Promise<void> {
  const store = await cookies();
  store.set(INBOX_SETTINGS_COOKIE, serializeInboxSettings(settings), {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // سنة
    path: '/',
  });
}

// ═══════════════════════════════════════════════════════════
// Merge tenants + stored preferences
// ═══════════════════════════════════════════════════════════

export async function getInboxSettings(): Promise<InboxSettingsResponse> {
  const [tenants, stored] = await Promise.all([
    fetchTenants(),
    readStoredInboxSettings(),
  ]);

  const availableIds = new Set(tenants.map((t) => t.phoneNumberId));

  const selectedPhoneNumberIds = stored
    ? stored.selectedPhoneNumberIds.filter((id) => availableIds.has(id))
    : tenants.filter((t) => t.isActive).map((t) => t.phoneNumberId);

  const requestedDefault = stored?.defaultPhoneNumberId;
  const defaultPhoneNumberId =
    requestedDefault && selectedPhoneNumberIds.includes(requestedDefault)
      ? requestedDefault
      : selectedPhoneNumberIds[0];

  return {
    tenants,
    selectedPhoneNumberIds,
    ...(defaultPhoneNumberId ? { defaultPhoneNumberId } : {}),
  };
}

export async function saveInboxSettings(input: {
  selectedPhoneNumberIds: string[];
  defaultPhoneNumberId?: string;
}): Promise<InboxSettingsResponse> {
  const tenants = await fetchTenants();
  const availableIds = new Set(tenants.map((t) => t.phoneNumberId));

  const selectedPhoneNumberIds = uniqueIds(input.selectedPhoneNumberIds).filter(
    (id) => availableIds.has(id),
  );

  const defaultPhoneNumberId =
    input.defaultPhoneNumberId && selectedPhoneNumberIds.includes(input.defaultPhoneNumberId)
      ? input.defaultPhoneNumberId
      : selectedPhoneNumberIds[0];

  const settings: InboxSettings = {
    selectedPhoneNumberIds,
    ...(defaultPhoneNumberId ? { defaultPhoneNumberId } : {}),
  };

  await writeStoredInboxSettings(settings);

  return {
    tenants,
    selectedPhoneNumberIds,
    ...(defaultPhoneNumberId ? { defaultPhoneNumberId } : {}),
  };
}
