// PATH: /src/app/api/customer/verify-otp/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp, password, fullName, contactNumber, barangay } = body;

    if (!email || !otp || !password || !fullName || !barangay) {
      return NextResponse.json({ success: false, message: 'Missing structural parameters.' }, { status: 400 });
    }

    // Connect to Supabase as Admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const cleanEmail = email.toLowerCase().trim();

    // 1. Validate matching token inside table
    const { data: record, error: recordError } = await supabase
      .from('customer_otps')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    if (recordError || !record) {
      return NextResponse.json({ success: false, message: 'Verification record expired or not found.' }, { status: 400 });
    }

    if (record.otp !== otp.trim()) {
      return NextResponse.json({ success: false, message: 'Incorrect 6-digit confirmation code.' }, { status: 400 });
    }

    if (new Date() > new Date(record.expires_at)) {
      return NextResponse.json({ success: false, message: 'Verification token has expired. Please try again.' }, { status: 400 });
    }

    // 2. Consume token
    await supabase.from('customer_otps').delete().eq('email', cleanEmail);

    // 3. Register straight to Supabase Auth as predefined verified account
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true, // Auto-sets email_confirmed_at immediately to satisfy your layout auth guards!
      user_metadata: { role: 'Customer' }
    });

    if (authError || !authUser?.user) {
      console.error('[verify-otp] Auth Error:', authError?.message);
      return NextResponse.json({ success: false, message: authError?.message || 'Authentication mapping failure.' }, { status: 500 });
    }

    // 4. Inject matching database profile row inside public.users
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authUser.user.id,
        full_name: fullName,
        email: cleanEmail,
        password_hash: 'MANAGED_BY_SUPABASE_AUTH',
        role: 'Customer',
        contact_number: contactNumber || null,
        barangay: barangay,
        municipality: 'Anini-y',
        province: 'Antique',
      })
      .select('user_id')
      .single();

    if (userError) {
      console.error('[verify-otp] Users Table Insertion Failure:', userError.message);
      await supabase.auth.admin.deleteUser(authUser.user.id); // Rollback orphaned profile
      return NextResponse.json({ success: false, message: 'Failed to compile local profile metadata.' }, { status: 500 });
    }

    // 5. Complete dependent profile layout row inside public.customers
    const { error: customerError } = await supabase
      .from('customers')
      .insert({
        user_id: newUser.user_id,
        preferred_barangay: barangay
      });

    if (customerError) {
      console.error('[verify-otp] Customers Table Insertion Failure:', customerError.message);
      await supabase.from('users').delete().eq('user_id', newUser.user_id);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ success: false, message: 'Failed to construct final database mapping.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Account established successfully.' });
  } catch (error) {
    console.error('[verify-otp] Core System Failure:', error.message);
    return NextResponse.json({ success: false, message: 'Fatal backend processing error occurred.' }, { status: 500 });
  }
}