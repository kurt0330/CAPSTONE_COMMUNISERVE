// PATH: /src/app/api/customer/send-otp/route.js
// M2 / BR-04 — issue a single-use 6-digit OTP for customer registration.
//
// Email delivery goes through /src/lib/resend.js, which falls back to printing
// the code in the terminal when live email fails and the dev bypass is on —
// so the verification screen is testable before a custom sending domain exists.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOtpEmail } from '@/lib/resend';
import { isValidEmail } from '@/lib/validators';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email field is required.' }, { status: 400 });
    }

    const inputEmail = email.toLowerCase().trim();

    if (!isValidEmail(inputEmail)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid email address.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Look up if user is already present in public.users
    const { data: userExists } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', inputEmail)
      .single();

    if (userExists) {
      return NextResponse.json({ success: false, message: 'This email address is already registered.' }, { status: 400 });
    }

    // Generate a secure 6-digit numeric token
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5-minute lifespan

    // Save or overwrite active OTP token for this input email address
    const { error: dbError } = await supabase
      .from('customer_otps')
      .upsert(
        { email: inputEmail, otp: otpCode, expires_at: expiresAt },
        { onConflict: 'email' }
      );

    if (dbError) {
      console.error('[send-otp] DB Error:', dbError.message);
      return NextResponse.json({ success: false, message: 'Failed to initialize verification sequence.' }, { status: 500 });
    }

    // Dispatch (or, under the dev bypass, print to the terminal)
    const result = await sendOtpEmail({ to: inputEmail, otpCode });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, message: 'Could not deliver the code to your email account.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.bypassed
        ? 'OTP generated — check your terminal (developer bypass).'
        : 'OTP code dispatched.',
      devBypass: result.bypassed === true,
    });

  } catch (error) {
    console.error('[send-otp] System Error:', error.message);
    return NextResponse.json({ success: false, message: 'Internal validation pipeline error.' }, { status: 500 });
  }
}
