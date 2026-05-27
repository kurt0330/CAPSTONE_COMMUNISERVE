// PATH: /src/app/api/customer/send-otp/route.js
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email field is required.' }, { status: 400 });
    }

    const inputEmail = email.toLowerCase().trim();

    // Connect to Supabase as Admin
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5-minute lifespan stored as text!

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

    const senderName = process.env.RESEND_FROM_NAME || 'CommuniServe';
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // ── THE +TEST1 TRICK BYPASS ──────────────────────────────────────────
    // If you use a +test email, this strips the + tag just for the delivery routing, 
    // ensuring Resend Sandbox accepts it!
    const targetDeliveryEmail = inputEmail.includes('+') 
      ? inputEmail.replace(/\+[^@]+/, '') 
      : inputEmail;
    // ─────────────────────────────────────────────────────────────────────

    // Dispatch via Resend API
    const { error: resendError } = await resend.emails.send({
      from: `${senderName} <${senderEmail}>`,
      to: [targetDeliveryEmail], 
      subject: 'Verify your Resident Account Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 32px; border-radius: 10px;">
          <h2 style="color: #0504AA; margin-top: 0; text-align: center;">Account Verification</h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.5;">Welcome to CommuniServe! To complete your client profile registration for <b>${inputEmail}</b>, enter the 6-digit code provided below into the form verification page:</p>
          <div style="background: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 5px; color: #0504AA;">${otpCode}</span>
          </div>
          <p style="font-size: 11px; color: #64748b; text-align: center; margin-bottom: 0;">This temporary verification token expires in 5 minutes.</p>
        </div>
      `
    });

    if (resendError) {
      console.error('[send-otp] Resend Error:', resendError);
      return NextResponse.json({ success: false, message: 'Could not deliver the code to your email account.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP code dispatched.' });
  } catch (error) {
    console.error('[send-otp] System Error:', error.message);
    return NextResponse.json({ success: false, message: 'Internal validation pipeline error.' }, { status: 500 });
  }
}