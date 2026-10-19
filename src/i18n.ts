import type { Language, LanguageInfo } from './types.ts';

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
];

export interface TranslationDictionary {
  appTitle: string;
  appSubtitle: string;
  tabLabel: string;
  activeTabsLabel: string;
  tabYouBadge: string;
  syncLatency: string;
  syncStatusConnected: string;
  appearanceTitle: string;
  appearanceDesc: string;
  lightMode: string;
  darkMode: string;
  languageTitle: string;
  languageDesc: string;
  fontSizeTitle: string;
  fontSizeDesc: string;
  presetCompact: string;
  presetNormal: string;
  presetComfortable: string;
  presetLarge: string;
  previewTitle: string;
  previewDesc: string;
  previewCardTitle: string;
  previewCardSubtitle: string;
  previewCardBody: string;
  previewActionPrimary: string;
  previewActionSecondary: string;
  previewBadgeLive: string;
  previewBadgeSynced: string;
  toolsTitle: string;
  openNewTab: string;
  simulateConflict: string;
  resetDefaults: string;
  telemetryTitle: string;
  clearLogs: string;
  telemetryEmpty: string;
  conflictModalNotice: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appTitle: 'SyncCore',
    appSubtitle: 'Deterministic Multi-Tab Preferences Engine',
    tabLabel: 'Current Tab',
    activeTabsLabel: 'Active Tabs',
    tabYouBadge: 'This Tab',
    syncLatency: 'Sync Latency',
    syncStatusConnected: 'Connected & Listening',
    appearanceTitle: 'Color Theme',
    appearanceDesc: 'Switch seamlessly between dark and light color modes',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    languageTitle: 'Display Language',
    languageDesc: 'Preferences propagate instantly to all open windows',
    fontSizeTitle: 'Base Font Size',
    fontSizeDesc: 'Fluid typography scales dynamically across the app',
    presetCompact: 'Compact (14px)',
    presetNormal: 'Standard (16px)',
    presetComfortable: 'Medium (18px)',
    presetLarge: 'Large (20px)',
    previewTitle: 'Live Preview',
    previewDesc: 'Real-time rendering of your active theme, language, and typography',
    previewCardTitle: 'Real-Time State Synchronization',
    previewCardSubtitle: 'Zero page refreshes • Sub-10ms delivery',
    previewCardBody:
      'Modify any setting in this window or open companion tabs. Updates synchronize across all open instances using the BroadcastChannel API with deterministic Lamport timestamp conflict resolution.',
    previewActionPrimary: 'Test Action',
    previewActionSecondary: 'Documentation',
    previewBadgeLive: 'Live State',
    previewBadgeSynced: 'Synchronized',
    toolsTitle: 'Testing & Coordination',
    openNewTab: 'Open Companion Tab',
    simulateConflict: 'Simulate Race Condition',
    resetDefaults: 'Reset to Defaults',
    telemetryTitle: 'Sync Telemetry & Conflict Log',
    clearLogs: 'Clear Log',
    telemetryEmpty: 'No sync events recorded yet. Modify a setting to begin.',
    conflictModalNotice: 'Simulated concurrent write resolved deterministically.',
  },
  es: {
    appTitle: 'SyncCore',
    appSubtitle: 'Motor determinista de preferencias multi-pestaña',
    tabLabel: 'Pestaña actual',
    activeTabsLabel: 'Pestañas activas',
    tabYouBadge: 'Esta pestaña',
    syncLatency: 'Latencia de sincronización',
    syncStatusConnected: 'Conectado y escuchando',
    appearanceTitle: 'Tema de color',
    appearanceDesc: 'Cambia fluidamente entre los modos oscuro y claro',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Oscuro',
    languageTitle: 'Idioma de visualización',
    languageDesc: 'Las preferencias se propagan al instante a todas las pestañas',
    fontSizeTitle: 'Tamaño de fuente base',
    fontSizeDesc: 'La tipografía fluida se escala dinámicamente en la aplicación',
    presetCompact: 'Compacto (14px)',
    presetNormal: 'Estándar (16px)',
    presetComfortable: 'Mediano (18px)',
    presetLarge: 'Grande (20px)',
    previewTitle: 'Vista previa en vivo',
    previewDesc: 'Renderizado en tiempo real de tema, idioma y tipografía',
    previewCardTitle: 'Sincronización de estado en tiempo real',
    previewCardSubtitle: 'Sin recargas de página • Entrega sub-10ms',
    previewCardBody:
      'Modifica cualquier ajuste aquí o abre pestañas compañeras. Las actualizaciones se sincronizan mediante la API BroadcastChannel con resolución determinista mediante marcas de tiempo Lamport.',
    previewActionPrimary: 'Acción de prueba',
    previewActionSecondary: 'Documentación',
    previewBadgeLive: 'Estado en vivo',
    previewBadgeSynced: 'Sincronizado',
    toolsTitle: 'Herramientas y pruebas',
    openNewTab: 'Abrir pestaña compañera',
    simulateConflict: 'Simular condición de carrera',
    resetDefaults: 'Restablecer ajustes',
    telemetryTitle: 'Telemetría y registro de conflictos',
    clearLogs: 'Limpiar registro',
    telemetryEmpty: 'No hay eventos registrados. Modifica un ajuste para comenzar.',
    conflictModalNotice: 'Escritura concurrente simulada resuelta de forma determinista.',
  },
  fr: {
    appTitle: 'SyncCore',
    appSubtitle: 'Moteur déterministe de préférences multi-onglets',
    tabLabel: 'Onglet actuel',
    activeTabsLabel: 'Onglets actifs',
    tabYouBadge: 'Cet onglet',
    syncLatency: 'Latence de synchro',
    syncStatusConnected: 'Connecté et à l’écoute',
    appearanceTitle: 'Thème visuel',
    appearanceDesc: 'Basculez facilement entre les modes sombre et clair',
    lightMode: 'Mode Clair',
    darkMode: 'Mode Sombre',
    languageTitle: 'Langue d’affichage',
    languageDesc: 'Les préférences se propagent instantanément aux onglets',
    fontSizeTitle: 'Taille de police',
    fontSizeDesc: 'La typographie s’adapte dynamiquement dans toute l’application',
    presetCompact: 'Compact (14px)',
    presetNormal: 'Standard (16px)',
    presetComfortable: 'Moyen (18px)',
    presetLarge: 'Grand (20px)',
    previewTitle: 'Aperçu en direct',
    previewDesc: 'Rendu en temps réel du thème, de la langue et de la police',
    previewCardTitle: 'Synchronisation d’état instantanée',
    previewCardSubtitle: 'Zéro rechargement • Délai inférieur à 10ms',
    previewCardBody:
      'Modifiez un paramètre ici ou ouvrez d’autres onglets. Les mises à jour sont synchronisées via l’API BroadcastChannel avec résolution déterministe des conflits par horloges de Lamport.',
    previewActionPrimary: 'Tester l’action',
    previewActionSecondary: 'Documentation',
    previewBadgeLive: 'État direct',
    previewBadgeSynced: 'Synchronisé',
    toolsTitle: 'Outils et tests',
    openNewTab: 'Ouvrir un nouvel onglet',
    simulateConflict: 'Simuler un conflit',
    resetDefaults: 'Réinitialiser',
    telemetryTitle: 'Télémétrie et journal des conflits',
    clearLogs: 'Effacer le journal',
    telemetryEmpty: 'Aucun événement pour le moment. Modifiez un paramètre pour débuter.',
    conflictModalNotice: 'Conflit simultané simulé et résolu de façon déterministe.',
  },
  de: {
    appTitle: 'SyncCore',
    appSubtitle: 'Deterministische Multi-Tab-Einstellungs-Engine',
    tabLabel: 'Aktueller Tab',
    activeTabsLabel: 'Aktive Tabs',
    tabYouBadge: 'Dieser Tab',
    syncLatency: 'Sync-Latenz',
    syncStatusConnected: 'Verbunden & empfangsbereit',
    appearanceTitle: 'Farbdesign',
    appearanceDesc: 'Nahtloses Umschalten zwischen Hell- und Dunkelmodus',
    lightMode: 'Heller Modus',
    darkMode: 'Dunkler Modus',
    languageTitle: 'Anzeigesprache',
    languageDesc: 'Einstellungen werden sofort an alle offenen Fenster übertragen',
    fontSizeTitle: 'Basis-Schriftgröße',
    fontSizeDesc: 'Dynamische Typografie-Skalierung über die gesamte App',
    presetCompact: 'Kompakt (14px)',
    presetNormal: 'Standard (16px)',
    presetComfortable: 'Mittel (18px)',
    presetLarge: 'Groß (20px)',
    previewTitle: 'Live-Vorschau',
    previewDesc: 'Echtzeit-Anzeige von Design, Sprache und Typografie',
    previewCardTitle: 'Echtzeit-Zustandssynchronisierung',
    previewCardSubtitle: 'Kein Neuladen • Übertragung in unter 10ms',
    previewCardBody:
      'Ändern Sie Einstellungen hier oder öffnen Sie Partner-Tabs. Aktualisierungen synchronisieren sich über die BroadcastChannel-API mit deterministischer Lamport-Konfliktlösung.',
    previewActionPrimary: 'Test-Aktion',
    previewActionSecondary: 'Dokumentation',
    previewBadgeLive: 'Live-Zustand',
    previewBadgeSynced: 'Synchronisiert',
    toolsTitle: 'Testwerkzeuge & Koordination',
    openNewTab: 'Neuen Tab öffnen',
    simulateConflict: 'Race Condition simulieren',
    resetDefaults: 'Auf Standard zurücksetzen',
    telemetryTitle: 'Sync-Telemetrie & Konfliktprotokoll',
    clearLogs: 'Protokoll leeren',
    telemetryEmpty: 'Noch keine Synchronisationsereignisse aufgezeichnet.',
    conflictModalNotice: 'Simulierter Schreibkonflikt deterministisch aufgelöst.',
  },
  ja: {
    appTitle: 'SyncCore',
    appSubtitle: '決定論的マルチタブ状態同期エンジン',
    tabLabel: '現在のタブ',
    activeTabsLabel: 'アクティブなタブ',
    tabYouBadge: 'このタブ',
    syncLatency: '同期遅延',
    syncStatusConnected: '接続済み・受信待機中',
    appearanceTitle: 'カラーテーマ',
    appearanceDesc: 'ダークモードとライトモードをスムーズに切り替えます',
    lightMode: 'ライトモード',
    darkMode: 'ダークモード',
    languageTitle: '表示言語',
    languageDesc: '設定は開いているすべてのタブへ即時に反映されます',
    fontSizeTitle: '基本フォントサイズ',
    fontSizeDesc: 'アプリ全体の文字サイズを動的に調整します',
    presetCompact: 'コンパクト (14px)',
    presetNormal: '標準 (16px)',
    presetComfortable: '中 (18px)',
    presetLarge: '大 (20px)',
    previewTitle: 'リアルタイムプレビュー',
    previewDesc: 'アクティブなテーマ、言語、フォントが即座に反映されます',
    previewCardTitle: 'リアルタイム状態同期',
    previewCardSubtitle: 'ページ更新不要 • 10ms未満の超高速伝播',
    previewCardBody:
      'このウィンドウで設定を変更するか、新規タブを開いてみてください。BroadcastChannel APIと決定論的ランポートタイムスタンプにより、全インスタンスが完全に一致します。',
    previewActionPrimary: 'アクションテスト',
    previewActionSecondary: 'ドキュメント',
    previewBadgeLive: 'リアルタイム状態',
    previewBadgeSynced: '同期完了',
    toolsTitle: 'テスト & ツール',
    openNewTab: '別タブを開く',
    simulateConflict: '競合シミュレーション',
    resetDefaults: '初期設定に戻す',
    telemetryTitle: '同期テレメトリ & 競合ログ',
    clearLogs: 'ログを消去',
    telemetryEmpty: '同期イベントはまだ記録されていません。設定を変更してください。',
    conflictModalNotice: 'シミュレートされた同時書き込みが決定論的に解決されました。',
  },
  it: {
    appTitle: 'SyncCore',
    appSubtitle: 'Motore deterministico di preferenze multi-scheda',
    tabLabel: 'Scheda corrente',
    activeTabsLabel: 'Schede attive',
    tabYouBadge: 'Questa scheda',
    syncLatency: 'Latenza di sincronizzazione',
    syncStatusConnected: 'Connesso e in ascolto',
    appearanceTitle: 'Tema visivo',
    appearanceDesc: 'Passa senza interruzioni tra modalità scura e chiara',
    lightMode: 'Modalità Chiara',
    darkMode: 'Modalità Scura',
    languageTitle: 'Lingua dell’interfaccia',
    languageDesc: 'Le preferenze si propagano istantaneamente a tutte le schede',
    fontSizeTitle: 'Dimensione carattere base',
    fontSizeDesc: 'La tipografia fluida scala dinamicamente nell’app',
    presetCompact: 'Compatto (14px)',
    presetNormal: 'Standard (16px)',
    presetComfortable: 'Medio (18px)',
    presetLarge: 'Grande (20px)',
    previewTitle: 'Anteprima dal vivo',
    previewDesc: 'Rendering in tempo reale di tema, lingua e tipografia',
    previewCardTitle: 'Sincronizzazione dello stato in tempo reale',
    previewCardSubtitle: 'Zero aggiornamenti di pagina • Consegna sub-10ms',
    previewCardBody:
      'Modifica qualsiasi impostazione in questa scheda o aprine di nuove. Gli aggiornamenti si sincronizzano con l’API BroadcastChannel con risoluzione deterministica dei conflitti Lamport.',
    previewActionPrimary: 'Azione di test',
    previewActionSecondary: 'Documentazione',
    previewBadgeLive: 'Stato attivo',
    previewBadgeSynced: 'Sincronizzato',
    toolsTitle: 'Strumenti e test',
    openNewTab: 'Apri nuova scheda',
    simulateConflict: 'Simula race condition',
    resetDefaults: 'Ripristina predefiniti',
    telemetryTitle: 'Telemetria e registro conflitti',
    clearLogs: 'Cancella registro',
    telemetryEmpty: 'Nessun evento registrato. Modifica un’impostazione per iniziare.',
    conflictModalNotice: 'Scrittura concorrente simulata risolta in modo deterministico.',
  },
};

export function getTranslation(lang: Language): TranslationDictionary {
  return translations[lang] || translations.en;
}
