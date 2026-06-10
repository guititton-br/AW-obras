'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErro('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
    console.log('Login result:', { data, error })
    if (error) {
      setErro('Erro: ' + error.message)
      setLoading(false)
    } else {
      console.log('Redirecting...')
      window.location.replace('/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A' }}>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '400px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '20px', fontWeight: 700 }}>AW | OBRAS</div>
          <div style={{ fontSize: '11px', color: '#A0A0A0', marginTop: '4px' }}>Gestão de Obras</div>
        </div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>E-MAIL</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: '6px' }}>SENHA</div>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} required
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #E8E8E8', borderRadius: '12px', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }} />
          </div>
          {erro && <div style={{ background: '#FDECEA', color: '#943030', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{erro}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
