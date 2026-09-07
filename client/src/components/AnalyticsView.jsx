import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Sparkles, 
  Smartphone,
  CheckCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';

export default function AnalyticsView({ accounts }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(json => {
        if (json.success) setStats(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in" style={{ padding: '28px', width: '100%', background: '#FFFFFF', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: '4px' }}>
          Statistik & Analitik CRM
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Pantau performa interaksi 3 nomor WhatsApp, efektivitas pipeline penjualan, dan produktivitas tim.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {/* Card 1: Total Leads */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Kontak Prospek</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
            {stats?.totalContacts || 0} Kontak
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <ArrowUpRight size={14} /> Terintegrasi dari 3 Nomor WA
          </div>
        </div>

        {/* Card 2: Won Revenue */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #A7F3D0',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pendapatan Closing (Won)</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Sparkles size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginBottom: '4px' }}>
            Rp {(stats?.wonRevenue || 0).toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Dari {stats?.wonDealsCount || 0} deal penjualan berhasil
          </div>
        </div>

        {/* Card 3: Pipeline Potential */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Potensi Pipeline Berjalan</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#B45309', marginBottom: '4px' }}>
            Rp {(stats?.totalPipelineValue || 0).toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {stats?.activeLeads || 0} prospek sedang difollow-up
          </div>
        </div>

        {/* Card 4: WhatsApp Messages */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aktivitas Pesan WhatsApp</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <MessageSquare size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
            {stats?.totalMessages || 0} Percakapan
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tersinkronisasi otomatis
          </div>
        </div>
      </div>

      {/* Account Health & Breakdown */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
          Status Kesehatan 3 Saluran WhatsApp
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {accounts.map((acc, i) => (
            <div
              key={acc.id}
              style={{
                background: '#F8FAFC',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: `${acc.color}15`,
                border: `1px solid ${acc.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: acc.color,
                fontWeight: 800
              }}>
                WA {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{acc.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.role}</div>
              </div>
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: acc.status === 'connected' ? '#ECFDF5' : '#F1F5F9',
                  color: acc.status === 'connected' ? '#059669' : '#64748B',
                  border: `1px solid ${acc.status === 'connected' ? '#A7F3D0' : '#CBD5E1'}`
                }}>
                  {acc.status === 'connected' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
