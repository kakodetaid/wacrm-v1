import React from 'react';
import { 
  MessageSquare, 
  QrCode, 
  Kanban, 
  Users, 
  Send, 
  Zap, 
  BarChart3, 
  Smartphone,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, accounts, activeAgent, setActiveAgent, agents }) {
  const getStatusDot = (status) => {
    if (status === 'connected') return 'pulse-dot online';
    if (status === 'qr_ready' || status === 'connecting') return 'pulse-dot warning';
    return 'pulse-dot offline';
  };

  const getStatusText = (status) => {
    if (status === 'connected') return 'Online';
    if (status === 'qr_ready') return 'Scan QR';
    if (status === 'connecting') return 'Menghubungkan...';
    return 'Offline';
  };

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '66px'
      }}>
        {/* Logo & Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(16, 185, 129, 0.25)'
          }}>
            <MessageSquare size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#0F172A' }}>
                WACRM<span style={{ color: '#10B981' }}>Pro</span>
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                background: '#ECFDF5',
                color: '#059669',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                padding: '2px 7px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                3 WA Bisnis
              </span>
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              Enterprise Multi-Device CRM Gateway
            </div>
          </div>
        </div>

        {/* 3 WhatsApp Number Status Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {accounts.map((acc, index) => (
            <div 
              key={acc.id}
              onClick={() => setActiveTab('wa_connections')}
              title={`Klik untuk buka koneksi ${acc.name}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                background: '#F8FAFC',
                borderRadius: '20px',
                border: `1px solid ${acc.status === 'connected' ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)'}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div className={getStatusDot(acc.status)} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  WA {index + 1} {acc.phone ? `(${acc.phone.slice(-4)})` : ''}
                </span>
                <span style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 600,
                  color: acc.status === 'connected' ? '#059669' : (acc.status === 'qr_ready' ? '#D97706' : 'var(--text-muted)') 
                }}>
                  {getStatusText(acc.status)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Active Agent Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#ffffff'
            }}>
              {activeAgent.slice(0, 1)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Petugas Aktif</span>
              <select
                value={activeAgent}
                onChange={(e) => setActiveAgent(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {agents.map(ag => (
                  <option key={ag.id} value={ag.name} style={{ background: '#ffffff', color: '#0F172A' }}>
                    {ag.name} ({ag.role})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '4px',
        background: '#FFFFFF',
        borderTop: '1px solid var(--border-color)',
        overflowX: 'auto'
      }}>
        {[
          { id: 'inbox', label: 'Shared Inbox', icon: MessageSquare, badge: null },
          { id: 'wa_connections', label: 'Koneksi 3 WhatsApp', icon: Smartphone, highlight: accounts.some(a => a.status === 'qr_ready') },
          { id: 'pipeline', label: 'Pipeline Deals (Kanban)', icon: Kanban },
          { id: 'contacts', label: 'Data Kontak & Leads', icon: Users },
          { id: 'broadcast', label: 'Broadcast Anti-Ban', icon: Send },
          { id: 'quick_replies', label: 'Quick Replies', icon: Zap },
          { id: 'analytics', label: 'Statistik & Laporan', icon: BarChart3 },
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #10B981' : '2px solid transparent',
                color: isActive ? '#059669' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} color={isActive ? '#059669' : 'currentColor'} />
              <span>{item.label}</span>
              {item.highlight && (
                <span style={{
                  background: '#FEF3C7',
                  color: '#B45309',
                  border: '1px solid #FCD34D',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  QR Siap
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
