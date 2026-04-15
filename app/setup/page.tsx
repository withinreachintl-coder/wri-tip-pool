'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../lib/supabase'

const DEFAULT_ROLES = [
  { name: 'Server', percentage: 70 },
  { name: 'Bartender', percentage: 20 },
  { name: 'Busser', percentage: 10 },
]

type Role = { name: string; percentage: number }

export default function SetupPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES)
  const [weightByHours, setWeightByHours] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrg = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: userRecord } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (userRecord?.org_id) setOrgId(userRecord.org_id)
    }
    fetchOrg()
  }, [router])

  const total = roles.reduce((sum, r) => sum + r.percentage, 0)

  const updateRole = (i: number, field: keyof Role, value: string | number) => {
    setRoles(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  const addRole = () => setRoles(prev => [...prev, { name: '', percentage: 0 }])
  const removeRole = (i: number) => setRoles(prev => prev.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    if (total !== 100) { setError('Percentages must add up to 100%'); return }
    if (roles.some(r => !r.name.trim())) { setError('All roles must have a name'); return }
    if (!orgId) { setError('Organization not found'); return }

    setSaving(true)
    setError('')
    const supabase = createClient()

    const { error: upsertErr } = await supabase
      .from('pool_configs')
      .upsert({ org_id: orgId, roles: JSON.stringify(roles), weight_by_hours: weightByHours, updated_at: new Date().toISOString() }, { onConflict: 'org_id' })

    if (upsertErr) { setError(upsertErr.message); setSaving(false); return }
    router.push('/calculator')
  }

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF9', color: '#1C1917' }}>
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', fontWeight: 700, color: '#F5F0E8', marginBottom: '4px' }}>Pool Setup</h1>
          <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#A8A29E' }}>Configure your tip pool formula once. Change it anytime.</p>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Roles */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 600, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Roles & Percentages</h2>
            <span style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 600, color: total === 100 ? '#16A34A' : '#EF4444' }}>Total: {total}%</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            {roles.map((role, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  type="text" value={role.name} onChange={e => updateRole(i, 'name', e.target.value)}
                  placeholder="Role name" style={{ flex: 1, fontFamily: 'var(--font-dmsans)', fontSize: '14px', padding: '10px 12px', border: '1px solid #E5E0D8', borderRadius: '4px', color: '#1C1917' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number" value={role.percentage} onChange={e => updateRole(i, 'percentage', Number(e.target.value))}
                    min={0} max={100} style={{ width: '70px', fontFamily: 'var(--font-dmsans)', fontSize: '14px', padding: '10px 8px', border: '1px solid #E5E0D8', borderRadius: '4px', color: '#1C1917', textAlign: 'center' }}
                  />
                  <span style={{ color: '#6B5B4E', fontSize: '14px' }}>%</span>
                </div>
                <button onClick={() => removeRole(i)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}>×</button>
              </div>
            ))}
          </div>

          <button onClick={addRole} style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 500, color: '#D97706', background: 'none', border: '1px dashed rgba(217,119,6,0.4)', borderRadius: '4px', padding: '8px 16px', cursor: 'pointer', width: '100%' }}>
            + Add role
          </button>
        </div>

        {/* Weighting */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', padding: '24px' }}>
          <h2 style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', fontWeight: 600, color: '#6B5B4E', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Payout Method</h2>
          {[
            { value: true, label: 'Weight by hours worked', desc: 'Staff who worked more hours get proportionally more tips' },
            { value: false, label: 'Flat split by role', desc: 'Each person in a role gets an equal share regardless of hours' },
          ].map(opt => (
            <div key={String(opt.value)} onClick={() => setWeightByHours(opt.value)} style={{ display: 'flex', gap: '12px', padding: '12px', borderRadius: '6px', border: `1px solid ${weightByHours === opt.value ? '#D97706' : '#E5E0D8'}`, background: weightByHours === opt.value ? 'rgba(217,119,6,0.06)' : 'transparent', cursor: 'pointer', marginBottom: '8px' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${weightByHours === opt.value ? '#D97706' : '#D1C9BF'}`, background: weightByHours === opt.value ? '#D97706' : 'transparent', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 500, color: '#1C1917', marginBottom: '2px' }}>{opt.label}</div>
                <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#78716C' }}>{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {error && <p style={{ color: '#EF4444', fontFamily: 'var(--font-dmsans)', fontSize: '13px' }}>{error}</p>}

        <button onClick={handleSave} disabled={saving || total !== 100} style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 600, color: '#1C1917', background: saving || total !== 100 ? '#A8A29E' : '#D97706', border: 'none', borderRadius: '6px', padding: '14px', cursor: saving || total !== 100 ? 'not-allowed' : 'pointer' }}>
          {saving ? 'Saving...' : 'Save & go to calculator →'}
        </button>
      </div>
    </main>
  )
}
