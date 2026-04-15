import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{ background: '#1C1917', color: '#F5F0E8', minHeight: '100vh' }}>
      {/* Nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(28,25,23,0.95)', backdropFilter: 'blur(10px)',
        height: '64px', display: 'flex', alignItems: 'center',
        padding: '0 24px', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', background: '#D97706',
            borderRadius: '6px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#1C1917',
          }}>$</div>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700 }}>Tip Pool</span>
        </div>
        <Link href="/login" style={{
          fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500,
          color: '#1C1917', background: '#D97706', padding: '8px 20px',
          borderRadius: '4px', textDecoration: 'none',
        }}>
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: '160px', paddingBottom: '80px', maxWidth: '768px', margin: '0 auto', padding: '160px 24px 80px' }}>
        <h1 style={{
          fontFamily: 'var(--font-playfair)', fontSize: '48px', fontWeight: 700,
          color: '#F5F0E8', lineHeight: 1.15, marginBottom: '24px',
        }}>
          Stop doing tip pool math at midnight
        </h1>
        <p style={{
          fontFamily: 'var(--font-dmsans)', fontSize: '18px', fontWeight: 300,
          color: '#A8A29E', lineHeight: 1.6, marginBottom: '40px', maxWidth: '560px',
        }}>
          Enter your shift tips, select who worked, and get instant transparent payouts — no calculators, no disputes, no compliance risk.
        </p>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a href="https://buy.stripe.com/4gM7sK59fd3vc2P9eN9k40e" style={{
            fontFamily: 'var(--font-dmsans)', fontSize: '16px', fontWeight: 600,
            color: '#1C1917', background: '#D97706', padding: '14px 32px',
            borderRadius: '6px', textDecoration: 'none',
          }}>
            Start free 14-day trial
          </a>
          <Link href="/login" style={{
            fontFamily: 'var(--font-dmsans)', fontSize: '16px', fontWeight: 500,
            color: '#D97706', background: 'transparent', padding: '14px 32px',
            borderRadius: '6px', textDecoration: 'none',
            border: '1px solid rgba(217,119,6,0.4)',
          }}>
            Sign in
          </Link>
        </div>
      </section>

      {/* Pain points */}
      <section style={{ maxWidth: '768px', margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
          {[
            { icon: '📱', title: 'No more phone calculators', desc: 'Stop doing weighted math at 1am. Enter the numbers, get instant results.' },
            { icon: '👁️', title: 'Full staff transparency', desc: 'Every team member sees their own breakdown. No more "why did I get less?"' },
            { icon: '📋', title: 'Tax-ready logs', desc: 'Every shift logged automatically. Download CSV for your accountant at tax time.' },
            { icon: '⚖️', title: 'FLSA compliant', desc: 'Built-in rules keep you legal. No more guessing on tip credits and pooling rules.' },
          ].map((item) => (
            <div key={item.title} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px', padding: '24px',
            }}>
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>{item.icon}</div>
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', fontWeight: 600, color: '#F5F0E8', marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#78716C', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ maxWidth: '480px', margin: '0 auto', padding: '0 24px 80px', textAlign: 'center' }}>
        <div style={{ background: '#292524', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '40px' }}>
          <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', fontWeight: 500, color: '#D97706', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>Simple pricing</p>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '52px', fontWeight: 700, color: '#F5F0E8', marginBottom: '4px' }}>$19<span style={{ fontSize: '20px', color: '#78716C' }}>/mo</span></div>
          <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#A8A29E', marginBottom: '32px' }}>14-day free trial. Cancel anytime.</p>
          <ul style={{ listStyle: 'none', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Unlimited shifts', 'All roles + custom formulas', 'Staff transparency view', 'CSV export for taxes', 'Email support'].map(f => (
              <li key={f} style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#F5F0E8', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                <span style={{ color: '#D97706', fontSize: '16px' }}>✓</span> {f}
              </li>
            ))}
          </ul>
          <a href="https://buy.stripe.com/4gM7sK59fd3vc2P9eN9k40e" style={{
            display: 'block', fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 600,
            color: '#1C1917', background: '#D97706', padding: '14px', borderRadius: '6px', textDecoration: 'none',
          }}>
            Start free trial →
          </a>
        </div>
      </section>
    </main>
  )
}
