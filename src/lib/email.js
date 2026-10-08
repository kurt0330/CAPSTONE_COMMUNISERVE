// PATH: /src/lib/email.js
// Email shortcut for sign-in and registration: most residents use Gmail, so
// they can type just the part before the @ and the rest is filled in.
// Pure functions only — safe to import on the client and the server.

export const DEFAULT_EMAIL_DOMAIN = 'gmail.com';

// Offered as one-tap choices while the user has not typed an @ yet.
export const EMAIL_DOMAIN_CHOICES = ['gmail.com', 'yahoo.com'];

/**
 * Finish a partly typed email address.
 *   "juan"            → "juan@gmail.com"
 *   "juan@"           → "juan@gmail.com"
 *   "juan@yahoo.com"  → unchanged (a typed domain is never replaced)
 *   ""                → ""
 */
export function completeEmail(raw, domain = DEFAULT_EMAIL_DOMAIN) {
  const value = String(raw ?? '').trim().replace(/\s+/g, '');
  if (!value) return '';

  const at = value.indexOf('@');
  if (at === -1) return `${value}@${domain}`;
  if (at === value.length - 1) return `${value}${domain}`;
  return value;
}

/** True while the shortcut still applies: something typed, but no domain yet. */
export function needsEmailDomain(raw) {
  const value = String(raw ?? '').trim();
  return value.length > 0 && (!value.includes('@') || value.endsWith('@'));
}
