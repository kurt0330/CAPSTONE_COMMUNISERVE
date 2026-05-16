// PATH: /src/actions/registerProvider.js
// Replaces: php/register_sp.php
// Full feature parity: multi-table insert, rejection timer, file upload to Supabase Storage

'use server';

import { createServerClient } from '@/lib/supabase/server';

const ALLOWED_TRADES = ['Carpenter', 'Electrician', 'Kasambahay'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

// ── Helper: upload a file to Supabase Storage ──────────────────────
async function uploadFile(supabase, file, bucket, folder) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} exceeds 5 MB.`);

  const ext      = file.name.split('.').pop().toLowerCase();
  const allowed  = ['jpg', 'jpeg', 'png', 'pdf'];
  if (!allowed.includes(ext)) throw new Error(`Invalid file type: ${ext}`);

  const uniqueName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(uniqueName, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Storage error: ${error.message}`);

  return uniqueName; // relative path stored in DB
}

// ── Main Server Action ─────────────────────────────────────────────
export async function registerProvider(formData) {
  const supabase = createServerClient();

  // ── 1. Extract all fields (mirrors register_sp.php section 3) ──

  const email          = formData.get('email')?.trim() || null;
  const contact_number = formData.get('contact_number')?.trim() || null;
  const last_name      = formData.get('last_name')?.trim() || null;
  const first_name     = formData.get('first_name')?.trim() || null;
  const middle_name    = formData.get('middle_name')?.trim() || null;
  const suffix         = formData.get('suffix')?.trim() || null;
  const date_of_birth  = formData.get('date_of_birth') || null;
  const age            = parseInt(formData.get('age')) || null;
  const sex            = formData.get('sex') || null;
  const civil_status   = formData.get('civil_status') || null;
  const pres_street    = formData.get('pres_street')?.trim() || null;
  const pres_barangay  = formData.get('pres_barangay')?.trim() || null;
  const pres_city      = formData.get('pres_city')?.trim() || 'Anini-y';
  const pres_province  = formData.get('pres_province')?.trim() || 'Antique';
  const same_address   = formData.get('same_as_permanent') === '1';
  const perm_street    = same_address ? pres_street   : formData.get('perm_street')?.trim()   || null;
  const perm_barangay  = same_address ? pres_barangay : formData.get('perm_barangay')?.trim() || null;
  const perm_city      = same_address ? pres_city     : formData.get('perm_city')?.trim()     || null;
  const perm_province  = same_address ? pres_province : formData.get('perm_province')?.trim() || null;
  const father_name    = formData.get('father_name')?.trim() || null;
  const father_contact = formData.get('father_contact')?.trim() || null;
  const mother_name    = formData.get('mother_name')?.trim() || null;
  const mother_contact = formData.get('mother_contact')?.trim() || null;
  const parents_civil_status = formData.get('parents_civil_status') || null;

  // Socio-economic booleans
  const is_4ps_beneficiary = formData.get('is_4ps_beneficiary') === '1';
  const is_indigent        = formData.get('is_indigent') === '1';
  const is_pwd             = formData.get('is_pwd') === '1';
  const is_senior_citizen  = formData.get('is_senior_citizen') === '1';
  const is_solo_parent     = formData.get('is_solo_parent') === '1';

  // Employment
  const employment_status   = formData.get('employment_status') || null;
  const employment_type     = formData.get('employment_type') || 'Not Applicable';
  const unemployment_reason = formData.get('unemployment_reason') || 'Not Applicable';
  const self_employed_spec  = formData.get('self_employed_spec') || null;
  const highest_education   = formData.get('highest_education') || null;
  const school_last_attended = formData.get('school_last_attended')?.trim() || null;
  const course_completed    = formData.get('course_completed')?.trim() || null;
  const year_graduated      = parseInt(formData.get('year_graduated')) || null;
  const employment_history  = formData.get('employment_history')?.trim() || null;

  const trade_category = formData.get('trade_category') || null;

  // Files
  const file_national_id      = formData.get('file_national_id');
  const file_national_id_back = formData.get('file_national_id_back');
  const file_photo             = formData.get('file_photo');
  const file_certificate       = formData.get('file_certificate');

  // ── 2. Server-side validation (mirrors register_sp.php section 4) ──
  const errors = [];
  if (!last_name)           errors.push('Last name is required.');
  if (!first_name)          errors.push('First name is required.');
  if (!email)               errors.push('Email address is required.');
  if (email && !/\S+@\S+\.\S+/.test(email)) errors.push('Invalid email format.');
  if (!date_of_birth)       errors.push('Date of birth is required.');
  if (!sex)                 errors.push('Sex is required.');
  if (!civil_status)        errors.push('Civil status is required.');
  if (!pres_barangay)       errors.push('Barangay is required.');
  if (!employment_status)   errors.push('Employment status is required.');
  if (!trade_category)      errors.push('Trade category is required.');
  if (trade_category && !ALLOWED_TRADES.includes(trade_category)) {
    errors.push('Invalid trade category.');
  }
  if (age !== null && (age < 15 || age > 120)) errors.push('Age must be between 15 and 120.');

  if (!file_national_id || file_national_id.size === 0)
    errors.push('National ID (Front) is required.');
  if (!file_national_id_back || file_national_id_back.size === 0)
    errors.push('National ID (Back) is required.');
  if (!file_photo || file_photo.size === 0)
    errors.push('2×2 photo is required.');

  if (errors.length > 0) return { success: false, errors };

  // ── 3. Rejection timer check (mirrors register_sp.php section 6a) ──
  const { data: existingUser } = await supabase
    .from('users')
    .select('user_id, providers(admin_status, rejected_at)')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    const provider = existingUser.providers?.[0];
    if (provider?.admin_status === 'Rejected' && provider.rejected_at) {
      const rejectedAt = new Date(provider.rejected_at);
      const daysSince  = Math.floor((Date.now() - rejectedAt.getTime()) / 86400000);
      if (daysSince < 14) {
        return {
          success: false,
          errors: [`Your previous application was rejected. Please wait ${14 - daysSince} more days to re-apply.`],
        };
      }
      // 14 days passed — delete old record so they can re-register fresh
      await supabase.from('users').delete().eq('user_id', existingUser.user_id);
    } else {
      return {
        success: false,
        errors: ['This email is already registered and active or pending.'],
      };
    }
  }

  // ── 4. Upload files to Supabase Storage ───────────────────────────
  let uploadedPaths = {};
  try {
    uploadedPaths.national_id      = await uploadFile(supabase, file_national_id,      'provider-files', 'national_ids');
    uploadedPaths.national_id_back = await uploadFile(supabase, file_national_id_back, 'provider-files', 'national_ids');
    uploadedPaths.photo            = await uploadFile(supabase, file_photo,             'provider-files', 'photos');
    uploadedPaths.certificate      = file_certificate?.size > 0
      ? await uploadFile(supabase, file_certificate, 'provider-files', 'certificates')
      : null;
  } catch (uploadError) {
    return { success: false, errors: [uploadError.message] };
  }

  // ── 5. Database inserts — mirrors PHP transaction (section 6b-f) ──
  // Supabase doesn't support raw transactions via JS client,
  // so we use a Postgres function (RPC) for atomicity.
  // For now: sequential inserts with manual rollback on failure.

  let userId, providerId;

  try {
    // 5a. Insert user
    const fullName = [first_name, middle_name, last_name].filter(Boolean).join(' ');
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        full_name:     fullName,
        email,
        password_hash: 'PENDING_RESET', // Admin resets on approval
        role:          'Provider',
        contact_number,
        barangay:      pres_barangay,
        municipality:  pres_city,
        province:      pres_province,
      })
      .select('user_id')
      .single();
    if (userError) throw userError;
    userId = newUser.user_id;

    // 5b. Insert provider
    const { data: newProvider, error: provError } = await supabase
      .from('providers')
      .insert({
        user_id:        userId,
        trade_category,
        admin_status:   'Pending',
        average_rating: 0,
      })
      .select('provider_id')
      .single();
    if (provError) throw provError;
    providerId = newProvider.provider_id;

    // 5c. Insert nsrp_details
    const { error: nsrpError } = await supabase
      .from('nsrp_details')
      .insert({
        provider_id, last_name, first_name, middle_name, suffix,
        date_of_birth, age, sex, civil_status,
        pres_street, pres_barangay, pres_city, pres_province,
        perm_street, perm_barangay, perm_city, perm_province,
        father_name, father_contact, mother_name, mother_contact,
        parents_civil_status,
        is_4ps_beneficiary, is_indigent, is_pwd,
        is_senior_citizen, is_solo_parent,
      });
    if (nsrpError) throw nsrpError;

    // 5d. Insert employment_details
    const { error: empError } = await supabase
      .from('employment_details')
      .insert({
        provider_id:      providerId,
        employment_status, employment_type,
        unemployment_reason, self_employed_spec,
        highest_education, school_last_attended,
        course_completed, year_graduated, employment_history,
      });
    if (empError) throw empError;

    // 5e. Insert provider_files
    const fileRows = [
      { file_type: 'national_id',      file_path: uploadedPaths.national_id },
      { file_type: 'national_id_back', file_path: uploadedPaths.national_id_back },
      { file_type: 'photo',            file_path: uploadedPaths.photo },
      uploadedPaths.certificate
        ? { file_type: 'certificate', file_path: uploadedPaths.certificate }
        : null,
    ]
      .filter(Boolean)
      .map((f) => ({ ...f, provider_id: providerId }));

    const { error: filesError } = await supabase.from('provider_files').insert(fileRows);
    if (filesError) throw filesError;

    return {
      success:     true,
      message:     'Registration submitted. Pending LGU review.',
      provider_id: providerId,
    };

  } catch (dbError) {
    // Manual rollback — delete in reverse order
    if (providerId) await supabase.from('providers').delete().eq('provider_id', providerId);
    if (userId)     await supabase.from('users').delete().eq('user_id', userId);

    // Clean up uploaded files
    const pathsToDelete = Object.values(uploadedPaths).filter(Boolean);
    if (pathsToDelete.length > 0) {
      await supabase.storage.from('provider-files').remove(pathsToDelete);
    }

    console.error('[CommuniServe] Registration DB error:', dbError.message);
    return { success: false, errors: ['Registration failed. Please try again.'] };
  }
}