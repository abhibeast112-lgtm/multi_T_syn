import { settingsManager } from './storageManager.ts';
import { getTranslation, SUPPORTED_LANGUAGES } from './i18n.ts';
import type { UserPreferences, SyncEventLog, Language } from './types.ts';
import './style.css';

// SVG Icons
const ICON_SYNC = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
  </svg>
`;

const ICON_SUN = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
`;

const ICON_MOON = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
`;

const ICON_EXTERNAL = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
`;

const ICON_BOLT = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
`;

const ICON_RESET = `
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
  </svg>
`;

class AppView {
  private appEl: HTMLElement;
  private currentPrefs: UserPreferences;
  private isUserDraggingSlider = false;

  constructor() {
    this.appEl = document.getElementById('app')!;
    this.currentPrefs = settingsManager.getPreferences();
    this.buildInitialHTML();
    this.bindEvents();
    this.subscribeToManager();
    this.updateUI(this.currentPrefs);
    this.renderTelemetry(settingsManager.getLogs());
    this.updatePeers(settingsManager.getActivePeerCount(), settingsManager.getActivePeerIds());
  }

  private buildInitialHTML() {
    const t = getTranslation(this.currentPrefs.language);

    this.appEl.innerHTML = `
      <div class="app-container">
        <!-- Top Navigation -->
        <header class="navbar">
          <div class="brand-section">
            <div class="brand-logo-icon">
              ${ICON_SYNC}
            </div>
            <div class="brand-info">
              <h1 id="i18n-app-title">${t.appTitle}</h1>
              <p id="i18n-app-subtitle">${t.appSubtitle}</p>
            </div>
          </div>

          <div class="nav-badges">
            <span class="badge badge-primary" title="Unique identifier for this tab">
              <span class="pulse-dot"></span>
              <span id="tab-id-text">${settingsManager.tabId} (${t.tabYouBadge})</span>
            </span>
            <span class="badge" id="peer-count-badge" title="Number of open synchronized tabs">
              <span id="i18n-active-tabs">${t.activeTabsLabel}</span>: <strong id="peer-count-val">1</strong>
            </span>
            <span class="badge badge-success" id="latency-badge" title="Live BroadcastChannel transit latency">
              ⚡ <span id="latency-text">&lt; 5ms</span>
            </span>
          </div>
        </header>

        <!-- Main Grid -->
        <main class="dashboard-grid">
          <!-- Left Column: Controls -->
          <div class="column">
            <!-- Theme Card -->
            <section class="card">
              <div class="card-header">
                <div class="card-title-group">
                  <h2 id="i18n-theme-title">
                    <span class="theme-icon-indicator" id="theme-icon-header">☀️</span>
                    <span id="i18n-theme-heading">${t.appearanceTitle}</span>
                  </h2>
                  <p id="i18n-theme-desc">${t.appearanceDesc}</p>
                </div>
              </div>

              <div class="theme-control-container">
                <div class="theme-toggle-row">
                  <div class="theme-mode-label">
                    <span id="theme-active-label">${this.currentPrefs.darkMode ? t.darkMode : t.lightMode}</span>
                  </div>
                  <label class="switch" for="dark-mode-toggle" aria-label="Toggle theme">
                    <input type="checkbox" id="dark-mode-toggle" ${this.currentPrefs.darkMode ? 'checked' : ''} />
                    <span class="slider-toggle">
                      <span class="toggle-thumb" id="toggle-thumb-icon">
                        ${this.currentPrefs.darkMode ? ICON_MOON : ICON_SUN}
                      </span>
                    </span>
                  </label>
                </div>

                <div class="theme-segmented-pills">
                  <button type="button" class="theme-pill-btn ${!this.currentPrefs.darkMode ? 'active' : ''}" id="btn-theme-light">
                    ${ICON_SUN} <span id="i18n-pill-light">${t.lightMode}</span>
                  </button>
                  <button type="button" class="theme-pill-btn ${this.currentPrefs.darkMode ? 'active' : ''}" id="btn-theme-dark">
                    ${ICON_MOON} <span id="i18n-pill-dark">${t.darkMode}</span>
                  </button>
                </div>
              </div>
            </section>

            <!-- Language Card -->
            <section class="card">
              <div class="card-header">
                <div class="card-title-group">
                  <h2>
                    <span>🌐</span>
                    <span id="i18n-lang-heading">${t.languageTitle}</span>
                  </h2>
                  <p id="i18n-lang-desc">${t.languageDesc}</p>
                </div>
              </div>

              <div class="language-grid" id="language-grid">
                ${SUPPORTED_LANGUAGES.map(
                  (lang) => `
                  <button
                    type="button"
                    class="lang-btn ${this.currentPrefs.language === lang.code ? 'active' : ''}"
                    data-lang="${lang.code}"
                  >
                    <span class="lang-flag">${lang.flag}</span>
                    <span class="lang-native">${lang.nativeName}</span>
                    <span class="lang-english">${lang.name}</span>
                  </button>
                `
                ).join('')}
              </div>
            </section>

            <!-- Typography & Font Size Card -->
            <section class="card">
              <div class="card-header">
                <div class="card-title-group">
                  <h2>
                    <span>🔤</span>
                    <span id="i18n-font-heading">${t.fontSizeTitle}</span>
                  </h2>
                  <p id="i18n-font-desc">${t.fontSizeDesc}</p>
                </div>
                <span class="slider-value-pill" id="font-size-badge">${this.currentPrefs.fontSize}px</span>
              </div>

              <div class="font-size-container">
                <div class="slider-wrapper">
                  <input
                    type="range"
                    id="font-size-slider"
                    min="12"
                    max="24"
                    step="1"
                    value="${this.currentPrefs.fontSize}"
                    aria-label="Adjust font size"
                  />
                </div>

                <div class="font-presets-row">
                  <button type="button" class="font-preset-btn ${this.currentPrefs.fontSize === 14 ? 'active' : ''}" data-size="14">
                    14px
                  </button>
                  <button type="button" class="font-preset-btn ${this.currentPrefs.fontSize === 16 ? 'active' : ''}" data-size="16">
                    16px
                  </button>
                  <button type="button" class="font-preset-btn ${this.currentPrefs.fontSize === 18 ? 'active' : ''}" data-size="18">
                    18px
                  </button>
                  <button type="button" class="font-preset-btn ${this.currentPrefs.fontSize === 20 ? 'active' : ''}" data-size="20">
                    20px
                  </button>
                </div>
              </div>
            </section>

            <!-- Testing & Coordination Tools -->
            <section class="card">
              <div class="card-header">
                <div class="card-title-group">
                  <h2>
                    <span>🛠️</span>
                    <span id="i18n-tools-heading">${t.toolsTitle}</span>
                  </h2>
                </div>
              </div>

              <div class="tools-row">
                <button type="button" class="btn btn-primary" id="btn-open-tab" title="Launch a new tab in this browser to test real-time sync">
                  ${ICON_EXTERNAL} <span id="i18n-btn-new-tab">${t.openNewTab}</span>
                </button>
                <button type="button" class="btn" id="btn-simulate-conflict" title="Simulates simultaneous competing writes across tabs to verify deterministic convergence">
                  ${ICON_BOLT} <span id="i18n-btn-conflict">${t.simulateConflict}</span>
                </button>
                <button type="button" class="btn btn-danger-outline" id="btn-reset-prefs" title="Reverts all settings to system defaults across all tabs">
                  ${ICON_RESET} <span id="i18n-btn-reset">${t.resetDefaults}</span>
                </button>
              </div>
            </section>
          </div>

          <!-- Right Column: Live Preview & Diagnostics -->
          <div class="column">
            <!-- Live Preview Card -->
            <section class="card">
              <div class="card-header">
                <div class="card-title-group">
                  <h2>
                    <span>👁️</span>
                    <span id="i18n-preview-heading">${t.previewTitle}</span>
                  </h2>
                  <p id="i18n-preview-desc">${t.previewDesc}</p>
                </div>
              </div>

              <div class="preview-display-card" id="preview-widget">
                <div class="preview-top-strip">
                  <div class="preview-badges-cluster">
                    <span class="badge badge-primary" id="i18n-preview-badge-live">${t.previewBadgeLive}</span>
                    <span class="badge badge-success" id="i18n-preview-badge-synced">${t.previewBadgeSynced}</span>
                  </div>
                  <span class="badge" id="preview-version-pill">v${this.currentPrefs.version}</span>
                </div>

                <div class="preview-content">
                  <h3 id="preview-title">${t.previewCardTitle}</h3>
                  <div class="preview-subtitle" id="preview-subtitle">${t.previewCardSubtitle}</div>
                  <p class="preview-body-text" id="preview-body">${t.previewCardBody}</p>
                </div>

                <div class="preview-actions-bar">
                  <button type="button" class="btn btn-primary" id="preview-btn-primary">
                    ${t.previewActionPrimary}
                  </button>
                  <button type="button" class="btn" id="preview-btn-secondary">
                    ${t.previewActionSecondary}
                  </button>
                </div>
              </div>
            </section>

            <!-- Diagnostics & Telemetry Feed -->
            <section class="card telemetry-card">
              <div class="card-header">
                <div class="card-title-group">
                  <h2>
                    <span>⚡</span>
                    <span id="i18n-telemetry-heading">${t.telemetryTitle}</span>
                  </h2>
                  <p id="telemetry-subtitle">BroadcastChannel & Storage Event stream (< 100ms)</p>
                </div>
                <button type="button" class="btn" id="btn-clear-logs" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                  <span id="i18n-clear-logs">${t.clearLogs}</span>
                </button>
              </div>

              <div class="telemetry-feed" id="telemetry-feed">
                <!-- Dynamically populated -->
              </div>
            </section>
          </div>
        </main>

        <footer class="app-footer">
          SyncCore Preferences Engine • Cross-Tab BroadcastChannel Protocol • Sub-100ms Latency SLA
        </footer>
      </div>
    `;
  }

  private bindEvents() {
    // Dark mode toggle switch
    const toggle = document.getElementById('dark-mode-toggle') as HTMLInputElement | null;
    toggle?.addEventListener('change', () => {
      settingsManager.updatePreferences({ darkMode: toggle.checked });
    });

    // Segmented theme pills
    document.getElementById('btn-theme-light')?.addEventListener('click', () => {
      settingsManager.updatePreferences({ darkMode: false });
    });
    document.getElementById('btn-theme-dark')?.addEventListener('click', () => {
      settingsManager.updatePreferences({ darkMode: true });
    });

    // Language buttons
    const langGrid = document.getElementById('language-grid');
    langGrid?.addEventListener('click', (e) => {
      const target = (e.target as HTMLElement).closest('.lang-btn') as HTMLElement | null;
      if (target && target.dataset.lang) {
        settingsManager.updatePreferences({ language: target.dataset.lang as Language });
      }
    });

    // Font size slider
    const slider = document.getElementById('font-size-slider') as HTMLInputElement | null;
    if (slider) {
      slider.addEventListener('pointerdown', () => {
        this.isUserDraggingSlider = true;
      });
      window.addEventListener('pointerup', () => {
        this.isUserDraggingSlider = false;
      });

      let fontRaf: number | null = null;
      slider.addEventListener('input', () => {
        const size = Number(slider.value);
        const badge = document.getElementById('font-size-badge');
        if (badge) badge.textContent = `${size}px`;

        if (fontRaf) cancelAnimationFrame(fontRaf);
        fontRaf = requestAnimationFrame(() => {
          settingsManager.updatePreferences({ fontSize: size });
        });
      });
    }

    // Font presets
    document.querySelectorAll('.font-preset-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const size = Number((e.currentTarget as HTMLElement).dataset.size);
        if (size) {
          settingsManager.updatePreferences({ fontSize: size });
        }
      });
    });

    // Action buttons
    document.getElementById('btn-open-tab')?.addEventListener('click', () => {
      window.open(window.location.href, '_blank');
    });

    document.getElementById('btn-simulate-conflict')?.addEventListener('click', () => {
      settingsManager.simulateConflict();
    });

    document.getElementById('btn-reset-prefs')?.addEventListener('click', () => {
      settingsManager.resetPreferences();
    });

    document.getElementById('btn-clear-logs')?.addEventListener('click', () => {
      settingsManager.clearLogs();
    });
  }

  private subscribeToManager() {
    settingsManager.subscribe((prefs) => {
      this.currentPrefs = prefs;
      this.updateUI(prefs);
    });

    settingsManager.subscribeLogs((logs) => {
      this.renderTelemetry(logs);
    });

    settingsManager.subscribePeers((count, peers) => {
      this.updatePeers(count, peers);
    });

    settingsManager.subscribeLatency((latencyMs) => {
      this.updateLatency(latencyMs);
    });
  }

  private updateUI(prefs: UserPreferences) {
    const t = getTranslation(prefs.language);

    // 1. Text elements & Translations
    this.setText('i18n-app-title', t.appTitle);
    this.setText('i18n-app-subtitle', t.appSubtitle);
    this.setText('tab-id-text', `${settingsManager.tabId} (${t.tabYouBadge})`);
    this.setText('i18n-active-tabs', t.activeTabsLabel);

    this.setText('i18n-theme-heading', t.appearanceTitle);
    this.setText('i18n-theme-desc', t.appearanceDesc);
    this.setText('theme-active-label', prefs.darkMode ? t.darkMode : t.lightMode);
    this.setText('i18n-pill-light', t.lightMode);
    this.setText('i18n-pill-dark', t.darkMode);

    this.setText('i18n-lang-heading', t.languageTitle);
    this.setText('i18n-lang-desc', t.languageDesc);

    this.setText('i18n-font-heading', t.fontSizeTitle);
    this.setText('i18n-font-desc', t.fontSizeDesc);

    this.setText('i18n-tools-heading', t.toolsTitle);
    this.setText('i18n-btn-new-tab', t.openNewTab);
    this.setText('i18n-btn-conflict', t.simulateConflict);
    this.setText('i18n-btn-reset', t.resetDefaults);

    this.setText('i18n-preview-heading', t.previewTitle);
    this.setText('i18n-preview-desc', t.previewDesc);
    this.setText('i18n-preview-badge-live', t.previewBadgeLive);
    this.setText('i18n-preview-badge-synced', t.previewBadgeSynced);
    this.setText('preview-title', t.previewCardTitle);
    this.setText('preview-subtitle', t.previewCardSubtitle);
    this.setText('preview-body', t.previewCardBody);
    this.setText('preview-btn-primary', t.previewActionPrimary);
    this.setText('preview-btn-secondary', t.previewActionSecondary);
    this.setText('preview-version-pill', `v${prefs.version}`);

    this.setText('i18n-telemetry-heading', t.telemetryTitle);
    this.setText('i18n-clear-logs', t.clearLogs);

    // 2. Theme controls
    const toggle = document.getElementById('dark-mode-toggle') as HTMLInputElement | null;
    if (toggle && toggle.checked !== prefs.darkMode) {
      toggle.checked = prefs.darkMode;
    }

    const thumbIcon = document.getElementById('toggle-thumb-icon');
    if (thumbIcon) {
      thumbIcon.innerHTML = prefs.darkMode ? ICON_MOON : ICON_SUN;
    }

    const headerIcon = document.getElementById('theme-icon-header');
    if (headerIcon) {
      headerIcon.textContent = prefs.darkMode ? '🌙' : '☀️';
    }

    const lightPill = document.getElementById('btn-theme-light');
    const darkPill = document.getElementById('btn-theme-dark');
    if (lightPill) lightPill.classList.toggle('active', !prefs.darkMode);
    if (darkPill) darkPill.classList.toggle('active', prefs.darkMode);

    // 3. Language grid active state
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      const code = (btn as HTMLElement).dataset.lang;
      btn.classList.toggle('active', code === prefs.language);
    });

    // 4. Font size slider & presets
    const badge = document.getElementById('font-size-badge');
    if (badge) badge.textContent = `${prefs.fontSize}px`;

    const slider = document.getElementById('font-size-slider') as HTMLInputElement | null;
    if (slider && !this.isUserDraggingSlider && Number(slider.value) !== prefs.fontSize) {
      slider.value = String(prefs.fontSize);
    }

    document.querySelectorAll('.font-preset-btn').forEach((btn) => {
      const size = Number((btn as HTMLElement).dataset.size);
      btn.classList.toggle('active', size === prefs.fontSize);
    });
  }

  private updatePeers(count: number, peers: string[]) {
    const peerVal = document.getElementById('peer-count-val');
    if (peerVal) {
      peerVal.textContent = String(count);
    }
    const badge = document.getElementById('peer-count-badge');
    if (badge) {
      const titles = peers.length > 0 ? `Active: ${settingsManager.tabId} (You), ${peers.join(', ')}` : 'Only this tab active';
      badge.setAttribute('title', titles);
    }
  }

  private updateLatency(latencyMs: number) {
    const latencyText = document.getElementById('latency-text');
    if (latencyText) {
      latencyText.textContent = `${latencyMs}ms`;
    }
    const badge = document.getElementById('latency-badge');
    if (badge) {
      badge.classList.remove('pulse-flash');
      void badge.offsetWidth; // trigger reflow
      badge.classList.add('pulse-flash');
    }
  }

  private renderTelemetry(logs: SyncEventLog[]) {
    const feed = document.getElementById('telemetry-feed');
    if (!feed) return;

    if (logs.length === 0) {
      const t = getTranslation(this.currentPrefs.language);
      feed.innerHTML = `<div class="log-empty-state">${t.telemetryEmpty}</div>`;
      return;
    }

    feed.innerHTML = logs
      .map((log) => {
        let tagClass = 'log-tag-system';
        let tagLabel = 'SYS';

        if (log.type === 'local_update') {
          tagClass = 'log-tag-local';
          tagLabel = 'LOCAL';
        } else if (log.type === 'remote_sync') {
          tagClass = 'log-tag-remote';
          tagLabel = 'SYNC';
        } else if (log.type === 'conflict_resolved') {
          tagClass = 'log-tag-conflict';
          tagLabel = 'CONFLICT';
        }

        const isSelf = log.sourceTab === settingsManager.tabId;
        const sourceLabel = isSelf ? `${log.sourceTab} (You)` : log.sourceTab;
        const timeStr = log.timestamp.toTimeString().split(' ')[0] + '.' + String(log.timestamp.getMilliseconds()).padStart(3, '0');
        const latencyBadge = log.latencyMs !== undefined ? ` • ${log.latencyMs}ms` : '';

        return `
          <div class="log-entry">
            <div class="log-entry-header">
              <span class="log-tag ${tagClass}">${tagLabel}</span>
              <span>${timeStr} • ${sourceLabel}${latencyBadge}</span>
            </div>
            <div class="log-message">${this.escapeHTML(log.message)}</div>
            ${log.details ? `<div class="log-details">${this.escapeHTML(log.details)}</div>` : ''}
          </div>
        `;
      })
      .join('');
  }

  private setText(id: string, text: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  private escapeHTML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

// Instantiate on script load
new AppView();
