'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Obra { id: string; nome: string }
interface Disciplina {
  id: string; nome: string; icon: string; cor_bg: string
  pct_avanco: number; status: string; ordem: number
  fornecedores?: Fornecedor[]
  subitens?: Subitem[]
}
interface Fornecedor {
  id: string; nome: string; av: string; cor: string
  contato_nome: string; contato_tel: string
}
interface Subitem { id: string; nome: string; ordem: number }

const ICONS = ['⚡','🧱','❄️','🔧','🪨','🎨','🪵','💡','🛁','🪟','🔩','🏗','🚿','🪜','🔌']
const CORES = [
  { bg: '#E8F0FC', label: 'Azul' },
  { bg: '#F0EEFF', label: 'Roxo' },
  { bg: '#E8F5EE', label: 'Verde' },
  { bg: '#FDF5E6', label: 'Âmbar' },
  { bg: '#FDECEA', label: 'Vermelho' },
  { bg: '#F5F0E8', label: 'Marrom' },
  { bg: '#F5F5F5', label: 'Cinza' },
]

export default function SetupDisciplinasPage() {
  const [obras, setObras] = useState<Obra[]>([])
  const [obraAtiva, setObraAtiva] = useState<Obra | null>(null)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [todosForns, setTodosForns] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [openDisc, setOpenDisc] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Forms
  const [showDiscForm, setShowDiscForm] = useState(false)
  const [discForm, setDiscForm] = useState({ nome: '', icon: '⚡', cor_bg: '#E8F0FC' })

  const [showFornForm, setShowFornForm] = useState<string | null>(null) // disc id
  const [fornForm, setFornForm] = useState({ nome: '', av: '', cor: '#383838', contato_nome: '', contato_tel: '' })
  const [fornExistente, setFornExistente] = useState<string>('') // id de forn existente

  const [showSubForm, setShowSubForm] = useState<string | null>(null) // disc id
  const [subNome, setSubNome] = useState('')

  const [confirmDeleteDisc, setConfirmDeleteDisc] = useState<Disciplina | null>(null)

  useEffect(() => { loadObras() }, [])
  useEffect(() => { if (obraAtiva) { loadDisciplinas(); loadTodosForns() } }, [obraAtiva])

  async function loadObras() {
    const supabase = createClient()
    const { data } = await supabase.from('obras').select('*').order('created_at', { ascending: false })
    setObras(data || [])
    if (data && data.length > 0) setObraAtiva(data[0])
    setLoading(false)
  }

  async function loadTodosForns() {
    const supabase = createClient()
    const { data } = await supabase.from('fornecedores').select('*').order('nome')
    setTodosForns(data || [])
  }

  async function loadDisciplinas() {
    if (!obraAtiva) return
    const supabase = createClient()
    const { data: discs } = await supabase.from('disciplinas').select('*').eq('obra_id', obraAtiva.id).order('ordem')
    if (!discs) { setDisciplinas([]); return }

    // Load fornecedores and subitems for each disciplina
    const { data: dfs } = await supabase.from('disciplinas_fornecedores').select('disciplina_id, fornecedor_id, fornecedores(*)').in('disciplina_id', discs.map(d => d.id))
    const { data: subs } = await supabase.from('subitens').select('*').in('disciplina_id', discs.map(d => d.id)).order('ordem')

    const result = discs.map(d => ({
      ...d,
      fornecedores: (dfs || []).filter((df: any) => df.disciplina_id === d.id).map((df: any) => df.fornecedores),
      subitens: (subs || []).filter(s => s.disciplina_id === d.id),
    }))
    setDisciplinas(result)
  }

  async function handleAddDisc(e: React.FormEvent) {
    e.preventDefault()
    if (!obraAtiva) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('disciplinas').insert({
      obra_id: obraAtiva.id,
      nome: discForm.nome,
      icon: discForm.icon,
      cor_bg: discForm.cor_bg,
      ordem: disciplinas.length,
    })
    if (error) { alert('Erro: ' + error.message) }
    else { setShowDiscForm(false); setDiscForm({ nome: '', icon: '⚡', cor_bg: '#E8F0FC' }); loadDisciplinas() }
    setSaving(false)
  }

  async function handleDeleteDisc() {
    if (!confirmDeleteDisc) return
    const supabase = createClient()
    await supabase.from('subitens').delete().eq('disciplina_id', confirmDeleteDisc.id)
    await supabase.from('disciplinas_fornecedores').delete().eq('disciplina_id', confirmDeleteDisc.id)
    await supabase.from('disciplinas').delete().eq('id', confirmDeleteDisc.id)
    setConfirmDeleteDisc(null)
    loadDisciplinas()
  }

  async function handleVincularForn(discId: string) {
    setSaving(true)
    const supabase = createClient()
    let fornId = fornExistente

    if (!fornId) {
      // Create new fornecedor
      const av = fornForm.av || fornForm.nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
      const { data: newForn, error } = await supabase.from('fornecedores').insert({
        nome: fornForm.nome, av, cor: fornForm.cor,
        contato_nome: fornForm.contato_nome || null,
        contato_tel: fornForm.contato_tel || null,
      }).select().single()
      if (error) { alert('Erro: ' + error.message); setSaving(false); return }
      fornId = newForn.id
    }

    const { error } = await supabase.from('disciplinas_fornecedores').insert({ disciplina_id: discId, fornecedor_id: fornId })
    if (error) { alert('Erro: ' + error.message) }
    else {
      setShowFornForm(null)
      setFornForm({ nome: '', av: '', cor: '#383838', contato_nome: '', contato_tel: '' })
      setFornExistente('')
      loadDisciplinas()
      loadTodosForns()
    }
    setSaving(false)
  }

  async function handleDesvincularForn(discId: string, fornId: string) {
    const supabase = createClient()
    await supabase.from('disciplinas_fornecedores').delete().eq('disciplina_id', discId).eq('fornecedor_id', fornId)
    loadDisciplinas()
  }

  async function handleAddSub(discId: string) {
    if (!subNome.trim()) return
    setSaving(true)
    const supabase = createClient()
    const disc = disciplinas.find(d => d.id === discId)
    await supabase.from('subitens').insert({ disciplina_id: discId, nome: subNome.trim(), ordem: disc?.subitens?.length || 0 })
    setSubNome('')
    setShowSubForm(null)
    loadDisciplinas()
    setSaving(false)
  }

  async function handleDeleteSub(id: string) {
    const supabase = createClient()
    await supabase.from('subitens').delete().eq('id', id)
    loadDisciplinas()
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
            {disciplinas.length > 0 && (
              <button onClick={() => setShowDiscForm(true)}
                style={{ padding: '7px 16px', borderRadius: '999px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                + Nova Disciplina
              </button>
            )}
          </div>
        </div>

        {/* ABAS */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', padding: '0 28px', display: 'flex' }}>
          {[
            { label: 'Estrutura', href: '/setup', active: false },
            { label: 'Disciplinas', href: '/setup/disciplinas', active: true },
          ].map(tab => (
            <a key={tab.label} href={tab.href} style={{
              padding: '12px 16px', fontSize: '13px', fontWeight: 600,
              color: tab.active ? '#1A1A1A' : '#A0A0A0',
              borderBottom: tab.active ? '2px solid #1A1A1A' : '2px solid transparent',
              marginBottom: '-1px', textDecoration: 'none'
            }}>{tab.label}</a>
          ))}
          {['Fornecedores', 'Equipe'].map(tab => (
            <div key={tab} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#D0D0D0', borderBottom: '2px solid transparent', marginBottom: '-1px' }}>
              {tab} <span style={{ fontSize: '10px', background: '#F5F5F5', padding: '1px 6px', borderRadius: '999px', marginLeft: '4px' }}>em breve</span>
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#A0A0A0' }}>Carregando...</div>
          ) : disciplinas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚙️</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Nenhuma disciplina cadastrada</div>
              <div style={{ fontSize: '14px', color: '#A0A0A0', marginBottom: '24px' }}>Adicione os grupos de serviço desta obra — Elétrica, Drywall, Hidráulica...</div>
              <button onClick={() => setShowDiscForm(true)}
                style={{ padding: '11px 24px', borderRadius: '999px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                + Nova Disciplina
              </button>
            </div>
          ) : (
            <div>
              {disciplinas.map(disc => (
                <div key={disc.id} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #EFEFEF', marginBottom: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', cursor: 'pointer', borderBottom: openDisc === disc.id ? '1px solid #F5F5F5' : 'none' }}
                    onClick={() => setOpenDisc(openDisc === disc.id ? null : disc.id)}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: disc.cor_bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                      {disc.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 700 }}>{disc.nome}</div>
                      <div style={{ fontSize: '11px', color: '#A0A0A0', marginTop: '2px' }}>
                        {disc.fornecedores?.length || 0} fornecedor{(disc.fornecedores?.length || 0) !== 1 ? 'es' : ''} · {disc.subitens?.length || 0} subiten{(disc.subitens?.length || 0) !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '16px', color: '#A0A0A0', transition: 'transform .2s', transform: openDisc === disc.id ? 'rotate(90deg)' : 'none' }}>›</span>
                      <button onClick={e => { e.stopPropagation(); setConfirmDeleteDisc(disc) }}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#FDECEA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D95F5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Body expandido */}
                  {openDisc === disc.id && (
                    <div style={{ padding: '16px 18px', background: '#FAFAFA' }}>
                      
                      {/* FORNECEDORES */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Fornecedores</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                          {disc.fornecedores?.map(f => (
                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#fff', borderRadius: '10px', border: '1px solid #EFEFEF' }}>
                              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: f.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>{f.av}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 500 }}>{f.nome}</div>
                                {f.contato_nome && <div style={{ fontSize: '11px', color: '#A0A0A0' }}>{f.contato_nome}{f.contato_tel ? ' · ' + f.contato_tel : ''}</div>}
                              </div>
                              <button onClick={() => handleDesvincularForn(disc.id, f.id)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#A0A0A0', fontSize: '14px' }}>✕</button>
                            </div>
                          ))}
                        </div>

                        {showFornForm === disc.id ? (
                          <div style={{ padding: '14px', background: '#fff', borderRadius: '12px', border: '1px solid #EFEFEF' }}>
                            {/* Escolher existente ou novo */}
                            {todosForns.length > 0 && (
                              <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Fornecedor existente</div>
                                <select value={fornExistente} onChange={e => setFornExistente(e.target.value)}
                                  style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E8E8E8', borderRadius: '10px', fontFamily: 'inherit', fontSize: '13px', outline: 'none', background: '#fff' }}>
                                  <option value="">— Criar novo —</option>
                                  {todosForns.filter(f => !disc.fornecedores?.find(df => df.id === f.id)).map(f => (
                                    <option key={f.id} value={f.id}>{f.nome}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                            {!fornExistente && (
                              <div>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>Novo fornecedor</div>
                                {[
                                  { key: 'nome', label: 'Nome', placeholder: 'Ex: Voltex Elétrica', required: true },
                                  { key: 'contato_nome', label: 'Contato', placeholder: 'Ex: João Silva' },
                                  { key: 'contato_tel', label: 'Telefone', placeholder: 'Ex: (11) 98765-4321' },
                                ].map(f => (
                                  <div key={f.key} style={{ marginBottom: '8px' }}>
                                    <div style={{ fontSize: '10px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '4px' }}>{f.label}</div>
                                    <input type="text" placeholder={f.placeholder}
                                      value={(fornForm as any)[f.key]}
                                      onChange={e => setFornForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #E8E8E8', borderRadius: '10px', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }} />
                                  </div>
                                ))}
                                <div style={{ marginBottom: '8px' }}>
                                  <div style={{ fontSize: '10px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Cor do avatar</div>
                                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                    {['#1A44A0','#1B6E40','#7A5200','#943030','#3820A0','#383838','#5C4A2A','#2A4A6A'].map(cor => (
                                      <div key={cor} onClick={() => setFornForm(f => ({ ...f, cor }))}
                                        style={{ width: '24px', height: '24px', borderRadius: '50%', background: cor, cursor: 'pointer', border: fornForm.cor === cor ? '3px solid #1A1A1A' : '2px solid transparent' }} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                              <button onClick={() => { setShowFornForm(null); setFornExistente('') }}
                                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                                Cancelar
                              </button>
                              <button onClick={() => handleVincularForn(disc.id)} disabled={saving}
                                style={{ flex: 2, padding: '8px', borderRadius: '8px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                                {saving ? 'Salvando...' : fornExistente ? 'Vincular' : 'Criar e vincular'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => { setShowFornForm(disc.id); setFornExistente('') }}
                            style={{ padding: '5px 12px', borderRadius: '999px', border: '1.5px dashed #D0D0D0', background: 'transparent', fontFamily: 'inherit', fontSize: '11px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                            + Fornecedor
                          </button>
                        )}
                      </div>

                      {/* SUBITENS */}
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Subitens acompanhados</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                          {disc.subitens?.map(s => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '999px', background: '#F5F5F5', border: '1px solid #E8E8E8', fontSize: '12px', fontWeight: 500, color: '#383838' }}>
                              {s.nome}
                              <button onClick={() => handleDeleteSub(s.id)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#A0A0A0', fontSize: '11px', padding: '0 0 0 2px' }}>✕</button>
                            </div>
                          ))}
                        </div>

                        {showSubForm === disc.id ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input type="text" value={subNome} onChange={e => setSubNome(e.target.value)}
                              placeholder="Ex: Infra. de parede" autoFocus
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSub(disc.id) } if (e.key === 'Escape') setShowSubForm(null) }}
                              style={{ flex: 1, padding: '7px 12px', border: '1.5px solid #1A1A1A', borderRadius: '8px', fontFamily: 'inherit', fontSize: '13px', outline: 'none' }} />
                            <button onClick={() => handleAddSub(disc.id)}
                              style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                              Adicionar
                            </button>
                            <button onClick={() => setShowSubForm(null)}
                              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '12px', color: '#707070', cursor: 'pointer' }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setShowSubForm(disc.id); setSubNome('') }}
                            style={{ padding: '5px 12px', borderRadius: '999px', border: '1.5px dashed #D0D0D0', background: 'transparent', fontFamily: 'inherit', fontSize: '11px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                            + Subitem
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL NOVA DISCIPLINA */}
      {showDiscForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setShowDiscForm(false)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>Nova Disciplina</div>
                <div style={{ fontSize: '13px', color: '#A0A0A0', marginTop: '2px' }}>Grupo de serviço desta obra</div>
              </div>
              <button onClick={() => setShowDiscForm(false)} style={{ width: '28px', height: '28px', borderRadius: '50%', border: 'none', background: '#F5F5F5', cursor: 'pointer', fontSize: '14px', color: '#707070' }}>✕</button>
            </div>
            <form onSubmit={handleAddDisc}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Nome</div>
                <input type="text" required placeholder="Ex: Elétrica, Drywall, Hidráulica..."
                  value={discForm.nome} onChange={e => setDiscForm(f => ({ ...f, nome: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>Ícone</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ICONS.map(icon => (
                    <div key={icon} onClick={() => setDiscForm(f => ({ ...f, icon }))}
                      style={{ width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', cursor: 'pointer', border: discForm.icon === icon ? '2px solid #1A1A1A' : '2px solid #E8E8E8', background: discForm.icon === icon ? '#F5F5F5' : '#fff' }}>
                      {icon}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '8px' }}>Cor do card</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {CORES.map(cor => (
                    <div key={cor.bg} onClick={() => setDiscForm(f => ({ ...f, cor_bg: cor.bg }))}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', background: cor.bg, cursor: 'pointer', border: discForm.cor_bg === cor.bg ? '3px solid #1A1A1A' : '2px solid #E8E8E8' }}
                      title={cor.label} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowDiscForm(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: '#1A1A1A', color: '#fff', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? 'Salvando...' : 'Criar Disciplina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR DELETE */}
      {confirmDeleteDisc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => e.target === e.currentTarget && setConfirmDeleteDisc(null)}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontSize: '18px', fontWeight: 700, textAlign: 'center', marginBottom: '8px' }}>Deletar disciplina?</div>
            <div style={{ fontSize: '14px', color: '#707070', textAlign: 'center', marginBottom: '24px' }}>
              <strong>{confirmDeleteDisc.nome}</strong> com todos os fornecedores e subitens será removida.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setConfirmDeleteDisc(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '13px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleDeleteDisc}
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
