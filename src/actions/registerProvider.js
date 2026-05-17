// PATH: /src/actions/registerProvider.js
// Replaces: php/register_sp.php

'use server';

import { createClient } from '@supabase/supabase-js';

const ALLOWED_TRADES = ['Carpenter', 'Electrician', 'Kasambahay'];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

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

  return uniqueName;
}

export async function registerProvider(formData) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ── 1. Extract all fields ──
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

  const is_4ps_beneficiary = formData.get('is_4ps_beneficiary') === '1';
  const is_indigent        = formData.get('is_indigent') === '1';
  const is_pwd             = formData.get('is_pwd') === '1';
  const is_senior_citizen  = formData.get('is_senior_citizen') === '1';
  const is_solo_parent     = formData.get('is_solo_parent') === '1';

  const employment_status   = formData.get('employment_status') || null;
  const employment_type     = formData.get('employment_type') || 'Not Applicable';
  const unemployment_reason = formData.get('unemployment_reason') || 'Not Applicable';
  const self_employed_spec  = formData.get('self_employed_spec') || null;
  const highest_education   = formData.get('highest_education') || null;
  const school_last_attended = formData.get('school_last_attended')?.trim() || null;
  const course_completed    = formData.get('course_completed')?.trim() || null;
  const year_graduated      = formData.get('year_graduated')?.trim() || null;
  const employment_history  = formData.get('employment_history')?.trim() || null;

  const trade_category = formData.get('trade_category') || null;

  // Step 4 Assessment variables extraction
  const assessment_test_id    = formData.get('assessment_test_id') || null;
  const assessment_started_at = formData.get('assessment_started_at') || null;
  const assessment_skipped    = formData.get('assessment_skipped') === '1';
  const assessment_answers_raw = formData.get('assessment_answers');
  const assessment_answers    = assessment_answers_raw ? JSON.parse(assessment_answers_raw) : {};

  // Files
  const file_national_id      = formData.get('file_national_id');
  const file_national_id_back = formData.get('file_national_id_back');
  const file_photo             = formData.get('file_photo');
  const file_certificate       = formData.get('file_certificate');

  // ── 2. Server-side validation ──
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

  // ── 3. Rejection timer check ──
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
      await supabase.from('users').delete().eq('user_id', existingUser.user_id);
    } else {
      return {
        success: false,
        errors: ['This email is already registered and active or pending.'],
      };
    }
  }

  // ── 4. Upload files to Supabase Storage ──
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

  // ── 5. Database inserts ──
  let userId, providerId;

  try {
    // 5a. Insert user
    const fullName = [first_name, middle_name, last_name].filter(Boolean).join(' ');
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        full_name:     fullName,
        email,
        password_hash: 'PENDING_RESET',
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
        provider_id: providerId, last_name, first_name, middle_name, suffix,
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
      { file_type: 'national_id',      file_path: uploadedPaths.national_id,      original_name: file_national_id.name },
      { file_type: 'national_id_back', file_path: uploadedPaths.national_id_back, original_name: file_national_id_back.name },
      { file_type: 'photo',            file_path: uploadedPaths.photo,            original_name: file_photo.name },
      uploadedPaths.certificate
        ? { file_type: 'certificate',  file_path: uploadedPaths.certificate,      original_name: file_certificate.name }
        : null,
    ]
      .filter(Boolean)
      .map((f) => ({ ...f, provider_id: providerId }));

    const { error: filesError } = await supabase.from('provider_files').insert(fileRows);
    if (filesError) throw filesError;

    // ── 5f. Secure Server-Side Test Assessment Evaluation Check ──
    if (assessment_test_id && !assessment_skipped) {
      try {
        const { data: questions, error: qErr } = await supabase
          .from('assessment_questions')
          .select(`
            question_id,
            points,
            assessment_choices (choice_id, is_correct)
          `)
          .eq('test_id', assessment_test_id);

        if (!qErr && questions) {
          let totalPoints = 0;
          let earnedPoints = 0;

          questions.forEach((q) => {
            const pointValue = q.points ?? 1;
            totalPoints += pointValue;
            const chosenId = assessment_answers[q.question_id];
            const correctChoice = q.assessment_choices.find((c) => c.is_correct);
            if (chosenId && correctChoice && Number(chosenId) === correctChoice.choice_id) {
              earnedPoints += pointValue;
            }
          });

          const { data: testMeta } = await supabase
            .from('assessment_tests')
            .select('passing_score')
            .eq('test_id', assessment_test_id)
            .single();

          const scorePct = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
          const passed = scorePct >= (testMeta?.passing_score ?? 75);

          const { data: attempt, error: attemptErr } = await supabase
            .from('assessment_attempts')
            .insert({
              provider_id:  providerId,
              test_id:      assessment_test_id,
              score_raw:    earnedPoints,
              score_pct:    Math.round(scorePct * 100) / 100,
              passed,
              started_at:   assessment_started_at || new Date().toISOString(),
              submitted_at: new Date().toISOString(),
            })
            .select('attempt_id')
            .single();

          if (!attemptErr && attempt) {
            const answerRows = Object.entries(assessment_answers).map(([q_id, c_id]) => ({
              attempt_id:       attempt.attempt_id,
              question_id:      Number(q_id),
              chosen_choice_id: c_id ? Number(c_id) : null,
            }));

            if (answerRows.length > 0) {
              await supabase.from('assessment_answers').insert(answerRows);
            }
          }
        }
      } catch (innerExamErr) {
        // Handled as non-fatal so database profiles aren't rolled back due to calculation script errors
        console.error('[Unified Submit Logic] Non-fatal Exam Insert Error:', innerExamErr);
      }
    }

    return {
      success:     true,
      message:     'Registration submitted. Pending LGU review.',
      provider_id: providerId,
    };

  } catch (dbError) {
    // Reverse order data rollbacks
    if (providerId) await supabase.from('providers').delete().eq('provider_id', providerId);
    if (userId)     await supabase.from('users').delete().eq('user_id', userId);

    const pathsToDelete = Object.values(uploadedPaths).filter(Boolean);
    if (pathsToDelete.length > 0) {
      await supabase.storage.from('provider-files').remove(pathsToDelete);
    }

    console.error('[CommuniServe] Registration DB error:', dbError.message);
    return { success: false, errors: ['Registration failed. Please try again.'] };
  }
}