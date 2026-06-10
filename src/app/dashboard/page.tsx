export default function DashboardPage() {
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
          <a href="/setup" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', color: '#707070', fontSize: '13px', fontWeight: 500, marginBottom: '1px', textDecoration: 'none' }}>
            <span>⚙️</span> Setup da Obra
          </a>
        </nav>
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '56px', background: '#fff', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', padding: '0 28px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>Dashboard</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '40px' }}>🏗</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>AW | Obras funcionando!</div>
          <div style={{ fontSize: '14px', color: '#A0A0A0' }}>Sistema no ar — próximo passo: cadastrar obras</div>
        </div>
      </main>
    </div>
  )
}
