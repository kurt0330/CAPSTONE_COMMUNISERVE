// PATH: /src/lib/validators.js
// Shared validation + normalisation helpers.
// Pure functions only — no network calls, safe to import anywhere.

import { NATIONAL_ID_PIN_LENGTH, MIN_PROVIDER_AGE } from './constants';

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
//  AGE
// ══════════════════════════════════════════════════════════════════

/**
 * Whole years between a 'YYYY-MM-DD' birth date and today. The parts are read
 * as a calendar date (not through new Date(string), which is UTC and can be a
 * day off), so a birthday counts from local midnight.
 * Returns null when the value is not a real date or is in the future.
 */
export function ageFromBirthDate(value, today = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''));
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dob = new Date(y, mo - 1, d);
  if (dob.getFullYear() !== y || dob.getMonth() !== mo - 1 || dob.getDate() !== d) return null;

  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() < mo - 1 || (today.getMonth() === mo - 1 && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age < 0 ? null : age;
}

/**
 * Why a birth date cannot be accepted for a provider application, or '' when
 * it is fine. One wording for the form, the step check and the server.
 */
export function providerAgeProblem(value, today = new Date()) {
  if (!value) return '';
  const age = ageFromBirthDate(value, today);
  if (age === null) return 'Please enter a valid date of birth.';
  if (age < MIN_PROVIDER_AGE) {
    return `Age requirement not met. You must be at least ${MIN_PROVIDER_AGE} years old to register as a service provider.`;
  }
  if (age > 120) return 'Please check the year of your date of birth.';
  return '';
}

// ══════════════════════════════════════════════════════════════════
//  NATIONAL ID CARD NUMBER  (BR-17)
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
 * BR-17: the card number is masked everywhere except the admin verification screen.
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
