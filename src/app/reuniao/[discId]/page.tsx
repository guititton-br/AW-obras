'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnudhxpolvxvezoglvrk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZudWRoeHBvbHZ4dmV6b2dsdnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNjUxMjksImV4cCI6MjA5NTY0MTEyOX0.G7dG8p004-3ISaslEAI0m6UuCPjZjFwmdANOBMtCll4'
);

// ─────────── CONSTANTS ───────────
const C = {
  bg:'#F5F5F5', white:'#FFFFFF', surf:'#FAFAFA',
  b100:'#F5F5F5', b150:'#EFEFEF', b200:'#E8E8E8', b300:'#D0D0D0',
  b400:'#A0A0A0', b500:'#707070', b700:'#383838', b900:'#1A1A1A',
  gp:'#E8F5EE', gm:'#3DAB6E', gd:'#1B6E40',
  rp:'#FDECEA', rm:'#D95F5F', rd:'#943030',
  ap:'#FDF5E6', am:'#D4930A', ad:'#7A5200',
  bp:'#E8F0FC', bm:'#4880D8', bd:'#1A44A0',
  pp:'#EEE8FC', pm:'#7060CC', pd:'#3820A0',
};
const FONT = "'Inter',-apple-system,BlinkMacSystemFont,sans-serif";
const DL = ['Seg','Ter','Qua','Qui','Sex'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const DAY_BG = [
  'rgba(147,197,253,.45)',
  'rgba(96,165,250,.42)',
  'rgba(59,130,246,.38)',
  'rgba(37,99,235,.35)',
  'rgba(29,78,216,.35)',
];
const DAY_BORDER = [
  'rgba(59,130,246,.65)',
  'rgba(37,99,235,.7)',
  'rgba(29,78,216,.72)',
  'rgba(30,64,175,.78)',
  'rgba(30,64,175,.85)',
];
const DAY_TEXT = ['#1e40af','#1e3a8a','#1e3a8a','#1e3a8a','#1e3a8a'];

// ─────────── HELPERS ───────────
function fmtDate(d: Date | null) {
  if (!d) return '—';
  return `${d.getDate()} ${MS[d.getMonth()]}`;
}
function fmtDateLong(d: Date | null) {
  if (!d) return '';
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}
function workingDays(s: Date, e: Date) {
  let n = 0;
  const c = new Date(s);
  while (c <= e) { const wd = c.getDay(); if (wd !== 0 && wd !== 6) n++; c.setDate(c.getDate()+1); }
  return n;
}
function weekToMonday(week: number, year: number) {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - dayOfWeek + 1);
  const target = new Date(week1Monday);
  target.setDate(week1Monday.getDate() + (week-1)*7);
  return target;
}

// ─────────── COMPONENT ───────────
export default function ReuniaoDisciplina() {
  const params = useParams() as { discId: string };
  const searchParams = useSearchParams();
  const discId = params.discId;
  const obraId = searchParams.get('obra') || '';
  const semana = parseInt(searchParams.get('semana') || '24', 10);
  const ano = parseInt(searchParams.get('ano') || '2026', 10);

  // auth
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  // data
  const [loading, setLoading] = useState(true);
  const [obra, setObra] = useState<any>(null);
  const [disciplina, setDisciplina] = useState<any>(null);
  const [fornecedorNome, setFornecedorNome] = useState('');
  const [subitens, setSubitens] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<Record<string, any[]>>({});
  const [mestres, setMestres] = useState<any[]>([]);
  const [pendencias, setPendencias] = useState<any[]>([]);

  // selection
  const [curSubId, setCurSubId] = useState<string | null>(null);
  const [curSetorId, setCurSetorId] = useState<string | null>(null);

  // form state per andar (key: subId-setorId)
  type AndarState = {
    efEq: number;
    efProd: number;
    mestreId: string | null;
    dist: Record<number, string[]>;
    unassigned: string[];
    calStart: Date;
    calEnd: Date;
    postponeReasons: string[];
    postponeObs: string;
    confirmed: boolean;
  };
  const [andarStates, setAndarStates] = useState<Record<string, AndarState>>({});

  // ui state
  const [calOpen, setCalOpen] = useState(false);
  const [calPickMode, setCalPickMode] = useState<'start'|'end'>('start');
  const [calViewYear, setCalViewYear] = useState(ano);
  const [calViewMonth, setCalViewMonth] = useState(new Date().getMonth());
  const [plantaUrl, setPlantaUrl] = useState<string | null>(null);
  const [plantaLoading, setPlantaLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [draggingAmb, setDraggingAmb] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─────────── EFFECTS ───────────
  // Inter font
  useEffect(() => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap';
    document.head.appendChild(l);
    return () => { try { document.head.removeChild(l); } catch {} };
  }, []);

  // Auth — não força redirect; libera a tela e mostra status real na sidebar
  useEffect(() => {
    let mounted = true;

    const tryLoad = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && mounted) {
        setUserEmail(session.user.email || '');
        setAuthLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user && mounted) {
        setUserEmail(user.email || '');
        setAuthLoading(false);
        return;
      }
      if (mounted) {
        setUserEmail('(não autenticado)');
        setAuthLoading(false);
        console.warn('[AW] Sessão não encontrada — carregando sem auth');
      }
    };

    tryLoad();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) setUserEmail(session.user.email || '');
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // Load data
  useEffect(() => {
    if (authLoading || !discId || !obraId) return;
    (async () => {
      setLoading(true);
      try {
        // obra
        const { data: obraData } = await supabase.from('obras').select('*').eq('id', obraId).maybeSingle();
        setObra(obraData);

        // disciplina
        const { data: discData } = await supabase.from('disciplinas').select('*').eq('id', discId).maybeSingle();
        setDisciplina(discData);

        // fornecedor da disciplina (via disciplinas_fornecedores)
        try {
          const { data: df } = await supabase.from('disciplinas_fornecedores').select('fornecedor_id').eq('disciplina_id', discId).limit(1);
          if (df && df[0]) {
            const { data: forn } = await supabase.from('fornecedores').select('nome').eq('id', df[0].fornecedor_id).maybeSingle();
            if (forn) setFornecedorNome(forn.nome);
          }
        } catch {}

        // subitens
        const { data: subs } = await supabase.from('subitens').select('*').eq('disciplina_id', discId).order('ordem', { ascending: true });
        setSubitens(subs || []);

        // setores (andares) da obra
        const { data: sets } = await supabase.from('setores').select('*').eq('obra_id', obraId).order('ordem', { ascending: true });
        setSetores(sets || []);

        // ambientes por setor
        if (sets && sets.length) {
          const { data: ambs } = await supabase.from('ambientes').select('*').in('setor_id', sets.map(s => s.id)).order('ordem', { ascending: true });
          const byS: Record<string, any[]> = {};
          (ambs || []).forEach(a => { (byS[a.setor_id] = byS[a.setor_id] || []).push(a); });
          setAmbientes(byS);
        }

        // mestres da obra
        try {
          const { data: ms } = await supabase.from('mestres').select('*').eq('obra_id', obraId);
          setMestres(ms || []);
        } catch { setMestres([]); }

        // pendencias da obra/disciplina
        try {
          const { data: pends } = await supabase.from('pendencias').select('*').eq('obra_id', obraId).eq('disciplina_id', discId);
          setPendencias(pends || []);
        } catch { setPendencias([]); }

        // seleção inicial
        if (subs && subs[0]) setCurSubId(subs[0].id);
        if (sets && sets[0]) setCurSetorId(sets[0].id);

      } catch (e:any) {
        console.error(e);
        showToast('Erro ao carregar dados: ' + (e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, discId, obraId]);

  // Initialize andar state when subitens/setores arrive
  useEffect(() => {
    if (!subitens.length || !setores.length) return;
    const monday = weekToMonday(semana, ano);
    const friday = new Date(monday); friday.setDate(monday.getDate() + 4);
    const init: Record<string, AndarState> = {};
    subitens.forEach(s => setores.forEach(se => {
      const k = s.id + '-' + se.id;
      init[k] = {
        efEq: 2, efProd: 2, mestreId: null,
        dist: { 0:[],1:[],2:[],3:[],4:[] }, unassigned: [],
        calStart: monday, calEnd: friday,
        postponeReasons: [], postponeObs: '',
        confirmed: false,
      };
    }));
    setAndarStates(init);
    setCalViewMonth(monday.getMonth());
    setCalViewYear(monday.getFullYear());
  }, [subitens, setores, semana, ano]);

  // Load planta when curSetorId changes
  useEffect(() => {
    if (!curSetorId) return;
    const s = setores.find(x => x.id === curSetorId);
    setPlantaUrl(s?.planta_url || null);
  }, [curSetorId, setores]);

  // Auto-distribute on andar change or efetivo change
  useEffect(() => {
    if (!curSubId || !curSetorId) return;
    const k = curSubId + '-' + curSetorId;
    const st = andarStates[k];
    if (!st) return;
    autoDistribute(curSubId, curSetorId, st.efEq, st.efProd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curSubId, curSetorId, andarStates[curSubId+'-'+curSetorId]?.efEq, andarStates[curSubId+'-'+curSetorId]?.efProd]);

  // ─────────── HELPERS ───────────
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }
  function curKey() { return curSubId && curSetorId ? curSubId+'-'+curSetorId : ''; }
  function curState(): AndarState | null { return andarStates[curKey()] || null; }
  function updateCur(patch: Partial<AndarState>) {
    const k = curKey(); if (!k) return;
    setAndarStates(s => ({ ...s, [k]: { ...s[k], ...patch } }));
  }

  function autoDistribute(subId: string, setorId: string, efEq: number, efProd: number) {
    const ambs = ambientes[setorId] || [];
    const pendIds = pendencias
      .filter(p => p.subitem_id === subId && p.setor_id === setorId)
      .map(p => p.ambiente_id);
    const perDay = efEq * efProd;
    const ordered: string[] = [
      ...pendIds,
      ...ambs.map(a => a.id).filter(id => !pendIds.includes(id)),
    ];
    const dist: Record<number,string[]> = { 0:[],1:[],2:[],3:[],4:[] };
    const unassigned: string[] = [];
    ordered.forEach((aid, i) => {
      const di = Math.floor(i / perDay);
      if (di < 5) dist[di].push(aid);
      else unassigned.push(aid);
    });
    const k = subId + '-' + setorId;
    setAndarStates(s => ({ ...s, [k]: { ...s[k], dist, unassigned } }));
  }

  function chEf(field: 'eq'|'prod', d: number) {
    const st = curState(); if (!st) return;
    if (field === 'eq') updateCur({ efEq: Math.max(1, st.efEq + d) });
    else updateCur({ efProd: Math.max(1, st.efProd + d) });
  }

  function calcCapacity() {
    const st = curState(); if (!st) return null;
    const ambs = ambientes[curSetorId!] || [];
    const pendIds = pendencias.filter(p => p.subitem_id === curSubId && p.setor_id === curSetorId).map(p => p.ambiente_id);
    const totalQ = ambs.length + pendIds.filter(p => !ambs.find(a => a.id === p)).length;
    const perDay = st.efEq * st.efProd;
    const daysN = Math.ceil(totalQ / perDay);
    const range = workingDays(st.calStart, st.calEnd);
    const fits = daysN <= range;
    const cls = fits ? (daysN <= 4 ? 'ok' : 'warn') : 'bad';
    return { totalQ, perDay, daysN, range, fits, cls, pendIds, ambs };
  }

  // ─────────── DRAG & DROP ───────────
  function onDragStart(ambId: string) { setDraggingAmb(ambId); }
  function onDragEnd() { setDraggingAmb(null); setDragOverDay(null); }
  function onDragOverDay(e: React.DragEvent, day: number) { e.preventDefault(); setDragOverDay(day); }
  function onDropDay(e: React.DragEvent, day: number) {
    e.preventDefault();
    if (!draggingAmb) return;
    const st = curState(); if (!st) return;
    const newDist: Record<number,string[]> = { ...st.dist };
    for (let d=0; d<5; d++) newDist[d] = newDist[d].filter(id => id !== draggingAmb);
    const newUn = st.unassigned.filter(id => id !== draggingAmb);
    newDist[day] = [...newDist[day], draggingAmb];
    updateCur({ dist: newDist, unassigned: newUn });
    setDraggingAmb(null); setDragOverDay(null);
  }
  function onDropUnassigned(e: React.DragEvent) {
    e.preventDefault();
    if (!draggingAmb) return;
    const st = curState(); if (!st) return;
    const newDist: Record<number,string[]> = { ...st.dist };
    for (let d=0; d<5; d++) newDist[d] = newDist[d].filter(id => id !== draggingAmb);
    const newUn = st.unassigned.includes(draggingAmb) ? st.unassigned : [...st.unassigned, draggingAmb];
    updateCur({ dist: newDist, unassigned: newUn });
    setDraggingAmb(null); setDragOverDay(null);
  }
  function findDayOfAmb(ambId: string): number | -1 {
    const st = curState(); if (!st) return -1;
    for (let d=0; d<5; d++) if (st.dist[d].includes(ambId)) return d as number;
    return -1;
  }

  // ─────────── PLANTA UPLOAD ───────────
  async function onImportPlanta(file: File) {
    if (!curSetorId) return;
    setPlantaLoading(true);
    // Preview local imediato
    const localUrl = URL.createObjectURL(file);
    setPlantaUrl(localUrl);
    // Tenta upload
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `obras/${obraId}/setores/${curSetorId}.${ext}`;
      const { error: upErr } = await supabase.storage.from('plantas').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('plantas').getPublicUrl(path);
      const url = pub.publicUrl;
      setPlantaUrl(url);
      // salva no banco
      try {
        await supabase.from('setores').update({ planta_url: url }).eq('id', curSetorId);
      } catch {}
      setSetores(s => s.map(x => x.id === curSetorId ? { ...x, planta_url: url } : x));
      showToast('✓ Planta importada e salva');
    } catch (e: any) {
      console.error(e);
      showToast('Preview local — verifique bucket "plantas" no Supabase Storage');
    } finally {
      setPlantaLoading(false);
    }
  }

  // ─────────── CALENDAR ───────────
  function calPrev() {
    let m = calViewMonth - 1, y = calViewYear;
    if (m < 0) { m = 11; y--; }
    setCalViewMonth(m); setCalViewYear(y);
  }
  function calNext() {
    let m = calViewMonth + 1, y = calViewYear;
    if (m > 11) { m = 0; y++; }
    setCalViewMonth(m); setCalViewYear(y);
  }
  function selDate(y: number, m: number, d: number) {
    const st = curState(); if (!st) return;
    const newDate = new Date(y, m, d);
    if (calPickMode === 'start') {
      const end = st.calEnd;
      updateCur({ calStart: newDate, calEnd: newDate > end ? newDate : end });
      setCalPickMode('end');
    } else {
      const start = st.calStart;
      if (newDate < start) updateCur({ calStart: newDate, calEnd: start });
      else updateCur({ calEnd: newDate });
      setCalPickMode('start');
      setTimeout(() => setCalOpen(false), 350);
    }
  }
  function openCalFor(mode: 'start'|'end') {
    const st = curState(); if (!st) return;
    setCalPickMode(mode);
    const ref = mode === 'start' ? st.calStart : st.calEnd;
    setCalViewMonth(ref.getMonth());
    setCalViewYear(ref.getFullYear());
    setCalOpen(true);
  }

  // ─────────── SAVE ───────────
  async function saveRascunho() {
    if (!curSubId || !curSetorId) return;
    const st = curState(); if (!st) return;
    try {
      const payload = {
        obra_id: obraId,
        disciplina_id: discId,
        subitem_id: curSubId,
        setor_id: curSetorId,
        semana, ano,
        mestre_id: st.mestreId,
        data_inicio: fmtDateLong(st.calStart).split('/').reverse().join('-'),
        data_fim: fmtDateLong(st.calEnd).split('/').reverse().join('-'),
        efetivo_equipes: st.efEq,
        efetivo_prod: st.efProd,
        ambientes_distribuicao: st.dist,
        ambientes_nao_alocados: st.unassigned,
        postpone_causas: st.postponeReasons,
        postpone_obs: st.postponeObs,
        status: 'rascunho',
        confirmado: false,
      };
      await supabase.from('planos_semanais').upsert(payload, {
        onConflict: 'obra_id,disciplina_id,subitem_id,setor_id,semana,ano'
      });
      showToast('✓ Rascunho salvo');
    } catch (e:any) {
      console.error(e);
      showToast('Erro ao salvar: ' + (e.message || e));
    }
  }

  async function confirmarAndar() {
    if (!curSubId || !curSetorId) return;
    const st = curState(); if (!st) return;
    if (!st.mestreId) { showToast('Selecione um mestre antes de confirmar'); return; }
    try {
      const payload = {
        obra_id: obraId,
        disciplina_id: discId,
        subitem_id: curSubId,
        setor_id: curSetorId,
        semana, ano,
        mestre_id: st.mestreId,
        data_inicio: fmtDateLong(st.calStart).split('/').reverse().join('-'),
        data_fim: fmtDateLong(st.calEnd).split('/').reverse().join('-'),
        efetivo_equipes: st.efEq,
        efetivo_prod: st.efProd,
        ambientes_distribuicao: st.dist,
        ambientes_nao_alocados: st.unassigned,
        postpone_causas: st.postponeReasons,
        postpone_obs: st.postponeObs,
        status: 'confirmado',
        confirmado: true,
      };
      await supabase.from('planos_semanais').upsert(payload, {
        onConflict: 'obra_id,disciplina_id,subitem_id,setor_id,semana,ano'
      });
      updateCur({ confirmed: true });
      showToast('✓ Andar confirmado');
    } catch (e:any) {
      console.error(e);
      showToast('Erro ao confirmar: ' + (e.message || e));
    }
  }

  function getAmbName(id: string) {
    for (const setorId in ambientes) {
      const a = ambientes[setorId].find(x => x.id === id);
      if (a) return a.nome;
    }
    return id.slice(0,4);
  }

  // ─────────── RENDER ───────────
  if (authLoading || loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:FONT, color:C.b500, fontSize:13 }}>
        Carregando...
      </div>
    );
  }

  const st = curState();
  const cap = calcCapacity();
  const curSub = subitens.find(s => s.id === curSubId);
  const curSetor = setores.find(s => s.id === curSetorId);
  const pendOfCur = pendencias.filter(p => p.subitem_id === curSubId && p.setor_id === curSetorId);
  const pendIds = pendOfCur.map(p => p.ambiente_id);

  const startChanged = st && (() => {
    const monday = weekToMonday(semana, ano);
    return st.calStart.getTime() !== monday.getTime();
  })();
  const endChanged = st && (() => {
    const monday = weekToMonday(semana, ano);
    const friday = new Date(monday); friday.setDate(monday.getDate()+4);
    return st.calEnd.getTime() !== friday.getTime();
  })();
  const isPostponed = startChanged || endChanged;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        *,*::before,*::after { box-sizing: border-box; margin:0; padding:0; }
        body { background:${C.bg}; font-family:${FONT}; -webkit-font-smoothing:antialiased; }
        .aw-btn:hover { filter: brightness(0.97); }
        .aw-sub-hdr:hover { background:${C.b100} !important; }
        .aw-andar-row:hover { background:${C.b100} !important; }
        .aw-mestre:hover { border-color:${C.b700} !important; background:${C.white} !important; }
        .aw-tb-btn:hover { border-color:${C.b900} !important; color:${C.b900} !important; }
        .aw-cal-day:hover:not(.past):not(.other):not(.sel) { background:${C.b150} !important; }
        .aw-cal-nav:hover { background:${C.b200} !important; }
        .aw-cap-prev { background:${C.b100}; color:${C.b500}; }
        .aw-causa:hover { background:${C.ap} !important; }
        .aw-chip { cursor:grab; user-select:none; }
        .aw-chip:active { cursor:grabbing; opacity:.6; }
        input[type=date], input[type=text], textarea { font-family:${FONT}; }
        textarea:focus { border-color:${C.am} !important; outline:none; }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        .aw-toast { animation: fadeIn .3s; }
      `}} />

      <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:C.bg, fontFamily:FONT, color:C.b900 }}>

        {/* ─────────── SIDEBAR ─────────── */}
        <div style={{ width:220, flexShrink:0, background:C.white, borderRight:`1px solid ${C.b200}`, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'18px 16px 14px', borderBottom:`1px solid ${C.b150}` }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.b900, letterSpacing:'-0.3px' }}>
              AW <span style={{ color:C.b300, fontWeight:300, margin:'0 2px' }}>|</span> OBRAS
            </div>
            <div style={{ fontSize:9, fontWeight:600, color:C.b400, textTransform:'uppercase', letterSpacing:'1.2px', marginTop:2 }}>
              Reunião Semanal
            </div>
          </div>

          {/* Obra ativa */}
          <div style={{ margin:10, padding:'10px 12px', background:C.b100, borderRadius:8, border:`1px solid ${C.b150}` }}>
            <div style={{ fontSize:9, fontWeight:600, color:C.b400, textTransform:'uppercase', letterSpacing:'0.8px' }}>Obra</div>
            <div style={{ fontSize:12, fontWeight:700, color:C.b900, marginTop:2 }}>{obra?.nome || '—'}</div>
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:4 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:C.am }} />
              <div style={{ fontSize:10, color:C.b400 }}>Semana {semana} · {ano}</div>
            </div>
          </div>

          {/* Voltar */}
          <div style={{ padding:'0 10px 8px' }}>
            <button
              onClick={() => { window.location.href = `/reuniao?obra=${obraId}`; }}
              style={{ width:'100%', padding:'8px 10px', background:'transparent', border:'none', textAlign:'left', fontSize:11, fontWeight:600, color:C.b500, cursor:'pointer', fontFamily:FONT, borderRadius:8 }}
              className="aw-sub-hdr"
            >
              ← Voltar ao Hub
            </button>
          </div>

          {/* Subitens com andares */}
          <div style={{ flex:1, overflowY:'auto', padding:'4px 0' }}>
            <div style={{ fontSize:9, fontWeight:700, color:C.b400, textTransform:'uppercase', letterSpacing:'1px', padding:'10px 14px 5px' }}>
              {disciplina?.nome || 'Disciplina'}
            </div>
            {subitens.map(s => {
              const isOpen = curSubId === s.id;
              const allConf = setores.every(se => andarStates[s.id+'-'+se.id]?.confirmed);
              const anyLate = pendencias.some(p => p.subitem_id === s.id);
              return (
                <div key={s.id} style={{ margin:'1px 8px' }}>
                  <div
                    className="aw-sub-hdr"
                    onClick={() => {
                      setCurSubId(s.id);
                      if (setores[0]) setCurSetorId(setores[0].id);
                    }}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, background: isOpen ? C.b900 : 'transparent', cursor:'pointer' }}
                  >
                    <div style={{ fontSize:14, width:24, textAlign:'center', flexShrink:0 }}>{s.icone || '•'}</div>
                    <div style={{ fontSize:12, fontWeight:600, color: isOpen ? '#fff' : C.b700, flex:1, lineHeight:1.3 }}>{s.nome}</div>
                    {allConf && setores.length > 0 ? (
                      <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:999, background:C.gp, color:C.gd }}>✓</span>
                    ) : anyLate ? (
                      <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:999, background:C.rp, color:C.rd }}>!</span>
                    ) : null}
                  </div>

                  {isOpen && (
                    <div style={{ paddingLeft:22, marginTop:2, marginBottom:4 }}>
                      {setores.map(se => {
                        const k = s.id + '-' + se.id;
                        const stRow = andarStates[k];
                        const done = stRow?.confirmed;
                        const hasPend = pendencias.some(p => p.subitem_id === s.id && p.setor_id === se.id);
                        const isAct = curSetorId === se.id;
                        return (
                          <div
                            key={se.id}
                            className="aw-andar-row"
                            onClick={() => setCurSetorId(se.id)}
                            style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 10px', borderRadius:6, cursor:'pointer', fontSize:11, color: isAct ? C.bd : done ? C.gm : C.b500, background: isAct ? C.bp : 'transparent', fontWeight: isAct ? 600 : 400 }}
                          >
                            <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0, background: done ? C.gm : hasPend ? C.rm : C.b300 }} />
                            {se.nome}
                            {done ? ' ✓' : hasPend ? ' ⚠' : ''}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* User footer */}
          <div style={{ padding:'12px 14px', borderTop:`1px solid ${C.b150}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:'50%', background:C.b900, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>
                {userEmail.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:11, fontWeight:600, color:C.b900, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userEmail}</div>
                <div
                  style={{ fontSize:10, color:C.bm, cursor:'pointer' }}
                  onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login'; }}
                >Sair</div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────── MAIN ─────────── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>

          {/* Topbar */}
          <div style={{ background:C.white, borderBottom:`1px solid ${C.b200}`, padding:'0 24px', display:'flex', alignItems:'center', gap:16, height:52, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:C.bp, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                {disciplina?.icone || '⚡'}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:C.b900, letterSpacing:'-0.2px' }}>{disciplina?.nome || 'Disciplina'}</div>
                <div style={{ fontSize:11, color:C.b400, marginTop:1 }}>{fornecedorNome || '—'}</div>
              </div>
            </div>
            <div style={{ width:1, height:24, background:C.b200 }} />
            <div style={{ fontSize:13, fontWeight:600, color:C.b700 }}>{curSetor?.nome || '—'}</div>
            {st?.confirmed ? (
              <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:999, background:C.gp, color:C.gd }}>✓ Confirmado</span>
            ) : pendOfCur.length > 0 ? (
              <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:999, background:C.rp, color:C.rd }}>⚠ {pendOfCur.length} pendência{pendOfCur.length>1?'s':''}</span>
            ) : (
              <span style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:999, background:C.b150, color:C.b500 }}>Novo</span>
            )}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
              <button
                onClick={saveRascunho}
                className="aw-tb-btn"
                style={{ padding:'6px 14px', borderRadius:999, border:`1.5px solid ${C.b200}`, background:C.b100, fontFamily:FONT, fontSize:12, fontWeight:600, color:C.b500, cursor:'pointer' }}
              >Salvar rascunho</button>
              <button
                onClick={confirmarAndar}
                disabled={st?.confirmed}
                style={{ padding:'6px 14px', borderRadius:999, border:`1.5px solid ${st?.confirmed ? C.gd : C.b900}`, background: st?.confirmed ? C.gd : C.b900, fontFamily:FONT, fontSize:12, fontWeight:600, color:'#fff', cursor: st?.confirmed ? 'default' : 'pointer' }}
              >{st?.confirmed ? '✓ Confirmado' : '✓ Confirmar este andar'}</button>
            </div>
          </div>

          {/* Workspace 3 cols */}
          <div style={{ flex:1, display:'flex', overflow:'hidden', minHeight:0 }}>

            {/* COL LEFT */}
            <div style={{ width:280, flexShrink:0, display:'flex', flexDirection:'column', borderRight:`1px solid ${C.b200}`, background:C.white, overflowY:'auto' }}>

              {/* Efetivo */}
              <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.b150}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.b400, textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>
                  Efetivo acordado
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${C.b150}` }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:C.b900 }}>Equipes</div>
                    <div style={{ fontSize:10, color:C.b400, marginTop:1 }}>Fornecedor declara</div>
                  </div>
                  <Stepper value={st?.efEq || 2} onChange={d => chEf('eq', d)} />
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0' }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:500, color:C.b900 }}>Quartos/equipe/dia</div>
                    <div style={{ fontSize:10, color:C.b400, marginTop:1 }}>Produtividade declarada</div>
                  </div>
                  <Stepper value={st?.efProd || 2} onChange={d => chEf('prod', d)} />
                </div>

                {/* Capacidade IA */}
                {cap && (
                  <div style={{
                    marginTop:10, borderRadius:8, padding:'11px 12px',
                    background: cap.cls==='ok' ? C.gp : cap.cls==='warn' ? C.ap : C.rp,
                    border: `1.5px solid ${cap.cls==='ok'?'rgba(61,171,110,.3)':cap.cls==='warn'?'rgba(212,147,10,.3)':'rgba(217,95,95,.3)'}`,
                  }}>
                    <div style={{ fontSize:11, fontWeight:700, marginBottom:7, display:'flex', alignItems:'center', gap:4,
                      color: cap.cls==='ok'?C.gd:cap.cls==='warn'?C.ad:C.rd }}>
                      🧠 Capacidade
                    </div>
                    <CapRow lbl="Quartos no andar" val={cap.ambs.length} cls={cap.cls} />
                    {cap.pendIds.length > 0 && (
                      <CapRow lbl={`⚠ Pendências acumuladas`} val={`+${cap.pendIds.length}`} cls={cap.cls} highlight />
                    )}
                    <CapRow lbl="Total a executar" val={cap.totalQ} cls={cap.cls} bold />
                    <CapRow lbl={`${st?.efEq} eq × ${st?.efProd} qt/dia`} val={`${cap.perDay} qt/dia`} cls={cap.cls} />
                    <CapRow lbl="Dias necessários" val={`${cap.daysN} dia${cap.daysN>1?'s':''}`} cls={cap.cls} />
                    <CapRow lbl="Veredicto" val={cap.fits ? `✓ Termina em ${cap.daysN}d` : `✗ Ultrapassa prazo`} cls={cap.cls} bold />
                  </div>
                )}
              </div>

              {/* Mestre */}
              <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.b150}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.b400, textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>
                  Mestre responsável
                </div>
                {mestres.length === 0 && (
                  <div style={{ fontSize:11, color:C.b400, padding:'8px 0' }}>
                    Nenhum mestre cadastrado nesta obra.
                  </div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {mestres.map(m => {
                    const sel = st?.mestreId === m.id;
                    return (
                      <div
                        key={m.id}
                        className="aw-mestre"
                        onClick={() => updateCur({ mestreId: m.id })}
                        style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:8, border: `1.5px solid ${sel ? C.b900 : C.b200}`, background: sel ? C.b900 : C.surf, cursor:'pointer' }}
                      >
                        <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#fff', background: m.cor || C.b700, flexShrink:0 }}>
                          {(m.iniciais || m.nome?.slice(0,2) || '?').toUpperCase()}
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:12, fontWeight:600, color: sel ? '#fff' : C.b900 }}>{m.nome}</div>
                          <div style={{ fontSize:10, color: sel ? 'rgba(255,255,255,.5)' : C.b400, marginTop:1 }}>
                            {m.territorio || m.setores_nomes || 'Disponível'}
                          </div>
                        </div>
                        {sel && <div style={{ fontSize:12, color:'#fff', fontWeight:700 }}>✓</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COL CENTER */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden', background:C.bg }}>

              {/* Pending banner */}
              {pendOfCur.length > 0 && (
                <div style={{ padding:'8px 12px', background:C.ap, borderBottom:`1px solid rgba(212,147,10,.25)`, flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ fontSize:13 }}>⚠️</div>
                    <div style={{ flex:1, fontSize:11, color:C.ad }}>
                      <strong>{pendOfCur.length} pendência{pendOfCur.length>1?'s':''} da semana passada</strong> incluída{pendOfCur.length>1?'s':''} automaticamente no plano —
                      aparecem em âmbar na grade.
                    </div>
                  </div>
                </div>
              )}

              {/* Planta header */}
              <div style={{ padding:'8px 12px', background:C.white, borderBottom:`1px solid ${C.b200}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.b900 }}>
                  Planta — {curSetor?.nome || '—'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ fontSize:10, color:C.b400 }}>Cada cor = um dia da semana</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display:'none' }}
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) onImportPlanta(f);
                      e.target.value = '';
                    }}
                  />
                  <button
                    className="aw-tb-btn"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ padding:'5px 12px', borderRadius:999, border:`1.5px solid ${C.b200}`, background:C.b100, fontFamily:FONT, fontSize:11, fontWeight:600, color:C.b500, cursor:'pointer' }}
                  >
                    📎 {plantaUrl ? 'Trocar planta' : 'Importar planta'}
                  </button>
                </div>
              </div>

              {/* Planta */}
              <div style={{ position:'relative', width:'100%', paddingBottom:'34%', background:'#F0ECE6', overflow:'hidden', flexShrink:0 }}>
                {plantaUrl ? (
                  <img
                    src={plantaUrl}
                    alt="Planta"
                    style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', objectFit:'contain' }}
                  />
                ) : (
                  <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, color:C.b400 }}>
                    <div style={{ fontSize:28 }}>🗺️</div>
                    <div style={{ fontSize:12, fontWeight:600 }}>Nenhuma planta importada</div>
                    <div style={{ fontSize:10 }}>Clique em "Importar planta" para enviar a foto deste andar</div>
                  </div>
                )}
                {plantaLoading && (
                  <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.7)', color:'#fff', padding:'4px 10px', borderRadius:999, fontSize:11 }}>
                    Subindo...
                  </div>
                )}
              </div>

              {/* Grade */}
              <div style={{ flex:1, overflowY:'auto', background:C.white, borderTop:`1px solid ${C.b200}`, minHeight:0 }}>
                <div style={{ padding:'8px 12px', borderBottom:`1px solid ${C.b150}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.b100, position:'sticky', top:0, zIndex:10 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:C.b900 }}>
                    Grade semanal — arraste os quartos pelos dias
                  </div>
                  <div
                    onClick={() => st && autoDistribute(curSubId!, curSetorId!, st.efEq, st.efProd)}
                    style={{ fontSize:10, color:C.bm, fontWeight:600, cursor:'pointer', padding:'3px 8px', borderRadius:999, background:C.bp }}
                  >↻ Redistribuir automaticamente</div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', borderLeft:`1px solid ${C.b150}` }}>
                  {DL.map((dayLbl, dayIdx) => {
                    const monday = weekToMonday(semana, ano);
                    const dt = new Date(monday); dt.setDate(monday.getDate()+dayIdx);
                    const chipsInDay = st?.dist[dayIdx] || [];
                    return (
                      <div key={dayIdx} style={{ borderRight:`1px solid ${C.b150}`, display:'flex', flexDirection:'column' }}>
                        <div style={{ padding:'7px 10px', background:C.b100, borderBottom:`1px solid ${C.b150}`, textAlign:'center' }}>
                          <div style={{ fontSize:12, fontWeight:700, color:C.b900 }}>{dayLbl}</div>
                          <div style={{ fontSize:10, color:C.b400 }}>{dt.getDate()} {MS[dt.getMonth()]}</div>
                          <div style={{
                            fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:999, marginTop:3, display:'inline-block',
                            background: chipsInDay.length>0 ? C.gp : C.b150,
                            color: chipsInDay.length>0 ? C.gd : C.b400,
                          }}>{chipsInDay.length} amb</div>
                        </div>
                        <div
                          onDragOver={e => onDragOverDay(e, dayIdx)}
                          onDragLeave={() => setDragOverDay(null)}
                          onDrop={e => onDropDay(e, dayIdx)}
                          style={{
                            padding:'7px 8px',
                            display:'flex', flexWrap:'wrap', gap:4,
                            alignContent:'flex-start',
                            minHeight:120,
                            background: dragOverDay === dayIdx ? C.bp : 'transparent',
                            transition: 'background .15s',
                          }}
                        >
                          {chipsInDay.map(ambId => {
                            const isPend = pendIds.includes(ambId);
                            return (
                              <div
                                key={ambId}
                                draggable
                                onDragStart={() => onDragStart(ambId)}
                                onDragEnd={onDragEnd}
                                className="aw-chip"
                                style={{
                                  display:'flex', alignItems:'center', gap:3, padding:'4px 8px',
                                  borderRadius:6, fontSize:11, fontWeight:600,
                                  background: isPend ? 'rgba(212,147,10,.25)' : DAY_BG[dayIdx],
                                  border: `1.5px solid ${isPend ? 'rgba(212,147,10,.7)' : DAY_BORDER[dayIdx]}`,
                                  color: isPend ? C.ad : DAY_TEXT[dayIdx],
                                }}
                              >
                                {isPend && <span style={{ fontSize:9 }}>⚠</span>}
                                {getAmbName(ambId)}
                              </div>
                            );
                          })}
                          {chipsInDay.length === 0 && dragOverDay !== dayIdx && (
                            <div style={{ width:'100%', textAlign:'center', fontSize:10, color:C.b300, padding:'8px 0' }}>vazio</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Unassigned strip */}
                {(st?.unassigned.length || 0) > 0 && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOverDay(-1); }}
                    onDragLeave={() => setDragOverDay(null)}
                    onDrop={onDropUnassigned}
                    style={{ padding:'8px 12px', background:C.rp, borderTop:`1px solid rgba(217,95,95,.15)`, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}
                  >
                    <div style={{ fontSize:10, fontWeight:700, color:C.rd, whiteSpace:'nowrap' }}>⚠ Não alocados:</div>
                    {st!.unassigned.map(ambId => (
                      <div
                        key={ambId}
                        draggable
                        onDragStart={() => onDragStart(ambId)}
                        onDragEnd={onDragEnd}
                        className="aw-chip"
                        style={{
                          display:'flex', alignItems:'center', gap:3, padding:'4px 8px',
                          borderRadius:6, fontSize:11, fontWeight:600,
                          background:C.rp, border:`1.5px solid rgba(217,95,95,.4)`, color:C.rd,
                        }}
                      >{getAmbName(ambId)}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* COL RIGHT */}
            <div style={{ width:300, flexShrink:0, display:'flex', flexDirection:'column', borderLeft:`1px solid ${C.b200}`, background:C.white, overflowY:'auto' }}>

              {/* Cronograma */}
              <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.b150}` }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.b400, textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>
                  Cronograma
                </div>

                {/* SVG Timeline */}
                {st && (
                  <svg width="100%" height="70" viewBox="0 0 260 70" style={{ marginBottom:6 }}>
                    <line x1="30" y1="35" x2="230" y2="35" stroke={isPostponed ? 'rgba(212,147,10,.6)' : 'rgba(26,26,26,.25)'} strokeWidth="2.5" strokeDasharray={isPostponed ? '6,3' : undefined} />
                    {/* Start */}
                    <g style={{ cursor:'pointer' }} onClick={() => openCalFor('start')}>
                      <circle cx="30" cy="35" r="7" fill={isPostponed ? C.rm : C.b900} opacity={isPostponed ? 0.5 : 1} />
                      <circle cx="30" cy="35" r="4" fill="white" opacity={isPostponed ? 0.7 : 1} />
                    </g>
                    {/* End */}
                    <g style={{ cursor:'pointer' }} onClick={() => openCalFor('end')}>
                      <circle cx="230" cy="35" r="7" fill={C.b900} />
                      <circle cx="230" cy="35" r="4" fill="white" />
                    </g>
                    <text x="30" y="16" textAnchor="middle" fontSize="10" fontWeight="600" fill={C.b500}>{isPostponed ? '⚠ Início' : 'Início'}</text>
                    <text x="30" y="56" textAnchor="middle" fontSize="12" fontWeight="700" fill={startChanged ? C.am : C.b900}>{fmtDate(st.calStart)}</text>
                    <text x="230" y="16" textAnchor="middle" fontSize="10" fontWeight="600" fill={C.b500}>Término</text>
                    <text x="230" y="56" textAnchor="middle" fontSize="12" fontWeight="700" fill={endChanged ? C.am : C.b900}>{fmtDate(st.calEnd)}</text>
                    <text x="130" y="30" textAnchor="middle" fontSize="10" fill="rgba(0,0,0,.4)">{workingDays(st.calStart, st.calEnd)}d úteis</text>
                    <text x="130" y="46" textAnchor="middle" fontSize="9" fill={C.bm} style={{ cursor:'pointer' }} onClick={() => openCalFor('end')}>✏ alterar</text>
                  </svg>
                )}

                {/* Calendar */}
                {calOpen && st && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ display:'flex', justifyContent:'flex-end', padding:'4px 0' }}>
                      <button
                        onClick={() => setCalOpen(false)}
                        style={{ fontSize:11, fontWeight:600, color:C.b500, background:'none', border:`1px solid ${C.b200}`, cursor:'pointer', fontFamily:FONT, padding:'3px 8px', borderRadius:999 }}
                      >✕ Fechar</button>
                    </div>
                    <div style={{ display:'flex', gap:5, padding:'8px 10px', background:C.b100, borderRadius:'6px 6px 0 0', border:`1.5px solid ${C.b200}`, borderBottom:'none' }}>
                      <button
                        onClick={() => setCalPickMode('start')}
                        style={{ flex:1, padding:5, borderRadius:6, border:`1.5px solid ${calPickMode==='start'?C.b900:C.b200}`, background: calPickMode==='start'?C.b900:C.white, color: calPickMode==='start'?'#fff':C.b500, fontFamily:FONT, fontSize:11, fontWeight:600, cursor:'pointer' }}
                      >📅 Selecionar início</button>
                      <button
                        onClick={() => setCalPickMode('end')}
                        style={{ flex:1, padding:5, borderRadius:6, border:`1.5px solid ${calPickMode==='end'?C.b900:C.b200}`, background: calPickMode==='end'?C.b900:C.white, color: calPickMode==='end'?'#fff':C.b500, fontFamily:FONT, fontSize:11, fontWeight:600, cursor:'pointer' }}
                      >🏁 Selecionar término</button>
                    </div>

                    <div style={{ borderRadius:'0 0 12px 12px', border:`1px solid ${C.b200}`, borderTop:'none', overflow:'hidden' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:C.b100, borderBottom:`1px solid ${C.b150}` }}>
                        <button className="aw-cal-nav" onClick={calPrev} style={{ width:26, height:26, borderRadius:'50%', border:`1.5px solid ${C.b200}`, background:C.white, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.b700 }}>‹</button>
                        <div>
                          <span style={{ fontSize:13, fontWeight:700, color:C.b900 }}>{MONTHS[calViewMonth]}</span>
                          <span style={{ fontSize:12, color:C.b400, marginLeft:3 }}>{calViewYear}</span>
                        </div>
                        <button className="aw-cal-nav" onClick={calNext} style={{ width:26, height:26, borderRadius:'50%', border:`1.5px solid ${C.b200}`, background:C.white, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.b700 }}>›</button>
                      </div>

                      <CalGrid
                        year={calViewYear}
                        month={calViewMonth}
                        start={st.calStart}
                        end={st.calEnd}
                        onSelect={(y,m,d) => selDate(y,m,d)}
                      />
                    </div>
                  </div>
                )}

                {/* Postpone box */}
                {st && isPostponed && (
                  <div style={{ marginTop:8, background:C.ap, borderRadius:8, padding:'10px 12px', border:`1.5px solid rgba(212,147,10,.3)` }}>
                    <div style={{ fontSize:10, fontWeight:700, color:C.ad, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>
                      Causa da postergação
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:7 }}>
                      {['📦 Faltou material','👷 Equipe insuficiente','🔄 Outro serviço','🚧 Área bloqueada'].map(c => {
                        const sel = st.postponeReasons.includes(c);
                        return (
                          <div
                            key={c}
                            className="aw-causa"
                            onClick={() => {
                              const newR = sel ? st.postponeReasons.filter(x => x !== c) : [...st.postponeReasons, c];
                              updateCur({ postponeReasons: newR });
                            }}
                            style={{ padding:'4px 10px', borderRadius:999, border:`1.5px solid rgba(212,147,10,.3)`, background: sel ? C.ad : C.white, fontSize:11, fontWeight:500, color: sel ? '#fff' : C.ad, cursor:'pointer' }}
                          >{c}</div>
                        );
                      })}
                    </div>
                    <textarea
                      value={st.postponeObs}
                      onChange={e => updateCur({ postponeObs: e.target.value })}
                      placeholder="Observações..."
                      style={{ width:'100%', padding:'7px 10px', border:`1.5px solid rgba(212,147,10,.3)`, borderRadius:6, fontSize:11, color:C.b900, background:C.white, resize:'none', minHeight:46, outline:'none' }}
                    />
                  </div>
                )}
              </div>

              {/* Histórico */}
              <div style={{ padding:'14px 16px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:C.b400, textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>
                  Histórico de postergações
                </div>
                {pendOfCur.length === 0 ? (
                  <div style={{ fontSize:11, color:C.b400, padding:'8px 0' }}>Sem postergações registradas</div>
                ) : (
                  pendOfCur.map((p,i) => (
                    <div key={p.id || i} style={{ display:'flex', gap:8, padding:'8px 0', borderBottom:`1px solid ${C.b150}` }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:C.am, flexShrink:0, marginTop:3 }} />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:C.b900 }}>{getAmbName(p.ambiente_id)}</div>
                        <div style={{ fontSize:10, color:C.b500, marginTop:1 }}>{p.dias_atraso || '—'} dia{(p.dias_atraso||0)>1?'s':''} de atraso</div>
                        {p.causa && <div style={{ fontSize:10, color:C.b400, marginTop:2 }}>Causa: {p.causa}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="aw-toast" style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', background:C.b900, color:'#fff', padding:'9px 18px', borderRadius:999, fontSize:12, fontWeight:600, zIndex:9000, whiteSpace:'nowrap' }}>
          {toast}
        </div>
      )}
    </>
  );
}

// ─────────── SUBCOMPONENTS ───────────
function Stepper({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', border:`1.5px solid ${C.b200}`, borderRadius:8, overflow:'hidden', background:C.white }}>
      <button
        onClick={() => onChange(-1)}
        style={{ width:28, height:28, border:'none', background:'transparent', fontSize:14, color:C.b500, cursor:'pointer', fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center' }}
      >−</button>
      <div style={{ minWidth:34, textAlign:'center', fontSize:13, fontWeight:700, color:C.b900, borderLeft:`1.5px solid ${C.b200}`, borderRight:`1.5px solid ${C.b200}`, padding:'3px 6px' }}>{value}</div>
      <button
        onClick={() => onChange(1)}
        style={{ width:28, height:28, border:'none', background:'transparent', fontSize:14, color:C.b500, cursor:'pointer', fontFamily:FONT, display:'flex', alignItems:'center', justifyContent:'center' }}
      >+</button>
    </div>
  );
}

function CapRow({ lbl, val, cls, highlight, bold }: { lbl: any; val: any; cls: string; highlight?: boolean; bold?: boolean }) {
  const color = cls === 'ok' ? C.gd : cls === 'warn' ? C.ad : C.rd;
  return (
    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4, ...(bold ? { fontWeight:600, paddingTop:5, borderTop:`1px solid rgba(0,0,0,.07)` } : {}) }}>
      <div style={{ color: highlight ? C.rd : C.b500 }}>{lbl}</div>
      <div style={{ fontWeight: bold ? 700 : 600, color: highlight ? C.rd : color }}>{val}</div>
    </div>
  );
}

function CalGrid({ year, month, start, end, onSelect }: {
  year: number; month: number; start: Date; end: Date;
  onSelect: (y: number, m: number, d: number) => void;
}) {
  const fd = new Date(year, month, 1).getDay();
  const dim = new Date(year, month+1, 0).getDate();
  const dip = new Date(year, month, 0).getDate();
  const today = new Date(); today.setHours(0,0,0,0);
  const sDate = new Date(start); sDate.setHours(0,0,0,0);
  const eDate = new Date(end); eDate.setHours(0,0,0,0);
  const off = fd === 0 ? 6 : fd-1;
  const cells: any[] = [];
  for (let i = off-1; i >= 0; i--) cells.push({ d: dip-i, other: true });
  for (let d = 1; d <= dim; d++) cells.push({ d, y: year, m: month });
  const tot = Math.ceil((off+dim)/7)*7;
  for (let d = 1; d <= tot-(off+dim); d++) cells.push({ d, other: true, suffix: true });

  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'6px 10px 2px' }}>
        {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map((d, i) => (
          <div key={i} style={{ textAlign:'center', fontSize:9, fontWeight:600, color: (i === 0 || i === 6) ? C.rm : C.b400 }}>{d}</div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', padding:'2px 10px 10px', gap:1 }}>
        {cells.map((cell, i) => {
          if (cell.other) return <div key={i} style={{ aspectRatio:1, display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'50%', fontSize:12, color:C.b300 }}>{cell.d}</div>;
          const dt = new Date(cell.y, cell.m, cell.d); dt.setHours(0,0,0,0);
          const isPast = dt < today;
          const isWknd = dt.getDay() === 0 || dt.getDay() === 6;
          const isToday = dt.getTime() === today.getTime();
          const isStart = sDate.getTime() === dt.getTime();
          const isEnd = eDate.getTime() === dt.getTime();
          const inRange = dt > sDate && dt < eDate;
          let bg = 'transparent';
          let color = C.b900;
          if (isPast) { color = C.b300; }
          else if (isWknd && !isStart && !isEnd && !inRange) { color = C.rm; }
          if (isStart || isEnd) { bg = C.b900; color = '#fff'; }
          else if (inRange) { bg = C.b200; color = C.b900; }
          if (isToday && !isStart && !isEnd) { color = C.bm; }
          return (
            <div
              key={i}
              className="aw-cal-day"
              onClick={() => !isPast && onSelect(cell.y, cell.m, cell.d)}
              style={{
                aspectRatio:1, display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'50%', fontSize:12, fontWeight: (isStart||isEnd||isToday) ? 700 : 400,
                cursor: isPast ? 'default' : 'pointer',
                background: bg, color,
              }}
            >{cell.d}</div>
          );
        })}
      </div>
    </>
  );
}
