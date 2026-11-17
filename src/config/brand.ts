/** Stałe marki i linki zewnętrzne. */
export const BRAND = {
  name: 'LimeControl',
  tagline: 'App for LimeSurvey',
  author: 'strefabadan.pl',
  authorUrl: 'https://strefabadan.pl',
  /** Link „Postaw mi kawę” (PayPal). Domyślnie profil PayPal strefabadan.pl; VITE_SUPPORT_URL nadpisuje. */
  supportUrl: (import.meta.env.VITE_SUPPORT_URL as string | undefined) || 'https://www.paypal.com/biz/profile/strefabadan',
  /** Linki do oficjalnej aplikacji w sklepach. Puste = przycisk „Wkrótce”. */
  appStoreUrl: (import.meta.env.VITE_APP_STORE_URL as string | undefined) || '',
  playStoreUrl: (import.meta.env.VITE_PLAY_STORE_URL as string | undefined) || '',
} as const;
