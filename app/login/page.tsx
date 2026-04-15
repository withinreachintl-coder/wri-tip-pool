'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/calculator` },
    })
    if (authError) { setError(authError.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#1C1917' }}>
      <div style={{ maxWidth: '420px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', background: '#D97706', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#1C1917', margin: '0 auto 16px' }}>$</div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', fontWeight: 700, color: '#F5F0E8', marginBottom: '8px' }}>Tip Pool</h1>
          <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#78716C' }}>Sign in to your account</p>
        </div>

        {!sent ? (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '32px' }}>
            <form onSubmit={handleLogin}>
              <label style={{ display: 'block', fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#A8A29E', marginBottom: '8px' }}>Email address</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@restaurant.com"
                style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#F5F0E8', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px', padding: '12px 16px', outline: 'none', marginBottom: '20px' }}
              />
              {error && <p style={{ color: '#EF4444', fontSize: '13px', marginBottom: '16px', fontFamily: 'var(--font-dmsans)' }}>{error}</p>}
              <button type="submit" disabled={loading} style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 600, color: '#1C1917', background: loading ? '#6B5B4E' : '#D97706', border: 'none', borderRadius: '4px', padding: '14px', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </form>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#6B5B4E', textAlign: 'center', marginTop: '16px' }}>Password-free sign in. No account? <a href="https://buy.stripe.com/tip-pool-placeholder" style={{ color: '#D97706' }}>Start free trial →</a></p>
          </div>
        ) : (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700, color: '#F5F0E8', marginBottom: '8px' }}>Check your email</h2>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#A8A29E', marginBottom: '24px' }}>We sent a magic link to <strong style={{ color: '#F5F0E8' }}>{email}</strong></p>
            <button onClick={() => { setSent(false); setEmail('') }} style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706', background: 'none', border: 'none', cursor: 'pointer' }}>← Use a different email</button>
          </div>
        )}
      </div>
    </main>
  )
}
