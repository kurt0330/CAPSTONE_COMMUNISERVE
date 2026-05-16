// PATH: /src/app/api/admin/providers/route.js
// Replaces: php/fetch_pending.php
// Returns all Pending providers with full joined data + Supabase Storage signed URLs.
// Uses service role client to bypass RLS (admin-only endpoint).
// Query mirrors fetch_pending.php exactly: users + providers + nsrp_details +
// employment_details + provider_files joined per provider_id.

import { NextResponse }      from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Signed URL expiry — 1 hour is enough for a review session
const SIGNED_URL_EXPIRY_SECONDS = 3600;

export async function GET(request) {
  const supabase = createServerClient();

  // ── 1. Auth guard — verify the caller is an Admin ────────────────────
  // We read the Authorization header that DashboardClient will send.
  // Service role bypasses RLS but we still want to confirm the caller
  // is a real authenticated Admin, not an anonymous hit on this route.
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', session.user.id)
    .single();

  if (!caller || caller.role !== 'Admin') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  // ── 2. Read query param: ?status=Pending (default) or ?status=Approved ─
  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') ?? 'Pending';

  // Whitelist — never allow arbitrary status strings into the query
  const ALLOWED_STATUSES = ['Pending', 'Approved', 'Rejected', 'Suspended'];
  if (!ALLOWED_STATUSES.includes(statusFilter)) {
    return NextResponse.json({ status: 'error', message: 'Invalid status filter' }, { status: 400 });
  }

  try {
    // ── 3. Fetch providers + related user row ─────────────────────────
    // Supabase JS v2 doesn't support multi-table JOIN syntax directly,
    // so we use the foreign-key embedding syntax (mirrors fetch_pending.php
    // LEFT JOIN pattern) and then attach files in a second pass.
    const { data: providers, error: provError } = await supabase
      .from('providers')
      .select(`
        provider_id,
        trade_category,
        admin_status,
        average_rating,
        bio,
        rejected_at,
        users (
          user_id,
          full_name,
          email,
          contact_number,
          barangay,
          municipality,
          province,
          created_at
        ),
        nsrp_details (
          last_name,
          first_name,
          middle_name,
          suffix,
          date_of_birth,
          age,
          sex,
          civil_status,
          pres_street,
          pres_barangay,
          pres_city,
          pres_province,
          perm_street,
          perm_barangay,
          perm_city,
          perm_province,
          father_name,
          father_contact,
          mother_name,
          mother_contact,
          parents_civil_status,
          is_4ps_beneficiary,
          is_indigent,
          is_pwd,
          is_senior_citizen,
          is_solo_parent
        ),
        employment_details (
          employment_status,
          employment_type,
          unemployment_reason,
          self_employed_spec,
          highest_education,
          school_last_attended,
          course_completed,
          year_graduated,
          employment_history
        )
      `)
      .eq('admin_status', statusFilter)
      .order('provider_id', { ascending: false });

    if (provError) throw provError;
    if (!providers || providers.length === 0) {
      return NextResponse.json({ status: 'success', count: 0, data: [] });
    }

    // ── 4. Fetch all files for these providers in one query ───────────
    const providerIds = providers.map((p) => p.provider_id);

    const { data: allFiles, error: fileError } = await supabase
      .from('provider_files')
      .select('provider_id, file_type, file_path, original_name')
      .in('provider_id', providerIds);

    if (fileError) throw fileError;

    // ── 5. Generate signed URLs for every file ────────────────────────
    // Raw file_path values stored in DB are relative storage paths,
    // e.g. "national_ids/cs_abc123.jpg". We need signed URLs so the
    // admin browser can actually render the images securely.
    const signedFileMap = {}; // { provider_id: { national_id: url, photo: url, ... } }

    if (allFiles && allFiles.length > 0) {
      // Batch sign all paths in one Storage call per bucket would be ideal,
      // but Supabase JS v2 createSignedUrls accepts an array — use that.
      const paths = allFiles.map((f) => f.file_path);

      const { data: signedUrls, error: signError } = await supabase
        .storage
        .from('provider-files')
        .createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);

      if (signError) throw signError;

      // Build a path → signedUrl lookup
      const urlLookup = {};
      signedUrls?.forEach(({ path, signedUrl }) => {
        urlLookup[path] = signedUrl;
      });

      // Map into per-provider structure keyed by file_type
      allFiles.forEach(({ provider_id, file_type, file_path, original_name }) => {
        if (!signedFileMap[provider_id]) signedFileMap[provider_id] = {};
        signedFileMap[provider_id][file_type] = {
          url:           urlLookup[file_path] ?? null,
          original_name,
        };
      });
    }

    // ── 6. Flatten & shape the response ──────────────────────────────
    // Mirror the flat object shape that admin_dashboard.js expected
    // from fetch_pending.php so our React components map fields identically.
    const shaped = providers.map((p) => {
      const files = signedFileMap[p.provider_id] ?? {};
      return {
        // Identity
        provider_id:         p.provider_id,
        full_name:           p.users?.full_name          ?? null,
        email:               p.users?.email              ?? null,
        contact_number:      p.users?.contact_number     ?? null,
        date_submitted:      p.users?.created_at         ?? null,

        // Provider
        trade:               p.trade_category,
        admin_status:        p.admin_status,
        average_rating:      p.average_rating,
        bio:                 p.bio,

        // NSRP / Personal
        ...p.nsrp_details,
        barangay:            p.nsrp_details?.pres_barangay ?? p.users?.barangay ?? null,

        // Employment
        ...p.employment_details,

        // Files (signed URLs)
        national_id_front:   files['national_id']?.url           ?? null,
        national_id_back:    files['national_id_back']?.url       ?? null,
        photo:               files['photo']?.url                  ?? null,
        certificate:         files['certificate']?.url            ?? null,
        national_id_front_name: files['national_id']?.original_name  ?? null,
        national_id_back_name:  files['national_id_back']?.original_name ?? null,
        photo_name:             files['photo']?.original_name         ?? null,
      };
    });

    return NextResponse.json({
      status: 'success',
      count:  shaped.length,
      data:   shaped,
    });

  } catch (err) {
    console.error('[CommuniServe Admin API] providers GET error:', err.message);
    return NextResponse.json(
      { status: 'error', message: 'Server error. Check logs.' },
      { status: 500 }
    );
  }
}