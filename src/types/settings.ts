// ═══════════════════════════════════════════════════════════
// WhatsApp Tenant (from ChatPlatform)
// ═══════════════════════════════════════════════════════════

export type WhatsAppTenant = {
  tenantId: string;
  phoneNumberId: string;
  displayName: string;
  isActive: boolean;
};

// ═══════════════════════════════════════════════════════════
// Inbox preferences (stored per-browser in cookie)
// ═══════════════════════════════════════════════════════════

export type InboxSettings = {
  selectedPhoneNumberIds: string[];
  defaultPhoneNumberId?: string;
};

// ═══════════════════════════════════════════════════════════
// API response shape
// ═══════════════════════════════════════════════════════════

export type InboxSettingsResponse = {
  tenants: WhatsAppTenant[];
  selectedPhoneNumberIds: string[];
  defaultPhoneNumberId?: string;
};
