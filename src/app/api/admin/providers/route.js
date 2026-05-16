// PATH: /src/app/api/admin/providers/route.js
import { NextResponse }      from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
const SIGNED_URL_EXPIRY_SECONDS = 3600;

export async function GET(request) {
  const supabase = createServerClient();

  // 1. Secure Auth guard
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  const { data: caller } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (!caller || caller.role !== 'Admin') {
    return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status') ?? 'Pending';

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 2. Fetch providers
    const { data: providers, error: provError } = await adminSupabase
      .from('providers')
      .select(`
        provider_id,
        trade_category,
        admin_status,
        average_rating,
        bio,
        rejected_at,
        users (user_id, full_name, email, contact_number, barangay, municipality, province, created_at),
        nsrp_details (*),
        employment_details (*)
      `)
      .eq('admin_status', statusFilter)
      .order('provider_id', { ascending: false });

    if (provError) throw provError;
    if (!providers || providers.length === 0) {
      return NextResponse.json({ status: 'success', count: 0, data: [] });
    }

    const providerIds = providers.map((p) => p.provider_id);

    // 3. Fetch files linked to these providers
    const { data: allFiles, error: fileError } = await adminSupabase
      .from('provider_files')
      .select('provider_id, file_type, file_path, original_name')
      .in('provider_id', providerIds);

    if (fileError) throw fileError;

    const signedFileMap = {}; 

    // 4. Generate signed URLs from Storage
    if (allFiles && allFiles.length > 0) {
      const paths = allFiles.map((f) => f.file_path);

      const { data: signedUrls, error: signError } = await adminSupabase
        .storage
        .from('provider-files') 
        .createSignedUrls(paths, SIGNED_URL_EXPIRY_SECONDS);

      if (signError) console.error("❌ Storage signing error:", signError.message);

      const urlLookup = {};
      signedUrls?.forEach(({ path, signedUrl, error }) => {
        if (error) console.error(`❌ Error signing path [${path}]:`, error);
        urlLookup[path] = signedUrl;
      });

      allFiles.forEach(({ provider_id, file_type, file_path, original_name }) => {
        if (!signedFileMap[provider_id]) signedFileMap[provider_id] = {};
        signedFileMap[provider_id][file_type] = {
          url:           urlLookup[file_path] ?? null,
          original_name,
        };
      });
    }

    // 5. Shape response data for the frontend UI components
    const shaped = providers.map((p) => {
      const files = signedFileMap[p.provider_id] ?? {};
      return {
        provider_id:            p.provider_id,
        full_name:              p.users?.full_name           ?? null,
        email:                  p.users?.email               ?? null,
        contact_number:         p.users?.contact_number      ?? null,
        date_submitted:         p.users?.created_at          ?? null,
        trade:                  p.trade_category,
        admin_status:           p.admin_status,
        average_rating:         p.average_rating,
        bio:                    p.bio,
        ...p.nsrp_details,
        barangay:               p.nsrp_details?.pres_barangay ?? p.users?.barangay ?? null,
        ...p.employment_details,
        
        // FIXED DATABASE KEYS MATCHES HERE:
        national_id_front:      files['national_id']?.url            ?? null,
        national_id_back:       files['national_id_back']?.url       ?? null,
        photo:                  files['photo']?.url                  ?? null,
        certificate:            files['certificate']?.url            ?? null,
        national_id_front_name: files['national_id']?.original_name  ?? null,
        national_id_back_name:  files['national_id_back']?.original_name ?? null,
        photo_name:             files['photo']?.original_name         ?? null,
      };
    });

    return NextResponse.json({ status: 'success', count: shaped.length, data: shaped });

  } catch (err) {
    console.error('[CommuniServe Admin API] providers GET error:', err.message);
    return NextResponse.json({ status: 'error', message: 'Server error.' }, { status: 500 });
  }
}