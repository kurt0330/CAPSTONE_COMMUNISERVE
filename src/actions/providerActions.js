// PATH: /src/actions/providerActions.js
// M3 — provider self-service edits to their own portfolio.
// Writes go through the session client; the "Providers update own row"
// policy restricts each provider to their own record.

'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';

export async function updateProviderBio(providerId, bio) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const { error } = await supabase
    .from('providers')
    .update({ bio: bio?.trim() || null })
    .eq('provider_id', providerId);

  if (error) {
    console.error('[providerActions] Bio update failed:', error.message);
    return { success: false, error: 'Could not save your bio.' };
  }

  revalidatePath('/provider/portfolio');
  return { success: true };
}

/**
 * Activate / re-price / deactivate one pre-set service (Services & Pricing).
 * The "Providers manage own services" policy restricts the row to the
 * signed-in provider AND to services of their own trade.
 */
export async function saveProviderService({ providerId, catalogId, price, isActive }) {
  const supabase = createServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'You must be signed in.' };

  const amount = Number(price);
  if (isActive && (!Number.isFinite(amount) || amount <= 0 || amount > 1000000)) {
    return { success: false, error: 'Enter a price between ₱1 and ₱1,000,000.' };
  }

  const row = {
    provider_id: providerId,
    catalog_id:  catalogId,
    is_active:   Boolean(isActive),
    updated_at:  new Date().toISOString(),
  };
  // Keep the last price when switching a service off.
  if (Number.isFinite(amount) && amount > 0) row.price = Math.round(amount * 100) / 100;

  const { error } = await supabase
    .from('provider_services')
    .upsert(row, { onConflict: 'provider_id,catalog_id' });

  if (error) {
    console.error('[providerActions] Service save failed:', error.message);
    return { success: false, error: 'Could not save this service.' };
  }

  revalidatePath('/provider/portfolio');
  return { success: true };
}
