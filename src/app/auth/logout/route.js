import { NextResponse }   from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  await supabase.auth.signOut();

  // Hard redirect — clears session and returns user to login
  return NextResponse.redirect(
    new URL('/auth/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  );
}