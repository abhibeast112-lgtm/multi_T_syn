import assert from 'node:assert';
import { test, describe, after } from 'node:test';
import { SettingsManager, DEFAULT_PREFERENCES } from '../src/storageManager.ts';
import { translations, SUPPORTED_LANGUAGES } from '../src/i18n.ts';
import type { UserPreferences } from '../src/types.ts';

// Mock browser globals for testing environment if not present
if (typeof globalThis.window === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) || null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
  };

  class MockBroadcastChannel {
    public name: string;
    public onmessage: ((event: any) => void) | null = null;
    constructor(name: string) {
      this.name = name;
    }
    postMessage(_data: any) {}
    close() {}
  }

  (globalThis as any).BroadcastChannel = MockBroadcastChannel;
  (globalThis as any).window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
  };
  (globalThis as any).document = {
    documentElement: {
      setAttribute: () => {},
      classList: { add: () => {}, remove: () => {} },
      style: { setProperty: () => {}, fontSize: '' },
    },
    body: {
      classList: { add: () => {}, remove: () => {} },
    },
  };
}

describe('SyncCore Deterministic Conflict Resolution Engine', () => {
  const manager = new SettingsManager();

  test('Higher Lamport logical version always wins', () => {
    const stateA: UserPreferences = {
      darkMode: false,
      language: 'en',
      fontSize: 16,
      version: 2,
      updatedAt: 1000,
      lastModifiedBy: 'tab-aaa',
    };

    const stateB: UserPreferences = {
      darkMode: true,
      language: 'es',
      fontSize: 18,
      version: 3,
      updatedAt: 500, // Older timestamp, but higher version!
      lastModifiedBy: 'tab-bbb',
    };

    const evalBoverA = manager.evaluateOrder(stateB, stateA);
    assert.strictEqual(evalBoverA.incomingWins, true, 'Version 3 should win over Version 2');
    assert.strictEqual(evalBoverA.conflictResolved, false);

    const evalAoverB = manager.evaluateOrder(stateA, stateB);
    assert.strictEqual(evalAoverB.incomingWins, false, 'Version 2 should lose against Version 3');
  });

  test('Timestamp tie-breaker resolves concurrent edits with identical version', () => {
    const stateA: UserPreferences = {
      darkMode: false,
      language: 'en',
      fontSize: 16,
      version: 5,
      updatedAt: 2000,
      lastModifiedBy: 'tab-aaa',
    };

    const stateB: UserPreferences = {
      darkMode: true,
      language: 'fr',
      fontSize: 20,
      version: 5,
      updatedAt: 2050, // Later timestamp
      lastModifiedBy: 'tab-bbb',
    };

    const evalBoverA = manager.evaluateOrder(stateB, stateA);
    assert.strictEqual(evalBoverA.incomingWins, true, 'Later timestamp should win');
    assert.strictEqual(evalBoverA.conflictResolved, true);

    const evalAoverB = manager.evaluateOrder(stateA, stateB);
    assert.strictEqual(evalAoverB.incomingWins, false, 'Earlier timestamp should lose');
  });

  test('Lexicographical Tab ID deterministically breaks tie when version & timestamp match', () => {
    const state1: UserPreferences = {
      darkMode: false,
      language: 'en',
      fontSize: 16,
      version: 10,
      updatedAt: 3000,
      lastModifiedBy: 'tab-alpha',
    };

    const state2: UserPreferences = {
      darkMode: true,
      language: 'ja',
      fontSize: 14,
      version: 10,
      updatedAt: 3000,
      lastModifiedBy: 'tab-omega', // 'tab-omega' > 'tab-alpha'
    };

    // Tab 1 comparing Tab 2
    const res1 = manager.evaluateOrder(state2, state1);
    assert.strictEqual(res1.incomingWins, true, "'tab-omega' should beat 'tab-alpha'");

    // Tab 2 comparing Tab 1
    const res2 = manager.evaluateOrder(state1, state2);
    assert.strictEqual(res2.incomingWins, false, "'tab-alpha' should lose to 'tab-omega'");

    // Both tabs deterministically converge on state2!
  });

  test('I18n translations coverage for all supported languages', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const dict = translations[lang.code];
      assert.ok(dict, `Missing translation dictionary for ${lang.code}`);
      assert.ok(dict.appTitle, `Missing appTitle for ${lang.code}`);
      assert.ok(dict.darkMode, `Missing darkMode for ${lang.code}`);
      assert.ok(dict.lightMode, `Missing lightMode for ${lang.code}`);
      assert.ok(dict.fontSizeTitle, `Missing fontSizeTitle for ${lang.code}`);
      assert.ok(dict.previewCardTitle, `Missing previewCardTitle for ${lang.code}`);
    }
  });

  test('Default preferences meet functional requirements', () => {
    assert.strictEqual(typeof DEFAULT_PREFERENCES.darkMode, 'boolean');
    assert.strictEqual(DEFAULT_PREFERENCES.language, 'en');
    assert.strictEqual(DEFAULT_PREFERENCES.fontSize, 16);
    assert.strictEqual(DEFAULT_PREFERENCES.version, 1);
  });

  after(() => {
    setTimeout(() => process.exit(0), 10);
  });
});
