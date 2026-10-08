// PATH: /src/actions/jobActions.js
// M4 — Hiring Management. Customers create job requests; providers respond.
//
// Reads/writes go through the session-scoped client so RLS enforces
// ownership (see supabase/migrations/20260924_portal_read_policies.sql).
// The service-role client is used only to look up the provider's mobile
// number for the SMS, which a customer is not permitted to read.

'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyProviderOfJobRequest } from '@/lib/sms';

/**
 * Create a job request from the signed-in customer to a provider.
 *   requestType 'fixed'  → books one of the provider's pre-set services;
 *                          the price is snapshotted server-side.
 *   requestType 'custom' → opens a negotiation with the customer's
 *                          proposed price (Panday bids also need
 *                          paymentStructure 'arawan' | 'pakyawan').
 * All validation and pricing happen inside create_service_request().
 * BR-08: an SMS failure must never block the request being created.
 */
export async function createJobRequest({
  providerId,
  requestType,
  providerServiceId,
  description,
  street,
  barangay,
  proposedPrice,
  paymentStructure,
}) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  if (!barangay?.trim()) return { success: false, error: 'Please choose the barangay.' };

  const { data: jobId, error } = await supabase.rpc('create_service_request', {
    p_provider_id:         providerId,
    p_request_type:        requestType,
    p_provider_service_id: providerServiceId ?? null,
    p_description:         description?.trim() || null,
    p_street:              street?.trim() || null,
    p_barangay:            barangay.trim(),
    p_proposed_price:      proposedPrice ?? null,
    p_payment_structure:   paymentStructure ?? null,
  });

  if (error) {
    console.error('[jobActions] Create failed:', error.message);
    return { success: false, error: friendlyDbError(error, 'Could not send your request. Please try again.') };
  }

  const job = { job_id: jobId };

  // ── Notify the provider by SMS (§12 / BR-08) — best effort only ──
  try {
    const admin = createAdminClient();
    const { data: provider } = await admin
      .from('providers')
      .select('users(contact_number)')
      .eq('provider_id', providerId)
      .single();

    const mobile = provider?.users?.contact_number;
    if (mobile) {
      await notifyProviderOfJobRequest({ providerMobile: mobile });
    } else {
      console.warn('[jobActions] Provider', providerId, 'has no contact number — SMS skipped.');
    }
  } catch (smsErr) {
    // Never fail the request over a notification.
    console.warn('[jobActions] SMS notification skipped:', smsErr.message);
  }

  revalidatePath('/customer/requests');
  return { success: true, jobId: job.job_id };
}

/**
 * Provider accepts, declines or starts one of their own requests.
 * RLS ("Providers update own requests") guarantees they cannot touch
 * anyone else's job, and the guard_job_lifecycle trigger enforces the
 * order (a job can only be started once Accepted).
 * There is deliberately no 'complete' here: only the customer concludes a
 * job — see completeJobWithReview().
 */
export async function respondToJobRequest(jobId, action) {
  const nextStatus = {
    accept:   'Accepted',
    decline:  'Declined',
    start:    'Ongoing',
  }[action];

  if (!nextStatus) return { success: false, error: 'Unknown action.' };

  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const patch = { job_status: nextStatus };
  if (nextStatus === 'Accepted')  patch.accepted_at  = new Date().toISOString();
  if (nextStatus === 'Ongoing')   patch.started_at   = new Date().toISOString();

  const { error } = await supabase
    .from('job_requests')
    .update(patch)
    .eq('job_id', jobId);

  if (error) {
    console.error('[jobActions] Respond failed:', error.message);
    return { success: false, error: friendlyDbError(error, 'Could not update this request.') };
  }

  revalidatePath('/provider/requests');
  return { success: true, status: nextStatus };
}

/**
 * Customer confirms the work is done and rates the provider (BR-07).
 * complete_job_with_review() does both in one transaction: the job becomes
 * Completed and the rating is saved, which recalculates the provider's
 * average. It also checks the job is the caller's own and is In Progress.
 */
export async function completeJobWithReview(jobId, stars, comment) {
  const rating = Number(stars);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: 'Please choose a rating from 1 to 5 stars.' };
  }

  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const { data: status, error } = await supabase.rpc('complete_job_with_review', {
    p_job_id:  jobId,
    p_stars:   rating,
    p_comment: comment?.trim() || null,
  });

  if (error) {
    console.error('[jobActions] Complete failed:', error.message);
    return { success: false, error: friendlyDbError(error, 'Could not complete this job. Please try again.') };
  }

  revalidatePath('/customer/requests');
  revalidatePath('/provider/requests');
  return { success: true, status };
}

/**
 * Custom Service negotiation — either party answers the latest offer.
 *   action 'accept'  → "Accept Agreement": job becomes Accepted at that price
 *   action 'decline' → provider: Declined / customer: Cancelled
 *   action 'counter' → sends `amount` back; the turn passes to the other side
 * respond_to_job_offer() works out who the caller is and whose turn it is.
 */
export async function respondToOffer(jobId, action, amount, note) {
  if (!['accept', 'decline', 'counter'].includes(action)) {
    return { success: false, error: 'Unknown action.' };
  }

  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const { data: status, error } = await supabase.rpc('respond_to_job_offer', {
    p_job_id: jobId,
    p_action: action,
    p_amount: action === 'counter' ? Number(amount) : null,
    p_note:   note?.trim() || null,
  });

  if (error) {
    console.error('[jobActions] Offer response failed:', error.message);
    return { success: false, error: friendlyDbError(error, 'Could not update this request.') };
  }

  revalidatePath('/customer/requests');
  revalidatePath('/provider/requests');
  return { success: true, status };
}

/**
 * The negotiation functions RAISE plain-English messages meant for the
 * user (e.g. "Waiting for the other party…"). Pass those through; hide
 * anything that looks like a raw Postgres error.
 */
function friendlyDbError(error, fallback) {
  const msg = error?.message ?? '';
  const looksInternal = /violates|constraint|syntax|relation|function|column|permission/i.test(msg);
  return msg && !looksInternal ? msg : fallback;
}

/**
 * The signed-in user has opened My Requests: remember the moment, so the
 * tab's notification badge only counts activity that happens after it
 * (see get_request_news_count()). Writes the caller's own users row.
 */
export async function markRequestsSeen() {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  const { error } = await supabase
    .from('users')
    .update({ requests_seen_at: new Date().toISOString() })
    .eq('auth_id', user.id);

  if (error) {
    console.error('[jobActions] markRequestsSeen failed:', error.message);
    return { success: false };
  }
  return { success: true };
}
