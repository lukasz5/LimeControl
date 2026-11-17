import JSZip from 'jszip';
import type { InstanceProfile } from '../types/limesurvey';

export interface GeneratedRnFile {
  path: string;
  language: 'json' | 'typescript' | 'markdown';
  content: string;
}

export function generateReactNativeProject(
  profiles: InstanceProfile[],
  schedulerBaseUrl: string
): GeneratedRnFile[] {
  const safeProfiles = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    baseUrl: p.baseUrl,
    rpcEndpoint: p.rpcEndpoint,
    username: p.username,
    authPlugin: p.authPlugin,
  }));

  const packageJson = JSON.stringify(
    {
      name: 'limecontrol-mobile',
      version: '1.0.0',
      main: 'expo-router/entry',
      scripts: {
        start: 'expo start',
        android: 'expo start --android',
        ios: 'expo start --ios',
      },
      dependencies: {
        '@expo/vector-icons': '^14.0.0',
        '@react-native-async-storage/async-storage': '1.23.1',
        expo: '~52.0.0',
        'expo-file-system': '~18.0.0',
        'expo-sharing': '~13.0.0',
        'expo-status-bar': '~2.0.0',
        react: '18.3.1',
        'react-native': '0.76.5',
        'react-native-safe-area-context': '4.12.0',
      },
      devDependencies: {
        '@types/react': '~18.3.12',
        typescript: '^5.6.3',
      },
    },
    null,
    2
  );

  const appJson = JSON.stringify(
    {
      expo: {
        name: 'LimeControl',
        slug: 'limecontrol-mobile',
        version: '1.0.0',
        orientation: 'portrait',
        userInterfaceStyle: 'automatic',
        ios: {
          supportsTablet: true,
          bundleIdentifier: 'com.limecontrol.rc2',
        },
        android: {
          package: 'com.limecontrol.rc2',
        },
      },
    },
    null,
    2
  );

  const tsconfigJson = JSON.stringify(
    {
      extends: 'expo/tsconfig.base',
      compilerOptions: {
        strict: true,
      },
    },
    null,
    2
  );

  const rpcTs = `export interface LimeSurveyItem {
  sid: number;
  surveyls_title: string;
  startdate: string | null;
  expires: string | null;
  active: 'Y' | 'N' | string;
}

export interface SurveySummary {
  completed_responses?: number | string;
  incomplete_responses?: number | string;
  full_responses?: number | string;
  token_count?: number | string;
  token_sent?: number | string;
  token_completed?: number | string;
  token_opted_out?: number | string;
}

export interface ParticipantItem {
  tid: number | string;
  token: string;
  completed?: string;
  sent?: string;
  participant_info?: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
}

export function normalizeRpcEndpoint(rawUrl: string): string {
  let clean = rawUrl.trim().replace(/\\/+$/, '');
  if (!/^https?:\\/\\//i.test(clean)) {
    clean = \`https://\${clean}\`;
  }
  if (clean.endsWith('/remotecontrol') || clean.includes('r=admin/remotecontrol')) {
    return clean;
  }
  return \`\${clean}/index.php/admin/remotecontrol\`;
}

export async function callLimeSurveyRpc<T>(
  rpcEndpoint: string,
  method: string,
  params: unknown[]
): Promise<T> {
  // Natywny fetch w React Native nie podlega ograniczeniom CORS przeglądarki
  const response = await fetch(rpcEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now(),
    }),
  });

  if (!response.ok) {
    throw new Error(\`HTTP \${response.status} \${response.statusText}\`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(typeof data.error === 'string' ? data.error : data.error.message);
  }

  if (
    data.result &&
    typeof data.result === 'object' &&
    typeof data.result.status === 'string' &&
    data.result.status.toUpperCase() !== 'OK'
  ) {
    throw new Error(data.result.status);
  }

  return data.result as T;
}

export const LimeSurveyApi = {
  getSessionKey: (endpoint: string, user: string, pass: string, plugin = 'Authdb') =>
    callLimeSurveyRpc<string>(endpoint, 'get_session_key', [user, pass, plugin]),

  releaseSessionKey: (endpoint: string, key: string) =>
    callLimeSurveyRpc<string>(endpoint, 'release_session_key', [key]),

  listSurveys: (endpoint: string, key: string) =>
    callLimeSurveyRpc<LimeSurveyItem[]>(endpoint, 'list_surveys', [key]),

  activateSurvey: (endpoint: string, key: string, sid: number) =>
    callLimeSurveyRpc<Record<string, unknown>>(endpoint, 'activate_survey', [key, sid]),

  setSurveyProperties: (
    endpoint: string,
    key: string,
    sid: number,
    props: Record<string, string | null>
  ) => callLimeSurveyRpc<Record<string, unknown>>(endpoint, 'set_survey_properties', [key, sid, props]),

  getSummary: (endpoint: string, key: string, sid: number) =>
    callLimeSurveyRpc<SurveySummary>(endpoint, 'get_summary', [key, sid, 'all']),

  activateTokens: (endpoint: string, key: string, sid: number) =>
    callLimeSurveyRpc<Record<string, unknown>>(endpoint, 'activate_tokens', [key, sid]),

  listParticipants: (endpoint: string, key: string, sid: number) =>
    callLimeSurveyRpc<ParticipantItem[]>(endpoint, 'list_participants', [
      key,
      sid,
      0,
      50,
      false,
      ['email', 'firstname', 'lastname', 'sent', 'completed'],
    ]),

  addParticipants: (
    endpoint: string,
    key: string,
    sid: number,
    participants: Array<{ email: string; firstname: string; lastname: string }>
  ) => callLimeSurveyRpc<unknown[]>(endpoint, 'add_participants', [key, sid, participants, true]),

  inviteParticipants: (endpoint: string, key: string, sid: number) =>
    callLimeSurveyRpc<Record<string, unknown>>(endpoint, 'invite_participants', [key, sid, []]),

  remindParticipants: (endpoint: string, key: string, sid: number) =>
    callLimeSurveyRpc<Record<string, unknown>>(endpoint, 'remind_participants', [key, sid]),

  exportResponsesBase64: (
    endpoint: string,
    key: string,
    sid: number,
    docType: 'csv' | 'xls' | 'json' = 'csv'
  ) =>
    callLimeSurveyRpc<string>(endpoint, 'export_responses', [
      key,
      sid,
      docType,
      null,
      'all',
      'full',
      'long',
    ]),
};
`;

  const profilesTs = `import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RnInstanceProfile {
  id: string;
  name: string;
  baseUrl: string;
  rpcEndpoint: string;
  username: string;
  authPlugin: string;
}

const STORAGE_KEY = 'limecontrol_profiles_v1';

export const DEFAULT_PROFILES: RnInstanceProfile[] = ${JSON.stringify(safeProfiles, null, 2)};

export async function loadProfiles(): Promise<RnInstanceProfile[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PROFILES;
  } catch {
    return DEFAULT_PROFILES;
  }
}

export async function saveProfiles(profiles: RnInstanceProfile[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}
`;

  const appTsx = `import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import {
  LimeSurveyApi,
  LimeSurveyItem,
  SurveySummary,
  normalizeRpcEndpoint,
} from './src/api/limeSurveyRpc';
import { RnInstanceProfile, loadProfiles, saveProfiles } from './src/storage/profiles';

const SCHEDULER_BACKEND_URL = '${schedulerBaseUrl.replace(/'/g, '')}';

type Tab = 'surveys' | 'schedule' | 'instances';

export default function App() {
  const [tab, setTab] = useState<Tab>('surveys');
  const [profiles, setProfiles] = useState<RnInstanceProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<RnInstanceProfile | null>(null);
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [surveys, setSurveys] = useState<LimeSurveyItem[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<LimeSurveyItem | null>(null);
  const [summary, setSummary] = useState<SurveySummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Formularz instancji
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Formularz harmonogramu
  const [scheduleIso, setScheduleIso] = useState(
    new Date(Date.now() + 3600_000).toISOString().slice(0, 16)
  );

  useEffect(() => {
    loadProfiles().then((items) => {
      setProfiles(items);
      if (items.length > 0 && !url) {
        setName(items[0].name);
        setUrl(items[0].baseUrl);
        setUsername(items[0].username);
      }
    });
  }, []);

  async function handleConnect(profile?: RnInstanceProfile) {
    const endpoint = profile ? profile.rpcEndpoint : normalizeRpcEndpoint(url);
    const user = profile ? profile.username : username;
    if (!endpoint || !user || !password) {
      Alert.alert('Brak danych', 'Podaj adres instancji, login oraz hasło.');
      return;
    }

    setLoading(true);
    try {
      const key = await LimeSurveyApi.getSessionKey(
        endpoint,
        user,
        password,
        profile?.authPlugin || 'Authdb'
      );
      setSessionKey(key);

      if (!profile) {
        const created: RnInstanceProfile = {
          id: \`prof_\${Date.now()}\`,
          name: name || endpoint,
          baseUrl: url,
          rpcEndpoint: endpoint,
          username: user,
          authPlugin: 'Authdb',
        };
        const updated = [created, ...profiles];
        setProfiles(updated);
        await saveProfiles(updated);
        setActiveProfile(created);
      } else {
        setActiveProfile(profile);
      }

      const list = await LimeSurveyApi.listSurveys(endpoint, key);
      setSurveys(list);
      setTab('surveys');
    } catch (err) {
      Alert.alert('Błąd połączenia', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(sid: number) {
    if (!sessionKey || !activeProfile) return;
    setLoading(true);
    try {
      await LimeSurveyApi.activateSurvey(activeProfile.rpcEndpoint, sessionKey, sid);
      const list = await LimeSurveyApi.listSurveys(activeProfile.rpcEndpoint, sessionKey);
      setSurveys(list);
      Alert.alert('Sukces', \`Ankieta #\${sid} została aktywowana.\`);
    } catch (err) {
      Alert.alert('Błąd aktywacji', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadSummary(survey: LimeSurveyItem) {
    if (!sessionKey || !activeProfile) return;
    setSelectedSurvey(survey);
    try {
      const data = await LimeSurveyApi.getSummary(activeProfile.rpcEndpoint, sessionKey, survey.sid);
      setSummary(data);
    } catch {
      setSummary(null);
    }
  }

  async function handleExportCsv(sid: number) {
    if (!sessionKey || !activeProfile) return;
    setLoading(true);
    try {
      const base64 = await LimeSurveyApi.exportResponsesBase64(
        activeProfile.rpcEndpoint,
        sessionKey,
        sid,
        'csv'
      );
      const fileUri = \`\${FileSystem.documentDirectory}limesurvey_\${sid}.csv\`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      await Sharing.shareAsync(fileUri);
    } catch (err) {
      Alert.alert('Błąd eksportu', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleScheduleActivation() {
    if (!selectedSurvey || !activeProfile || !password) {
      Alert.alert('Uwaga', 'Wybierz ankietę i wpisz hasło w zakładce Instancje.');
      return;
    }
    try {
      const res = await fetch(\`\${SCHEDULER_BACKEND_URL}/api/schedules\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: selectedSurvey.sid,
          surveyTitle: selectedSurvey.surveyls_title,
          instanceName: activeProfile.name,
          rpcEndpoint: activeProfile.rpcEndpoint,
          username: activeProfile.username,
          password,
          authPlugin: activeProfile.authPlugin,
          scheduledAt: new Date(scheduleIso).toISOString(),
          activateTokens: false,
          clearCredentialsAfterRun: true,
        }),
      });
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      Alert.alert('Zaplanowano', \`Aktywacja ankiety #\${selectedSurvey.sid} zapisana w harmonogramie.\`);
    } catch (err) {
      Alert.alert('Błąd harmonogramu', err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LimeControl Mobile</Text>
        <Text style={styles.headerSub}>
          {activeProfile ? activeProfile.name : 'Niepołączono'}
        </Text>
      </View>

      {loading && <ActivityIndicator size="small" color="#1F7A3E" style={{ marginVertical: 8 }} />}

      {tab === 'surveys' && (
        <FlatList
          data={surveys}
          keyExtractor={(item) => String(item.sid)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Połącz się z instancją LimeSurvey, aby pobrać ankiety.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleLoadSummary(item)}>
              <Text style={styles.cardTitle}>{item.surveyls_title}</Text>
              <Text style={styles.cardMeta}>
                SID {item.sid} · {item.active === 'Y' ? 'Aktywna' : 'Nieaktywna'}
              </Text>
              <View style={styles.rowActions}>
                {item.active !== 'Y' && (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => handleActivate(item.sid)}
                  >
                    <Text style={styles.primaryBtnText}>Aktywuj</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => handleExportCsv(item.sid)}
                >
                  <Text style={styles.secondaryBtnText}>Eksport CSV</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {tab === 'schedule' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionTitle}>Zaplanuj aktywację (activate_survey)</Text>
          <Text style={styles.cardMeta}>
            Wybrana ankieta: {selectedSurvey ? \`#\${selectedSurvey.sid} \${selectedSurvey.surveyls_title}\` : 'Brak — kliknij ankietę na liście'}
          </Text>
          <TextInput
            style={styles.input}
            value={scheduleIso}
            onChangeText={setScheduleIso}
            placeholder="YYYY-MM-DDTHH:mm"
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleScheduleActivation}>
            <Text style={styles.primaryBtnText}>Zapisz zadanie w harmonogramie serwera</Text>
          </TouchableOpacity>
          {summary && (
            <View style={[styles.card, { marginTop: 16 }]}>
              <Text style={styles.cardTitle}>Statystyki get_summary</Text>
              <Text style={styles.cardMeta}>
                Pełne odpowiedzi: {summary.completed_responses ?? 0} · Niepełne: {summary.incomplete_responses ?? 0}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {tab === 'instances' && (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionTitle}>Połącz z instancją LimeSurvey</Text>
          <TextInput style={styles.input} placeholder="Nazwa profilu" value={name} onChangeText={setName} />
          <TextInput
            style={styles.input}
            placeholder="https://twoja-instancja.pl"
            autoCapitalize="none"
            value={url}
            onChangeText={setUrl}
          />
          <TextInput
            style={styles.input}
            placeholder="Login administratora"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Hasło"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={() => handleConnect()}>
            <Text style={styles.primaryBtnText}>Połącz (get_session_key)</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('surveys')}>
          <Text style={[styles.tabText, tab === 'surveys' && styles.tabActive]}>Ankiety</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('schedule')}>
          <Text style={[styles.tabText, tab === 'schedule' && styles.tabActive]}>Harmonogram</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab('instances')}>
          <Text style={[styles.tabText, tab === 'instances' && styles.tabActive]}>Instancje</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  headerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  cardMeta: { fontSize: 12, color: '#64748B', marginTop: 4 },
  rowActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  primaryBtn: { backgroundColor: '#1F7A3E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  secondaryBtn: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { color: '#0F172A', fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, padding: 12, marginBottom: 10, fontSize: 14 },
  empty: { textAlign: 'center', color: '#64748B', marginTop: 40 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', height: 60 },
  tabBtn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  tabActive: { color: '#1F7A3E', fontWeight: '700' },
});
`;

  const readmeMd = `# LimeControl — Projekt React Native (Expo)

Wygenerowana aplikacja mobilna React Native komunikująca się bezpośrednio z dowolną instancją LimeSurvey poprzez oficjalne API RemoteControl 2 (\`remotecontrol_handle\`).

## Zaleta wersji natywnej
W React Native żądania \`fetch\` wykonywane są z poziomu natywnego stosu sieciowego iOS/Android, dzięki czemu **nie obowiązują ograniczenia CORS przeglądarki** — możesz łączyć się z dowolnym serwerem LimeSurvey bez modyfikowania jego nagłówków HTTP.

## Uruchomienie lokalne
1. Zainstaluj zależności:
   \`\`\`bash
   npm install
   \`\`\`
2. Uruchom środowisko Expo:
   \`\`\`bash
   npx expo start
   \`\`\`
3. Zeskanuj kod QR w aplikacji **Expo Go** na iOS lub Androidzie.

## Obsługiwane metody API LimeSurvey
- \`get_session_key\` / \`release_session_key\`
- \`list_surveys\` / \`activate_survey\` / \`set_survey_properties\`
- \`get_summary\`
- \`activate_tokens\` / \`list_participants\` / \`add_participants\` / \`invite_participants\` / \`remind_participants\`
- \`export_responses\` (zapis Base64 przez \`expo-file-system\` i udostępnianie przez \`expo-sharing\`)
`;

  return [
    { path: 'package.json', language: 'json', content: packageJson },
    { path: 'app.json', language: 'json', content: appJson },
    { path: 'tsconfig.json', language: 'json', content: tsconfigJson },
    { path: 'src/api/limeSurveyRpc.ts', language: 'typescript', content: rpcTs },
    { path: 'src/storage/profiles.ts', language: 'typescript', content: profilesTs },
    { path: 'App.tsx', language: 'typescript', content: appTsx },
    { path: 'README.md', language: 'markdown', content: readmeMd },
  ];
}

export async function downloadReactNativeZip(
  profiles: InstanceProfile[],
  schedulerBaseUrl: string
): Promise<void> {
  const files = generateReactNativeProject(profiles, schedulerBaseUrl);
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'limecontrol-react-native-expo.zip';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
