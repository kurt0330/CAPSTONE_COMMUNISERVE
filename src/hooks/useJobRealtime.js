// PATH: /src/hooks/useJobRealtime.js
// Live updates for the customer and provider portals.
//
// Subscribes to INSERT / UPDATE / DELETE on job_requests and job_offers and
// re-fetches the current route's Server Components when something changes.
// Realtime applies the tables' RLS policies to the signed-in user, so each
// party is only notified about their own jobs.
//
// Why re-fetch instead of patching local state: the lists are built by
// get_customer_jobs() / get_provider_jobs(), which join names, prices and
// the whole offer thread — a change payload only carries one raw row.
// router.refresh() keeps client state, so a half-typed counter-offer or an
// active filter survives the update.

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const TABLES = ['job_requests', 'job_offers'];

// One user action often writes several rows (a counter-offer inserts into
// job_offers AND updates job_requests) — collapse the burst into one fetch.
const REFRESH_DELAY_MS = 300;

export function useJobRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer = null;

    function scheduleRefresh() {
      clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), REFRESH_DELAY_MS);
    }

    // Unique topic per mount, so a remount never collides with a channel
    // that is still closing.
    let channel = supabase.channel(`job-activity-${Date.now()}`);
    TABLES.forEach((table) => {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        scheduleRefresh
      );
    });

    let wasConnected = false;
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Events sent while the socket was down are lost, so catch up
        // after a reconnect (not on the very first connect).
        if (wasConnected) scheduleRefresh();
        wasConnected = true;
      }
    });

    // Phones suspend the socket when the tab is in the background; catch
    // up as soon as the user comes back.
    function onVisible() {
      if (document.visibilityState === 'visible') scheduleRefresh();
    }
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [router]);
}
