export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'it';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export interface UserPreferences {
  darkMode: boolean;
  language: Language;
  fontSize: number; // in px: 12 - 24
  version: number;  // Monotonic Lamport logical clock
  updatedAt: number; // High-resolution timestamp (ms)
  lastModifiedBy: string; // Tab ID of originator
}

export type SyncMessageType =
  | 'PREFERENCES_UPDATE'
  | 'REQUEST_SYNC'
  | 'SYNC_RESPONSE'
  | 'TAB_PING'
  | 'TAB_PONG'
  | 'TAB_DISCONNECT';

export interface SyncMessage {
  type: SyncMessageType;
  payload?: UserPreferences;
  senderId: string;
  sentAt: number; // timestamp for transit latency calculation
}

export type EventLogType =
  | 'local_update'
  | 'remote_sync'
  | 'conflict_resolved'
  | 'tab_joined'
  | 'tab_left'
  | 'system';

export interface SyncEventLog {
  id: string;
  timestamp: Date;
  type: EventLogType;
  message: string;
  latencyMs?: number;
  sourceTab: string;
  details?: string;
}

export interface TabPeer {
  id: string;
  lastSeen: number;
}
