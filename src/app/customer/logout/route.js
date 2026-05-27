// PATH: /src/app/customer/logout/route.js
// Mirrors provider/logout exactly.

import { NextResponse }       from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(
    new URL('/auth/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  );
}