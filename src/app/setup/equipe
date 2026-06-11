'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Obra { id: string; nome: string }
interface Mestre {
  id: string; nome: string; av: string; cor: string; territorio: string
}

const CORES = ['#1A44A0','#1B6E40','#7A5200','#943030','#3820A0','#383838','#5C4A2A','#2A4A6A','#6B3FA0','#A05C1A']

export default function SetupEquipePage() {
  const [obras, setObras] = useState<Obra[]>([])
  const [obraAtiva, setObraAtiva] = useState<Obra | null>(null)
  const [mestres, setMestres] = useState<Mestre[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editMestre, setEditMestre] = useState<Mestre | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Mestre | null>(null)
  const [form, setForm] = useState({ nome: '', cor: '#1A44A0', territorio: '' })

  useEffect(() => { loadObras() }, [])
  useEffect(() => { if (obraAtiva) loadMestres() }, [obraAtiva])
  useEffect(() => {
    if (editMestre) setForm({ nome: editMestre.nome, cor: editMestre.cor, territorio: editMestre.territorio || '' })
  }, [editMestre])

  async function loadObras() {
    const supabase = createClient()
    const { data } = await supabase.from('obras').select('*').order('created_at', { ascending: false })
    setObras(data || [])
    if (data && data.length > 0) setObraAtiva(data[0])
    setLoading(false)
  }

  async function loadMestres() {
    if (!obraAtiva) return
    const supabase = createClient()
    const { data } = await supabase.from('mestres').select('*').eq('obra_id', obraAtiva.id).order('created_at')
    setMestres(data || [])
  }

  function getAv(nome: string) {
    return nome.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!obraAtiva) return
    setSaving(true)
    const supabase = createClient()
    const av = getAv(form.nome)

    if (editMestre) {
      const { error } = await supabase.from('mestres').update({ nome: form.nome, av, cor: form.cor, territorio: form.territorio }).eq('id', editMestre.id)
      if (error) { alert('Erro: ' + error.message) }
    } else {
      const { error } = await supabase.from('mestres').insert({ obra_id: obraAtiva.id, nome: form.nome, av, cor: form.cor, territorio: form.territorio })
      if (error) { alert('Erro: ' + error.message) }
    }
    setShowForm(false)
    setEditMestre(null)
    setForm({ nome: '', cor: '#1A44A0', territorio: '' })
    loadMestres()
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    const supabase = createClient()
    await supabase.from('mestres').delete().eq('id', confirmDelete.id)
    setConfirmDelete(null)
    loadMestres()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      {/* SIDEBAR */}
      <aside style={{ width: '220px', flexShrink: 0, background: '#fff', borderRight: '1px solid #E8E8E8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #EFEFEF' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>AW <span style={{ color: '#D0D0D0', fontWeight: 300, margin: '0 3px' }}>|</span> OBRAS</div>
          <div style={{ fontSize: '10px', color: '#A0A0A0', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>Gestão de Obras</div>
        </div>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #EFEFEF' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Obra ativa</div>
          <select value={obraAtiva?.id || ''} onChange={e => setObraAtiva(obras.find(o => o.id === e.target.value) || null)}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #E8E8E8', borderRadius: '8px', fontFamily: 'inherit', fontSize: '12px', outline: 'none', background: '#F5F5F5' }}>
            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '10px 10px 4px' }}>Principal</div>
          {[
            { icon: '📊', label: 'Dashboard', href: '/dashboard' },
            { icon: '📅', label: 'Reunião Semanal', href: '/reuniao' },
            { icon: '📱', label: 'Reporte do Mestre', href: '/mestre' },
            { icon: '👷', label: 'Efetivo OnTime', href: '/efetivo' },
          ].map(item => (
            <a key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#707070', marginBottom: '1px', textDecoration: 'none' }}>
              <span style={{ width: '18px', textAlign: 'center' }}>{item.icon}</span>{item.label}
            </a>
          ))}
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '10px 10px 4px', marginTop: '8px' }}>Configuração</div>
          <a href="/setup" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#fff', background: '#1A1A1A', textDecoration: 'none' }}>
            <span>⚙️</span> Setup da Obra
          </a>
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid #EFEFEF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={handleLogout}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1A1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>GT</div>
            <div><div style={{ fontSize: '12px', fontWeight: 600 }}>Sair</div><div style={{ fontSize: '10px', color: '#A0A0A0' }}>Clique para sair</div></div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '56px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', padding: '0 28px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>Setup da Obra</div>
          <div style={{ fontSize: '13px', color: '#A0A0A0', marginLeft: '10px' }}>{obraAtiva?.nome}</div>
          <div style={{ marginLeft: 'auto' }}>
            {mestres.length > 0 && (
              <button onClick={() => { setShowForm(true); setEditMestre(null); setForm({ nome: '', cor: '#1A44A0', territorio: '' }) }}
                style={{ padding: '7px 16px', borderRadius: '999px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                + Novo Mestre
              </button>
            )}
          </div>
        </div>

        {/* ABAS */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', padding: '0 28px', display: 'flex' }}>
          {[
            { label: 'Estrutura', href: '/setup' },
            { label: 'Disciplinas', href: '/setup/disciplinas' },
            { label: 'Fornecedores', href: '/setup/fornecedores' },
            { label: 'Equipe', href: '/setup/equipe', active: true },
          ].map(tab => (
            <a key={tab.label} href={tab.href} style={{
              padding: '12px 16px', fontSize: '13px', fontWeight: 600,
              color: (tab as any).active ? '#1A1A1A' : '#A0A0A0',
              borderBottom: (tab as any).active ? '2px solid #1A1A1A' : '2px solid transparent',
              marginBottom: '-1px', textDecoration: 'none'
            }}>{tab.label}</a>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#A0A0A0' }}>Carregando...</div>
          ) : mestres.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>👷</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Nenhum mestre cadastrado</div>
              <div style={{ fontSize: '14px', color: '#A0A0A0', marginBottom: '24px' }}>Adicione os mestres de obra e defina o território de cada um</div>
              <button onClick={() => setShowForm(true)}
                style={{ padding: '11px 24px', borderRadius: '999px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                + Novo Mestre
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
              {mestres.map(m => (
                <div key={m.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EFEFEF', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: m.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {m.av}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A' }}>{m.nome}</div>
                      <div style={{ fontSize: '11px', color: '#A0A0A0', marginTop: '2px' }}>Mestre de Obra</div>
                      {m.territorio && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '8px', padding: '3px 10px', borderRadius: '999px', background: '#E8F0FC', fontSize: '11px', fontWeight: 500, color: '#1A44A0' }}>
                          📍 {m.territorio}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button onClick={() => { setEditMestre(m); setShowForm(true) }}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F5F5F5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#707070" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button onClick={() => setConfirmDelete(m)}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#FDECEA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D95F5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL MESTRE */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{editMestre ? 'Editar Mestre' : 'Novo Mestre'}</div>
                <div style={{ fontSize: '13px', color: '#A0A0A0', marginTop: '2px' }}>Mestre de obra desta obra</div>
              </div>
              <button onClick={() => { setShowForm(false); setEditMestre(null) }} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F5F5F5', cursor: 'pointer', fontSize: '14px', color: '#707070' }}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              {/* Preview avatar */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: form.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                  {form.nome ? getAv(form.nome) : '?'}
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Nome completo</div>
                <input type="text" required placeholder="Ex: José Mário da Silva"
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Território responsável</div>
                <input type="text" placeholder="Ex: 5º ao 10º andar, Bloco A, Fase 1..."
                  value={form.territorio} onChange={e => setForm(f => ({ ...f, territorio: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>Cor do avatar</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {CORES.map(cor => (
                    <div key={cor} onClick={() => setForm(f => ({ ...f, cor }))}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', background: cor, cursor: 'pointer', border: form.cor === cor ? '3px solid #1A1A1A' : '2px solid transparent', transition: 'all .15s' }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => { setShowForm(false); setEditMestre(null) }}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Salvando...' : editMestre ? 'Salvar alterações' : 'Adicionar Mestre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>Remover mestre?</div>
            <div style={{ fontSize: '14px', color: '#707070', textAlign: 'center', marginBottom: '24px' }}>
              <strong>{confirmDelete.nome}</strong> será removido desta obra.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleDelete}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#D95F5F', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
