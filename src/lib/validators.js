// PATH: /src/lib/validators.js
// Shared validation + normalisation helpers.
// Pure functions only — no network calls, safe to import anywhere.

import { NATIONAL_ID_PIN_LENGTH } from './constants';

// ══════════════════════════════════════════════════════════════════
//  PHILIPPINE MOBILE NUMBERS
// ══════════════════════════════════════════════════════════════════

/**
 * Normalise a PH mobile number to E.164 (+639XXXXXXXXX). sms.js converts
 * this to the 09XXXXXXXXX form Semaphore expects. Handles the ways
 * residents actually type it:
 *   09171234567, 9171234567, 639171234567, +63 917 123 4567, 0917-123-4567
 * Returns null when the input cannot be a PH mobile number.
 */
export function toE164PH(raw) {
  if (!raw) return null;

  // Strip everything except digits (drops spaces, dashes, parens, leading +)
  let digits = String(raw).replace(/\D/g, '');

  if (digits.startsWith('63'))      digits = digits.slice(2);   // 639171234567
  else if (digits.startsWith('0'))  digits = digits.slice(1);   // 09171234567

  // What remains must be a 10-digit subscriber number starting with 9.
  if (!/^9\d{9}$/.test(digits)) return null;

  return `+63${digits}`;
}

export function isValidPHMobile(raw) {
  return toE164PH(raw) !== null;
}

// ══════════════════════════════════════════════════════════════════
//  NATIONAL ID PIN  (BR-17)
// ══════════════════════════════════════════════════════════════════

/** Digits only, exactly NATIONAL_ID_PIN_LENGTH characters. */
export function isValidNationalIdPin(pin) {
  if (!pin) return false;
  return new RegExp(`^\\d{${NATIONAL_ID_PIN_LENGTH}}$`).test(String(pin));
}

/** Keep only digits, capped at the configured length. For controlled inputs. */
export function normalizeNationalIdPin(raw) {
  return String(raw ?? '').replace(/\D/g, '').slice(0, NATIONAL_ID_PIN_LENGTH);
}

/**
 * BR-17: the PIN is masked everywhere except the admin verification screen.
 * 1234567890123456 → •••• •••• •••• 3456
 */
export function maskNationalIdPin(pin) {
  const digits = String(pin ?? '').replace(/\D/g, '');
  if (digits.length < 4) return '••••';

  const last4 = digits.slice(-4);
  const hiddenGroups = Math.ceil((digits.length - 4) / 4);

  return [...Array(hiddenGroups).fill('••••'), last4].join(' ');
}

// ══════════════════════════════════════════════════════════════════
//  EMAIL
// ══════════════════════════════════════════════════════════════════

export function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(String(email ?? '').trim());
}

/**
 * Strip a +tag from an address for delivery routing only
 * (maria+test1@gmail.com → maria@gmail.com).
 * Resend's sandbox rejects tagged addresses; the untagged address still
 * reaches the same inbox. Always store/compare the ORIGINAL address — this
 * is only for handing to the mail provider.
 */
export function stripEmailTag(email) {
  const clean = String(email ?? '').toLowerCase().trim();
  return clean.includes('+') ? clean.replace(/\+[^@]+/, '') : clean;
}

// ══════════════════════════════════════════════════════════════════
//  NAMES
// ══════════════════════════════════════════════════════════════════

export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
