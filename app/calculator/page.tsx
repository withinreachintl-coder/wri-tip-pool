'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase'

type Role = { name: string; percentage: number }
type StaffMember = { name: string; role: string; hours: number }
type Payout = { name: string; role: string; hours: number; amount: number }

export default function CalculatorPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [weightByHours, setWeightByHours] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [ccTips, setCcTips] = useState('')
  const [cashTips, setCashTips] = useState('')
  const [staff, setStaff] = useState<StaffMember[]>([{ name: '', role: '', hours: 0 }])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: userRecord } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!userRecord?.org_id) { router.push('/login'); return }
      setOrgId(userRecord.org_id)

      const { data: config } = await supabase.from('pool_configs').select('*').eq('org_id', userRecord.org_id).single()
      if (!config) { router.push('/setup'); return }

      setRoles(JSON.parse(config.roles))
      setWeightByHours(config.weight_by_hours)
      setLoading(false)
    }
    init()
  }, [router])

  const addStaff = () => setStaff(prev => [...prev, { name: '', role: roles[0]?.name || '', hours: 0 }])
  const removeStaff = (i: number) => setStaff(prev => prev.filter((_, idx) => idx !== i))
  const updateStaff = (i: number, field: keyof StaffMember, value: string | number) => {
    setStaff(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const calculate = () => {
    const total = (parseFloat(ccTips) || 0) + (parseFloat(cashTips) || 0)
    if (total <= 0 || staff.length === 0) return

    const results: Payout[] = []

    if (weightByHours) {
      // Weight by hours within each role
      roles.forEach(role => {
        const roleStaff = staff.filter(s => s.role === role.name && s.hours > 0)
        if (roleStaff.length === 0) return
        const rolePool = total * (role.percentage / 100)
        const totalHours = roleStaff.reduce((sum, s) => sum + s.hours, 0)
        roleStaff.forEach(s => {
          results.push({ name: s.name, role: s.role, hours: s.hours, amount: rolePool * (s.hours / totalHours) })
        })
      })
    } else {
      // Flat split per role
      roles.forEach(role => {
        const roleStaff = staff.filter(s => s.role === role.name)
        if (roleStaff.length === 0) return
        const rolePool = total * (role.percentage / 100)
        roleStaff.forEach(s => {
          results.push({ name: s.name, role: s.role, hours: s.hours, amount: rolePool / roleStaff.length })
        })
      })
    }

    setPayouts(results.sort((a, b) => b.amount - a.amount))
    setSaved(false)
  }

  const saveShift = async () => {
    if (!orgId || payouts.length === 0) return
    setSaving(true)
    const supabase = createClient()
    const total = (parseFloat(ccTips) || 0) + (parseFloat(cashTips) || 0)
    await supabase.from('shift_logs').insert({
      org_id: orgId,
      shift_date: new Date().toISOString().split('T')[0],
      cc_tips: parseFloat(ccTips) || 0,
      cash_tips: parseFloat(cashTips) || 0,
      total_tips: total,
      payouts: JSON.stringify(payouts),
    })
    setSaving(false)
    setSaved(true)
  }

  if (loading) return <main style={{ minHeight: '100vh', background: '#FAFAF9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#6B5B4E', fontFamily: 'var(--font-dmsans)' }}>Loading...</p></main>

  const totalPool = (parseFloat(ccTips) || 0) + (parseFloat(cashTips) || 0)

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF9', color: '#1C1917' }}>
      {/* Header */}
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700, color: '#F5F0E8' }}>Tip Pool Calculator</h1>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A8A29E' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/history" style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A8A29E', textDecoration: 'none' }}>History</Link>
            <Link href="/setup" style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706', textDecoration: 'none' }}>Setup</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Tip input */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 600, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Tonight's Tips</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Credit Card Tips', value: ccTips, setter: setCcTips },
              { label: 'Cash Tips', value: cashTips, setter: setCashTips },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <label style={{ display: 'block', fontFamily: 'var(--font-dmsans)', fontSize: '12px', fontWeight: 500, color: '#6B5B4E', marginBottom: '6px' }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B5B4E', fontFamily: 'var(--font-dmsans)', fontSize: '14px' }}>$</span>
                  <input type="number" value={value} onChange={e => setter(e.target.value)} min={0} step={0.01} placeholder="0.00"
                    style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '18px', fontWeight: 600, color: '#1C1917', border: '1px solid #E5E0D8', borderRadius: '4px', padding: '10px 12px 10px 28px' }}
                  />
                </div>
              </div>
            ))}
          </div>
          {totalPool > 0 && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(217,119,6,0.08)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#6B5B4E' }}>Total pool</span>
              <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700, color: '#D97706' }}>${totalPool.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Staff */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 600, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Who Worked Tonight</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {staff.map((s, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 32px', gap: '8px', alignItems: 'center' }}>
                <input type="text" value={s.name} onChange={e => updateStaff(i, 'name', e.target.value)} placeholder="Name"
                  style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', border: '1px solid #E5E0D8', borderRadius: '4px', padding: '8px 10px' }}
                />
                <select value={s.role} onChange={e => updateStaff(i, 'role', e.target.value)}
                  style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', border: '1px solid #E5E0D8', borderRadius: '4px', padding: '8px 6px' }}
                >
                  <option value="">Role</option>
                  {roles.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input type="number" value={s.hours || ''} onChange={e => updateStaff(i, 'hours', Number(e.target.value))} min={0} max={24} step={0.5} placeholder="hrs"
                    style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917', border: '1px solid #E5E0D8', borderRadius: '4px', padding: '8px 6px', textAlign: 'center' }}
                  />
                </div>
                <button onClick={() => removeStaff(i)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}>×</button>
              </div>
            ))}
          </div>
          <button onClick={addStaff} style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706', background: 'none', border: '1px dashed rgba(217,119,6,0.4)', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer', width: '100%' }}>
            + Add staff member
          </button>
        </div>

        <button onClick={calculate} disabled={totalPool <= 0 || staff.every(s => !s.name)}
          style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 600, color: '#1C1917', background: totalPool <= 0 ? '#A8A29E' : '#D97706', border: 'none', borderRadius: '6px', padding: '16px', cursor: totalPool <= 0 ? 'not-allowed' : 'pointer' }}>
          Calculate Payouts →
        </button>

        {/* Results */}
        {payouts.length > 0 && (
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderLeft: '3px solid #D97706', borderRadius: '8px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700, color: '#1C1917' }}>Payouts</h2>
              <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#6B5B4E' }}>Total: <strong style={{ color: '#1C1917' }}>${totalPool.toFixed(2)}</strong></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {payouts.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#FAFAF9', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 500, color: '#1C1917' }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#78716C' }}>{p.role} · {p.hours}h</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700, color: '#D97706' }}>${p.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
            <button onClick={saveShift} disabled={saving || saved}
              style={{ width: '100%', fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 600, color: saved ? '#16A34A' : '#1C1917', background: saved ? 'rgba(22,163,74,0.1)' : saving ? '#A8A29E' : '#D97706', border: saved ? '1px solid #16A34A' : 'none', borderRadius: '6px', padding: '12px', cursor: saving || saved ? 'default' : 'pointer' }}>
              {saved ? '✓ Saved to history' : saving ? 'Saving...' : 'Save shift to history'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
