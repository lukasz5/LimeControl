import { useEffect, useState } from 'react';
import {
  CalendarClock,
  ClipboardList,
  Moon,
  Server,
  Sun,
  Users,
} from 'lucide-react';
import { InstancesView } from './components/InstancesView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ParticipantsView } from './components/ParticipantsView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ScheduleView } from './components/ScheduleView';
import { SurveysView } from './components/SurveysView';
import {
  getSessionKey,
  getSiteSettings,
  LimeSurveyRpcError,
  listSurveys,
  releaseSessionKey,
  subscribeRpcTrace,
} from './services/limeSurveyRpc';
import type {
  ActiveSession,
  AppTab,
  ConnectionMode,
  InstanceProfile,
  LimeSurveyItem,
  RpcTraceEntry,
} from './types/limesurvey';

const PROFILES_KEY = 'limecontrol_profiles_v1';
const THEME_KEY = 'limecontrol_theme_v1';

function loadStoredProfiles(): InstanceProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  const [tab, setTab] = useState<AppTab>('instances');
  const [profiles, setProfiles] = useState<InstanceProfile[]>(() =>
    loadStoredProfiles()
  );
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    null
  );
  const [surveys, setSurveys] = useState<LimeSurveyItem[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<{
    message: string;
    isCors: boolean;
  } | null>(null);
  const [rpcTraces, setRpcTraces] = useState<RpcTraceEntry[]>([]);
  const [preselectedSid, setPreselectedSid] = useState<number | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    } catch {
      // Ignore storage errors
    }
  }, [profiles]);

  useEffect(() => {
    return subscribeRpcTrace((entry) => {
      setRpcTraces((prev) => [entry, ...prev].slice(0, 60));
    });
  }, []);

  async function refreshSurveysForSession(session: ActiveSession) {
    setLoadingSurveys(true);
    try {
      const list = await listSurveys(
        session.rpcEndpoint,
        session.sessionKey,
        undefined,
        session.connectionMode
      );
      setSurveys(list);
    } finally {
      setLoadingSurveys(false);
    }
  }

  async function handleConnectProfile(
    profile: InstanceProfile,
    overridePassword?: string
  ) {
    const pass = overridePassword ?? profile.password;
    setConnecting(true);
    setConnectionError(null);

    try {
      const key = await getSessionKey(
        profile.rpcEndpoint,
        profile.username,
        pass,
        profile.authPlugin || 'Authdb',
        profile.connectionMode
      );

      let sitename: string | undefined;
      try {
        const siteVal = await getSiteSettings(
          profile.rpcEndpoint,
          key,
          'sitename',
          profile.connectionMode
        );
        if (typeof siteVal === 'string') {
          sitename = siteVal;
        }
      } catch {
        // Optional metadata
      }

      const session: ActiveSession = {
        profileId: profile.id,
        profileName: sitename || profile.name,
        rpcEndpoint: profile.rpcEndpoint,
        username: profile.username,
        authPlugin: profile.authPlugin || 'Authdb',
        connectionMode: profile.connectionMode,
        sessionKey: key,
        connectedAt: new Date().toISOString(),
      };

      setActiveSession(session);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id
            ? {
                ...p,
                lastConnectedAt: new Date().toISOString(),
                siteName: sitename || p.siteName,
              }
            : p
        )
      );

      await refreshSurveysForSession(session);
      setTab('surveys');
    } catch (err) {
      const isCors =
        err instanceof LimeSurveyRpcError ? err.isCorsOrNetwork : false;
      const message = err instanceof Error ? err.message : String(err);
      setConnectionError({ message, isCors });
    } finally {
      setConnecting(false);
    }
  }

  function handleSaveProfile(profile: InstanceProfile) {
    setProfiles((prev) => {
      const existing = prev.findIndex((p) => p.id === profile.id);
      if (existing >= 0) {
        const next = [...prev];
        next[existing] = profile;
        return next;
      }
      return [profile, ...prev];
    });
  }

  function handleDeleteProfile(profileId: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== profileId));
    if (activeSession?.profileId === profileId) {
      setActiveSession(null);
      setSurveys([]);
    }
  }

  function handleSwitchConnectionMode(
    profileId: string,
    mode: ConnectionMode
  ) {
    setProfiles((prev) =>
      prev.map((p) => (p.id === profileId ? { ...p, connectionMode: mode } : p))
    );
  }

  async function handleDisconnect() {
    if (activeSession) {
      try {
        await releaseSessionKey(
          activeSession.rpcEndpoint,
          activeSession.sessionKey,
          activeSession.connectionMode
        );
      } catch {
        // Ignore release failures on disconnect
      }
    }
    setActiveSession(null);
    setSurveys([]);
  }

  const activeProfile =
    profiles.find((p) => p.id === activeSession?.profileId) ||
    profiles[0] ||
    null;

  const navItems: Array<{
    id: AppTab;
    label: string;
    icon: typeof ClipboardList;
  }> = [
    { id: 'surveys', label: 'Ankiety', icon: ClipboardList },
    { id: 'schedule', label: 'Harmonogram', icon: CalendarClock },
    { id: 'participants', label: 'Uczestnicy', icon: Users },
    { id: 'instances', label: 'Instancje', icon: Server },
  ];

  const activeNavTitle =
    navItems.find((item) => item.id === tab)?.label || 'LimeControl';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sticky Header: 3-zone contract on desktop, compact 52px App Bar on mobile */}
      <header className="sticky top-0 z-30 h-[54px] md:h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-8 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setTab('surveys')}
            className="font-display text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            LimeControl
          </button>

          <nav
            aria-label="Nawigacja główna"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`py-2 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    active
                      ? 'border-emerald-600 text-slate-900 dark:text-white font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <span className="md:hidden text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {activeNavTitle}
          </span>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={
                darkMode ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'
              }
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 pt-5 pb-24 md:pb-10">
        {tab === 'surveys' && (
          <SurveysView
            activeSession={activeSession}
            surveys={surveys}
            loadingSurveys={loadingSurveys}
            onRefreshSurveys={async () => {
              if (activeSession) await refreshSurveysForSession(activeSession);
            }}
            onScheduleSurvey={(sid) => {
              setPreselectedSid(sid);
              setTab('schedule');
            }}
            onOpenParticipants={(sid) => {
              setPreselectedSid(sid);
              setTab('participants');
            }}
            onGoToInstances={() => setTab('instances')}
          />
        )}

        {tab === 'schedule' && (
          <ScheduleView
            activeSession={activeSession}
            activeProfile={activeProfile}
            surveys={surveys}
            preselectedSurveyId={preselectedSid}
            onJobExecuted={() => {
              if (activeSession) void refreshSurveysForSession(activeSession);
            }}
          />
        )}

        {tab === 'participants' && (
          <ParticipantsView
            activeSession={activeSession}
            surveys={surveys}
            preselectedSurveyId={preselectedSid}
            onGoToInstances={() => setTab('instances')}
          />
        )}

        {tab === 'instances' && (
          <InstancesView
            profiles={profiles}
            activeSession={activeSession}
            connecting={connecting}
            connectionError={connectionError}
            rpcTraces={rpcTraces}
            onConnectProfile={handleConnectProfile}
            onSaveProfile={handleSaveProfile}
            onDeleteProfile={handleDeleteProfile}
            onDisconnect={handleDisconnect}
            onSwitchConnectionMode={handleSwitchConnectionMode}
            onClearTraces={() => setRpcTraces([])}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Tab Bar (Thumb Zone) */}
      <nav
        aria-label="Dolna nawigacja mobilna"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-safe"
      >
        <div className="grid grid-cols-4 h-16 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
                <span className="mt-1 text-[11px] font-semibold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <OfflineIndicator />
    </div>
  );
}
