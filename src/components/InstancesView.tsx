import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Code2,
  Copy,
  Download,
  ExternalLink,
  KeyRound,
  LogOut,
  Plus,
  Search,
  Server,
  ShieldCheck,
  Terminal,
  Trash2,
} from 'lucide-react';
import {
  LimeSurveyRpcError,
  normalizeRpcEndpoint,
} from '../services/limeSurveyRpc';
import {
  downloadReactNativeZip,
  generateReactNativeProject,
} from '../services/reactNativeExporter';
import type {
  ActiveSession,
  ConnectionMode,
  InstanceProfile,
  LimeSurveyVersion,
  RpcTraceEntry,
} from '../types/limesurvey';

interface InstancesViewProps {
  profiles: InstanceProfile[];
  activeSession: ActiveSession | null;
  connecting: boolean;
  connectionError: { message: string; isCors: boolean } | null;
  rpcTraces: RpcTraceEntry[];
  onConnectProfile: (profile: InstanceProfile, overridePassword?: string) => Promise<void>;
  onSaveProfile: (profile: InstanceProfile) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  onSwitchConnectionMode: (profileId: string, mode: ConnectionMode) => Promise<void>;
  onSwitchLimeVersion: (profileId: string, version: LimeSurveyVersion) => Promise<void>;
  onClearTraces: () => void;
}

type SubPanel = 'connections' | 'react-native' | 'rpc-log';

export const InstancesView: React.FC<InstancesViewProps> = ({
  profiles,
  activeSession,
  connecting,
  connectionError,
  rpcTraces,
  onConnectProfile,
  onSaveProfile,
  onDeleteProfile,
  onDisconnect,
  onSwitchConnectionMode,
  onSwitchLimeVersion,
  onClearTraces,
}) => {
  const [subPanel, setSubPanel] = useState<SubPanel>('connections');
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authPlugin, setAuthPlugin] = useState('Authdb');
  const [savePassword, setSavePassword] = useState(false);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('direct');
  const [limeVersion, setLimeVersion] = useState<LimeSurveyVersion>('auto');
  const [formError, setFormError] = useState<string | null>(null);

  const [promptProfile, setPromptProfile] = useState<InstanceProfile | null>(null);
  const [promptPassword, setPromptPassword] = useState('');
  const [profileSearch, setProfileSearch] = useState('');
  const [profileModeFilter, setProfileModeFilter] = useState<'all' | ConnectionMode>('all');

  const filteredProfiles = useMemo(() => {
    const q = profileSearch.trim().toLowerCase();
    return profiles.filter((p) => {
      if (profileModeFilter !== 'all' && p.connectionMode !== profileModeFilter) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.baseUrl.toLowerCase().includes(q) ||
        p.rpcEndpoint.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        (p.authPlugin || '').toLowerCase().includes(q)
      );
    });
  }, [profiles, profileSearch, profileModeFilter]);

  // React Native Exporter state
  const rnFiles = useMemo(
    () =>
      generateReactNativeProject(
        profiles,
        typeof window !== 'undefined' ? window.location.origin : ''
      ),
    [profiles]
  );
  const [selectedRnFile, setSelectedRnFile] = useState<string>('App.tsx');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const activeRnFile =
    rnFiles.find((f) => f.path === selectedRnFile) || rnFiles[0];

  async function handleCreateAndConnect(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      const normalized = normalizeRpcEndpoint(baseUrl);
      if (!username.trim() || !password) {
        setFormError('Podaj nazwę użytkownika oraz hasło administratora.');
        return;
      }

      const profile: InstanceProfile = {
        id: `inst_${Date.now()}`,
        name: name.trim() || new URL(normalized.baseUrl).hostname,
        baseUrl: normalized.baseUrl,
        rpcEndpoint: normalized.rpcEndpoint,
        username: username.trim(),
        password: savePassword ? password : '',
        savePassword,
        authPlugin: authPlugin.trim() || 'Authdb',
        connectionMode,
        limeVersion,
      };

      await onSaveProfile(profile);
      await onConnectProfile(profile, password);
      setName('');
      setBaseUrl('');
      setUsername('');
      setPassword('');
    } catch (err) {
      if (err instanceof LimeSurveyRpcError) {
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : String(err));
      }
    }
  }

  async function handleCopyFile(path: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  }

  async function handleDownloadZip() {
    setDownloadingZip(true);
    try {
      await downloadReactNativeZip(
        profiles,
        typeof window !== 'undefined' ? window.location.origin : ''
      );
    } finally {
      setDownloadingZip(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Instancje LimeSurvey i kod React Native
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Łącz się bezpośrednio przez JSON-RPC z dowolnym serwerem lub wyeksportuj projekt Expo.
          </p>
        </div>

        <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 self-start">
          <button
            type="button"
            onClick={() => setSubPanel('connections')}
            className={`min-h-[40px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subPanel === 'connections'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Profile ({profiles.length})
          </button>
          <button
            type="button"
            onClick={() => setSubPanel('react-native')}
            className={`min-h-[40px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subPanel === 'react-native'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Eksport React Native
          </button>
          <button
            type="button"
            onClick={() => setSubPanel('rpc-log')}
            className={`min-h-[40px] rounded-lg px-3.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              subPanel === 'rpc-log'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Log RPC ({rpcTraces.length})
          </button>
        </div>
      </div>

      {subPanel === 'connections' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          <div className="lg:col-span-7 space-y-4">
            {activeSession && (
              <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50/60 dark:bg-emerald-950/30 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      <span>Aktywna sesja RemoteControl 2</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeSession.profileName}
                    </h3>
                    <p className="font-mono text-xs text-slate-600 dark:text-slate-300 break-all">
                      {activeSession.rpcEndpoint}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Użytkownik: {activeSession.username} · Tryb:{' '}
                      {activeSession.connectionMode === 'direct'
                        ? 'Bezpośredni JSON-RPC'
                        : 'Przekaźnik serwerowy'}{' '}
                      · Wersja:{' '}
                      {activeSession.limeVersion === 'v7'
                        ? 'LimeSurvey 7.x (UTC)'
                        : activeSession.limeVersion === 'legacy'
                          ? 'LimeSurvey 3–6'
                          : 'Automatyczna'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void onDisconnect();
                    }}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    <span>Rozłącz sesję</span>
                  </button>
                </div>
              </div>
            )}

            {connectionError && (
              <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-5 text-sm text-rose-900 dark:text-rose-200 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div>
                    <div className="font-semibold">Błąd połączenia JSON-RPC</div>
                    <p className="mt-1 text-xs leading-relaxed">
                      {connectionError.message}
                    </p>
                  </div>
                </div>

                {connectionError.isCors && (
                  <div className="rounded-xl bg-white/80 dark:bg-slate-900/80 p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-2 border border-rose-200/70 dark:border-rose-900/40">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Diagnostyka CORS w przeglądarce
                    </p>
                    <p>
                      Docelowa instancja LimeSurvey nie zwraca nagłówka{' '}
                      <code className="font-mono text-rose-700 dark:text-rose-300">
                        Access-Control-Allow-Origin
                      </code>
                      . Możesz:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Przełączyć profil na tryb{' '}
                        <strong>Przekaźnik serwerowy</strong> (poniżej na karcie profilu),
                        aby połączyć się z poziomu serwera aplikacji.
                      </li>
                      <li>
                        Lub wyeksportować gotowy projekt <strong>React Native</strong> w zakładce obok — aplikacja natywna na iOS/Android nie podlega CORS.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Zapisane profile instancji
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {filteredProfiles.length === profiles.length
                      ? `Łącznie: ${profiles.length}`
                      : `Wyniki: ${filteredProfiles.length} / ${profiles.length}`}
                  </span>
                </div>

                {profiles.length > 0 && (
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Search
                        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                        aria-hidden="true"
                      />
                      <input
                        type="search"
                        value={profileSearch}
                        onChange={(e) => setProfileSearch(e.target.value)}
                        placeholder="Szukaj po nazwie, URL lub loginie..."
                        aria-label="Szukaj zapisanych instancji"
                        className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-10 pr-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 self-start shrink-0">
                      <button
                        type="button"
                        onClick={() => setProfileModeFilter('all')}
                        className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                          profileModeFilter === 'all'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Wszystkie
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileModeFilter('direct')}
                        className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                          profileModeFilter === 'direct'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Bezpośredni
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileModeFilter('relay')}
                        className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold transition-colors whitespace-nowrap ${
                          profileModeFilter === 'relay'
                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        Przekaźnik
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {profiles.length === 0 ? (
                <div className="p-8 text-center">
                  <Server className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                    Brak zapisanych instancji LimeSurvey
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Dodaj adres swojego serwera LimeSurvey w formularzu obok. Pamiętaj o włączeniu JSON-RPC w{' '}
                    <span className="font-medium">Ustawienia globalne → Interfejsy</span>.
                  </p>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Brak profili pasujących do wyszukiwania
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileSearch('');
                      setProfileModeFilter('all');
                    }}
                    className="min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Wyczyść filtry
                  </button>
                </div>
              ) : (
                filteredProfiles.map((profile) => {
                  const isActive = activeSession?.profileId === profile.id;
                  return (
                    <div
                      key={profile.id}
                      className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                            {profile.name}
                          </span>
                          {isActive && (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              · Połączono
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400 truncate">
                          {profile.rpcEndpoint}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>Login: {profile.username}</span>
                          <span aria-hidden="true">·</span>
                          <span>Plugin: {profile.authPlugin || 'Authdb'}</span>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={() => {
                              void onSwitchConnectionMode(
                                profile.id,
                                profile.connectionMode === 'direct' ? 'relay' : 'direct'
                              );
                            }}
                            className="underline decoration-slate-300 dark:decoration-slate-700 hover:text-slate-900 dark:hover:text-white"
                          >
                            {profile.connectionMode === 'direct'
                              ? 'Tryb: Bezpośredni JSON-RPC (zmień)'
                              : 'Tryb: Przekaźnik CORS (zmień)'}
                          </button>
                          <span aria-hidden="true">·</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVer: LimeSurveyVersion =
                                profile.limeVersion === 'auto'
                                  ? 'v7'
                                  : profile.limeVersion === 'v7'
                                    ? 'legacy'
                                    : 'auto';
                              void onSwitchLimeVersion(profile.id, nextVer);
                            }}
                            className="underline decoration-slate-300 dark:decoration-slate-700 hover:text-slate-900 dark:hover:text-white"
                          >
                            {profile.limeVersion === 'v7'
                              ? 'Wersja: LS 7.x UTC (zmień)'
                              : profile.limeVersion === 'legacy'
                                ? 'Wersja: LS 3–6 (zmień)'
                                : 'Wersja: Auto (zmień)'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={connecting}
                          onClick={() => {
                            if (profile.password) {
                              void onConnectProfile(profile);
                            } else {
                              setPromptProfile(profile);
                              setPromptPassword('');
                            }
                          }}
                          className="min-h-[44px] rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                        >
                          {connecting ? 'Łączenie...' : isActive ? 'Odśwież sesję' : 'Połącz'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void onDeleteProfile(profile.id);
                          }}
                          aria-label={`Usuń profil ${profile.name}`}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <form
            onSubmit={handleCreateAndConnect}
            className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Dodaj instancję LimeSurvey
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Obsługuje LimeSurvey 3.x, 5.x, 6.x oraz 7.x z włączonym interfejsem JSON-RPC. Profile zapisują się w Cloud Firestore (bez haseł).
              </p>
            </div>

            {formError && (
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-800 dark:text-rose-200">
                {formError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nazwa własna (opcjonalna)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Produkcja uczelnia / Klient ABC"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Adres URL instancji lub endpoint RPC
                </label>
                <input
                  type="text"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://twoje-ankiety.pl"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 font-mono text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Domyślnie uzupełniane do <code className="font-mono">/index.php/admin/remotecontrol</code>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Login administratora
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Hasło
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Plugin uwierzytelniania
                  </label>
                  <input
                    type="text"
                    value={authPlugin}
                    onChange={(e) => setAuthPlugin(e.target.value)}
                    placeholder="Authdb"
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 font-mono text-xs text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tryb połączenia
                  </label>
                  <select
                    value={connectionMode}
                    onChange={(e) => setConnectionMode(e.target.value as ConnectionMode)}
                    className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="direct">Bezpośredni JSON-RPC</option>
                    <option value="relay">Przekaźnik serwerowy (obejście CORS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Wersja serwera LimeSurvey
                </label>
                <select
                  value={limeVersion}
                  onChange={(e) => setLimeVersion(e.target.value as LimeSurveyVersion)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-medium text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="auto">Automatyczna (zgodna z RC2)</option>
                  <option value="v7">LimeSurvey 7.x (daty UTC + nowe kody błędów)</option>
                  <option value="legacy">LimeSurvey 3.x–6.x (czas lokalny serwera)</option>
                </select>
              </div>

              <label className="flex min-h-[44px] items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={savePassword}
                  onChange={(e) => setSavePassword(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Zapamiętaj hasło tylko w pamięci tej sesji (nie jest zapisywane w bazie ani w przeglądarce)</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={connecting}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span>{connecting ? 'Uwierzytelnianie...' : 'Zapisz profil i połącz'}</span>
            </button>

            <a
              href="https://api.limesurvey.org/classes/remotecontrol-handle.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dokumentacja klasy remotecontrol_handle</span>
            </a>
          </form>
        </div>
      )}

      {subPanel === 'react-native' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Code2 className="h-4 w-4" aria-hidden="true" />
                <span>Generator natywnej aplikacji mobilnej</span>
              </div>
              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                Projekt React Native (Expo + TypeScript)
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Zawiera zapisane profile instancji, natywnego klienta JSON-RPC bez blokad CORS oraz integrację z harmonogramem serwera.
              </p>
            </div>

            <button
              type="button"
              disabled={downloadingZip}
              onClick={() => {
                void handleDownloadZip();
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>{downloadingZip ? 'Pakowanie ZIP...' : 'Pobierz projekt ZIP'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 p-3 flex lg:flex-col gap-1.5 overflow-x-auto">
              {rnFiles.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedRnFile(file.path)}
                  className={`min-h-[44px] rounded-xl px-3.5 py-2 text-left font-mono text-xs transition-colors whitespace-nowrap shrink-0 ${
                    activeRnFile.path === file.path
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {file.path}
                </button>
              ))}
            </div>

            <div className="lg:col-span-8 flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40">
                <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                  {activeRnFile.path}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void handleCopyFile(activeRnFile.path, activeRnFile.content);
                  }}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800"
                >
                  {copiedPath === activeRnFile.path ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Skopiowano</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Kopiuj kod</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-800 dark:text-slate-200 overflow-x-auto max-h-[460px] leading-relaxed bg-slate-50/40 dark:bg-slate-950/70">
                <code>{activeRnFile.content}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {subPanel === 'rpc-log' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Rejestr wywołań JSON-RPC sesji
              </h3>
            </div>
            {rpcTraces.length > 0 && (
              <button
                type="button"
                onClick={onClearTraces}
                className="min-h-[36px] rounded-lg px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Wyczyść
              </button>
            )}
          </div>

          {rpcTraces.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Brak wywołań RPC w tej sesji. Po wykonaniu operacji zobaczysz tu dokładne metody i czasy odpowiedzi.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {rpcTraces.map((trace) => (
                <div key={trace.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-semibold ${
                          trace.ok
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {trace.ok ? 'OK' : 'BŁĄD'}
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white">
                        {trace.method}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {trace.durationMs} ms
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 break-words">
                      {trace.summary}
                    </p>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0 tabular-nums">
                    {new Date(trace.timestamp).toLocaleTimeString('pl-PL')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {promptProfile && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="mx-auto h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Podaj hasło dla {promptProfile.name}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ten profil nie zapisuje hasła na urządzeniu. Wpisz hasło jednorazowo dla użytkownika{' '}
              <span className="font-mono font-semibold">{promptProfile.username}</span>.
            </p>
            <input
              type="password"
              autoFocus
              value={promptPassword}
              onChange={(e) => setPromptPassword(e.target.value)}
              placeholder="Hasło LimeSurvey"
              className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 text-sm text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPromptProfile(null)}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={!promptPassword || connecting}
                onClick={async () => {
                  const target = promptProfile;
                  const pass = promptPassword;
                  setPromptProfile(null);
                  await onConnectProfile(target, pass);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Połącz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
