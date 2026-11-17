import { useEffect, useRef, useState } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import {
  CalendarClock,
  ClipboardList,
  LogOut,
  Moon,
  Server,
  Sun,
  Users,
} from 'lucide-react';
import { AuthGate } from './components/AuthGate';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InstancesView } from './components/InstancesView';
import {
  NotificationProvider,
  useNotifications,
} from './components/NotificationProvider';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ParticipantsView } from './components/ParticipantsView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ScheduleView } from './components/ScheduleView';
import { SurveysView } from './components/SurveysView';
import { auth, signOutUser } from './firebase';
import {
  deleteInstanceFromFirestore,
  ensureUserProfile,
  saveInstanceToFirestore,
  subscribeUserInstances,
  updateInstanceConnectionModeInFirestore,
  updateInstanceLastConnectedInFirestore,
  updateInstanceLimeVersionInFirestore,
} from './services/firestoreInstances';
import {
  getSessionKey,
  getSiteSettings,
  LimeSurveyRpcError,
  listSurveys,
  releaseSessionKey,
  subscribeRpcTrace,
} from './services/limeSurveyRpc';
import { fetchSchedules } from './services/schedulerApi';
import type {
  ActiveSession,
  AppTab,
  ConnectionMode,
  InstanceProfile,
  LimeSurveyItem,
  LimeSurveyVersion,
  RpcTraceEntry,
  ScheduleJob,
} from './types/limesurvey';
import { BrandLogo } from './components/BrandLogo';
import { AppFooter } from './components/AppFooter';
import { LanguageSwitch } from './components/LanguageSwitch';
import { t, useLang } from './i18n';

const LEGACY_PROFILES_KEY = 'limecontrol_profiles_v1';
const THEME_KEY = 'limecontrol_theme_v1';

function AppContent() {
  // Subskrypcja języka: zmiana PL/EN przerenderowuje całe drzewo widoków.
  useLang();
  const { notify } = useNotifications();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [tab, setTab] = useState<AppTab>('instances');
  const [profiles, setProfiles] = useState<InstanceProfile[]>([]);
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

  const runtimePasswordsRef = useRef<Record<string, string>>({});
  const knownJobStatusesRef = useRef<Map<string, ScheduleJob['status']> | null>(
    null
  );
  const activeSessionRef = useRef<ActiveSession | null>(null);
  activeSessionRef.current = activeSession;

  // Purge legacy localStorage profile storage so credentials/instances are never kept in browser storage
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_PROFILES_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  }, [darkMode]);

  useEffect(() => {
    let unsubscribeInstances: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeInstances) {
        unsubscribeInstances();
        unsubscribeInstances = null;
      }

      if (!user) {
        setAuthUser(null);
        setProfiles([]);
        setActiveSession(null);
        setSurveys([]);
        runtimePasswordsRef.current = {};
        knownJobStatusesRef.current = null;
        setAuthLoading(false);
        return;
      }

      setAuthUser(user);
      setAuthError(null);
      setAuthLoading(false);

      void ensureUserProfile(user).catch((err) => {
        setAuthError(err instanceof Error ? err.message : String(err));
      });

      unsubscribeInstances = subscribeUserInstances(
        user.uid,
        (cloudProfiles) => {
          setProfiles(
            cloudProfiles.map((item) => ({
              ...item,
              password: runtimePasswordsRef.current[item.id] || '',
              savePassword: Boolean(runtimePasswordsRef.current[item.id]),
            }))
          );
        },
        (err) => {
          notify({
            type: 'error',
            title: t('Błąd synchronizacji bazy danych'),
            message: err.message,
            dedupeKey: 'firestore:sync',
          });
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeInstances) {
        unsubscribeInstances();
      }
    };
  }, [notify]);

  useEffect(() => {
    return subscribeRpcTrace((entry) => {
      setRpcTraces((prev) => [entry, ...prev].slice(0, 60));

      if (!entry.ok) {
        const isExpectedProbe =
          (entry.method === 'get_summary' &&
            /no data|not active|no survey/i.test(entry.summary)) ||
          (entry.method === 'list_participants' &&
            /no token table|not exist|no data/i.test(entry.summary));

        if (!isExpectedProbe) {
          notify({
            type: 'error',
            title: t('Błąd komunikacji z API ({0})', entry.method),
            message: entry.summary,
            actionLabel: t('Log RPC'),
            onAction: () => setTab('instances'),
            dedupeKey: `rpc:${entry.method}:${entry.summary}`,
          });
        }
      }
    });
  }, [notify]);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;

    const pollSchedules = async () => {
      try {
        const jobs = await fetchSchedules();
        if (cancelled) return;

        const prevMap = knownJobStatusesRef.current;
        const nextMap = new Map<string, ScheduleJob['status']>();
        let shouldRefreshSurveys = false;

        for (const job of jobs) {
          nextMap.set(job.id, job.status);
          if (prevMap !== null) {
            const previousStatus = prevMap.get(job.id);
            const transitionedFromActive =
              previousStatus === 'scheduled' || previousStatus === 'running';

            if (transitionedFromActive && job.status === 'completed') {
              shouldRefreshSurveys = true;
              notify({
                type: 'success',
                title: t('Zaplanowana aktywacja zakończona'),
                message: t('Ankieta #{0} ({1}) została pomyślnie aktywowana.', job.surveyId, job.surveyTitle),
                actionLabel: t('Harmonogram'),
                onAction: () => setTab('schedule'),
                dedupeKey: `job:${job.id}:completed`,
              });
            } else if (transitionedFromActive && job.status === 'failed') {
              notify({
                type: 'error',
                title: t('Błąd zadania harmonogramu (#{0})', job.surveyId),
                message: job.resultMessage,
                actionLabel: t('Szczegóły'),
                onAction: () => setTab('schedule'),
                dedupeKey: `job:${job.id}:failed`,
              });
            }
          }
        }

        knownJobStatusesRef.current = nextMap;

        if (shouldRefreshSurveys && activeSessionRef.current) {
          void refreshSurveysForSession(activeSessionRef.current);
        }
      } catch {
        // Silent retry on transient background schedule poll
      }
    };

    void pollSchedules();
    const timer = setInterval(() => {
      void pollSchedules();
    }, 15_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [authUser, notify]);

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
    const pass =
      overridePassword ??
      profile.password ??
      runtimePasswordsRef.current[profile.id] ??
      '';
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

      if (profile.savePassword) {
        runtimePasswordsRef.current[profile.id] = pass;
      }

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
        limeVersion: profile.limeVersion || 'auto',
        sessionKey: key,
        connectedAt: new Date().toISOString(),
      };

      setActiveSession(session);

      if (authUser) {
        void updateInstanceLastConnectedInFirestore(
          authUser.uid,
          profile.id,
          sitename
        ).catch(() => null);
      }

      await refreshSurveysForSession(session);
      notify({
        type: 'success',
        title: t('Połączono z instancją LimeSurvey'),
        message: t('{0} · użytkownik {1}', session.profileName, session.username),
        dedupeKey: `connect:${session.profileId}`,
      });
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

  async function handleSaveProfile(profile: InstanceProfile) {
    if (!authUser) return;
    if (profile.savePassword && profile.password) {
      runtimePasswordsRef.current[profile.id] = profile.password;
    } else {
      delete runtimePasswordsRef.current[profile.id];
    }

    const saved = await saveInstanceToFirestore(authUser.uid, profile);
    setProfiles((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      const hydrated: InstanceProfile = {
        ...saved,
        password: runtimePasswordsRef.current[saved.id] || '',
        savePassword: Boolean(runtimePasswordsRef.current[saved.id]),
      };
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? hydrated : p));
      }
      return [hydrated, ...prev];
    });
  }

  async function handleDeleteProfile(profileId: string) {
    if (!authUser) return;
    delete runtimePasswordsRef.current[profileId];
    await deleteInstanceFromFirestore(authUser.uid, profileId);
    if (activeSession?.profileId === profileId) {
      setActiveSession(null);
      setSurveys([]);
    }
  }

  async function handleSwitchConnectionMode(
    profileId: string,
    mode: ConnectionMode
  ) {
    if (!authUser) return;
    await updateInstanceConnectionModeInFirestore(authUser.uid, profileId, mode);
    if (activeSession?.profileId === profileId) {
      setActiveSession((prev) =>
        prev ? { ...prev, connectionMode: mode } : prev
      );
    }
  }

  async function handleSwitchLimeVersion(
    profileId: string,
    limeVersion: LimeSurveyVersion
  ) {
    if (!authUser) return;
    await updateInstanceLimeVersionInFirestore(
      authUser.uid,
      profileId,
      limeVersion
    );
    if (activeSession?.profileId === profileId) {
      setActiveSession((prev) => (prev ? { ...prev, limeVersion } : prev));
    }
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

  async function handleSignOut() {
    await handleDisconnect();
    runtimePasswordsRef.current = {};
    await signOutUser();
  }

  if (authLoading || !authUser) {
    return (
      <>
        <AuthGate loading={authLoading} authError={authError} />
        <OfflineIndicator />
      </>
    );
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
    { id: 'surveys', label: t('Ankiety'), icon: ClipboardList },
    { id: 'schedule', label: t('Harmonogram'), icon: CalendarClock },
    { id: 'participants', label: t('Uczestnicy'), icon: Users },
    { id: 'instances', label: t('Instancje'), icon: Server },
  ];

  const activeNavTitle =
    navItems.find((item) => item.id === tab)?.label || 'LimeControl';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sticky Header: 3-zone contract on desktop, compact 54px App Bar on mobile */}
      <header className="sticky top-0 z-30 h-[54px] md:h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setTab('surveys')}
            aria-label={t('LimeControl — strona główna')}
            className="whitespace-nowrap shrink-0"
          >
            <BrandLogo compact markClassName="h-7 w-7 md:h-8 md:w-8" />
          </button>

          <nav
            aria-label={t('Nawigacja główna')}
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`py-2 transition-colors whitespace-nowrap shrink-0 border-b-2 ${active
                      ? 'border-emerald-600 text-slate-900 dark:text-white font-semibold'
                      : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <span className="md:hidden text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
            {activeNavTitle}
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton />
            <LanguageSwitch />

            <div className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-2.5 py-1.5">
              {authUser.photoURL && (
                <img
                  src={authUser.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-5 w-5 rounded-full object-cover"
                />
              )}
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                {authUser.email || authUser.displayName}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleSignOut();
              }}
              aria-label={t('Wyloguj z konta Google')}
              title={t('Wyloguj ({0})', authUser.email || '')}
              className="min-h-[44px] min-w-[44px] px-2.5 flex items-center justify-center gap-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('Wyloguj')}</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((d) => !d)}
              aria-label={
                darkMode ? t('Przełącz na tryb jasny') : t('Przełącz na tryb ciemny')
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
            onSwitchLimeVersion={handleSwitchLimeVersion}
            onClearTraces={() => setRpcTraces([])}
          />
        )}
        <AppFooter className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-6" />
      </main>

      {/* Mobile Fixed Bottom Tab Bar (Thumb Zone) */}
      <nav
        aria-label={t('Dolna nawigacja mobilna')}
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
                className={`flex flex-col items-center justify-center min-h-[48px] transition-colors ${active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400'}`}
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

export default function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </ErrorBoundary>
  );
}
