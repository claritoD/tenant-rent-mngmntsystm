'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { markAnnouncementsAsRead } from '@/app/actions/tenant';

/**
 * Invisible client component that marks announcements as read and
 * forces a router.refresh() to bust the Next.js client-side router cache.
 * This ensures the unread badge and tenant dashboard both update immediately.
 */
export default function MarkAsRead() {
  const router = useRouter();

  useEffect(() => {
    markAnnouncementsAsRead().then(() => {
      // Force Next.js to discard the client-side page cache for all /tenant routes
      router.refresh();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
