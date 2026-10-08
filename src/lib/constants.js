// PATH: /src/lib/constants.js
// Shared enums/constants for the customer + provider front end.
// Keep values aligned with the schema documented in CAPSTONE_DOCS.md §9.

// ── Trade categories (BR-05: only these three exist, enum/check-constrained) ─
export const TRADE_CATEGORIES = ['Electrician', 'Carpenter', 'Kasambahay'];

// Icon name per trade — render with <Icon name={TRADE_ICONS[trade]} />.
// Names resolve to files in /public/assets/icons/ (see src/lib/icons.js).
export const TRADE_ICONS = {
  Electrician: 'bolt',
  Carpenter:   'hammer',
  Kasambahay:  'broom',
};

// ── Panday custom-bid payment structures (T-job_requests.payment_structure) ─
// Pandays don't charge hourly: a Custom Service bid to a Carpenter must pick
// one of these. Values match the job_requests_payment_structure_check.
export const PAYMENT_STRUCTURES = {
  arawan: {
    label:   'Arawan',
    short:   'Daily rate',
    unit:    'per day',
    detail:  'Fixed rate per day (standard 8 AM – 5 PM). Best for unpredictable repairs.',
  },
  pakyawan: {
    label:   'Pakyawan',
    short:   'Per-project contract',
    unit:    'for the whole job',
    detail:  'Fixed total price for the entire job, regardless of days taken.',
  },
};

// ── Provider registration: minimum age ──────────────────────────────────────
// Applicants must be at least this old on the day they register. Checked the
// moment the birth date is entered (Step 1) and again on the server.
export const MIN_PROVIDER_AGE = 18;

// ── National ID card number (BR-17) ─────────────────────────────────────────
// Shown to users as "card number". The identifier keeps its original name
// because the column is provider_identity.national_id_pin.
// PhilSys Card Number (PCN) is commonly 16 digits; Q-01 recommends this as the
// default length until the LGU confirms PCN vs. the 12-digit PSN.
export const NATIONAL_ID_PIN_LENGTH = 16;

// ── Job request lifecycle (T-job_requests.job_status) ───────────────────────
// These MUST match the job_requests_job_status_check constraint in the
// database exactly — note it is 'Declined', not 'Rejected'.
export const JOB_STATUSES = ['Pending', 'Accepted', 'Ongoing', 'Completed', 'Declined', 'Cancelled'];

// What the user reads for a status. The database value stays 'Ongoing';
// the interface calls it "In Progress".
const JOB_STATUS_LABELS = { Ongoing: 'In Progress' };
export const jobStatusLabel = (status) => JOB_STATUS_LABELS[status] ?? status;

// A provider with a job in one of these is shown as "Currently on a job".
export const ACTIVE_JOB_STATUSES = ['Accepted', 'Ongoing'];

// ── Ratings (T-ratings) ─────────────────────────────────────────────────────
export const REVIEW_MAX_LENGTH = 500;

// ── Anini-y barangay list ────────────────────────────────────────────────────
// Copied from src/components/customer/RegisterForm.jsx's existing list rather
// than importing it, since that component is being visually re-skinned but not
// restructured — this keeps the two lists independently editable if the LGU's
// official 23-barangay roster (CAPSTONE_DOCS.md Q-08) is ever finalized differently.
export const BARANGAYS = [
  'Bayo Grande',
  'Bayo Pequeño',
  'Butuan',
  'Casay',
  'Casay Viejo',
  'Iba',
  'Igbarabatuan',
  'Igpalge',
  'Igtumarom',
  'Lisub A',
  'Lisub B',
  'Mabuyong',
  'Magdalena',
  'Nasuli C',
  'Nato',
  'Poblacion',
  'Sagua',
  'Salvacion',
  'San Francisco',
  'San Ramon',
  'San Roque',
  'Tagaytay',
  'Talisayan',
];
