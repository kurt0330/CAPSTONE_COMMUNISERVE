import { NextResponse }   from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request) {
  const supabase = createServerClient();
  await supabase.auth.signOut();

  // Hard redirect — clears session and returns user to login.
  // Uses the request's own origin so it works on any domain without
  // depending on NEXT_PUBLIC_SITE_URL being set on the host.
  return NextResponse.redirect(new URL('/auth/login', request.url));
}