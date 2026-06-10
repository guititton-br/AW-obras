import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: obras } = await supabase.from('obras').select('*').order('created_at', { ascending: false })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <aside style={{ width: '220px', background: '#fff', borderRight: '1px solid #E8E8E8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 20px', borderBottom: '1px solid #EFEFEF' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>AW | OBRAS</div>
          <div style={{ fontSize: '10px', color: '#A0A0A0', marginTop: '2px' }}>GESTÃO DE OBRAS</div>
        </div>
        <nav style={{ flex: 1, padding: '8px 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', background: '#1A1A1A', color: '#fff', fontSize: '13px', fontWeight: 500, marginBottom: '1px' }}>
            <span>📊</span> Dashboard
          </div>
          <a href="/reuniao" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', color: '#707070', fontSize: '13px', fontWeight: 500, marginBottom: '1px', textDecoration: 'none' }}>
            <span>📅</span> Reunião Semanal
          </a>
          <a href="/efetivo" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', color: '#707070', fontSize: '13px', fontWeight: 500, marginBottom: '1px', textDecoration: 'none' }}>
            <span>👷</span> Efetivo OnTime
          </a>
          <a href="/mestre" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', color: '#707070', fontSize: '13px', fontWeight: 500, marginBottom: '1px', textDecoration: 'none' }}>
            <span>📱</span> Reporte do Mestre
          </a>
          <a href="/setup" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', color: '#707070', fontSize: '13px', fontWeight: 500, marginBottom: '1px', textDecoration: 'none' }}>
            <span>⚙️</span> Setup da Obra
          </a>
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid #EFEFEF', fontSize: '12px', color: '#A0A0A0' }}>
          {user.email}
        </div>
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '56px', background: '#fff', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', padding: '0 28px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>Dashboard</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
          {obras && obras.length > 0 ? (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                {obras.length} obra{obras.length > 1 ? 's' : ''} ativa{obras.length > 1 ? 's' : ''}
              </div>
              {obras.map((obra: any) => (
                <div key={obra.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EFEFEF', padding: '20px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 700 }}>{obra.nome}</div>
                      <div style={{ fontSize: '12px', color: '#A0A0A0', marginTop: '3px' }}>{obra.tipo} · {obra.local}</div>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#3DAB6E' }}>{obra.pct_avanco}%</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏗</div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Nenhuma obra cadastrada</div>
              <div style={{ fontSize: '14px', color: '#A0A0A0', marginBottom: '24px' }}>Configure sua primeira obra</div>
              <a href="/setup" style={{ padding: '11px 22px', borderRadius: '999px', background: '#1A1A1A', color: '#fff', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}>
                ⚙️ Setup da Obra
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
