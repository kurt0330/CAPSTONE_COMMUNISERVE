// PATH: /src/app/api/provider/complete-onboarding/route.js
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const supabase = await createServerClient();

    // 1. Verify the user is authenticated with their temporary session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized session context.' }, { status: 401 });
    }

    // 2. Parse the body to get the new password
    const body = await request.json();
    const { password } = body;

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // 3. Update their password in Supabase Auth
    const { error: initialPasswordError } = await supabase.auth.updateUser({
      password: password
    });

    if (initialPasswordError) {
      return NextResponse.json({ error: initialPasswordError.message }, { status: 400 });
    }

    // 4. Update the onboarding flag in public.users using Service Role (to bypass RLS safely)
    const adminSupa = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error: profileError } = await adminSupa
      .from('users')
      .update({ onboarding_complete: true })
      .eq('auth_id', user.id);

    if (profileError) {
      return NextResponse.json({ error: 'Password updated, but profile flag modification failed.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account onboarding complete.' });

  } catch (err) {
    return NextResponse.json({ error: err.message || 'Server error processing setup.' }, { status: 500 });
  }
}