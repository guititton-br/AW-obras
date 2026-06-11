'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useSearchParams } from 'next/navigation'

interface Disciplina { id: string; nome: string; icon: string; cor_bg: string }
interface Mestre { id: string; nome: string; av: string; cor: string; territorio: string }
interface Subitem { id: string; nome: string }
interface Setor { id: string; nome: string; tipo_unidade: string; ambientes: Ambiente[] }
interface Ambiente { id: string; codigo: string; nome: string }
interface Plano {
  id: string; status: string; mestre_id: string; subitem_id: string
  ambientes_ids: string[]; data_inicio: string; data_termino: string; obs: string
}

export default function ReuniaoDiscPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const discId = params.discId as string
  const obraId = searchParams.get('obra') || ''
  const semana = parseInt(searchParams.get('semana') || '1')
  const ano = parseInt(searchParams.get('ano') || '2026')

  const [disciplina, setDisciplina] = useState<Disciplina | null>(null)
  const [mestres, setMestres] = useState<Mestre[]>([])
  const [subitens, setSubitens] = useState<Subitem[]>([])
  const [setores, setSetores] = useState<Setor[]>([])
  const [plano, setPlano] = useState<Plano | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'semana_passada' | 'planejar'>('planejar')

  // Form plano
  const [mestreId, setMestreId] = useState('')
  const [subitemId, setSubitemId] = useState('')
  const [ambSelecionados, setAmbSelecionados] = useState<string[]>([])
  const [dataInicio, setDataInicio] = useState('')
  const [dataTermino, setDataTermino] = useState('')

  useEffect(() => { if (discId && obraId) loadData() }, [discId, obraId])

  async function loadData() {
    const supabase = createClient()
    const [discRes, mestresRes, subRes, setoresRes, planoRes] = await Promise.all([
      supabase.from('disciplinas').select('*').eq('id', discId).single(),
      supabase.from('mestres').select('*').eq('obra_id', obraId).order('created_at'),
      supabase.from('subitens').select('*').eq('disciplina_id', discId).order('ordem'),
      supabase.from('setores').select('*, ambientes(*)').eq('obra_id', obraId).order('ordem'),
      supabase.from('planos_semanais').select('*').eq('disciplina_id', discId).eq('obra_id', obraId).eq('semana', semana).eq('ano', ano).single(),
    ])

    setDisciplina(discRes.data)
    setMestres(mestresRes.data || [])
    setSubitens(subRes.data || [])
    setSetores((setoresRes.data || []).map((s: any) => ({ ...s, ambientes: s.ambientes || [] })))

    if (planoRes.data) {
      setPlano(planoRes.data)
      setMestreId(planoRes.data.mestre_id || '')
      setSubitemId(planoRes.data.subitem_id || '')
      setAmbSelecionados(planoRes.data.ambientes_ids || [])
      setDataInicio(planoRes.data.data_inicio || '')
      setDataTermino(planoRes.data.data_termino || '')
    }
    setLoading(false)
  }

  function toggleAmb(id: string) {
    setAmbSelecionados(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id])
  }

  function toggleSetor(setor: Setor) {
    const ids = setor.ambientes.map(a => a.id)
    const allSelected = ids.every(id => ambSelecionados.includes(id))
    if (allSelected) {
      setAmbSelecionados(prev => prev.filter(id => !ids.includes(id)))
    } else {
      setAmbSelecionados(prev => [...new Set([...prev, ...ids])])
    }
  }

  async function handleSalvar(status: 'rascunho' | 'confirmado') {
    setSaving(true)
    const supabase = createClient()
    const payload = {
      obra_id: obraId, disciplina_id: discId, semana, ano,
      mestre_id: mestreId || null,
      subitem_id: subitemId || null,
      ambientes_ids: ambSelecionados,
      data_inicio: dataInicio || null,
      data_termino: dataTermino || null,
      status,
    }

    if (plano) {
      await supabase.from('planos_semanais').update(payload).eq('id', plano.id)
    } else {
      await supabase.from('planos_semanais').insert(payload)
    }

    if (status === 'confirmado') {
      window.location.href = '/reuniao'
    } else {
      loadData()
    }
    setSaving(false)
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#A0A0A0', fontFamily: 'inherit' }}>Carregando...</div>

  const totalAndares = setores.length
  const totalAmb = setores.reduce((a, s) => a + s.ambientes.length, 0)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif' }}>

      {/* SIDEBAR */}
      <aside style={{ width: '220px', flexShrink: 0, background: '#fff', borderRight: '1px solid #E8E8E8', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid #EFEFEF' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>AW <span style={{ color: '#D0D0D0', fontWeight: 300, margin: '0 3px' }}>|</span> OBRAS</div>
          <div style={{ fontSize: '10px', color: '#A0A0A0', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px' }}>Gestão de Obras</div>
        </div>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #EFEFEF' }}>
          <a href="/reuniao" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#707070', textDecoration: 'none', fontWeight: 500 }}>
            ← Reunião Semanal
          </a>
          {disciplina && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: disciplina.cor_bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                {disciplina.icon}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A' }}>{disciplina.nome}</div>
                <div style={{ fontSize: '10px', color: '#A0A0A0' }}>Semana {semana}</div>
              </div>
            </div>
          )}
        </div>

        {/* Resumo seleção */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #EFEFEF' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Selecionados</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: ambSelecionados.length > 0 ? '#4880D8' : '#D0D0D0', letterSpacing: '-1px' }}>
            {ambSelecionados.length}
          </div>
          <div style={{ fontSize: '11px', color: '#A0A0A0' }}>de {totalAmb} ambientes</div>
          {mestreId && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '9px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Mestre</div>
              {(() => {
                const m = mestres.find(m => m.id === mestreId)
                return m ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: m.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff' }}>{m.av}</div>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A1A' }}>{m.nome.split(' ')[0]}</span>
                  </div>
                ) : null
              })()}
            </div>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Botões ação */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid #EFEFEF', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => handleSalvar('rascunho')} disabled={saving}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #E8E8E8', background: '#F5F5F5', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, color: '#707070', cursor: 'pointer' }}>
            Salvar rascunho
          </button>
          <button onClick={() => handleSalvar('confirmado')} disabled={saving || ambSelecionados.length === 0}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: ambSelecionados.length === 0 ? '#D0D0D0' : '#3DAB6E', color: '#fff', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600, cursor: ambSelecionados.length === 0 ? 'not-allowed' : 'pointer' }}>
            {saving ? 'Salvando...' : '✓ Confirmar semana'}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* TOPBAR */}
        <div style={{ height: '56px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{disciplina?.nome}</div>
          <div style={{ padding: '3px 10px', borderRadius: '999px', background: '#E8F0FC', fontSize: '11px', fontWeight: 600, color: '#1A44A0' }}>Semana {semana}</div>
          {plano?.status === 'confirmado' && (
            <div style={{ padding: '3px 10px', borderRadius: '999px', background: '#E8F5EE', fontSize: '11px', fontWeight: 600, color: '#1B6E40' }}>✓ Confirmado</div>
          )}
        </div>

        {/* ABAS */}
        <div style={{ background: '#fff', borderBottom: '1px solid #E8E8E8', padding: '0 28px', display: 'flex' }}>
          {[
            { key: 'semana_passada', label: `← Semana ${semana - 1}` },
            { key: 'planejar', label: `Planejar Semana ${semana}` },
          ].map(t => (
            <div key={t.key} onClick={() => setTab(t.key as any)}
              style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                color: tab === t.key ? '#1A1A1A' : '#A0A0A0',
                borderBottom: tab === t.key ? '2px solid #1A1A1A' : '2px solid transparent',
                marginBottom: '-1px' }}>
              {t.label}
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>

          {tab === 'semana_passada' && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>📋</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#1A1A1A', marginBottom: '8px' }}>Semana {semana - 1}</div>
              <div style={{ fontSize: '14px', color: '#A0A0A0' }}>Histórico de execução em desenvolvimento</div>
            </div>
          )}

          {tab === 'planejar' && (
            <div>
              {/* CONFIGURAÇÃO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Mestre responsável</div>
                  <select value={mestreId} onChange={e => setMestreId(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', background: '#fff' }}>
                    <option value="">— Selecionar mestre —</option>
                    {mestres.map(m => <option key={m.id} value={m.id}>{m.nome}{m.territorio ? ' · ' + m.territorio : ''}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Serviço (subitem)</div>
                  <select value={subitemId} onChange={e => setSubitemId(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none', background: '#fff' }}>
                    <option value="">— Selecionar serviço —</option>
                    {subitens.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Início previsto</div>
                  <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '6px' }}>Término previsto</div>
                  <input type="date" value={dataTermino} onChange={e => setDataTermino(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontFamily: 'inherit', fontSize: '14px', outline: 'none' }} />
                </div>
              </div>

              {/* SELEÇÃO DE AMBIENTES */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#707070', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '12px' }}>
                Ambientes planejados — {ambSelecionados.length} selecionados
              </div>

              {setores.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: '#F5F5F5', borderRadius: '16px' }}>
                  <div style={{ fontSize: '14px', color: '#A0A0A0', marginBottom: '12px' }}>Nenhum andar/setor cadastrado para esta obra</div>
                  <a href="/setup" style={{ fontSize: '13px', color: '#1A1A1A', fontWeight: 600 }}>⚙️ Configurar estrutura</a>
                </div>
              ) : (
                setores.map(setor => {
                  const ids = setor.ambientes.map(a => a.id)
                  const allSelected = ids.length > 0 && ids.every(id => ambSelecionados.includes(id))
                  const someSelected = ids.some(id => ambSelecionados.includes(id))
                  return (
                    <div key={setor.id} style={{ background: '#fff', borderRadius: '14px', border: '1px solid #EFEFEF', marginBottom: '10px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: setor.ambientes.length > 0 ? '1px solid #F5F5F5' : 'none', cursor: 'pointer' }}
                        onClick={() => toggleSetor(setor)}>
                        <div style={{ width: '18px', height: '18px', borderRadius: '5px', border: `2px solid ${allSelected ? '#1A1A1A' : someSelected ? '#4880D8' : '#D0D0D0'}`, background: allSelected ? '#1A1A1A' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {allSelected && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                          {someSelected && !allSelected && <span style={{ color: '#4880D8', fontSize: '11px', lineHeight: 1 }}>–</span>}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', flex: 1 }}>{setor.nome}</div>
                        <div style={{ fontSize: '12px', color: '#A0A0A0' }}>{setor.ambientes.length} {setor.tipo_unidade.toLowerCase()}s</div>
                      </div>
                      {setor.ambientes.length > 0 && (
                        <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {setor.ambientes.map(amb => {
                            const sel = ambSelecionados.includes(amb.id)
                            return (
                              <div key={amb.id} onClick={() => toggleAmb(amb.id)}
                                style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all .1s',
                                  background: sel ? '#1A1A1A' : '#F5F5F5',
                                  color: sel ? '#fff' : '#383838',
                                  border: `1.5px solid ${sel ? '#1A1A1A' : '#E8E8E8'}` }}>
                                {amb.codigo}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
