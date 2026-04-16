import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/calculator'
  const redirectTo = next.startsWith('/') ? next : '/calculator'

  if (!code) {
    console.error('[auth/callback] No code provided')
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    const cookieStore = await cookies()

    // Session client (anon key, cookie-based)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
          },
        },
      }
    )

    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError || !data?.user) {
      console.error('[auth/callback] Code exchange failed:', exchangeError?.message)
      return NextResponse.redirect(new URL(`/login?error=auth_failed`, request.url))
    }

    const user = data.user
    console.log('[auth/callback] Auth successful for:', user.email)

    // Admin client (service role key, bypasses RLS) — use createClient directly
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if user already has an org
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (existingUser?.org_id) {
      console.log('[auth/callback] Existing user, skipping org creation')
    } else {
      // Upsert org (handles re-logins with same email gracefully)
      const { data: org, error: orgError } = await supabaseAdmin
        .from('organizations')
        .upsert(
          {
            name: user.email?.split('@')[0] || 'My Restaurant',
            owner_email: user.email,
            plan: 'free',
            subscription_status: 'trial',
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          { onConflict: 'owner_email', ignoreDuplicates: false }
        )
        .select('id')
        .single()

      if (orgError || !org?.id) {
        console.error('[auth/callback] Org upsert failed:', orgError?.message, orgError?.details)
      } else {
        console.log('[auth/callback] Org created/found:', org.id)

        const { error: userError } = await supabaseAdmin
          .from('users')
          .upsert(
            { id: user.id, org_id: org.id, email: user.email, name: user.email, role: 'admin' },
            { onConflict: 'id', ignoreDuplicates: false }
          )

        if (userError) {
          console.error('[auth/callback] User upsert failed:', userError.message, userError.details)
        } else {
          console.log('[auth/callback] User record created/updated for:', user.email)
        }
      }
    }

    return NextResponse.redirect(new URL(redirectTo, request.url))
  } catch (err) {
    console.error('[auth/callback] Unexpected error:', err instanceof Error ? err.message : String(err))
    return NextResponse.redirect(new URL('/login?error=unexpected', request.url))
  }
}
