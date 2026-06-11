'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Obra {
  id: string
  nome: string
  tipo: string
  local: string
  pct_avanco: number
  status: string
  data_entrega: string
}

export default function DashboardPage() {
  const [obras, setObras] = useState<Obra[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Obra | null>(null)
  const [editObra, setEditObra] = useState<Obra | null>(null)
  const [editForm, setEditForm] = useState({ nome: '', tipo: 'Hotel', local: '', data_inicio: '', data_entrega: '', pct_avanco: 0 })
  const [form, setForm] = useState({ nome: '', tipo: 'Hotel', local: '', data_inicio: '', data_entrega: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (editObra) {
      setEditForm({
        nome: editObra.nome,
        tipo: editObra.tipo,
        local: editObra.local || '',
        data_inicio: '',
        data_entrega: editObra.data_entrega ? editObra.data_entrega.split('T')[0] : '',
        pct_avanco: editObra.pct_avanco,
      })
    }
  }, [editObra])

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editObra) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('obras').update({
      nome: editForm.nome,
      tipo: editForm.tipo,
      local: editForm.local,
      data_entrega: editForm.data_entrega || null,
      pct_avanco: editForm.pct_avanco,
    }).eq('id', editObra.id)
    if (error) { alert('Erro: ' + error.message) }
    else { setEditObra(null); loadObras() }
    setSaving(false)
  }

  useEffect(() => { loadObras() }, [])

  async function loadObras() {
    const supabase = createClient()
    const { data } = await supabase.from('obras').select('*').order('created_at', { ascending: false })
    setObras(data || [])
    setLoading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { alert('Não autenticado'); setSaving(false); return }

    const { data: obra, error } = await supabase.from('obras').insert({
      nome: form.nome, tipo: form.tipo, local: form.local,
      data_inicio: form.data_inicio || null,
      data_entrega: form.data_entrega || null,
      pct_avanco: 0, status: 'ok'
    }).select().single()

    if (error) { alert('Erro: ' + error.message); setSaving(false); return }

    await supabase.from('usuarios_obras').insert({ usuario_id: user.id, obra_id: obra.id })
    setShowForm(false)
    setForm({ nome: '', tipo: 'Hotel', local: '', data_inicio: '', data_entrega: '' })
    loadObras()
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('usuarios_obras').delete().eq('obra_id', confirmDelete.id)
    const { error } = await supabase.from('obras').delete().eq('id', confirmDelete.id)
    if (error) { alert('Erro ao deletar: ' + error.message) }
    setConfirmDelete(null)
    setDeleting(false)
    loadObras()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const statusColor = (pct: number) => pct >= 70 ? '#3DAB6E' : pct >= 40 ? '#D4930A' : '#D95F5F'
  const statusLabel = (s: string) => s === 'ok' ? 'Em dia' : s === 'warn' ? 'Atenção' : 'Alerta'
  const statusBg = (s: string) => s === 'ok' ? '#E8F5EE' : s === 'warn' ? '#FDF5E6' : '#FDECEA'
  const statusTxt = (s: string) => s === 'ok' ? '#1B6E40' : s === 'warn' ? '#7A5200' : '#943030'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      {/* SIDEBAR */}
      <aside style={{ width: '220px', flexShrink: 0, background: '#fff', borderRight: '1px solid #E8E8E8', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #EFEFEF' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>
            AW <span style={{ color: '#D0D0D0', fontWeight: 300, margin: '0 3px' }}>|</span> OBRAS
          </div>
          <div style={{ fontSize: '10px', color: '#A0A0A0', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>Gestão de Obras</div>
        </div>
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '10px 10px 4px' }}>Principal</div>
          {[
            { icon: '📊', label: 'Dashboard', href: '/dashboard', active: true },
            { icon: '📅', label: 'Reunião Semanal', href: '/reuniao', active: false },
            { icon: '📱', label: 'Reporte do Mestre', href: '/mestre', active: false },
            { icon: '👷', label: 'Efetivo OnTime', href: '/efetivo', active: false },
          ].map(item => (
            <a key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
              color: item.active ? '#fff' : '#707070',
              background: item.active ? '#1A1A1A' : 'transparent',
              marginBottom: '1px', textDecoration: 'none'
            }}>
              <span style={{ width: '18px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '10px 10px 4px', marginTop: '8px' }}>Configuração</div>
          <a href="/setup" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#707070', textDecoration: 'none' }}>
            <span>⚙️</span> Setup da Obra
          </a>
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid #EFEFEF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={handleLogout}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1A1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>GT</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A1A1A' }}>Sair</div>
              <div style={{ fontSize: '10px', color: '#A0A0A0' }}>Clique para sair</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '56px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>Dashboard</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '12px', color: '#A0A0A0', padding: '5px 12px', borderRadius: '999px', border: '1px solid #E8E8E8', background: '#F5F5F5' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
            <button onClick={() => setShowForm(true)} style={{ padding: '7px 16px', borderRadius: '999px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              + Nova Obra
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#A0A0A0' }}>Carregando...</div>
          ) : obras.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>Nenhuma obra cadastrada</div>
              <div style={{ fontSize: '14px', color: '#A0A0A0', marginBottom: '24px' }}>Comece criando sua primeira obra</div>
              <button onClick={() => setShowForm(true)} style={{ padding: '11px 24px', borderRadius: '999px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                + Nova Obra
              </button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                {obras.length} obra{obras.length > 1 ? 's' : ''} ativa{obras.length > 1 ? 's' : ''}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                {obras.map(obra => (
                  <div key={obra.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EFEFEF', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)', position: 'relative' }}>
                    <div style={{ height: '4px', background: statusColor(obra.pct_avanco) }} />
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ flex: 1, paddingRight: '8px' }}>
                          <div style={{ fontSize: '17px', fontWeight: 700, color: '#1A1A1A' }}>{obra.nome}</div>
                          <div style={{ fontSize: '12px', color: '#A0A0A0', marginTop: '3px' }}>{obra.tipo}{obra.local ? ' · ' + obra.local : ''}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '32px', fontWeight: 700, color: statusColor(obra.pct_avanco) }}>{obra.pct_avanco}%</div>
                            <div style={{ fontSize: '10px', color: '#A0A0A0', textTransform: 'uppercase' }}>Avanço</div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                            <button onClick={() => setEditObra(obra)} title="Editar obra"
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F5F5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#707070" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button onClick={() => setConfirmDelete(obra)} title="Deletar obra"
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#FDECEA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D95F5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                                <path d="M10 11v6M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div style={{ height: '3px', background: '#F5F5F5', borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
                        <div style={{ height: '100%', borderRadius: '2px', background: statusColor(obra.pct_avanco), width: `${obra.pct_avanco}%` }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {obra.data_entrega && (
                          <div style={{ fontSize: '11px', color: '#A0A0A0' }}>
                            Entrega: {new Date(obra.data_entrega).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                          </div>
                        )}
                        <div style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: statusBg(obra.status), color: statusTxt(obra.status) }}>
                          {statusLabel(obra.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL NOVA OBRA */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>Nova Obra</div>
                <div style={{ fontSize: '13px', color: '#A0A0A0', marginTop: '2px' }}>Cadastre uma nova obra no sistema</div>
              </div>
              <button onClick={() => setShowForm(false)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F5F5F5', cursor: 'pointer', fontSize: '14px', color: '#707070' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Nome da Obra</div>
                <input type="text" required placeholder="Ex: Hotel Grand Splendor"
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Cidade / Estado</div>
                <input type="text" placeholder="Ex: São Paulo, SP"
                  value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Tipo de Obra</div>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', background: '#fff' }}>
                  {['Hotel', 'Corporativo', 'Residencial', 'Retrofit', 'Varejo', 'Saúde', 'Industrial', 'Outro'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Data de Início</div>
                  <input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Previsão de Entrega</div>
                  <input type="date" value={form.data_entrega} onChange={e => setForm(f => ({ ...f, data_entrega: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: saving ? '#A0A0A0' : '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Salvando...' : 'Cadastrar Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR DELETE */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>🗑</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', textAlign: 'center', marginBottom: '8px' }}>Deletar obra?</div>
            <div style={{ fontSize: '14px', color: '#707070', textAlign: 'center', marginBottom: '24px' }}>
              Tem certeza que deseja deletar <strong>{confirmDelete.nome}</strong>? Esta ação não pode ser desfeita.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleting}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: deleting ? '#A0A0A0' : '#D95F5F', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Deletando...' : 'Sim, deletar'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL EDITAR OBRA */}
      {editObra && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setEditObra(null)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>Editar Obra</div>
                <div style={{ fontSize: '13px', color: '#A0A0A0', marginTop: '2px' }}>Atualize os dados desta obra</div>
              </div>
              <button onClick={() => setEditObra(null)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F5F5F5', cursor: 'pointer', fontSize: '14px', color: '#707070' }}>✕</button>
            </div>
            <form onSubmit={handleEdit}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Nome da Obra</div>
                <input type="text" required value={editForm.nome} onChange={e => setEditForm(f => ({ ...f, nome: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Cidade / Estado</div>
                <input type="text" value={editForm.local} onChange={e => setEditForm(f => ({ ...f, local: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Tipo de Obra</div>
                <select value={editForm.tipo} onChange={e => setEditForm(f => ({ ...f, tipo: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', background: '#fff' }}>
                  {['Hotel', 'Corporativo', 'Residencial', 'Retrofit', 'Varejo', 'Saúde', 'Industrial', 'Outro'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Previsão de Entrega</div>
                  <input type="date" value={editForm.data_entrega} onChange={e => setEditForm(f => ({ ...f, data_entrega: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Avanço (%)</div>
                  <input type="number" min="0" max="100" value={editForm.pct_avanco} onChange={e => setEditForm(f => ({ ...f, pct_avanco: parseInt(e.target.value) || 0 }))}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setEditObra(null)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: saving ? '#A0A0A0' : '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
