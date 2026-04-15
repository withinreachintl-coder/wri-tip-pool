'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase'

type ShiftLog = {
  id: string
  shift_date: string
  cc_tips: number
  cash_tips: number
  total_tips: number
  payouts: string
  created_at: string
}

type Payout = { name: string; role: string; hours: number; amount: number }

export default function HistoryPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<ShiftLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: userRecord } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!userRecord?.org_id) { router.push('/login'); return }
      const { data } = await supabase.from('shift_logs').select('*').eq('org_id', userRecord.org_id).order('shift_date', { ascending: false }).limit(90)
      setLogs(data || [])
      setLoading(false)
    }
    init()
  }, [router])

  const exportCSV = () => {
    const rows = [['Date', 'CC Tips', 'Cash Tips', 'Total', 'Staff', 'Role', 'Hours', 'Payout']]
    logs.forEach(log => {
      const payouts: Payout[] = JSON.parse(log.payouts)
      payouts.forEach(p => rows.push([log.shift_date, String(log.cc_tips), String(log.cash_tips), String(log.total_tips), p.name, p.role, String(p.hours), p.amount.toFixed(2)]))
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'tip-pool-history.csv'; a.click()
  }

  if (loading) return <main style={{ minHeight: '100vh', background: '#FAFAF9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#6B5B4E', fontFamily: 'var(--font-dmsans)' }}>Loading...</p></main>

  return (
    <main style={{ minHeight: '100vh', background: '#FAFAF9', color: '#1C1917' }}>
      <div style={{ background: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700, color: '#F5F0E8' }}>Shift History</h1>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A8A29E' }}>Last 90 days</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button onClick={exportCSV} style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#D97706', background: 'none', border: '1px solid rgba(217,119,6,0.4)', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer' }}>Export CSV</button>
            <Link href="/calculator" style={{ fontFamily: 'var(--font-dmsans)', fontSize: '13px', color: '#A8A29E', textDecoration: 'none' }}>← Calculator</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <p style={{ fontFamily: 'var(--font-dmsans)', fontSize: '16px', color: '#6B5B4E' }}>No shifts saved yet.</p>
            <Link href="/calculator" style={{ color: '#D97706', fontFamily: 'var(--font-dmsans)', fontSize: '14px' }}>Run your first calculation →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs.map(log => {
              const payouts: Payout[] = JSON.parse(log.payouts)
              const isExpanded = expanded === log.id
              return (
                <div key={log.id} style={{ background: '#FFFFFF', border: '1px solid #E5E0D8', borderRadius: '8px', overflow: 'hidden' }}>
                  <div onClick={() => setExpanded(isExpanded ? null : log.id)} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '15px', fontWeight: 500, color: '#1C1917' }}>
                        {new Date(log.shift_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '12px', color: '#78716C' }}>{payouts.length} staff · CC ${log.cc_tips.toFixed(2)} · Cash ${log.cash_tips.toFixed(2)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700, color: '#D97706' }}>${log.total_tips.toFixed(2)}</span>
                      <span style={{ color: '#A8A29E', fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 20px 16px', borderTop: '1px solid #E5E0D8' }}>
                      {payouts.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < payouts.length - 1 ? '1px solid #F5F0E8' : 'none' }}>
                          <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', color: '#1C1917' }}>{p.name} <span style={{ color: '#78716C', fontSize: '12px' }}>({p.role} · {p.hours}h)</span></div>
                          <div style={{ fontFamily: 'var(--font-dmsans)', fontSize: '14px', fontWeight: 600, color: '#1C1917' }}>${p.amount.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
