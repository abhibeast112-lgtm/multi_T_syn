var T=Object.defineProperty;var L=(p,e,t)=>e in p?T(p,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):p[e]=t;var o=(p,e,t)=>L(p,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))i(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function t(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(a){if(a.ep)return;a.ep=!0;const n=t(a);fetch(a.href,n)}})();const f="app_user_preferences_v2",y="app_user_preferences_v1",C="app_settings_sync_channel_v2",w={darkMode:!1,language:"en",fontSize:16,version:1,updatedAt:Date.now(),lastModifiedBy:"init"};class P{constructor(){o(this,"tabId");o(this,"channel",null);o(this,"listeners",new Set);o(this,"logListeners",new Set);o(this,"peerListeners",new Set);o(this,"latencyListeners",new Set);o(this,"currentPreferences");o(this,"logs",[]);o(this,"activePeers",new Map);o(this,"pingInterval",null);o(this,"pruneInterval",null);this.tabId=this.generateTabId(),this.currentPreferences=this.loadFromStorage(),this.initBroadcastChannel(),this.setupStorageFallback(),this.setupPresence(),this.applyToDOM(this.currentPreferences),this.addLog("system",`Tab initialized (ID: ${this.tabId})`,this.tabId,`Loaded preferences: ${this.currentPreferences.darkMode?"Dark":"Light"} | ${this.currentPreferences.language} | ${this.currentPreferences.fontSize}px (v${this.currentPreferences.version})`),this.broadcastSyncRequest(),this.sendPing()}generateTabId(){const e="abcdefghijklmnopqrstuvwxyz0123456789";let t="";for(let i=0;i<5;i++)t+=e.charAt(Math.floor(Math.random()*e.length));return`tab-${t}`}loadFromStorage(){try{if(typeof localStorage<"u"){const e=localStorage.getItem(f)||localStorage.getItem(y);if(e){const t=JSON.parse(e);return{darkMode:typeof t.darkMode=="boolean"?t.darkMode:!1,language:t.language||"en",fontSize:typeof t.fontSize=="number"?t.fontSize:16,version:typeof t.version=="number"?t.version:1,updatedAt:typeof t.updatedAt=="number"?t.updatedAt:Date.now(),lastModifiedBy:t.lastModifiedBy||"storage"}}}}catch(e){console.warn("Failed to read from localStorage",e)}return{...w,updatedAt:Date.now()}}getPreferences(){return{...this.currentPreferences}}getLogs(){return[...this.logs]}getActivePeerCount(){return this.activePeers.size+1}getActivePeerIds(){return Array.from(this.activePeers.keys())}clearLogs(){this.logs=[],this.notifyLogListeners()}updatePreferences(e){const t=this.currentPreferences.version+1,i=Date.now(),a={...this.currentPreferences,...e,version:t,updatedAt:i,lastModifiedBy:this.tabId},n=Object.entries(e).map(([r,c])=>`${r}: ${c}`).join(", ");this.currentPreferences=a,this.saveToStorage(a),this.applyToDOM(a),this.notifyListeners(),this.addLog("local_update",`Locally updated [${n}] (v${t})`,this.tabId),this.postMessage({type:"PREFERENCES_UPDATE",payload:a,senderId:this.tabId,sentAt:Date.now()})}resetPreferences(){const e=this.currentPreferences.version+1,t={...w,version:e,updatedAt:Date.now(),lastModifiedBy:this.tabId};this.currentPreferences=t,this.saveToStorage(t),this.applyToDOM(t),this.notifyListeners(),this.addLog("local_update",`Preferences reset to defaults (v${e})`,this.tabId),this.postMessage({type:"PREFERENCES_UPDATE",payload:t,senderId:this.tabId,sentAt:Date.now()})}simulateConflict(){const e=`tab-sim-${Math.random().toString(36).substring(2,6)}`,t=this.currentPreferences.version,i=Date.now(),a={...this.currentPreferences,darkMode:!this.currentPreferences.darkMode,fontSize:this.currentPreferences.fontSize===16?18:16,version:t,updatedAt:i,lastModifiedBy:e};this.addLog("system",`Race condition injected: concurrent write from '${e}' with identical version (${t})`,e),this.handleIncomingPreferences(a,e,1)}evaluateOrder(e,t){return e.version>t.version?{incomingWins:!0,conflictResolved:!1,reason:`Higher logical version (v${e.version} > v${t.version})`}:e.version<t.version?{incomingWins:!1,conflictResolved:!1,reason:`Obsolete logical version (v${e.version} < v${t.version})`}:e.updatedAt>t.updatedAt?{incomingWins:!0,conflictResolved:!0,reason:`Equal version (v${e.version}): won via timestamp (${e.updatedAt} > ${t.updatedAt})`}:e.updatedAt<t.updatedAt?{incomingWins:!1,conflictResolved:!0,reason:`Equal version (v${e.version}): lost via timestamp (${e.updatedAt} < ${t.updatedAt})`}:e.lastModifiedBy>t.lastModifiedBy?{incomingWins:!0,conflictResolved:!0,reason:`Deterministic tie-breaker: Tab ID '${e.lastModifiedBy}' > '${t.lastModifiedBy}'`}:{incomingWins:!1,conflictResolved:!0,reason:`Deterministic tie-breaker: Tab ID '${e.lastModifiedBy}' <= '${t.lastModifiedBy}'`}}handleIncomingPreferences(e,t,i){const a=this.evaluateOrder(e,this.currentPreferences);a.incomingWins?(this.currentPreferences=e,this.saveToStorage(e),this.applyToDOM(e),this.notifyListeners(),a.conflictResolved?this.addLog("conflict_resolved",`Conflict resolved: accepted update from ${t}. [${a.reason}]`,t,`New State: ${e.darkMode?"Dark":"Light"} | ${e.language} | ${e.fontSize}px (v${e.version})`,i):this.addLog("remote_sync",`Synchronized from ${t} in ${i??"<5"}ms (v${e.version})`,t,`${e.darkMode?"Dark":"Light"} | ${e.language} | ${e.fontSize}px`,i)):a.conflictResolved&&this.addLog("conflict_resolved",`Conflict resolved: rejected incoming update from ${t}. [${a.reason}]`,t,`Retained State: ${this.currentPreferences.darkMode?"Dark":"Light"} | v${this.currentPreferences.version}`,i)}initBroadcastChannel(){if(typeof BroadcastChannel<"u")try{this.channel=new BroadcastChannel(C),this.channel.onmessage=e=>{this.handleChannelMessage(e.data)}}catch(e){console.warn("BroadcastChannel initialization failed, relying on storage events",e)}}handleChannelMessage(e){if(!e||e.senderId===this.tabId)return;const t=Date.now(),i=e.sentAt?Math.max(0,t-e.sentAt):0;switch(this.notifyLatency(i),this.recordPeer(e.senderId),e.type){case"PREFERENCES_UPDATE":case"SYNC_RESPONSE":e.payload&&this.handleIncomingPreferences(e.payload,e.senderId,i);break;case"REQUEST_SYNC":this.postMessage({type:"SYNC_RESPONSE",payload:this.currentPreferences,senderId:this.tabId,sentAt:Date.now()});break;case"TAB_PING":this.postMessage({type:"TAB_PONG",senderId:this.tabId,sentAt:Date.now()});break;case"TAB_PONG":break;case"TAB_DISCONNECT":this.removePeer(e.senderId);break}}setupStorageFallback(){typeof window>"u"||window.addEventListener("storage",e=>{if((e.key===f||e.key===y)&&e.newValue)try{const t=JSON.parse(e.newValue);this.handleIncomingPreferences(t,t.lastModifiedBy||"storage-event")}catch(t){console.error("Failed to parse storage event data",t)}})}setupPresence(){var t,i;if(typeof window>"u")return;this.pingInterval=window.setInterval(()=>{this.sendPing()},4e3),typeof((t=this.pingInterval)==null?void 0:t.unref)=="function"&&this.pingInterval.unref(),this.pruneInterval=window.setInterval(()=>{const a=Date.now();let n=!1;for(const[r,c]of this.activePeers.entries())a-c>9e3&&(this.activePeers.delete(r),n=!0,this.addLog("tab_left",`Companion tab '${r}' closed or timed out`,r));n&&this.notifyPeers()},4e3),typeof((i=this.pruneInterval)==null?void 0:i.unref)=="function"&&this.pruneInterval.unref();const e=()=>{try{this.postMessage({type:"TAB_DISCONNECT",senderId:this.tabId,sentAt:Date.now()})}catch{}};window.addEventListener("beforeunload",e),window.addEventListener("pagehide",e)}sendPing(){this.postMessage({type:"TAB_PING",senderId:this.tabId,sentAt:Date.now()})}recordPeer(e){const t=!this.activePeers.has(e);this.activePeers.set(e,Date.now()),t&&(this.addLog("tab_joined",`Connected to companion tab '${e}'`,e),this.notifyPeers())}removePeer(e){this.activePeers.has(e)&&(this.activePeers.delete(e),this.addLog("tab_left",`Companion tab '${e}' closed`,e),this.notifyPeers())}postMessage(e){if(this.channel)try{this.channel.postMessage(e)}catch(t){console.warn("BroadcastChannel postMessage failed",t)}}broadcastSyncRequest(){this.postMessage({type:"REQUEST_SYNC",senderId:this.tabId,sentAt:Date.now()})}saveToStorage(e){if(!(typeof localStorage>"u"))try{localStorage.setItem(f,JSON.stringify(e))}catch(t){console.error("Failed to write to localStorage",t)}}applyToDOM(e){if(typeof document>"u")return;const t=document.documentElement;if(!t)return;const i=e.darkMode;t.setAttribute("data-theme",i?"dark":"light"),i?(t.classList.add("dark","dark-theme"),document.body&&document.body.classList.add("dark","dark-theme")):(t.classList.remove("dark","dark-theme"),document.body&&document.body.classList.remove("dark","dark-theme")),t.style.setProperty("--base-font-size",`${e.fontSize}px`),t.style.fontSize=`${e.fontSize}px`,t.lang=e.language}addLog(e,t,i,a,n){const r={id:Math.random().toString(36).substring(2,9),timestamp:new Date,type:e,message:t,sourceTab:i,details:a,latencyMs:n};this.logs.unshift(r),this.logs.length>60&&this.logs.pop(),this.notifyLogListeners()}subscribe(e){return this.listeners.add(e),()=>this.listeners.delete(e)}subscribeLogs(e){return this.logListeners.add(e),()=>this.logListeners.delete(e)}subscribePeers(e){return this.peerListeners.add(e),()=>this.peerListeners.delete(e)}subscribeLatency(e){return this.latencyListeners.add(e),()=>this.latencyListeners.delete(e)}notifyListeners(){this.listeners.forEach(e=>e(this.currentPreferences))}notifyLogListeners(){this.logListeners.forEach(e=>e(this.logs))}notifyPeers(){const e=this.getActivePeerCount(),t=this.getActivePeerIds();this.peerListeners.forEach(i=>i(e,t))}notifyLatency(e){this.latencyListeners.forEach(t=>t(e))}}const s=new P,M=[{code:"en",name:"English",nativeName:"English",flag:"🇺🇸"},{code:"es",name:"Spanish",nativeName:"Español",flag:"🇪🇸"},{code:"fr",name:"French",nativeName:"Français",flag:"🇫🇷"},{code:"de",name:"German",nativeName:"Deutsch",flag:"🇩🇪"},{code:"ja",name:"Japanese",nativeName:"日本語",flag:"🇯🇵"},{code:"it",name:"Italian",nativeName:"Italiano",flag:"🇮🇹"}],S={en:{appTitle:"SyncCore",appSubtitle:"Deterministic Multi-Tab Preferences Engine",tabLabel:"Current Tab",activeTabsLabel:"Active Tabs",tabYouBadge:"This Tab",syncLatency:"Sync Latency",syncStatusConnected:"Connected & Listening",appearanceTitle:"Color Theme",appearanceDesc:"Switch seamlessly between dark and light color modes",lightMode:"Light Mode",darkMode:"Dark Mode",languageTitle:"Display Language",languageDesc:"Preferences propagate instantly to all open windows",fontSizeTitle:"Base Font Size",fontSizeDesc:"Fluid typography scales dynamically across the app",presetCompact:"Compact (14px)",presetNormal:"Standard (16px)",presetComfortable:"Medium (18px)",presetLarge:"Large (20px)",previewTitle:"Live Preview",previewDesc:"Real-time rendering of your active theme, language, and typography",previewCardTitle:"Real-Time State Synchronization",previewCardSubtitle:"Zero page refreshes • Sub-10ms delivery",previewCardBody:"Modify any setting in this window or open companion tabs. Updates synchronize across all open instances using the BroadcastChannel API with deterministic Lamport timestamp conflict resolution.",previewActionPrimary:"Test Action",previewActionSecondary:"Documentation",previewBadgeLive:"Live State",previewBadgeSynced:"Synchronized",toolsTitle:"Testing & Coordination",openNewTab:"Open Companion Tab",simulateConflict:"Simulate Race Condition",resetDefaults:"Reset to Defaults",telemetryTitle:"Sync Telemetry & Conflict Log",clearLogs:"Clear Log",telemetryEmpty:"No sync events recorded yet. Modify a setting to begin.",conflictModalNotice:"Simulated concurrent write resolved deterministically."},es:{appTitle:"SyncCore",appSubtitle:"Motor determinista de preferencias multi-pestaña",tabLabel:"Pestaña actual",activeTabsLabel:"Pestañas activas",tabYouBadge:"Esta pestaña",syncLatency:"Latencia de sincronización",syncStatusConnected:"Conectado y escuchando",appearanceTitle:"Tema de color",appearanceDesc:"Cambia fluidamente entre los modos oscuro y claro",lightMode:"Modo Claro",darkMode:"Modo Oscuro",languageTitle:"Idioma de visualización",languageDesc:"Las preferencias se propagan al instante a todas las pestañas",fontSizeTitle:"Tamaño de fuente base",fontSizeDesc:"La tipografía fluida se escala dinámicamente en la aplicación",presetCompact:"Compacto (14px)",presetNormal:"Estándar (16px)",presetComfortable:"Mediano (18px)",presetLarge:"Grande (20px)",previewTitle:"Vista previa en vivo",previewDesc:"Renderizado en tiempo real de tema, idioma y tipografía",previewCardTitle:"Sincronización de estado en tiempo real",previewCardSubtitle:"Sin recargas de página • Entrega sub-10ms",previewCardBody:"Modifica cualquier ajuste aquí o abre pestañas compañeras. Las actualizaciones se sincronizan mediante la API BroadcastChannel con resolución determinista mediante marcas de tiempo Lamport.",previewActionPrimary:"Acción de prueba",previewActionSecondary:"Documentación",previewBadgeLive:"Estado en vivo",previewBadgeSynced:"Sincronizado",toolsTitle:"Herramientas y pruebas",openNewTab:"Abrir pestaña compañera",simulateConflict:"Simular condición de carrera",resetDefaults:"Restablecer ajustes",telemetryTitle:"Telemetría y registro de conflictos",clearLogs:"Limpiar registro",telemetryEmpty:"No hay eventos registrados. Modifica un ajuste para comenzar.",conflictModalNotice:"Escritura concurrente simulada resuelta de forma determinista."},fr:{appTitle:"SyncCore",appSubtitle:"Moteur déterministe de préférences multi-onglets",tabLabel:"Onglet actuel",activeTabsLabel:"Onglets actifs",tabYouBadge:"Cet onglet",syncLatency:"Latence de synchro",syncStatusConnected:"Connecté et à l’écoute",appearanceTitle:"Thème visuel",appearanceDesc:"Basculez facilement entre les modes sombre et clair",lightMode:"Mode Clair",darkMode:"Mode Sombre",languageTitle:"Langue d’affichage",languageDesc:"Les préférences se propagent instantanément aux onglets",fontSizeTitle:"Taille de police",fontSizeDesc:"La typographie s’adapte dynamiquement dans toute l’application",presetCompact:"Compact (14px)",presetNormal:"Standard (16px)",presetComfortable:"Moyen (18px)",presetLarge:"Grand (20px)",previewTitle:"Aperçu en direct",previewDesc:"Rendu en temps réel du thème, de la langue et de la police",previewCardTitle:"Synchronisation d’état instantanée",previewCardSubtitle:"Zéro rechargement • Délai inférieur à 10ms",previewCardBody:"Modifiez un paramètre ici ou ouvrez d’autres onglets. Les mises à jour sont synchronisées via l’API BroadcastChannel avec résolution déterministe des conflits par horloges de Lamport.",previewActionPrimary:"Tester l’action",previewActionSecondary:"Documentation",previewBadgeLive:"État direct",previewBadgeSynced:"Synchronisé",toolsTitle:"Outils et tests",openNewTab:"Ouvrir un nouvel onglet",simulateConflict:"Simuler un conflit",resetDefaults:"Réinitialiser",telemetryTitle:"Télémétrie et journal des conflits",clearLogs:"Effacer le journal",telemetryEmpty:"Aucun événement pour le moment. Modifiez un paramètre pour débuter.",conflictModalNotice:"Conflit simultané simulé et résolu de façon déterministe."},de:{appTitle:"SyncCore",appSubtitle:"Deterministische Multi-Tab-Einstellungs-Engine",tabLabel:"Aktueller Tab",activeTabsLabel:"Aktive Tabs",tabYouBadge:"Dieser Tab",syncLatency:"Sync-Latenz",syncStatusConnected:"Verbunden & empfangsbereit",appearanceTitle:"Farbdesign",appearanceDesc:"Nahtloses Umschalten zwischen Hell- und Dunkelmodus",lightMode:"Heller Modus",darkMode:"Dunkler Modus",languageTitle:"Anzeigesprache",languageDesc:"Einstellungen werden sofort an alle offenen Fenster übertragen",fontSizeTitle:"Basis-Schriftgröße",fontSizeDesc:"Dynamische Typografie-Skalierung über die gesamte App",presetCompact:"Kompakt (14px)",presetNormal:"Standard (16px)",presetComfortable:"Mittel (18px)",presetLarge:"Groß (20px)",previewTitle:"Live-Vorschau",previewDesc:"Echtzeit-Anzeige von Design, Sprache und Typografie",previewCardTitle:"Echtzeit-Zustandssynchronisierung",previewCardSubtitle:"Kein Neuladen • Übertragung in unter 10ms",previewCardBody:"Ändern Sie Einstellungen hier oder öffnen Sie Partner-Tabs. Aktualisierungen synchronisieren sich über die BroadcastChannel-API mit deterministischer Lamport-Konfliktlösung.",previewActionPrimary:"Test-Aktion",previewActionSecondary:"Dokumentation",previewBadgeLive:"Live-Zustand",previewBadgeSynced:"Synchronisiert",toolsTitle:"Testwerkzeuge & Koordination",openNewTab:"Neuen Tab öffnen",simulateConflict:"Race Condition simulieren",resetDefaults:"Auf Standard zurücksetzen",telemetryTitle:"Sync-Telemetrie & Konfliktprotokoll",clearLogs:"Protokoll leeren",telemetryEmpty:"Noch keine Synchronisationsereignisse aufgezeichnet.",conflictModalNotice:"Simulierter Schreibkonflikt deterministisch aufgelöst."},ja:{appTitle:"SyncCore",appSubtitle:"決定論的マルチタブ状態同期エンジン",tabLabel:"現在のタブ",activeTabsLabel:"アクティブなタブ",tabYouBadge:"このタブ",syncLatency:"同期遅延",syncStatusConnected:"接続済み・受信待機中",appearanceTitle:"カラーテーマ",appearanceDesc:"ダークモードとライトモードをスムーズに切り替えます",lightMode:"ライトモード",darkMode:"ダークモード",languageTitle:"表示言語",languageDesc:"設定は開いているすべてのタブへ即時に反映されます",fontSizeTitle:"基本フォントサイズ",fontSizeDesc:"アプリ全体の文字サイズを動的に調整します",presetCompact:"コンパクト (14px)",presetNormal:"標準 (16px)",presetComfortable:"中 (18px)",presetLarge:"大 (20px)",previewTitle:"リアルタイムプレビュー",previewDesc:"アクティブなテーマ、言語、フォントが即座に反映されます",previewCardTitle:"リアルタイム状態同期",previewCardSubtitle:"ページ更新不要 • 10ms未満の超高速伝播",previewCardBody:"このウィンドウで設定を変更するか、新規タブを開いてみてください。BroadcastChannel APIと決定論的ランポートタイムスタンプにより、全インスタンスが完全に一致します。",previewActionPrimary:"アクションテスト",previewActionSecondary:"ドキュメント",previewBadgeLive:"リアルタイム状態",previewBadgeSynced:"同期完了",toolsTitle:"テスト & ツール",openNewTab:"別タブを開く",simulateConflict:"競合シミュレーション",resetDefaults:"初期設定に戻す",telemetryTitle:"同期テレメトリ & 競合ログ",clearLogs:"ログを消去",telemetryEmpty:"同期イベントはまだ記録されていません。設定を変更してください。",conflictModalNotice:"シミュレートされた同時書き込みが決定論的に解決されました。"},it:{appTitle:"SyncCore",appSubtitle:"Motore deterministico di preferenze multi-scheda",tabLabel:"Scheda corrente",activeTabsLabel:"Schede attive",tabYouBadge:"Questa scheda",syncLatency:"Latenza di sincronizzazione",syncStatusConnected:"Connesso e in ascolto",appearanceTitle:"Tema visivo",appearanceDesc:"Passa senza interruzioni tra modalità scura e chiara",lightMode:"Modalità Chiara",darkMode:"Modalità Scura",languageTitle:"Lingua dell’interfaccia",languageDesc:"Le preferenze si propagano istantaneamente a tutte le schede",fontSizeTitle:"Dimensione carattere base",fontSizeDesc:"La tipografia fluida scala dinamicamente nell’app",presetCompact:"Compatto (14px)",presetNormal:"Standard (16px)",presetComfortable:"Medio (18px)",presetLarge:"Grande (20px)",previewTitle:"Anteprima dal vivo",previewDesc:"Rendering in tempo reale di tema, lingua e tipografia",previewCardTitle:"Sincronizzazione dello stato in tempo reale",previewCardSubtitle:"Zero aggiornamenti di pagina • Consegna sub-10ms",previewCardBody:"Modifica qualsiasi impostazione in questa scheda o aprine di nuove. Gli aggiornamenti si sincronizzano con l’API BroadcastChannel con risoluzione deterministica dei conflitti Lamport.",previewActionPrimary:"Azione di test",previewActionSecondary:"Documentazione",previewBadgeLive:"Stato attivo",previewBadgeSynced:"Sincronizzato",toolsTitle:"Strumenti e test",openNewTab:"Apri nuova scheda",simulateConflict:"Simula race condition",resetDefaults:"Ripristina predefiniti",telemetryTitle:"Telemetria e registro conflitti",clearLogs:"Cancella registro",telemetryEmpty:"Nessun evento registrato. Modifica un’impostazione per iniziare.",conflictModalNotice:"Scrittura concorrente simulata risolta in modo deterministico."}};function v(p){return S[p]||S.en}const k=`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
  </svg>
`,m=`
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
`,b=`
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
`,E=`
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
  </svg>
`,$=`
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
`,z=`
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
  </svg>
`;class x{constructor(){o(this,"appEl");o(this,"currentPrefs");o(this,"isUserDraggingSlider",!1);this.appEl=document.getElementById("app"),this.currentPrefs=s.getPreferences(),this.buildInitialHTML(),this.bindEvents(),this.subscribeToManager(),this.updateUI(this.currentPrefs),this.renderTelemetry(s.getLogs()),this.updatePeers(s.getActivePeerCount(),s.getActivePeerIds())}buildInitialHTML(){const e=v(this.currentPrefs.language);this.appEl.innerHTML=`
      <div class="app-container">
        <!-- Top Navigation -->
        <header class="navbar">
          <div class="brand-section">
            <div class="brand-logo-icon">
              ${k}
            </div>
            <div class="brand-info">
              <h1 id="i18n-app-title">${e.appTitle}</h1>
              <p id="i18n-app-subtitle">${e.appSubtitle}</p>
            </div>
          </div>

          <div class="nav-badges">
            <span class="badge badge-primary" title="Unique identifier for this tab">
              <span class="pulse-dot"></span>
              <span id="tab-id-text">${s.tabId} (${e.tabYouBadge})</span>
            </span>
            <span class="badge" id="peer-count-badge" title="Number of open synchronized tabs">
              <span id="i18n-active-tabs">${e.activeTabsLabel}</span>: <strong id="peer-count-val">1</strong>
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
                    <span id="i18n-theme-heading">${e.appearanceTitle}</span>
                  </h2>
                  <p id="i18n-theme-desc">${e.appearanceDesc}</p>
                </div>
              </div>

              <div class="theme-control-container">
                <div class="theme-toggle-row">
                  <div class="theme-mode-label">
                    <span id="theme-active-label">${this.currentPrefs.darkMode?e.darkMode:e.lightMode}</span>
                  </div>
                  <label class="switch" for="dark-mode-toggle" aria-label="Toggle theme">
                    <input type="checkbox" id="dark-mode-toggle" ${this.currentPrefs.darkMode?"checked":""} />
                    <span class="slider-toggle">
                      <span class="toggle-thumb" id="toggle-thumb-icon">
                        ${this.currentPrefs.darkMode?b:m}
                      </span>
                    </span>
                  </label>
                </div>

                <div class="theme-segmented-pills">
                  <button type="button" class="theme-pill-btn ${this.currentPrefs.darkMode?"":"active"}" id="btn-theme-light">
                    ${m} <span id="i18n-pill-light">${e.lightMode}</span>
                  </button>
                  <button type="button" class="theme-pill-btn ${this.currentPrefs.darkMode?"active":""}" id="btn-theme-dark">
                    ${b} <span id="i18n-pill-dark">${e.darkMode}</span>
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
                    <span id="i18n-lang-heading">${e.languageTitle}</span>
                  </h2>
                  <p id="i18n-lang-desc">${e.languageDesc}</p>
                </div>
              </div>

              <div class="language-grid" id="language-grid">
                ${M.map(t=>`
                  <button
                    type="button"
                    class="lang-btn ${this.currentPrefs.language===t.code?"active":""}"
                    data-lang="${t.code}"
                  >
                    <span class="lang-flag">${t.flag}</span>
                    <span class="lang-native">${t.nativeName}</span>
                    <span class="lang-english">${t.name}</span>
                  </button>
                `).join("")}
              </div>
            </section>

            <!-- Typography & Font Size Card -->
            <section class="card">
              <div class="card-header">
                <div class="card-title-group">
                  <h2>
                    <span>🔤</span>
                    <span id="i18n-font-heading">${e.fontSizeTitle}</span>
                  </h2>
                  <p id="i18n-font-desc">${e.fontSizeDesc}</p>
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
                  <button type="button" class="font-preset-btn ${this.currentPrefs.fontSize===14?"active":""}" data-size="14">
                    14px
                  </button>
                  <button type="button" class="font-preset-btn ${this.currentPrefs.fontSize===16?"active":""}" data-size="16">
                    16px
                  </button>
                  <button type="button" class="font-preset-btn ${this.currentPrefs.fontSize===18?"active":""}" data-size="18">
                    18px
                  </button>
                  <button type="button" class="font-preset-btn ${this.currentPrefs.fontSize===20?"active":""}" data-size="20">
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
                    <span id="i18n-tools-heading">${e.toolsTitle}</span>
                  </h2>
                </div>
              </div>

              <div class="tools-row">
                <button type="button" class="btn btn-primary" id="btn-open-tab" title="Launch a new tab in this browser to test real-time sync">
                  ${E} <span id="i18n-btn-new-tab">${e.openNewTab}</span>
                </button>
                <button type="button" class="btn" id="btn-simulate-conflict" title="Simulates simultaneous competing writes across tabs to verify deterministic convergence">
                  ${$} <span id="i18n-btn-conflict">${e.simulateConflict}</span>
                </button>
                <button type="button" class="btn btn-danger-outline" id="btn-reset-prefs" title="Reverts all settings to system defaults across all tabs">
                  ${z} <span id="i18n-btn-reset">${e.resetDefaults}</span>
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
                    <span id="i18n-preview-heading">${e.previewTitle}</span>
                  </h2>
                  <p id="i18n-preview-desc">${e.previewDesc}</p>
                </div>
              </div>

              <div class="preview-display-card" id="preview-widget">
                <div class="preview-top-strip">
                  <div class="preview-badges-cluster">
                    <span class="badge badge-primary" id="i18n-preview-badge-live">${e.previewBadgeLive}</span>
                    <span class="badge badge-success" id="i18n-preview-badge-synced">${e.previewBadgeSynced}</span>
                  </div>
                  <span class="badge" id="preview-version-pill">v${this.currentPrefs.version}</span>
                </div>

                <div class="preview-content">
                  <h3 id="preview-title">${e.previewCardTitle}</h3>
                  <div class="preview-subtitle" id="preview-subtitle">${e.previewCardSubtitle}</div>
                  <p class="preview-body-text" id="preview-body">${e.previewCardBody}</p>
                </div>

                <div class="preview-actions-bar">
                  <button type="button" class="btn btn-primary" id="preview-btn-primary">
                    ${e.previewActionPrimary}
                  </button>
                  <button type="button" class="btn" id="preview-btn-secondary">
                    ${e.previewActionSecondary}
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
                    <span id="i18n-telemetry-heading">${e.telemetryTitle}</span>
                  </h2>
                  <p id="telemetry-subtitle">BroadcastChannel & Storage Event stream (< 100ms)</p>
                </div>
                <button type="button" class="btn" id="btn-clear-logs" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                  <span id="i18n-clear-logs">${e.clearLogs}</span>
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
    `}bindEvents(){var a,n,r,c,g,u;const e=document.getElementById("dark-mode-toggle");e==null||e.addEventListener("change",()=>{s.updatePreferences({darkMode:e.checked})}),(a=document.getElementById("btn-theme-light"))==null||a.addEventListener("click",()=>{s.updatePreferences({darkMode:!1})}),(n=document.getElementById("btn-theme-dark"))==null||n.addEventListener("click",()=>{s.updatePreferences({darkMode:!0})});const t=document.getElementById("language-grid");t==null||t.addEventListener("click",d=>{const l=d.target.closest(".lang-btn");l&&l.dataset.lang&&s.updatePreferences({language:l.dataset.lang})});const i=document.getElementById("font-size-slider");if(i){i.addEventListener("pointerdown",()=>{this.isUserDraggingSlider=!0}),window.addEventListener("pointerup",()=>{this.isUserDraggingSlider=!1});let d=null;i.addEventListener("input",()=>{const l=Number(i.value),h=document.getElementById("font-size-badge");h&&(h.textContent=`${l}px`),d&&cancelAnimationFrame(d),d=requestAnimationFrame(()=>{s.updatePreferences({fontSize:l})})})}document.querySelectorAll(".font-preset-btn").forEach(d=>{d.addEventListener("click",l=>{const h=Number(l.currentTarget.dataset.size);h&&s.updatePreferences({fontSize:h})})}),(r=document.getElementById("btn-open-tab"))==null||r.addEventListener("click",()=>{window.open(window.location.href,"_blank")}),(c=document.getElementById("btn-simulate-conflict"))==null||c.addEventListener("click",()=>{s.simulateConflict()}),(g=document.getElementById("btn-reset-prefs"))==null||g.addEventListener("click",()=>{s.resetPreferences()}),(u=document.getElementById("btn-clear-logs"))==null||u.addEventListener("click",()=>{s.clearLogs()})}subscribeToManager(){s.subscribe(e=>{this.currentPrefs=e,this.updateUI(e)}),s.subscribeLogs(e=>{this.renderTelemetry(e)}),s.subscribePeers((e,t)=>{this.updatePeers(e,t)}),s.subscribeLatency(e=>{this.updateLatency(e)})}updateUI(e){const t=v(e.language);this.setText("i18n-app-title",t.appTitle),this.setText("i18n-app-subtitle",t.appSubtitle),this.setText("tab-id-text",`${s.tabId} (${t.tabYouBadge})`),this.setText("i18n-active-tabs",t.activeTabsLabel),this.setText("i18n-theme-heading",t.appearanceTitle),this.setText("i18n-theme-desc",t.appearanceDesc),this.setText("theme-active-label",e.darkMode?t.darkMode:t.lightMode),this.setText("i18n-pill-light",t.lightMode),this.setText("i18n-pill-dark",t.darkMode),this.setText("i18n-lang-heading",t.languageTitle),this.setText("i18n-lang-desc",t.languageDesc),this.setText("i18n-font-heading",t.fontSizeTitle),this.setText("i18n-font-desc",t.fontSizeDesc),this.setText("i18n-tools-heading",t.toolsTitle),this.setText("i18n-btn-new-tab",t.openNewTab),this.setText("i18n-btn-conflict",t.simulateConflict),this.setText("i18n-btn-reset",t.resetDefaults),this.setText("i18n-preview-heading",t.previewTitle),this.setText("i18n-preview-desc",t.previewDesc),this.setText("i18n-preview-badge-live",t.previewBadgeLive),this.setText("i18n-preview-badge-synced",t.previewBadgeSynced),this.setText("preview-title",t.previewCardTitle),this.setText("preview-subtitle",t.previewCardSubtitle),this.setText("preview-body",t.previewCardBody),this.setText("preview-btn-primary",t.previewActionPrimary),this.setText("preview-btn-secondary",t.previewActionSecondary),this.setText("preview-version-pill",`v${e.version}`),this.setText("i18n-telemetry-heading",t.telemetryTitle),this.setText("i18n-clear-logs",t.clearLogs);const i=document.getElementById("dark-mode-toggle");i&&i.checked!==e.darkMode&&(i.checked=e.darkMode);const a=document.getElementById("toggle-thumb-icon");a&&(a.innerHTML=e.darkMode?b:m);const n=document.getElementById("theme-icon-header");n&&(n.textContent=e.darkMode?"🌙":"☀️");const r=document.getElementById("btn-theme-light"),c=document.getElementById("btn-theme-dark");r&&r.classList.toggle("active",!e.darkMode),c&&c.classList.toggle("active",e.darkMode),document.querySelectorAll(".lang-btn").forEach(d=>{const l=d.dataset.lang;d.classList.toggle("active",l===e.language)});const g=document.getElementById("font-size-badge");g&&(g.textContent=`${e.fontSize}px`);const u=document.getElementById("font-size-slider");u&&!this.isUserDraggingSlider&&Number(u.value)!==e.fontSize&&(u.value=String(e.fontSize)),document.querySelectorAll(".font-preset-btn").forEach(d=>{const l=Number(d.dataset.size);d.classList.toggle("active",l===e.fontSize)})}updatePeers(e,t){const i=document.getElementById("peer-count-val");i&&(i.textContent=String(e));const a=document.getElementById("peer-count-badge");if(a){const n=t.length>0?`Active: ${s.tabId} (You), ${t.join(", ")}`:"Only this tab active";a.setAttribute("title",n)}}updateLatency(e){const t=document.getElementById("latency-text");t&&(t.textContent=`${e}ms`);const i=document.getElementById("latency-badge");i&&(i.classList.remove("pulse-flash"),i.offsetWidth,i.classList.add("pulse-flash"))}renderTelemetry(e){const t=document.getElementById("telemetry-feed");if(t){if(e.length===0){const i=v(this.currentPrefs.language);t.innerHTML=`<div class="log-empty-state">${i.telemetryEmpty}</div>`;return}t.innerHTML=e.map(i=>{let a="log-tag-system",n="SYS";i.type==="local_update"?(a="log-tag-local",n="LOCAL"):i.type==="remote_sync"?(a="log-tag-remote",n="SYNC"):i.type==="conflict_resolved"&&(a="log-tag-conflict",n="CONFLICT");const c=i.sourceTab===s.tabId?`${i.sourceTab} (You)`:i.sourceTab,g=i.timestamp.toTimeString().split(" ")[0]+"."+String(i.timestamp.getMilliseconds()).padStart(3,"0"),u=i.latencyMs!==void 0?` • ${i.latencyMs}ms`:"";return`
          <div class="log-entry">
            <div class="log-entry-header">
              <span class="log-tag ${a}">${n}</span>
              <span>${g} • ${c}${u}</span>
            </div>
            <div class="log-message">${this.escapeHTML(i.message)}</div>
            ${i.details?`<div class="log-details">${this.escapeHTML(i.details)}</div>`:""}
          </div>
        `}).join("")}}setText(e,t){const i=document.getElementById(e);i&&(i.textContent=t)}escapeHTML(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}}new x;
