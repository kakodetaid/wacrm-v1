import React, { useState } from 'react';
import { MessageSquare, ShieldCheck, Lock, User, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e, customUser = null, customPass = null) => {
    if (e) e.preventDefault();
    const u = customUser || username;
    const p = customPass || password;

    if (!u) {
      setError('Masukkan username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p })
      });
      const json = await res.json();
      if (json.success) {
        onLoginSuccess(json.data);
      } else {
        setError(json.error || 'Login gagal, periksa kembali data Anda');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (userRole) => {
    if (userRole === 'admin') {
      setUsername('admin');
      setPassword('admin123');
      handleSubmit(null, 'admin', 'admin123');
    } else if (userRole === 'cs') {
      setUsername('cs');
      setPassword('cs123');
      handleSubmit(null, 'cs', 'cs123');
    } else if (userRole === 'sales') {
      setUsername('sales');
      setPassword('sales123');
      handleSubmit(null, 'sales', 'sales123');
    } else if (userRole === 'support') {
      setUsername('support');
      setPassword('support123');
      handleSubmit(null, 'support', 'support123');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F8FAFC',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        padding: '36px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
      }}>
        {/* Brand Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}>
            <MessageSquare size={28} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Masuk ke WACRM<span style={{ color: '#10B981' }}>Pro</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Sistem Manajemen Multi-Perangkat WhatsApp Terpadu
          </p>
        </div>

        {error && (
          <div style={{
            background: '#FFF1F2',
            border: '1px solid #FECDD3',
            color: '#E11D48',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.82rem',
            marginBottom: '18px',
            textAlign: 'center',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Username
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#F8FAFC',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '10px 14px'
            }}>
              <User size={16} color="var(--text-muted)" />
              <input
                type="text"
                required
                placeholder="admin / cs / sales / support"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#0F172A',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#F8FAFC',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '10px 14px'
            }}>
              <Lock size={16} color="var(--text-muted)" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#0F172A',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '10px',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.25)',
              marginTop: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Login Buttons */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', textAlign: 'center' }}>
            Akses Cepat 1-Klik Akun & Perangkat:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => quickLogin('admin')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '8px 10px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#059669',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.78rem' }}>
                <ShieldCheck size={14} /> Admin Super
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Semua Saluran & Audit
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('cs')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '8px 10px',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                color: '#16A34A',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.78rem' }}>
                <User size={14} /> Dewi CS
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Perangkat: WA 1
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('sales')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '8px 10px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#2563EB',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.78rem' }}>
                <User size={14} /> Rian Sales
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Perangkat: WA 2
              </div>
            </button>

            <button
              type="button"
              onClick={() => quickLogin('support')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                padding: '8px 10px',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                color: '#D97706',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '0.78rem' }}>
                <User size={14} /> Fajar Support
              </div>
              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Perangkat: WA 3
              </div>
            </button>
          </div>

          <div style={{
            marginTop: '14px',
            background: '#F8FAFC',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.45
          }}>
            <div>• <strong>Admin</strong>: Akses 3 perangkat WA sekaligus, pembagian tugas sales, & audit chat log.</div>
            <div>• <strong>Sales / CS</strong>: Terkunci pada nomor WhatsApp dan prospek yang ditugaskan.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
