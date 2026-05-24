// PATH: /src/app/provider/logout/route.js
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request) {
  const supabase = await createServerClient();
  
  // Clear the active session cookies
  await supabase.auth.signOut();
  
  const requestUrl = new URL(request.url);
  return NextResponse.redirect(`${requestUrl.origin}/auth/login`);
}