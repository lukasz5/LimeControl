import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Aplikacja mobilna LimeControl (iOS i Android) — ta sama aplikacja co w przeglądarce,
 * zbudowana poleceniem `npm run build:mobile` do dist-mobile/ i osadzona w natywnej powłoce.
 * Projekty natywne są w mobile/ios i mobile/android; opis wydania: mobile/README.md.
 */
const config: CapacitorConfig = {
  appId: 'eu.limecontrol.app',
  appName: 'LimeControl',
  webDir: 'dist-mobile',
  ios: {
    path: 'mobile/ios',
    // Treść sama uwzględnia wcięcie ekranu i pasek gestów (env(safe-area-inset-*)).
    contentInset: 'never',
  },
  android: {
    path: 'mobile/android',
  },
  plugins: {
    // Zapytania fetch() idą przez natywną warstwę sieciową — bez ograniczeń CORS przeglądarki,
    // więc aplikacja łączy się bezpośrednio z każdym serwerem LimeSurvey.
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
