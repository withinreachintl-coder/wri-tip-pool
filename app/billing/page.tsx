'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase'
import { Suspense } from 'react'

type Org = {
  name: string
  subscription_status: string
  subscription_tier: string
  trial_ends_at: string | null
  subscription_end_date: string | null
}

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [org, setOrg] = useState<Org | null>(null)
  const [loading, setLoading] = useState(true)
  const success = searchParams.get('success')

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: userRecord } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!userRecord?.org_id) { router.push('/login'); return }
      const { data: orgData } = await supabase
        .from('organizations')
        .select('name, subscription_status, subscription_tier, trial_ends_at, subscription_end_date')
        .eq('id', userRecord.org_id)
        .single()
      setOrg(orgData)
      setLoading(false)
    }
    init()
  }, [router])

  if (loading) return <main style={{ minHeight: '100vh', background: '#FAFAF9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#6B5B4E', fontFamily: 'var(--font-dmsans)' }}>Loading...</p></main>

  const isActive = org?.subscription_status === 'active' && org?.subscription_tier === 'pro'
  const isTrial = org?.subscription_status === 'trial' || !org?.subscription_status
  const isCanceled = org?.subscription_status === 'canceled'

  const trialEnd = org?.trial_ends_at ? new Date(org.trial_ends_at) : null
  const daysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null

  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/4gM7sK59fd3vc2P9eN9k40e'

  const statusBadge = isActive
    ? { label: 'Pro — Active', color: '#16A34A', bg: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.3)' }
    : isTrial
    ? { label: `Free Trial${daysLeft !== null ? ` — ${daysLeft}d left` : ''}`, color: '#D97706', bg: 'rgba(217,119,6,0.1)', border: '1px solid rgba(217,119,6,0.3)' }
    : { label: 'Canceled', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF9', color: '#1C1917' }}>
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700, color: '#F5F0E8' }}>Billing</h1>
          <Link href="/calculator" style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A8A29E', textDecoration: 'none' }}>← Calculator</Link>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {success && (
          <div style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '8px', padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#16A34A', fontWeight: 500 }}>You're all set! Your Pro subscription is now active.</p>
          </div>
        )}

        {/* Current plan */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 600, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Current Plan</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700, color: '#1C1917', marginBottom: '4px' }}>
                {isActive ? 'Pro Plan' : 'Free Trial'}
              </div>
              <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#78716C' }}>
                {isActive ? '$19/month' : isTrial ? 'All features included during trial' : 'Subscription ended'}
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', fontWeight: 600, color: statusBadge.color, background: statusBadge.bg, border: statusBadge.border, borderRadius: '4px', padding: '4px 12px' }}>
              {statusBadge.label}
            </span>
          </div>

          {isTrial && trialEnd && (
            <div style={{ background: '#FAFAF9', border: '1px solid #E5E0D8', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px' }}>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E' }}>
                Trial ends: <strong style={{ color: '#1C1917' }}>{trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                {daysLeft !== null && daysLeft <= 3 && (
                  <span style={{ color: '#EF4444', marginLeft: '8px' }}>⚠ Expires soon</span>
                )}
              </p>
            </div>
          )}

          {!isActive && (
            <a href={paymentLink} target="_blank" rel="noopener noreferrer" style={{
              display: 'block', textAlign: 'center',
              fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 600,
              color: '#1C1917', background: '#D97706', border: 'none',
              borderRadius: '6px', padding: '14px', textDecoration: 'none',
            }}>
              {isCanceled ? 'Resubscribe — $19/mo →' : 'Upgrade to Pro — $19/mo →'}
            </a>
          )}

          {isActive && (
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#78716C', textAlign: 'center' }}>
              To manage or cancel your subscription, contact <a href="mailto:support@wireach.tools" style={{ color: '#D97706' }}>support@wireach.tools</a>
            </p>
          )}
        </div>

        {/* What's included */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 600, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>What&apos;s Included</h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['Unlimited shifts', 'All roles + custom formulas', 'Weight by hours or flat split', 'Staff transparency view', '90-day shift history', 'CSV export for taxes'].map(f => (
              <li key={f} style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#D97706' }}>✓</span> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '100vh', background: '#FAFAF9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#6B5B4E', fontFamily: 'var(--font-dmsans)' }}>Loading...</p></main>}>
      <BillingContent />
    </Suspense>
  )
}
