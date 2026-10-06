// PATH: /src/actions/profileActions.js
// Self-service profile edits for customers and providers.
//
// Editable here: nickname, bio, photo; customers also their street address and
// contact number; providers also their documents, skills and work gallery.
// Full name, address and trade are verified registration data: nothing in
// this file writes them, and the guard_user_identity / guard_provider_identity
// triggers reject such a change even from a hand-made API call.
//
// Files are uploaded by the browser directly to Storage; these actions only
// record the result, after checking the object sits in the caller's own
// folder (`<auth uid>/…`).

'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';

const AVATAR_BUCKET   = 'avatars';
const DOCUMENT_BUCKET = 'provider-documents';
const GALLERY_BUCKET  = 'provider-gallery';
const NICKNAME_MAX = 40;
const BIO_MAX      = 500;
const STREET_MAX   = 160;
const CAPTION_MAX  = 120;
const SKILL_NAME_MAX = 100;
const SKILL_DESC_MAX = 255;
const MAX_SKILLS  = 20;
const MAX_GALLERY = 24;

// Philippine mobile number as stored for SMS: 09XXXXXXXXX
const PH_MOBILE = /^09\d{9}$/;

async function getMe() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: 'You must be signed in.' };

  const { data: me } = await supabase
    .from('users')
    .select('user_id, role, avatar_url')
    .eq('auth_id', user.id)
    .single();

  if (!me) return { supabase, error: 'Your profile could not be found.' };
  return { supabase, user, me };
}

async function getMyProvider(supabase, userId) {
  const { data } = await supabase
    .from('providers')
    .select('provider_id, resume_path')
    .eq('user_id', userId)
    .single();
  return data;
}

const ownsPath = (user, path) => typeof path === 'string' && path.startsWith(`${user.id}/`) && !path.includes('..');
const cleanName = (name) => String(name ?? 'document').replace(/[\\/]/g, ' ').trim().slice(0, 200) || 'document';

// A profile change shows up in the header, dashboards, search and profiles.
function refreshEverything() {
  revalidatePath('/customer', 'layout');
  revalidatePath('/provider', 'layout');
}

/**
 * Nickname + bio for everyone; customers can also edit their street address
 * and contact number. Returns { success } or { success: false, error,
 * fieldErrors } so the page can show each problem beside its field.
 */
export async function updateMyProfile({ nickname, bio, streetAddress, contactNumber }) {
  const { supabase, user, me, error } = await getMe();
  if (error) return { success: false, error };

  const isProvider = me.role === 'Provider';
  const nick   = (nickname ?? '').trim();
  const text   = (bio ?? '').trim();
  const street = (streetAddress ?? '').trim();
  const mobile = (contactNumber ?? '').replace(/[\s-]/g, '');

  const fieldErrors = {};
  if (nick.length > NICKNAME_MAX) fieldErrors.nickname = `Keep your nickname within ${NICKNAME_MAX} characters.`;
  if (text.length > BIO_MAX)      fieldErrors.bio = `Keep this within ${BIO_MAX} characters.`;
  if (!isProvider) {
    if (street.length > STREET_MAX) fieldErrors.streetAddress = `Keep the address within ${STREET_MAX} characters.`;
    if (mobile && !PH_MOBILE.test(mobile)) fieldErrors.contactNumber = 'Enter an 11-digit mobile number that starts with 09, for example 09171234567.';
  }
  if (Object.keys(fieldErrors).length) {
    return { success: false, error: 'Please fix the highlighted fields.', fieldErrors };
  }

  // Customers keep their bio on users; providers on providers.bio (existing).
  const userPatch = { nickname: nick || null };
  if (!isProvider) {
    userPatch.bio = text || null;
    userPatch.street_address = street || null;
    userPatch.contact_number = mobile || null;
  }

  const { error: userError } = await supabase.from('users').update(userPatch).eq('auth_id', user.id);
  if (userError) {
    console.error('[profileActions] Profile update failed:', userError.message);
    return { success: false, error: 'Could not save your profile. Please try again.' };
  }

  if (isProvider) {
    const { error: bioError } = await supabase
      .from('providers').update({ bio: text || null }).eq('user_id', me.user_id);
    if (bioError) {
      console.error('[profileActions] Bio update failed:', bioError.message);
      return { success: false, error: 'Your nickname was saved, but the bio could not be. Please try again.' };
    }
  }

  refreshEverything();
  return { success: true };
}

/** Point the profile at a freshly uploaded photo, or pass null to remove it. */
export async function setMyAvatar(path) {
  const { supabase, user, me, error } = await getMe();
  if (error) return { success: false, error };
  if (path !== null && !ownsPath(user, path)) return { success: false, error: 'That photo could not be saved.' };

  const avatarUrl = path
    ? supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
    : null;

  const { error: updateError } = await supabase
    .from('users').update({ avatar_url: avatarUrl }).eq('auth_id', user.id);
  if (updateError) {
    console.error('[profileActions] Avatar update failed:', updateError.message);
    return { success: false, error: 'Could not save your photo.' };
  }

  // Tidy up the photo this one replaces (the user's own file; best effort).
  const oldPath = me.avatar_url?.split(`/${AVATAR_BUCKET}/`)[1];
  if (oldPath && oldPath !== path && ownsPath(user, oldPath)) {
    await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
  }

  refreshEverything();
  return { success: true, avatarUrl };
}

/** Provider résumé: pass { path, name } after uploading, or null to remove. */
export async function setMyResume(file) {
  const { supabase, user, me, error } = await getMe();
  if (error) return { success: false, error };
  if (me.role !== 'Provider') return { success: false, error: 'Only providers can add a résumé.' };
  if (file !== null && !ownsPath(user, file?.path)) return { success: false, error: 'That file could not be saved.' };

  const provider = await getMyProvider(supabase, me.user_id);
  if (!provider) return { success: false, error: 'Your provider record could not be found.' };

  const { error: updateError } = await supabase
    .from('providers')
    .update({ resume_path: file?.path ?? null, resume_name: file ? cleanName(file.name) : null })
    .eq('provider_id', provider.provider_id);
  if (updateError) {
    console.error('[profileActions] Resume update failed:', updateError.message);
    return { success: false, error: 'Could not save your résumé.' };
  }

  if (provider.resume_path && provider.resume_path !== file?.path && ownsPath(user, provider.resume_path)) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([provider.resume_path]);
  }

  refreshEverything();
  return { success: true };
}

/** Record an uploaded skill certificate (T-provider_files, type 'certificate'). */
export async function addMyCertificate({ path, name }) {
  const { supabase, user, me, error } = await getMe();
  if (error) return { success: false, error };
  if (me.role !== 'Provider') return { success: false, error: 'Only providers can add certificates.' };
  if (!ownsPath(user, path)) return { success: false, error: 'That file could not be saved.' };

  const provider = await getMyProvider(supabase, me.user_id);
  if (!provider) return { success: false, error: 'Your provider record could not be found.' };

  const { error: insertError } = await supabase.from('provider_files').insert({
    provider_id:   provider.provider_id,
    file_type:     'certificate',
    file_path:     path,
    original_name: cleanName(name),
  });
  if (insertError) {
    console.error('[profileActions] Certificate insert failed:', insertError.message);
    return { success: false, error: 'Could not save that certificate.' };
  }

  refreshEverything();
  return { success: true };
}

/** Remove one of the provider's own certificates (row + stored file). */
export async function removeMyCertificate(fileId) {
  const { supabase, user, me, error } = await getMe();
  if (error) return { success: false, error };

  const provider = await getMyProvider(supabase, me.user_id);
  if (!provider) return { success: false, error: 'Your provider record could not be found.' };

  // Scoped to the caller's own provider row and to certificates only, so
  // this can never touch application documents (IDs, photo).
  const { data: row } = await supabase
    .from('provider_files')
    .select('file_id, file_path')
    .eq('file_id', fileId)
    .eq('provider_id', provider.provider_id)
    .eq('file_type', 'certificate')
    .single();
  if (!row) return { success: false, error: 'That certificate could not be found.' };

  const { error: deleteError } = await supabase
    .from('provider_files').delete().eq('file_id', row.file_id).eq('provider_id', provider.provider_id);
  if (deleteError) {
    console.error('[profileActions] Certificate delete failed:', deleteError.message);
    return { success: false, error: 'Could not remove that certificate.' };
  }

  if (ownsPath(user, row.file_path)) {
    await supabase.storage.from(DOCUMENT_BUCKET).remove([row.file_path]);
  }

  refreshEverything();
  return { success: true };
}

// ── Provider skills (T-skills; "Providers manage own skills" policy) ────────

export async function addMySkill({ name, description, years }) {
  const { supabase, me, error } = await getMe();
  if (error) return { success: false, error };
  if (me.role !== 'Provider') return { success: false, error: 'Only providers can add skills.' };

  const skillName = (name ?? '').trim();
  const desc = (description ?? '').trim();
  const yrs = Number(years);

  const fieldErrors = {};
  if (!skillName) fieldErrors.name = 'Enter the name of the skill.';
  else if (skillName.length > SKILL_NAME_MAX) fieldErrors.name = `Keep the name within ${SKILL_NAME_MAX} characters.`;
  if (desc.length > SKILL_DESC_MAX) fieldErrors.description = `Keep the description within ${SKILL_DESC_MAX} characters.`;
  if (!Number.isInteger(yrs) || yrs < 0 || yrs > 60) fieldErrors.years = 'Enter whole years between 0 and 60.';
  if (Object.keys(fieldErrors).length) return { success: false, error: 'Please fix the highlighted fields.', fieldErrors };

  const provider = await getMyProvider(supabase, me.user_id);
  if (!provider) return { success: false, error: 'Your provider record could not be found.' };

  const { count } = await supabase
    .from('skills').select('*', { count: 'exact', head: true }).eq('provider_id', provider.provider_id);
  if ((count ?? 0) >= MAX_SKILLS) return { success: false, error: `You can list up to ${MAX_SKILLS} skills. Remove one to add another.` };

  const { error: insertError } = await supabase.from('skills').insert({
    provider_id: provider.provider_id,
    skill_name: skillName,
    description: desc || null,
    years_experience: yrs,
  });
  if (insertError) {
    console.error('[profileActions] Skill insert failed:', insertError.message);
    return { success: false, error: 'Could not add that skill. Please try again.' };
  }

  refreshEverything();
  return { success: true };
}

export async function removeMySkill(skillId) {
  const { supabase, me, error } = await getMe();
  if (error) return { success: false, error };

  const provider = await getMyProvider(supabase, me.user_id);
  if (!provider) return { success: false, error: 'Your provider record could not be found.' };

  const { error: deleteError } = await supabase
    .from('skills').delete().eq('skill_id', skillId).eq('provider_id', provider.provider_id);
  if (deleteError) {
    console.error('[profileActions] Skill delete failed:', deleteError.message);
    return { success: false, error: 'Could not remove that skill. Please try again.' };
  }

  refreshEverything();
  return { success: true };
}

// ── Provider work gallery (T-provider_gallery, public bucket) ───────────────

export async function addMyGalleryImage({ path, caption }) {
  const { supabase, user, me, error } = await getMe();
  if (error) return { success: false, error };
  if (me.role !== 'Provider') return { success: false, error: 'Only providers can add gallery photos.' };
  if (!ownsPath(user, path)) return { success: false, error: 'That photo could not be saved.' };

  const provider = await getMyProvider(supabase, me.user_id);
  if (!provider) return { success: false, error: 'Your provider record could not be found.' };

  const { count } = await supabase
    .from('provider_gallery').select('*', { count: 'exact', head: true }).eq('provider_id', provider.provider_id);
  if ((count ?? 0) >= MAX_GALLERY) {
    await supabase.storage.from(GALLERY_BUCKET).remove([path]);
    return { success: false, error: `Your gallery holds up to ${MAX_GALLERY} photos. Remove one to add another.` };
  }

  const { error: insertError } = await supabase.from('provider_gallery').insert({
    provider_id: provider.provider_id,
    file_path: path,
    caption: (caption ?? '').trim().slice(0, CAPTION_MAX) || null,
  });
  if (insertError) {
    console.error('[profileActions] Gallery insert failed:', insertError.message);
    return { success: false, error: 'Could not save that photo. Please try again.' };
  }

  refreshEverything();
  return { success: true };
}

export async function removeMyGalleryImage(imageId) {
  const { supabase, user, me, error } = await getMe();
  if (error) return { success: false, error };

  const provider = await getMyProvider(supabase, me.user_id);
  if (!provider) return { success: false, error: 'Your provider record could not be found.' };

  const { data: row } = await supabase
    .from('provider_gallery')
    .select('image_id, file_path')
    .eq('image_id', imageId)
    .eq('provider_id', provider.provider_id)
    .single();
  if (!row) return { success: false, error: 'That photo could not be found.' };

  const { error: deleteError } = await supabase
    .from('provider_gallery').delete().eq('image_id', row.image_id).eq('provider_id', provider.provider_id);
  if (deleteError) {
    console.error('[profileActions] Gallery delete failed:', deleteError.message);
    return { success: false, error: 'Could not remove that photo. Please try again.' };
  }

  if (ownsPath(user, row.file_path)) {
    await supabase.storage.from(GALLERY_BUCKET).remove([row.file_path]);
  }

  refreshEverything();
  return { success: true };
}
