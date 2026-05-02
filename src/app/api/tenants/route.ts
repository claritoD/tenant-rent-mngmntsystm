import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/tenants
 *
 * Creates a Supabase Auth user + tenant record.
 * Uses the service role key so this MUST remain a server-only route handler.
 *
 * Body:
 *   name            string  required
 *   email           string  required
 *   password        string  required  (min 6 chars)
 *   unit_id         string  required  (UUID)
 *   move_in_date    string  required  (ISO date, e.g. "2024-03-08")
 *   has_wifi        boolean
 *   water_mode      "metered" | "tank"
 *   water_tank_rate number
 *   security_deposit number
 *   is_existing     boolean  — if true, record pre-existing financial state
 *   arrears         number   — only for existing tenants
 *   credit_balance  number   — only for existing tenants
 */
export async function POST(request: Request) {
  try {
    // 1. Verify the caller is an authenticated owner
    const serverSupabase = await createServerClient();
    const { data: { user: caller } } = await serverSupabase.auth.getUser();

    if (!caller || caller.user_metadata?.role !== 'owner') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();
    const {
      name,
      email,
      password,
      unit_id,
      move_in_date,
      has_wifi = false,
      water_mode = 'tank',
      water_tank_rate = 0,
      security_deposit = 0,
      is_existing = false,
      arrears = 0,
      credit_balance = 0,
    } = body;

    if (!name || !email || !password || !unit_id || !move_in_date) {
      return Response.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // 3. Use admin client (service role) to create the auth user
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,       // skip email verification
      user_metadata: { role: 'tenant', name },
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 4. Insert the tenant record
    const { error: tenantError } = await adminSupabase.from('tenants').insert({
      id: userId,
      name,
      unit_id,
      move_in_date,
      has_wifi,
      water_mode,
      water_tank_rate: Number(water_tank_rate),
      security_deposit: Number(security_deposit),
      // For existing tenants carry over their financial state
      arrears: is_existing ? Number(arrears) : 0,
      credit_balance: is_existing ? Number(credit_balance) : 0,
      is_active: true,
    });

    if (tenantError) {
      // Roll back: delete the auth user we just created
      await adminSupabase.auth.admin.deleteUser(userId);
      return Response.json({ error: tenantError.message }, { status: 400 });
    }

    return Response.json({ success: true, tenantId: userId }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
}
