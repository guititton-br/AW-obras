'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Obra {
  id: string
  nome: string
  tipo: string
  local: string
}

interface Setor {
  id: string
  nome: string
  tipo_unidade: string
  ordem: number
  ambientes?: Ambiente[]
}

interface Ambiente {
  id: string
  codigo: string
  nome: string
  setor_id: string
}

export default function SetupPage() {
  const [obras, setObras] = useState<Obra[]>([])
  const [obraAtiva, setObraAtiva] = useState<Obra | null>(null)
  const [setores, setSetores] = useState<Setor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [setoresLoaded, setSetoresLoaded] = useState(false)

  // Novo setor
  const [showSetorForm, setShowSetorForm] = useState(false)
  const [setorForm, setSetorForm] = useState({ nome: '', tipo_unidade: 'Ambiente' })

  // Novo ambiente
  const [showAmbForm, setShowAmbForm] = useState<string | null>(null) // setor_id
  const [ambForm, setAmbForm] = useState({ codigos: '' })

  // Confirmar delete
  const [confirmDeleteSetor, setConfirmDeleteSetor] = useState<Setor | null>(null)

  useEffect(() => { loadObras() }, [])
  useEffect(() => { if (obraAtiva) { setSetoresLoaded(false); loadSetores() } }, [obraAtiva])

  async function loadObras() {
    const supabase = createClient()
    const { data } = await supabase.from('obras').select('*').order('created_at', { ascending: false })
    setObras(data || [])
    if (data && data.length > 0) setObraAtiva(data[0])
    setLoading(false)
  }

  async function loadSetores() {
    if (!obraAtiva) return
    const supabase = createClient()
    const { data: setoresData } = await supabase
      .from('setores').select('*')
      .eq('obra_id', obraAtiva.id)
      .order('ordem')
    const { data: ambientesData } = await supabase
      .from('ambientes').select('*')
      .eq('obra_id', obraAtiva.id)
      .order('codigo')

    const setoresComAmb = (setoresData || []).map(s => ({
      ...s,
      ambientes: (ambientesData || []).filter(a => a.setor_id === s.id)
    }))
    setSetores(setoresComAmb)
    setSetoresLoaded(true)
  }

  async function handleAddSetor(e: React.FormEvent) {
    e.preventDefault()
    if (!obraAtiva) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('setores').insert({
      obra_id: obraAtiva.id,
      nome: setorForm.nome,
      tipo_unidade: setorForm.tipo_unidade,
      ordem: setores.length
    })
    if (error) { alert('Erro: ' + error.message) }
    else {
      setShowSetorForm(false)
      setSetorForm({ nome: '', tipo_unidade: 'Ambiente' })
      loadSetores()
    }
    setSaving(false)
  }

  async function handleDeleteSetor() {
    if (!confirmDeleteSetor) return
    const supabase = createClient()
    await supabase.from('ambientes').delete().eq('setor_id', confirmDeleteSetor.id)
    await supabase.from('setores').delete().eq('id', confirmDeleteSetor.id)
    setConfirmDeleteSetor(null)
    loadSetores()
  }

  async function handleAddAmbientes(e: React.FormEvent, setorId: string) {
    e.preventDefault()
    if (!obraAtiva) return
    setSaving(true)
    const supabase = createClient()
    const codigos = ambForm.codigos
      .split(/[\n,;]+/)
      .map(c => c.trim())
      .filter(c => c.length > 0)

    const inserts = codigos.map(codigo => ({
      setor_id: setorId,
      obra_id: obraAtiva.id,
      codigo
    }))

    const { error } = await supabase.from('ambientes').insert(inserts)
    if (error) { alert('Erro: ' + error.message) }
    else {
      setShowAmbForm(null)
      setAmbForm({ codigos: '' })
      loadSetores()
    }
    setSaving(false)
  }

  async function handleDeleteAmbiente(id: string) {
    const supabase = createClient()
    await supabase.from('ambientes').delete().eq('id', id)
    loadSetores()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const TIPOS_UNIDADE = ['Ambiente', 'Quarto', 'Suíte', 'Apartamento', 'Sala', 'Unidade', 'Loja', 'Setor']

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

        {/* Seletor de obra — sempre visível */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #EFEFEF' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Obra ativa</div>
          {obras.length > 0 ? (
            <select value={obraAtiva?.id || ''} onChange={e => setObraAtiva(obras.find(o => o.id === e.target.value) || null)}
              style={{ width: '100%', padding: '6px 10px', border: '1px solid #E8E8E8', borderRadius: '8px', fontFamily: 'inherit', fontSize: '12px', outline: 'none', background: '#F5F5F5' }}>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          ) : (
            <a href="/dashboard" style={{ fontSize: '12px', color: '#D4930A', fontWeight: 500 }}>
              ← Cadastre uma obra primeiro
            </a>
          )}
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
              <span style={{ width: '18px', textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '10px 10px 4px', marginTop: '8px' }}>Configuração</div>
          <a href="/setup" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, color: '#fff', background: '#1A1A1A', marginBottom: '1px', textDecoration: 'none' }}>
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
        {/* TOPBAR */}
        <div style={{ height: '56px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>Setup da Obra</div>
          <div style={{ fontSize: '13px', color: '#A0A0A0' }}>{obraAtiva?.nome}</div>
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => setShowSetorForm(true)}
              style={{ padding: '7px 16px', borderRadius: '999px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              + Novo Andar
            </button>
          </div>
        </div>

        {/* ABAS */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', padding: '0 28px', display: 'flex', gap: '0' }}>
          {['Estrutura', 'Disciplinas', 'Fornecedores', 'Equipe'].map((tab, i) => (
            <div key={tab} style={{
              padding: '12px 16px', fontSize: '13px', fontWeight: 600, cursor: i === 0 ? 'default' : 'not-allowed',
              color: i === 0 ? '#1A1A1A' : '#D0D0D0',
              borderBottom: i === 0 ? '2px solid #1A1A1A' : '2px solid transparent',
              marginBottom: '-1px'
            }}>
              {tab} {i > 0 && <span style={{ fontSize: '10px', background: '#F5F5F5', padding: '1px 6px', borderRadius: '999px', marginLeft: '4px' }}>em breve</span>}
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#A0A0A0' }}>Carregando...</div>
          ) : !obraAtiva ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '14px', color: '#A0A0A0' }}>Nenhuma obra selecionada</div>
              <a href="/dashboard" style={{ color: '#1A1A1A', fontWeight: 600, fontSize: '13px' }}>← Ir para o Dashboard</a>
            </div>
          ) : setores.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>🏗</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', marginBottom: '8px' }}>Nenhum andar cadastrado</div>
              <div style={{ fontSize: '14px', color: '#A0A0A0', marginBottom: '24px' }}>
                Adicione os andares desta obra — dentro de cada andar você cadastrará os setores (quartos, salas, ambientes)
              </div>
              <button onClick={() => setShowSetorForm(true)}
                style={{ padding: '11px 24px', borderRadius: '999px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                + Novo Andar
              </button>
            </div>
          ) : (
            <div>
              {/* ANDARES */}
              {setores.map(setor => (
                <div key={setor.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EFEFEF', marginBottom: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                  {/* Header setor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderBottom: '1px solid #F5F5F5' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A' }}>{setor.nome}</div>
                      <div style={{ fontSize: '11px', color: '#A0A0A0', marginTop: '2px' }}>
                        {setor.ambientes?.length || 0} setor{(setor.ambientes?.length || 0) !== 1 ? 'es' : ''} cadastrado{(setor.ambientes?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button onClick={() => { setShowAmbForm(setor.id); setAmbForm({ codigos: '' }) }}
                      style={{ padding: '5px 12px', borderRadius: '999px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '11px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                      + Setor
                    </button>
                    <button onClick={() => setConfirmDeleteSetor(setor)}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#FDECEA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D95F5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                      </svg>
                    </button>
                  </div>

                  {/* Ambientes */}
                  <div style={{ padding: '12px 18px' }}>
                    {setor.ambientes && setor.ambientes.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {setor.ambientes.map(amb => (
                          <div key={amb.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '999px', background: '#F5F5F5', border: '1px solid #E8E8E8', fontSize: '12px', fontWeight: 500, color: '#383838' }}>
                            {amb.codigo}
                            <button onClick={() => handleDeleteAmbiente(amb.id)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#A0A0A0', fontSize: '11px', padding: '0 0 0 2px', lineHeight: 1 }}>✕</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#A0A0A0', fontStyle: 'italic' }}>
                        Nenhum setor cadastrado — clique em "+ Setor" para adicionar
                      </div>
                    )}

                    {/* Form adicionar ambientes */}
                    {showAmbForm === setor.id && (
                      <form onSubmit={e => handleAddAmbientes(e, setor.id)} style={{ marginTop: '12px', padding: '14px', background: '#F5F5F5', borderRadius: '12px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>
                          Adicionar Setores
                        </div>
                        <textarea
                          value={ambForm.codigos}
                          onChange={e => setAmbForm({ codigos: e.target.value })}
                          placeholder={`Ex: 101, 102, 103\nou um por linha:\n101\n102\n103`}
                          rows={4}
                          style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E8E8E8', borderRadius: '10px', fontFamily: 'inherit', fontSize: '13px', outline: 'none', resize: 'vertical', background: '#fff' }}
                        />
                        <div style={{ fontSize: '11px', color: '#A0A0A0', marginTop: '4px', marginBottom: '10px' }}>
                          Separe por vírgula, ponto-vírgula ou uma por linha
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => setShowAmbForm(null)}
                            style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #E8E8E8', background: '#fff', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                            Cancelar
                          </button>
                          <button type="submit" disabled={saving}
                            style={{ flex: 2, padding: '8px', borderRadius: '8px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                            {saving ? 'Salvando...' : 'Adicionar Setores'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL NOVO SETOR */}
      {showSetorForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowSetorForm(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>Novo Andar</div>
                <div style={{ fontSize: '13px', color: '#A0A0A0', marginTop: '2px' }}>Define o andar da obra — os setores serão cadastrados dentro dele</div>
              </div>
              <button onClick={() => setShowSetorForm(false)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F5F5F5', cursor: 'pointer', fontSize: '14px', color: '#707070' }}>✕</button>
            </div>
            <form onSubmit={handleAddSetor}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Nome do Andar</div>
                <input type="text" required placeholder="Ex: 8º Andar, 9º Andar, Subsolo..."
                  value={setorForm.nome} onChange={e => setSetorForm(f => ({ ...f, nome: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Tipo de Unidade</div>
                <select value={setorForm.tipo_unidade} onChange={e => setSetorForm(f => ({ ...f, tipo_unidade: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', background: '#fff' }}>
                  {TIPOS_UNIDADE.map(t => <option key={t}>{t}</option>)}
                </select>
                <div style={{ fontSize: '11px', color: '#A0A0A0', marginTop: '4px' }}>Como cada espaço dentro deste andar será chamado</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowSetorForm(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Salvando...' : 'Criar Andar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR DELETE SETOR */}
      {confirmDeleteSetor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setConfirmDeleteSetor(null)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', textAlign: 'center', marginBottom: '8px' }}>Deletar andar?</div>
            <div style={{ fontSize: '14px', color: '#707070', textAlign: 'center', marginBottom: '24px' }}>
              <strong>{confirmDeleteSetor.nome}</strong> e todos os seus {confirmDeleteSetor.ambientes?.length || 0} setores serão removidos.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setConfirmDeleteSetor(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleDeleteSetor}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#D95F5F', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Sim, deletar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
