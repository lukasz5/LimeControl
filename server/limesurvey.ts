/** Wywołania API LimeSurvey RemoteControl 2 z serwera (harmonogram). */
import { LocalizedError } from './messages.ts';
import { guardedRequest } from './netguard.ts';

export interface RpcOptions {
  allowPrivate: boolean;
  timeoutMs?: number;
}

export async function callLimeSurveyRpc(endpoint: string, method: string, params: unknown[], options: RpcOptions): Promise<unknown> {
  const response = await guardedRequest(
    endpoint,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() }),
      timeoutMs: options.timeoutMs ?? 60_000,
    },
    { allowPrivate: options.allowPrivate }
  );
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`HTTP ${response.status}`);
  }
  let data: { result?: unknown; error?: { message?: string; code?: number } | string | null };
  try {
    data = JSON.parse(response.body);
  } catch {
    throw new LocalizedError('rpc_not_json', [], 502);
  }
  if (data.error) {
    const errText =
      typeof data.error === 'string'
        ? data.error
        : data.error.code !== undefined
          ? `[RPC ${data.error.code}] ${data.error.message || JSON.stringify(data.error)}`
          : data.error.message || JSON.stringify(data.error);
    throw new Error(`RPC Error: ${errText}`);
  }
  return data.result;
}

/** Tekst błędu ze struktury {status, error_code} zwracanej przez LimeSurvey albo null, gdy wynik jest poprawny. */
export function statusError(result: unknown): string | null {
  if (!result || typeof result !== 'object') return null;
  const record = result as Record<string, unknown>;
  const rawCode =
    typeof record.error_code === 'string' || typeof record.error_code === 'number'
      ? record.error_code
      : typeof record.code === 'string' || typeof record.code === 'number'
        ? record.code
        : undefined;
  if (typeof record.status === 'string' && record.status.toUpperCase() !== 'OK') {
    return rawCode !== undefined ? `[Kod ${rawCode}] ${record.status}` : record.status;
  }
  if (rawCode !== undefined && typeof record.message === 'string') {
    return `[Kod ${rawCode}] ${record.message}`;
  }
  return null;
}

/**
 * Wynik invite_participants / remind_participants.
 * LimeSurvey wysyła wiadomości partiami i w polu status zwraca „N left to send”;
 * brak adresatów zgłasza jako „Error: No candidate tokens”.
 */
export interface MailBatch {
  sent: number;
  failed: number;
  left: number;
  /** Brak uczestników, do których należałoby wysłać wiadomość. */
  none: boolean;
  /** Błąd całego wywołania (np. brak tabeli uczestników). */
  error: string | null;
  /** Pierwszy błąd pojedynczej wysyłki (np. odmowa serwera SMTP). */
  firstFailure: string | null;
}

export function parseMailBatch(result: unknown): MailBatch {
  const empty: MailBatch = { sent: 0, failed: 0, left: 0, none: false, error: null, firstFailure: null };
  if (!result || typeof result !== 'object') return { ...empty, error: 'Nieoczekiwana odpowiedź LimeSurvey.' };
  const record = result as Record<string, unknown>;
  const status = typeof record.status === 'string' ? record.status : '';
  if (/no candidate tokens/i.test(status)) return { ...empty, none: true };
  const leftMatch = status.match(/(\d+)\s+left to send/i);
  if (!leftMatch) return { ...empty, error: statusError(result) || status || 'Nieoczekiwana odpowiedź LimeSurvey.' };
  const batch: MailBatch = { ...empty, left: Number(leftMatch[1]) };
  for (const [key, value] of Object.entries(record)) {
    if (key === 'status' || !value || typeof value !== 'object') continue;
    const item = value as Record<string, unknown>;
    if (/^ok$/i.test(String(item.status || ''))) batch.sent += 1;
    else {
      batch.failed += 1;
      if (!batch.firstFailure) batch.firstFailure = String(item.error || item.status || 'nieznany błąd').slice(0, 300);
    }
  }
  return batch;
}

/**
 * Format daty oczekiwany przez LimeSurvey.
 * LimeSurvey 7 przyjmuje czas UTC; starsze wersje — czas lokalny serwera ankiet, dlatego
 * przeliczamy na strefę użytkownika, który planował zadanie (tzOffsetMinutes jak w Date#getTimezoneOffset).
 */
export function formatLimeSurveyDate(iso: string, options: { utc: boolean; tzOffsetMinutes?: number }): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const shifted = options.utc ? date : new Date(date.getTime() - (options.tzOffsetMinutes ?? 0) * 60_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`;
}
