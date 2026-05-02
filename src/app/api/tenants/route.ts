import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { resend, FROM_EMAIL } from '@/lib/resend';


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
      wifi_rate = 0,
      water_mode = 'tank',
      water_tank_rate = 0,
      security_deposit = 0,
      is_existing = false,
      arrears = 0,
      credit_balance = 0,
      start_electric_reading = 0,
      start_water_reading = 0,
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
      wifi_rate: Number(wifi_rate),
      water_mode,
      water_tank_rate: Number(water_tank_rate),
      security_deposit: Number(security_deposit),
      anniversary_day: new Date(move_in_date).getDate(),
      // For existing tenants carry over their financial state
      arrears: is_existing ? Number(arrears) : 0,
      credit_balance: is_existing ? Number(credit_balance) : 0,
      start_electric_reading: Number(start_electric_reading),
      start_water_reading: Number(start_water_reading),
      is_active: true,
    });

    if (tenantError) {
      // Roll back: delete the auth user we just created
      await adminSupabase.auth.admin.deleteUser(userId);
      return Response.json({ error: tenantError.message }, { status: 400 });
    }

    // Fetch Unit Details for the email
    const { data: unitData } = await adminSupabase
      .from('units')
      .select('unit_name, base_rent')
      .eq('id', unit_id)
      .single();

    // 5. Send Welcome Email
    if (resend) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: 'Welcome to your Tenant Portal!',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #6366f1;">Hello ${name}!</h2>
              <p>Your landlord has created an account for you in the <strong>RentEase Tenant Portal</strong>.</p>
              
              <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #1e293b;">Rental Details:</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Unit:</strong> ${unitData?.unit_name || 'Assigned Unit'}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Monthly Rent:</strong> ₱${unitData?.base_rent?.toLocaleString() || '0'}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Move-in Date:</strong> ${new Date(move_in_date).toLocaleDateString()}</p>
              </div>

              ${is_existing && (Number(arrears) > 0 || Number(credit_balance) > 0) ? `
              <div style="background: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #fde68a;">
                <p style="margin: 0; font-size: 15px; font-weight: 600; color: #92400e;">Current Account Balance:</p>
                ${Number(arrears) > 0 ? `<p style="margin: 5px 0; font-size: 14px; color: #ef4444;"><strong>Arrears:</strong> ₱${Number(arrears).toLocaleString()}</p>` : ''}
                ${Number(credit_balance) > 0 ? `<p style="margin: 5px 0; font-size: 14px; color: #10b981;"><strong>Credit Balance:</strong> ₱${Number(credit_balance).toLocaleString()}</p>` : ''}
              </div>
              ` : ''}

              <p>You can now log in to view your bills, submit payments, and request maintenance.</p>
              <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>Login URL:</strong> <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://tenant-rent-mngmntsystm.vercel.app'}/login">Click here to login</a></p>
                <p style="margin: 10px 0 0 0; font-size: 14px;"><strong>Temporary Password:</strong> ${password}</p>
              </div>
              <p style="font-size: 12px; color: #64748b;">Please change your password once you log in.</p>
            </div>
          `
        });
      } catch (e) {
        console.error('Email failed to send, but tenant was created:', e);
      }
    }

    return Response.json({ success: true, tenantId: userId }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected error';
    return Response.json({ error: message }, { status: 500 });
  }
}
