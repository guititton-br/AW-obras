'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Obra { id: string; nome: string; tipo: string; local: string }
interface Disciplina {
  id: string; nome: string; icon: string; cor_bg: string
  fornecedores?: { nome: string; av: string; cor: string }[]
  plano_atual?: { id: string; status: string; ambientes_ids: string[] } | null
  total_ambientes?: number
  pendencias?: number
}
interface Mestre { id: string; nome: string; av: string; cor: string; territorio: string }

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

export default function ReuniaoPage() {
  const router = useRouter()
  const [obras, setObras] = useState<Obra[]>([])
  const [obraAtiva, setObraAtiva] = useState<Obra | null>(null)
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([])
  const [mestres, setMestres] = useState<Mestre[]>([])
  const [loading, setLoading] = useState(true)
  const semanaAtual = getWeekNumber(new Date())
  const anoAtual = new Date().getFullYear()

  useEffect(() => { loadObras() }, [])
  useEffect(() => { if (obraAtiva) { loadDisciplinas(); loadMestres() } }, [obraAtiva])

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
    const { data } = await supabase.from('mestres').select('*').eq('obra_id', obraAtiva.id)
    setMestres(data || [])
  }

  async function loadDisciplinas() {
    if (!obraAtiva) return
    const supabase = createClient()

    const { data: discs } = await supabase.from('disciplinas').select('*, disciplinas_fornecedores(fornecedores(nome,av,cor))')
      .eq('obra_id', obraAtiva.id).order('ordem')

    const { data: planos } = await supabase.from('planos_semanais').select('*')
      .eq('obra_id', obraAtiva.id).eq('semana', semanaAtual).eq('ano', anoAtual)

    const { data: pendencias } = await supabase.from('pendencias').select('*, planos_semanais!inner(obra_id, semana, ano)')
      .eq('planos_semanais.obra_id', obraAtiva.id)
      .eq('planos_semanais.semana', semanaAtual - 1)
      .eq('resolvida', false)

    const result = (discs || []).map((d: any) => {
      const planoDisc = (planos || []).filter(p => p.disciplina_id === d.id)
      const pendDisc = (pendencias || []).filter((p: any) => p.planos_semanais?.disciplina_id === d.id)
      const totalAmb = planoDisc.reduce((a: number, p: any) => a + (p.ambientes_ids?.length || 0), 0)
      return {
        ...d,
        fornecedores: d.disciplinas_fornecedores?.map((df: any) => df.fornecedores) || [],
        plano_atual: planoDisc.length > 0 ? planoDisc[0] : null,
        total_ambientes: totalAmb,
        pendencias: pendDisc.length,
      }
    })
    setDisciplinas(result)
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
  const discConfirmadas = disciplinas.filter(d => d.plano_atual?.status === 'confirmado').length
  const discPendentes = disciplinas.filter(d => !d.plano_atual || d.plano_atual.status === 'rascunho').length

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
          <select value={obraAtiva?.id || ''} onChange={e => { setObraAtiva(obras.find(o => o.id === e.target.value) || null) }}
            style={{ width: '100%', padding: '6px 10px', border: '1px solid #E8E8E8', borderRadius: '8px', fontFamily: 'inherit', fontSize: '12px', outline: 'none', background: '#F5F5F5' }}>
            {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>
        <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1.2px', padding: '10px 10px 4px' }}>Principal</div>
          {[
            { icon: '📊', label: 'Dashboard', href: '/dashboard' },
            { icon: '📅', label: 'Reunião Semanal', href: '/reuniao', active: true },
            { icon: '📱', label: 'Reporte do Mestre', href: '/mestre' },
            { icon: '👷', label: 'Efetivo OnTime', href: '/efetivo' },
          ].map(item => (
            <a key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 500,
              color: (item as any).active ? '#fff' : '#707070',
              background: (item as any).active ? '#1A1A1A' : 'transparent',
              marginBottom: '1px', textDecoration: 'none'
            }}>
              <span style={{ width: '18px', textAlign: 'center' }}>{item.icon}</span>{item.label}
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
            <div><div style={{ fontSize: '12px', fontWeight: 600 }}>Sair</div><div style={{ fontSize: '10px', color: '#A0A0A0' }}>Clique para sair</div></div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* TOPBAR */}
        <div style={{ height: '56px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #E8E8E8', display: 'flex', alignItems: 'center', padding: '0 28px', gap: '12px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>Reunião Semanal</div>
          <div style={{ padding: '3px 10px', borderRadius: '999px', background: '#E8F0FC', fontSize: '11px', fontWeight: 600, color: '#1A44A0' }}>Semana {semanaAtual}</div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#A0A0A0' }}>{hoje}</div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#A0A0A0' }}>Carregando...</div>
          ) : !obraAtiva ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#A0A0A0' }}>Selecione uma obra</div>
          ) : disciplinas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>📅</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Nenhuma disciplina cadastrada</div>
              <div style={{ fontSize: '14px', color: '#A0A0A0', marginBottom: '24px' }}>Cadastre as disciplinas no Setup antes de iniciar a reunião</div>
              <a href="/setup/disciplinas" style={{ padding: '11px 24px', borderRadius: '999px', border: 'none', background: '#1A1A1A', color: '#fff', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
                ⚙️ Ir para Setup
              </a>
            </div>
          ) : (
            <div>
              {/* HEADER INFO */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
                <div style={{ flex: 1, padding: '16px 20px', background: '#fff', borderRadius: '14px', border: '1px solid #EFEFEF' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Obra</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A' }}>{obraAtiva.nome}</div>
                  <div style={{ fontSize: '12px', color: '#A0A0A0', marginTop: '2px' }}>{obraAtiva.tipo}{obraAtiva.local ? ' · ' + obraAtiva.local : ''}</div>
                </div>
                <div style={{ padding: '16px 20px', background: '#fff', borderRadius: '14px', border: '1px solid #EFEFEF', textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#3DAB6E' }}>{discConfirmadas}</div>
                  <div style={{ fontSize: '11px', color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: '2px' }}>Confirmadas</div>
                </div>
                <div style={{ padding: '16px 20px', background: '#fff', borderRadius: '14px', border: '1px solid #EFEFEF', textAlign: 'center', minWidth: '100px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: discPendentes > 0 ? '#D4930A' : '#3DAB6E' }}>{discPendentes}</div>
                  <div style={{ fontSize: '11px', color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: '2px' }}>Pendentes</div>
                </div>
                {mestres.length > 0 && (
                  <div style={{ padding: '16px 20px', background: '#fff', borderRadius: '14px', border: '1px solid #EFEFEF', minWidth: '140px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Mestres</div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {mestres.map(m => (
                        <div key={m.id} title={m.nome} style={{ width: '28px', height: '28px', borderRadius: '50%', background: m.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#fff' }}>
                          {m.av}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* DISCIPLINAS */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#A0A0A0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                {disciplinas.length} disciplina{disciplinas.length !== 1 ? 's' : ''} · Semana {semanaAtual}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {disciplinas.map(disc => {
                  const confirmado = disc.plano_atual?.status === 'confirmado'
                  const temPlano = !!disc.plano_atual
                  const statusBg = confirmado ? '#E8F5EE' : temPlano ? '#FDF5E6' : '#F5F5F5'
                  const statusColor = confirmado ? '#1B6E40' : temPlano ? '#7A5200' : '#707070'
                  const statusLabel = confirmado ? '✓ Confirmado' : temPlano ? '⏳ Rascunho' : 'Planejar'

                  return (
                    <div key={disc.id}
                      onClick={() => router.push(`/reuniao/${disc.id}?obra=${obraAtiva.id}&semana=${semanaAtual}&ano=${anoAtual}`)}
                      style={{ background: '#fff', borderRadius: '16px', border: `1.5px solid ${confirmado ? '#C8E8D4' : '#EFEFEF'}`, padding: '18px', cursor: 'pointer', transition: 'all .15s', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: disc.cor_bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                          {disc.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A' }}>{disc.nome}</div>
                          <div style={{ fontSize: '11px', color: '#A0A0A0', marginTop: '2px' }}>
                            {disc.fornecedores?.map(f => f.nome).join(', ') || 'Sem fornecedor'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {disc.total_ambientes! > 0 && (
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#4880D8' }}>{disc.total_ambientes} amb</span>
                          )}
                          {disc.pendencias! > 0 && (
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#D4930A' }}>⚠ {disc.pendencias} pend</span>
                          )}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', background: statusBg, color: statusColor }}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
