import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/calculator'
  const redirectTo = next.startsWith('/') ? next : '/calculator'

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=no_code', request.url))
  }

  try {
    const cookieStore = await cookies()
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
      return NextResponse.redirect(new URL(`/login?error=auth_failed`, request.url))
    }

    const user = data.user

    // Auto-create org + user on first login
    try {
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll() },
            setAll(cookiesToSet) {
              try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
            },
          },
        }
      )

      const { data: org } = await supabaseAdmin
        .from('organizations')
        .insert({ name: user.email?.split('@')[0] || 'My Restaurant', owner_email: user.email, plan: 'free', subscription_status: 'trial', trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() })
        .select('id')
        .single()

      if (org?.id) {
        await supabaseAdmin.from('users').upsert(
          { id: user.id, org_id: org.id, email: user.email, name: user.email, role: 'admin' },
          { onConflict: 'id', ignoreDuplicates: true }
        )
      }
    } catch {}

    return NextResponse.redirect(new URL(redirectTo, request.url))
  } catch {
    return NextResponse.redirect(new URL('/login?error=unexpected', request.url))
  }
}
