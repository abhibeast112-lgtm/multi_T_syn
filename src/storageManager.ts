import type { UserPreferences, SyncMessage, SyncEventLog, EventLogType } from './types.ts';

const STORAGE_KEY = 'app_user_preferences_v2';
const LEGACY_STORAGE_KEY = 'app_user_preferences_v1';
const CHANNEL_NAME = 'app_settings_sync_channel_v2';

export const DEFAULT_PREFERENCES: UserPreferences = {
  darkMode: false,
  language: 'en',
  fontSize: 16,
  version: 1,
  updatedAt: Date.now(),
  lastModifiedBy: 'init',
};

export class SettingsManager {
  public readonly tabId: string;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(prefs: UserPreferences) => void> = new Set();
  private logListeners: Set<(logs: SyncEventLog[]) => void> = new Set();
  private peerListeners: Set<(count: number, peers: string[]) => void> = new Set();
  private latencyListeners: Set<(latencyMs: number) => void> = new Set();

  private currentPreferences: UserPreferences;
  private logs: SyncEventLog[] = [];
  private activePeers: Map<string, number> = new Map();
  private pingInterval: number | null = null;
  private pruneInterval: number | null = null;

  constructor() {
    this.tabId = this.generateTabId();
    this.currentPreferences = this.loadFromStorage();
    this.initBroadcastChannel();
    this.setupStorageFallback();
    this.setupPresence();
    this.applyToDOM(this.currentPreferences);

    this.addLog(
      'system',
      `Tab initialized (ID: ${this.tabId})`,
      this.tabId,
      `Loaded preferences: ${this.currentPreferences.darkMode ? 'Dark' : 'Light'} | ${this.currentPreferences.language} | ${this.currentPreferences.fontSize}px (v${this.currentPreferences.version})`
    );

    // Announce presence and request latest state from existing tabs
    this.broadcastSyncRequest();
    this.sendPing();
  }

  private generateTabId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `tab-${id}`;
  }

  public loadFromStorage(): UserPreferences {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            darkMode: typeof parsed.darkMode === 'boolean' ? parsed.darkMode : false,
            language: parsed.language || 'en',
            fontSize: typeof parsed.fontSize === 'number' ? parsed.fontSize : 16,
            version: typeof parsed.version === 'number' ? parsed.version : 1,
            updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
            lastModifiedBy: parsed.lastModifiedBy || 'storage',
          };
        }
      }
    } catch (e) {
      console.warn('Failed to read from localStorage', e);
    }
    return { ...DEFAULT_PREFERENCES, updatedAt: Date.now() };
  }

  public getPreferences(): UserPreferences {
    return { ...this.currentPreferences };
  }

  public getLogs(): SyncEventLog[] {
    return [...this.logs];
  }

  public getActivePeerCount(): number {
    return this.activePeers.size + 1; // + 1 for self
  }

  public getActivePeerIds(): string[] {
    return Array.from(this.activePeers.keys());
  }

  public clearLogs() {
    this.logs = [];
    this.notifyLogListeners();
  }

  /**
   * Updates user preferences locally and broadcasts to all other open tabs.
   */
  public updatePreferences(partial: Partial<Pick<UserPreferences, 'darkMode' | 'language' | 'fontSize'>>) {
    const nextVersion = this.currentPreferences.version + 1;
    const now = Date.now();

    const updated: UserPreferences = {
      ...this.currentPreferences,
      ...partial,
      version: nextVersion,
      updatedAt: now,
      lastModifiedBy: this.tabId,
    };

    const changes = Object.entries(partial)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    this.currentPreferences = updated;
    this.saveToStorage(updated);
    this.applyToDOM(updated);
    this.notifyListeners();

    this.addLog(
      'local_update',
      `Locally updated [${changes}] (v${nextVersion})`,
      this.tabId
    );

    this.postMessage({
      type: 'PREFERENCES_UPDATE',
      payload: updated,
      senderId: this.tabId,
      sentAt: Date.now(),
    });
  }

  /**
   * Reset all settings to defaults deterministically across tabs.
   */
  public resetPreferences() {
    const nextVersion = this.currentPreferences.version + 1;
    const resetPrefs: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      version: nextVersion,
      updatedAt: Date.now(),
      lastModifiedBy: this.tabId,
    };

    this.currentPreferences = resetPrefs;
    this.saveToStorage(resetPrefs);
    this.applyToDOM(resetPrefs);
    this.notifyListeners();

    this.addLog('local_update', `Preferences reset to defaults (v${nextVersion})`, this.tabId);

    this.postMessage({
      type: 'PREFERENCES_UPDATE',
      payload: resetPrefs,
      senderId: this.tabId,
      sentAt: Date.now(),
    });
  }

  /**
   * Simulates a concurrent race condition from a virtual peer tab
   * to demonstrate deterministic conflict resolution.
   */
  public simulateConflict() {
    const virtualTabId = `tab-sim-${Math.random().toString(36).substring(2, 6)}`;
    const currentVer = this.currentPreferences.version;
    const currentTimestamp = Date.now();

    // Create a simulated concurrent update with identical version & timestamp
    // but inverted dark mode or different font size
    const syntheticPrefs: UserPreferences = {
      ...this.currentPreferences,
      darkMode: !this.currentPreferences.darkMode,
      fontSize: this.currentPreferences.fontSize === 16 ? 18 : 16,
      version: currentVer, // Concurrent race with same logical version!
      updatedAt: currentTimestamp,
      lastModifiedBy: virtualTabId,
    };

    this.addLog(
      'system',
      `Race condition injected: concurrent write from '${virtualTabId}' with identical version (${currentVer})`,
      virtualTabId
    );

    // Evaluate using deterministic ordering
    this.handleIncomingPreferences(syntheticPrefs, virtualTabId, 1);
  }

  /**
   * Deterministic total ordering function (Lamport version > High-res timestamp > Tab ID).
   */
  public evaluateOrder(
    incoming: UserPreferences,
    current: UserPreferences
  ): { incomingWins: boolean; conflictResolved: boolean; reason: string } {
    // 1. Lamport Logical Clock / Version check
    if (incoming.version > current.version) {
      return {
        incomingWins: true,
        conflictResolved: false,
        reason: `Higher logical version (v${incoming.version} > v${current.version})`,
      };
    }
    if (incoming.version < current.version) {
      return {
        incomingWins: false,
        conflictResolved: false,
        reason: `Obsolete logical version (v${incoming.version} < v${current.version})`,
      };
    }

    // 2. High-precision wall timestamp tie-breaker
    if (incoming.updatedAt > current.updatedAt) {
      return {
        incomingWins: true,
        conflictResolved: true,
        reason: `Equal version (v${incoming.version}): won via timestamp (${incoming.updatedAt} > ${current.updatedAt})`,
      };
    }
    if (incoming.updatedAt < current.updatedAt) {
      return {
        incomingWins: false,
        conflictResolved: true,
        reason: `Equal version (v${incoming.version}): lost via timestamp (${incoming.updatedAt} < ${current.updatedAt})`,
      };
    }

    // 3. Strict lexicographical Tab ID tie-breaker (mathematical determinism)
    if (incoming.lastModifiedBy > current.lastModifiedBy) {
      return {
        incomingWins: true,
        conflictResolved: true,
        reason: `Deterministic tie-breaker: Tab ID '${incoming.lastModifiedBy}' > '${current.lastModifiedBy}'`,
      };
    }

    return {
      incomingWins: false,
      conflictResolved: true,
      reason: `Deterministic tie-breaker: Tab ID '${incoming.lastModifiedBy}' <= '${current.lastModifiedBy}'`,
    };
  }

  private handleIncomingPreferences(incoming: UserPreferences, senderId: string, latencyMs?: number) {
    const evaluation = this.evaluateOrder(incoming, this.currentPreferences);

    if (evaluation.incomingWins) {
      this.currentPreferences = incoming;
      this.saveToStorage(incoming);
      this.applyToDOM(incoming);
      this.notifyListeners();

      if (evaluation.conflictResolved) {
        this.addLog(
          'conflict_resolved',
          `Conflict resolved: accepted update from ${senderId}. [${evaluation.reason}]`,
          senderId,
          `New State: ${incoming.darkMode ? 'Dark' : 'Light'} | ${incoming.language} | ${incoming.fontSize}px (v${incoming.version})`,
          latencyMs
        );
      } else {
        this.addLog(
          'remote_sync',
          `Synchronized from ${senderId} in ${latencyMs ?? '<5'}ms (v${incoming.version})`,
          senderId,
          `${incoming.darkMode ? 'Dark' : 'Light'} | ${incoming.language} | ${incoming.fontSize}px`,
          latencyMs
        );
      }
    } else {
      if (evaluation.conflictResolved) {
        this.addLog(
          'conflict_resolved',
          `Conflict resolved: rejected incoming update from ${senderId}. [${evaluation.reason}]`,
          senderId,
          `Retained State: ${this.currentPreferences.darkMode ? 'Dark' : 'Light'} | v${this.currentPreferences.version}`,
          latencyMs
        );
      }
    }
  }

  private initBroadcastChannel() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
          this.handleChannelMessage(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization failed, relying on storage events', e);
      }
    }
  }

  private handleChannelMessage(message: SyncMessage) {
    if (!message || message.senderId === this.tabId) return;

    const now = Date.now();
    const latency = message.sentAt ? Math.max(0, now - message.sentAt) : 0;
    this.notifyLatency(latency);

    // Track peer tab
    this.recordPeer(message.senderId);

    switch (message.type) {
      case 'PREFERENCES_UPDATE':
      case 'SYNC_RESPONSE':
        if (message.payload) {
          this.handleIncomingPreferences(message.payload, message.senderId, latency);
        }
        break;

      case 'REQUEST_SYNC':
        // A newly opened tab is requesting the latest preferences
        this.postMessage({
          type: 'SYNC_RESPONSE',
          payload: this.currentPreferences,
          senderId: this.tabId,
          sentAt: Date.now(),
        });
        break;

      case 'TAB_PING':
        // Respond with PONG to register presence
        this.postMessage({
          type: 'TAB_PONG',
          senderId: this.tabId,
          sentAt: Date.now(),
        });
        break;

      case 'TAB_PONG':
        // Peer registered
        break;

      case 'TAB_DISCONNECT':
        this.removePeer(message.senderId);
        break;
    }
  }

  private setupStorageFallback() {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (event) => {
      if ((event.key === STORAGE_KEY || event.key === LEGACY_STORAGE_KEY) && event.newValue) {
        try {
          const parsed: UserPreferences = JSON.parse(event.newValue);
          // If BroadcastChannel already processed it, evaluateOrder will safely drop obsolete versions
          this.handleIncomingPreferences(parsed, parsed.lastModifiedBy || 'storage-event');
        } catch (e) {
          console.error('Failed to parse storage event data', e);
        }
      }
    });
  }

  private setupPresence() {
    if (typeof window === 'undefined') return;
    // Send periodic ping to track open tabs
    this.pingInterval = window.setInterval(() => {
      this.sendPing();
    }, 4000);
    if (typeof (this.pingInterval as any)?.unref === 'function') {
      (this.pingInterval as any).unref();
    }

    // Clean up stale tabs (tabs inactive > 10s)
    this.pruneInterval = window.setInterval(() => {
      const now = Date.now();
      let changed = false;
      for (const [peerId, lastSeen] of this.activePeers.entries()) {
        if (now - lastSeen > 9000) {
          this.activePeers.delete(peerId);
          changed = true;
          this.addLog('tab_left', `Companion tab '${peerId}' closed or timed out`, peerId);
        }
      }
      if (changed) {
        this.notifyPeers();
      }
    }, 4000);
    if (typeof (this.pruneInterval as any)?.unref === 'function') {
      (this.pruneInterval as any).unref();
    }

    // Disconnect announcement when closing tab
    const handleUnload = () => {
      try {
        this.postMessage({
          type: 'TAB_DISCONNECT',
          senderId: this.tabId,
          sentAt: Date.now(),
        });
      } catch (e) {}
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
  }

  private sendPing() {
    this.postMessage({
      type: 'TAB_PING',
      senderId: this.tabId,
      sentAt: Date.now(),
    });
  }

  private recordPeer(peerId: string) {
    const isNew = !this.activePeers.has(peerId);
    this.activePeers.set(peerId, Date.now());
    if (isNew) {
      this.addLog('tab_joined', `Connected to companion tab '${peerId}'`, peerId);
      this.notifyPeers();
    }
  }

  private removePeer(peerId: string) {
    if (this.activePeers.has(peerId)) {
      this.activePeers.delete(peerId);
      this.addLog('tab_left', `Companion tab '${peerId}' closed`, peerId);
      this.notifyPeers();
    }
  }

  private postMessage(msg: SyncMessage) {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.warn('BroadcastChannel postMessage failed', e);
      }
    }
  }

  private broadcastSyncRequest() {
    this.postMessage({
      type: 'REQUEST_SYNC',
      senderId: this.tabId,
      sentAt: Date.now(),
    });
  }

  private saveToStorage(prefs: UserPreferences) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }

  /**
   * Applies preferences directly to DOM without flashing or layout glitches.
   */
  public applyToDOM(prefs: UserPreferences) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (!root) return;
    const isDark = prefs.darkMode;

    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (isDark) {
      root.classList.add('dark', 'dark-theme');
      if (document.body) document.body.classList.add('dark', 'dark-theme');
    } else {
      root.classList.remove('dark', 'dark-theme');
      if (document.body) document.body.classList.remove('dark', 'dark-theme');
    }

    root.style.setProperty('--base-font-size', `${prefs.fontSize}px`);
    root.style.fontSize = `${prefs.fontSize}px`;
    root.lang = prefs.language;
  }

  private addLog(
    type: EventLogType,
    message: string,
    sourceTab: string,
    details?: string,
    latencyMs?: number
  ) {
    const newLog: SyncEventLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      type,
      message,
      sourceTab,
      details,
      latencyMs,
    };

    this.logs.unshift(newLog);
    if (this.logs.length > 60) {
      this.logs.pop();
    }
    this.notifyLogListeners();
  }

  // --- Subscription Listeners ---

  public subscribe(listener: (prefs: UserPreferences) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public subscribeLogs(listener: (logs: SyncEventLog[]) => void) {
    this.logListeners.add(listener);
    return () => this.logListeners.delete(listener);
  }

  public subscribePeers(listener: (count: number, peers: string[]) => void) {
    this.peerListeners.add(listener);
    return () => this.peerListeners.delete(listener);
  }

  public subscribeLatency(listener: (latencyMs: number) => void) {
    this.latencyListeners.add(listener);
    return () => this.latencyListeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn(this.currentPreferences));
  }

  private notifyLogListeners() {
    this.logListeners.forEach((fn) => fn(this.logs));
  }

  private notifyPeers() {
    const count = this.getActivePeerCount();
    const peerIds = this.getActivePeerIds();
    this.peerListeners.forEach((fn) => fn(count, peerIds));
  }

  private notifyLatency(latencyMs: number) {
    this.latencyListeners.forEach((fn) => fn(latencyMs));
  }
}

export const settingsManager = new SettingsManager();
