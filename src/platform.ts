import { Capacitor } from '@capacitor/core';

/** Czy aplikacja działa w natywnej powłoce (iOS / Android), a nie w przeglądarce. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/** 'ios', 'android' albo 'web'. */
export function nativePlatform(): 'ios' | 'android' | 'web' {
  const platform = Capacitor.getPlatform();
  return platform === 'ios' || platform === 'android' ? platform : 'web';
}
