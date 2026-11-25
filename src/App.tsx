import { useEffect, useRef, useState } from 'react';
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
import { getBackend, type BackendUser } from './backend';
import {
  getSessionKey,
  getSiteSettings,
  isEmptyParticipantList,
  isMissingParticipantTable,
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
import { ScheduleNeedsServer } from './components/ServerConnection';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';
import { useTextEntryActive } from './hooks/useTextEntryActive';
import { isNativeApp } from './platform';
import { syncStatusBar } from './services/nativeBridge';
import { findProfileForLink, type AppLink } from './services/appLinks';
import { forgetPassword, isInvalidCredentialsError, readPassword, storePassword } from './services/secureCredentials';
import { clearSurveySnapshot, loadSurveySnapshot, saveSurveySnapshot, type SurveySnapshot } from './services/surveyCache';
import { useAppLinks } from './hooks/useAppLinks';
import { t, useLang } from './i18n';

/** Wynik próby połączenia z profilem instancji. */
export type ConnectOutcome = 'connected' | 'failed' | 'needs-password';

export interface ConnectOptions {
  /** Aplikacja mobilna: zapisz wpisane hasło w pęku kluczy (biometria). */
  rememberSecurely?: boolean;
}

const LEGACY_PROFILES_KEY = 'limecontrol_profiles_v1';
const THEME_KEY = 'limecontrol_theme_v1';

/** Motyw wybrany przełącznikiem w nagłówku; null, dopóki użytkownik go nie użył. */
function storedDarkMode(): boolean | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'dark' ? true : value === 'light' ? false : null;
  } catch {
    return null;
  }
}

const systemDarkQuery = (): MediaQueryList | null =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

function AppContent() {
  // Subskrypcja języka: zmiana PL/EN przerenderowuje całe drzewo widoków.
  useLang();
  const { notify } = useNotifications();
  // Aplikacja mobilna przyjmuje motyw systemu, dopóki użytkownik nie wybierze własnego;
  // w przeglądarce domyślny jest motyw jasny.
  const [darkMode, setDarkMode] = useState<boolean>(
    () => storedDarkMode() ?? (isNativeApp() && Boolean(systemDarkQuery()?.matches))
  );

  const backend = getBackend();
  const [authUser, setAuthUser] = useState<BackendUser | null>(null);
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
  const [openServerPanel, setOpenServerPanel] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  /** Link aplikacji (limecontrol://open…) albo zeskanowany kod QR czekający na obsłużenie. */
  const [incomingLink, setIncomingLink] = useState<AppLink | null>(null);
  /** Formularz nowej instancji wypełniony z linku. */
  const [prefill, setPrefill] = useState<{ link: AppLink; nonce: number } | null>(null);
  /** Prośba o połączenie z zapisanym profilem (z linku) — obsługuje ją widok instancji. */
  const [connectRequest, setConnectRequest] = useState<{ profileId: string; nonce: number } | null>(null);
  /** Ankieta do otwarcia po połączeniu (z linku). profileId '*' = dowolny, świeżo dodany profil. */
  const pendingSurveyRef = useRef<{ profileId: string; sid: number } | null>(null);
  const [focusSurveyId, setFocusSurveyId] = useState<number | null>(null);
  const [surveySnapshot, setSurveySnapshot] = useState<SurveySnapshot | null>(null);
  // Aplikacja mobilna: gdy klawiatura ekranowa jest otwarta, dolna nawigacja zasłaniałaby formularz.
  const typing = useTextEntryActive(isNativeApp());
  useAndroidBackButton(tab === 'surveys', () => setTab('surveys'));

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
    void syncStatusBar(darkMode);
  }, [darkMode]);

  // Zmiana motywu systemu w trakcie pracy (aplikacja mobilna, bez własnego wyboru użytkownika).
  useEffect(() => {
    const query = isNativeApp() ? systemDarkQuery() : null;
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => {
      if (storedDarkMode() === null) setDarkMode(event.matches);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    let unsubscribeInstances: (() => void) | null = null;

    const unsubscribeAuth = backend.onAuthChange((user) => {
      if (unsubscribeInstances) {
        unsubscribeInstances();
        unsubscribeInstances = null;
      }

      if (!user) {
        setAuthUser(null);
        setProfiles([]);
        setActiveSession(null);
        setSurveys([]);
        setProfilesLoaded(false);
        runtimePasswordsRef.current = {};
        knownJobStatusesRef.current = null;
        setAuthLoading(false);
        return;
      }

      setAuthUser(user);
      setAuthError(null);
      setAuthLoading(false);

      void backend.ensureUserProfile(user).catch((err) => {
        setAuthError(err instanceof Error ? err.message : String(err));
      });

      unsubscribeInstances = backend.subscribeInstances(
        user.uid,
        (cloudProfiles) => {
          setProfilesLoaded(true);
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
  }, [notify, backend]);

  useEffect(() => {
    void loadSurveySnapshot().then(setSurveySnapshot);
  }, []);

  useAppLinks((link) => setIncomingLink(link));

  // Link z aplikacji lub z kodu QR: otwórz pasujący profil (i ankietę) albo wypełnij formularz nowej instancji.
  useEffect(() => {
    if (!incomingLink || !authUser || !profilesLoaded) return;
    const link = incomingLink;
    setIncomingLink(null);
    const profile = findProfileForLink(profiles, link);
    if (profile && link.surveyId && activeSessionRef.current?.profileId === profile.id) {
      setFocusSurveyId(link.surveyId);
      setTab('surveys');
      return;
    }
    pendingSurveyRef.current = link.surveyId ? { profileId: profile?.id ?? '*', sid: link.surveyId } : null;
    setTab('instances');
    if (profile) {
      setConnectRequest({ profileId: profile.id, nonce: Date.now() });
    } else {
      setPrefill({ link, nonce: Date.now() });
    }
  }, [incomingLink, authUser, profilesLoaded, profiles]);

  useEffect(() => {
    return subscribeRpcTrace((entry) => {
      setRpcTraces((prev) => [entry, ...prev].slice(0, 60));

      if (!entry.ok) {
        const isExpectedProbe =
          // Pusta instancja: „No surveys found” to pusta lista ankiet, nie błąd (patrz listSurveys).
          (entry.method === 'list_surveys' && /no surveys found/i.test(entry.summary)) ||
          (entry.method === 'get_summary' &&
            /no data|not active|no survey/i.test(entry.summary)) ||
          (entry.method === 'list_participants' &&
            (isMissingParticipantTable(entry.summary) || isEmptyParticipantList(entry.summary) || /not exist/i.test(entry.summary)));

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
    // Tryb „na urządzeniu” nie ma serwera, więc nie ma też kolejki harmonogramu do odpytywania.
    if (!authUser || backend.mode === 'device') return;
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
                title: t('Zadanie harmonogramu zakończone'),
                message: job.resultMessage || `${job.surveyTitle} (#${job.surveyId})`,
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
  }, [authUser, backend, notify]);

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
      void saveSurveySnapshot(session.profileId, session.profileName, list).then((snapshot) => {
        if (snapshot) setSurveySnapshot(snapshot);
      });
    } finally {
      setLoadingSurveys(false);
    }
  }

  async function handleConnectProfile(
    profile: InstanceProfile,
    overridePassword?: string,
    options: ConnectOptions = {}
  ): Promise<ConnectOutcome> {
    let pass =
      overridePassword ??
      (profile.password || runtimePasswordsRef.current[profile.id] || '');
    let fromKeychain = false;
    setConnectionError(null);

    // Hasło w pęku kluczy urządzenia: odczyt po potwierdzeniu biometrią.
    if (!pass && profile.biometricPassword) {
      const stored = await readPassword(profile.id, profile.name);
      if (stored.status === 'ok') {
        pass = stored.password;
        fromKeychain = true;
      } else {
        if (stored.status === 'missing' && authUser) {
          void backend.updateInstance(authUser.uid, profile.id, { biometricPassword: false }).catch(() => null);
        }
        return 'needs-password';
      }
    }
    if (!pass) return 'needs-password';

    setConnecting(true);

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

      if (options.rememberSecurely && overridePassword && authUser) {
        const stored = await storePassword(profile.id, profile.username, overridePassword);
        if (stored) {
          await backend.updateInstance(authUser.uid, profile.id, { biometricPassword: true }).catch(() => null);
        } else {
          notify({
            type: 'info',
            title: t('Nie zapisano hasła'),
            message: t('Pęk kluczy urządzenia odrzucił zapis albo potwierdzenie zostało przerwane. Połączenie działa — hasło trzeba będzie wpisać ponownie.'),
            dedupeKey: `keychain:${profile.id}`,
          });
        }
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
        void backend
          .updateInstance(authUser.uid, profile.id, { lastConnectedAt: new Date().toISOString(), siteName: sitename })
          .catch(() => null);
      }

      await refreshSurveysForSession(session);
      notify({
        type: 'success',
        title: t('Połączono z instancją LimeSurvey'),
        message: t('{0} · użytkownik {1}', session.profileName, session.username),
        dedupeKey: `connect:${session.profileId}`,
      });
      const pending = pendingSurveyRef.current;
      if (pending && (pending.profileId === profile.id || pending.profileId === '*')) {
        setFocusSurveyId(pending.sid);
      }
      pendingSurveyRef.current = null;
      setTab('surveys');
      return 'connected';
    } catch (err) {
      const isCors =
        err instanceof LimeSurveyRpcError ? err.isCorsOrNetwork : false;
      let message = err instanceof Error ? err.message : String(err);
      // Hasło w pęku kluczy jest nieaktualne (zmienione na serwerze) — usuń je, żeby nie próbować ponownie.
      if (fromKeychain && isInvalidCredentialsError(message) && authUser) {
        await forgetPassword(profile.id);
        await backend.updateInstance(authUser.uid, profile.id, { biometricPassword: false }).catch(() => null);
        message = `${message} ${t('Zapisane hasło zostało usunięte z urządzenia — wpisz aktualne hasło.')}`;
      }
      setConnectionError({ message, isCors });
      return 'failed';
    } finally {
      setConnecting(false);
    }
  }

  async function handleForgetPassword(profileId: string) {
    if (!authUser) return;
    await forgetPassword(profileId);
    await backend.updateInstance(authUser.uid, profileId, { biometricPassword: false });
    notify({ type: 'success', title: t('Hasło usunięte z urządzenia'), dedupeKey: `forget:${profileId}` });
  }

  async function handleSaveProfile(profile: InstanceProfile) {
    if (!authUser) return;
    if (profile.savePassword && profile.password) {
      runtimePasswordsRef.current[profile.id] = profile.password;
    } else {
      delete runtimePasswordsRef.current[profile.id];
    }

    const saved = await backend.saveInstance(authUser.uid, profile);
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
    await forgetPassword(profileId);
    await clearSurveySnapshot(profileId);
    if (surveySnapshot?.profileId === profileId) setSurveySnapshot(null);
    await backend.deleteInstance(authUser.uid, profileId);
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
    await backend.updateInstance(authUser.uid, profileId, { connectionMode: mode });
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
    await backend.updateInstance(authUser.uid, profileId, { limeVersion });
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
    await backend.signOut();
  }

  if (authLoading || !authUser) {
    return (
      <>
        <AuthGate loading={authLoading} authError={authError} mode={backend.mode} />
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
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-[54px] md:h-16 max-w-7xl items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6">
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
                {backend.mode === 'device'
                  ? t('Na tym urządzeniu')
                  : backend.mode === 'local'
                    ? t('Instalacja własna')
                    : authUser.email || authUser.displayName}
              </span>
            </div>

            {backend.mode !== 'device' && (
              <button
                type="button"
                onClick={() => {
                  void handleSignOut();
                }}
                aria-label={backend.mode === 'local' ? t('Wyloguj') : t('Wyloguj z konta Google')}
                title={backend.mode === 'local' ? t('Wyloguj') : t('Wyloguj ({0})', authUser.email || '')}
                className="min-h-[44px] min-w-[44px] px-2.5 flex items-center justify-center gap-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t('Wyloguj')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={toggleDarkMode}
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 pt-5 pb-bottom-nav">
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
            activeProfile={activeProfile}
            focusSurveyId={focusSurveyId}
            onFocusHandled={() => setFocusSurveyId(null)}
            snapshot={surveySnapshot && profiles.some((p) => p.id === surveySnapshot.profileId) ? surveySnapshot : null}
            onConnectSnapshotProfile={() => {
              if (!surveySnapshot) return;
              setTab('instances');
              setConnectRequest({ profileId: surveySnapshot.profileId, nonce: Date.now() });
            }}
          />
        )}

        {tab === 'schedule' && backend.mode === 'device' && (
          <ScheduleNeedsServer
            onConnect={() => {
              setOpenServerPanel(true);
              setTab('instances');
            }}
          />
        )}

        {tab === 'schedule' && backend.mode !== 'device' && (
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
            openServerPanel={openServerPanel}
            onForgetPassword={handleForgetPassword}
            onAppLink={(link) => setIncomingLink(link)}
            prefill={prefill}
            connectRequest={connectRequest}
          />
        )}
        <AppFooter className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-6" />
      </main>

      {/* Mobile Fixed Bottom Tab Bar (Thumb Zone) */}
      <nav
        aria-label={t('Dolna nawigacja mobilna')}
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-safe ${typing ? 'hidden' : ''}`}
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
