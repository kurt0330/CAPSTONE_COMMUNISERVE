// PATH: /src/lib/sms.js
// SMS notifications via Semaphore.co (M9 / BR-08). SERVER ONLY —
// SEMAPHORE_API_KEY must never reach the browser.
//
// BR-08: "Creating a job request triggers an SMS to the provider. SMS failure
// must not block request creation (log it)." Nothing in this file throws —
// every path returns a result object.
//
// DEVELOPER BYPASS: in development the payload is printed to the terminal
// instead of sent, so testing the booking flow does not burn credits.
// Set FORCE_REAL_SMS=true to send a real message from a dev server.

import { toE164PH } from './validators';

const SEMAPHORE_URL = 'https://api.semaphore.co/api/v4/messages';

export function isSemaphoreConfigured() {
  return Boolean(process.env.SEMAPHORE_API_KEY);
}

/** Dev bypass: ON in development unless FORCE_REAL_SMS=true. */
export function smsDevBypassEnabled() {
  if (process.env.FORCE_REAL_SMS === 'true') return false;
  return process.env.NODE_ENV === 'development';
}

/** Semaphore expects the local 11-digit format: 09XXXXXXXXX. */
function toSemaphoreNumber(raw) {
  const e164 = toE164PH(raw);
  return e164 ? `0${e164.slice(3)}` : null;
}

/**
 * Send an SMS. Never throws.
 * @returns {Promise<{sent: boolean, bypassed?: boolean, reason?: string, messageId?: number, status?: string}>}
 */
export async function sendSMS({ to, message }) {
  const number = toSemaphoreNumber(to);
  if (!number) {
    console.warn('[CommuniServe][sms] Unusable mobile number, skipping SMS:', to);
    return { sent: false, reason: 'invalid_phone_number' };
  }

  if (smsDevBypassEnabled()) {
    console.warn(
      '\n' +
      '╔══════════════════════════════════════════════════════════╗\n' +
      '║  DEV SMS BYPASS — not sent (FORCE_REAL_SMS=true to send) ║\n' +
      '╚══════════════════════════════════════════════════════════╝\n' +
      `  To:      ${number}\n` +
      `  Message: ${message}\n`
    );
    return { sent: false, bypassed: true };
  }

  if (!isSemaphoreConfigured()) {
    console.warn('[CommuniServe][sms] SEMAPHORE_API_KEY is not set — skipping SMS to', number);
    return { sent: false, reason: 'semaphore_not_configured' };
  }

  try {
    const res = await fetch(SEMAPHORE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        apikey: process.env.SEMAPHORE_API_KEY,
        number,
        message,
      }),
    });

    const raw = await res.text();
    let data = null;
    try { data = JSON.parse(raw); } catch { /* non-JSON error page */ }

    // Success is an array with one entry per recipient. Validation errors come
    // back as an object keyed by field, sometimes with a 200 status. A 403
    // usually means the account is still Pending or has no credits.
    if (!res.ok || !Array.isArray(data) || data.length === 0) {
      const reason = `HTTP ${res.status}: ${(data ? JSON.stringify(data) : raw).slice(0, 300)}`;
      console.warn('[CommuniServe][sms] Semaphore rejected the SMS:', reason);
      return { sent: false, reason };
    }

    const [first] = data;
    console.info('[CommuniServe][sms] Semaphore accepted SMS', first.message_id, 'status:', first.status);
    return { sent: true, messageId: first.message_id, status: first.status };
  } catch (err) {
    console.warn('[CommuniServe][sms] SMS not sent:', err.message);
    return { sent: false, reason: err.message };
  }
}

/**
 * BR-08 / §12: tell a provider that a resident has requested their service.
 * The provider must still open the web app to accept — they cannot reply by SMS.
 */
export function notifyProviderOfJobRequest({ providerMobile }) {
  return sendSMS({
    to: providerMobile,
    message:
      'CommuniServe: You have received a new service request! ' +
      'Log in to your dashboard to view details.',
  });
}
