// PATH: /src/lib/resend.js
// Email delivery via Resend (M9). SERVER ONLY — RESEND_API_KEY must never
// reach the browser.
//
// DEVELOPER FALLBACK: until a custom sending domain is verified, live email
// to arbitrary addresses will fail. When the OTP dev bypass is active, the
// 6-digit code is printed to the terminal and the send is reported as
// successful, so the verification screen can be tested end to end without
// working email. The bypass is OFF in production unless explicitly forced.

import { Resend } from 'resend';
import { stripEmailTag } from './validators';

// ── Configuration ─────────────────────────────────────────────────────────

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Dev bypass: ON in development by default, OFF in production by default.
 * Override either way with OTP_DEV_BYPASS=true|false in .env.local.
 */
export function otpDevBypassEnabled() {
  if (process.env.OTP_DEV_BYPASS === 'true')  return true;
  if (process.env.OTP_DEV_BYPASS === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

function getClient() {
  if (!isResendConfigured()) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

function sender() {
  const name  = process.env.RESEND_FROM_NAME || 'CommuniServe';
  const email = process.env.RESEND_FROM_EMAIL;
  return email ? `${name} <${email}>` : null;
}

// ── Generic send ──────────────────────────────────────────────────────────

/**
 * Send an email. Never throws — always returns a result object so callers
 * decide what a delivery failure means for their flow.
 * @returns {Promise<{delivered: boolean, error?: string}>}
 */
export async function sendEmail({ to, subject, html }) {
  const client = getClient();

  if (!client) {
    console.warn('[CommuniServe][resend] RESEND_API_KEY is not set — skipping email to', to);
    return { delivered: false, error: 'RESEND_API_KEY missing' };
  }

  const from = sender();
  if (!from) {
    console.warn('[CommuniServe][resend] RESEND_FROM_EMAIL is not set — skipping email to', to);
    return { delivered: false, error: 'RESEND_FROM_EMAIL missing' };
  }

  try {
    // Resend's sandbox rejects +tagged addresses; the untagged address still
    // lands in the same inbox.
    const { error } = await client.emails.send({
      from,
      to: [stripEmailTag(to)],
      subject,
      html,
    });

    if (error) {
      console.error('[CommuniServe][resend] Delivery failed:', error.message ?? error);
      return { delivered: false, error: error.message ?? String(error) };
    }

    return { delivered: true };
  } catch (err) {
    console.error('[CommuniServe][resend] Send threw:', err.message);
    return { delivered: false, error: err.message };
  }
}

// ── OTP email (M2 / BR-04) ────────────────────────────────────────────────

function otpEmailHtml(otpCode, recipientEmail) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 32px; border-radius: 10px;">
      <h2 style="color: #0504AA; margin-top: 0; text-align: center;">Account Verification</h2>
      <p style="font-size: 14px; color: #334155; line-height: 1.5;">Welcome to CommuniServe! To complete your client profile registration for <b>${recipientEmail}</b>, enter the 6-digit code provided below into the form verification page:</p>
      <div style="background: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 5px; color: #0504AA;">${otpCode}</span>
      </div>
      <p style="font-size: 11px; color: #64748b; text-align: center; margin-bottom: 0;">This temporary verification token expires in 5 minutes.</p>
    </div>
  `;
}

/**
 * Deliver a 6-digit OTP.
 *
 * Returns { ok, delivered, bypassed, error }:
 *   ok        → the caller may advance the user to the OTP screen
 *   delivered → a real email actually went out
 *   bypassed  → the code was printed to the terminal instead
 *
 * NOTE: printing an OTP violates the "never log OTPs" rule in
 * CAPSTONE_DOCS.md §11, which is why it is confined to the dev bypass.
 * Set OTP_DEV_BYPASS=false before any real pilot or production deployment.
 */
export async function sendOtpEmail({ to, otpCode }) {
  const result = await sendEmail({
    to,
    subject: 'Verify your Resident Account Registration',
    html: otpEmailHtml(otpCode, to),
  });

  if (result.delivered) return { ok: true, delivered: true, bypassed: false };

  if (otpDevBypassEnabled()) {
    console.warn(
      '\n' +
      '╔══════════════════════════════════════════════════════════╗\n' +
      '║  DEV OTP BYPASS — email was not delivered                ║\n' +
      '╠══════════════════════════════════════════════════════════╣\n' +
      `║  To:   ${String(to).padEnd(48)}║\n` +
      `║  Code: ${String(otpCode).padEnd(48)}║\n` +
      '╠══════════════════════════════════════════════════════════╣\n' +
      `║  Reason: ${String(result.error ?? 'unknown').slice(0, 46).padEnd(46)}║\n` +
      '║  Disable with OTP_DEV_BYPASS=false                       ║\n' +
      '╚══════════════════════════════════════════════════════════╝\n'
    );
    return { ok: true, delivered: false, bypassed: true };
  }

  return { ok: false, delivered: false, bypassed: false, error: result.error };
}
