import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: '220px', background: '#fff', borderRight: '1px solid #E8E8E8', padding: '22px 20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '24px' }}>AW | OBRAS</div>
        <a href="/dashboard" style={{ display: 'block', padding: '9px 10px', color: '#707070', fontSize: '13px', textDecoration: 'none' }}>← Dashboard</a>
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '56px', background: '#fff', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', padding: '0 28px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>Efetivo OnTime</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A0A0A0', fontSize: '14px' }}>
          Em desenvolvimento — em breve
        </div>
      </main>
    </div>
  )
}
