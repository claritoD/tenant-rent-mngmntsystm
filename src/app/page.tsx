import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Route based on role in user_metadata
  const role = user.user_metadata?.role;
  if (role === 'owner') redirect('/owner');
  redirect('/tenant');
}
