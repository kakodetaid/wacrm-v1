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
  ShieldCheck,
  FileText,
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  accounts, 
  currentUser, 
  onLogout 
}) {
  const getStatusDot = (status) => {
    if (status === 'connected') return 'pulse-dot online';
    if (status === 'qr_ready' || status === 'connecting') return 'pulse-dot warning';
    return 'pulse-dot offline';
  };

  const getStatusText = (status) => {
    if (status === 'connected') return 'Online';
    if (status === 'qr_ready') return 'Scan QR';
    if (status === 'connecting') return 'Menghubungkan';
    return 'Offline';
  };

  const navItems = [
    { id: 'inbox', label: 'Shared Inbox', icon: MessageSquare, roles: ['admin', 'sales'] },
    { id: 'pipeline', label: 'Pipeline Deals (Kanban)', icon: Kanban, roles: ['admin', 'sales'] },
    { id: 'contacts', label: 'Data Kontak & Leads', icon: Users, roles: ['admin', 'sales'] },
    { id: 'wa_connections', label: 'Koneksi 3 WhatsApp', icon: Smartphone, roles: ['admin', 'sales'], highlight: accounts.some(a => a.status === 'qr_ready') },
    { id: 'broadcast', label: 'Broadcast Anti-Ban', icon: Send, roles: ['admin'] },
    { id: 'quick_replies', label: 'Quick Replies', icon: Zap, roles: ['admin', 'sales'] },
    { id: 'chat_audit', label: 'Laporan & Audit Chat', icon: FileText, roles: ['admin'], adminBadge: true },
    { id: 'analytics', label: 'Statistik & Analitik', icon: BarChart3, roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter(item => 
    item.roles.includes(currentUser?.role || 'admin')
  );

  return (
    <aside style={{
      width: '260px',
      background: '#FFFFFF',
      borderRight: '1px solid var(--border-color)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #10B981, #059669)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(16, 185, 129, 0.25)',
          flexShrink: 0
        }}>
          <MessageSquare size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#0F172A' }}>
              WACRM<span style={{ color: '#10B981' }}>Pro</span>
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              background: '#ECFDF5',
              color: '#059669',
              border: '1px solid #A7F3D0',
              padding: '1px 5px',
              borderRadius: '4px'
            }}>
              3 WA
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Enterprise Multi-Device CRM
          </div>
        </div>
      </div>

      {/* 3 WhatsApp Quick Status Bar */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: '#F8FAFC'
      }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          Status 3 Saluran WhatsApp:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {accounts.map((acc, index) => (
            <div
              key={acc.id}
              onClick={() => setActiveTab('wa_connections')}
              title={`Klik untuk buka pengaturan ${acc.name}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 10px',
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className={getStatusDot(acc.status)} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  WA {index + 1} {acc.phone ? `(${acc.phone.slice(-4)})` : ''}
                  {currentUser?.role === 'sales' && (acc.assignedUsername === currentUser?.username || acc.assignedAgent === currentUser?.name) && (
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      background: '#ECFDF5',
                      color: '#059669',
                      border: '1px solid #A7F3D0',
                      padding: '1px 4px',
                      borderRadius: '4px'
                    }}>
                      Anda
                    </span>
                  )}
                </span>
              </div>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                color: acc.status === 'connected' ? '#059669' : (acc.status === 'qr_ready' ? '#D97706' : 'var(--text-muted)')
              }}>
                {getStatusText(acc.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 8px' }}>
          Menu Navigasi
        </div>

        {visibleNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? '#ECFDF5' : 'transparent',
                color: isActive ? '#059669' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={18} color={isActive ? '#059669' : 'currentColor'} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.highlight && (
                <span style={{
                  background: '#FEF3C7',
                  color: '#B45309',
                  border: '1px solid #FCD34D',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  QR Siap
                </span>
              )}
              {item.adminBadge && (
                <span style={{
                  background: '#EFF6FF',
                  color: '#2563EB',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}>
                  Admin
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout Bottom Box */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid var(--border-color)',
        background: '#F8FAFC'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: currentUser?.role === 'sales' ? '10px' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: currentUser?.role === 'admin' 
                ? 'linear-gradient(135deg, #10B981, #059669)' 
                : 'linear-gradient(135deg, #3B82F6, #2563EB)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}>
              {(currentUser?.name || 'U').slice(0, 1)}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A', lineHeight: 1.2 }}>
                {currentUser?.name || 'Pengguna'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: currentUser?.role === 'admin' ? '#ECFDF5' : '#EFF6FF',
                  color: currentUser?.role === 'admin' ? '#059669' : '#2563EB',
                  border: `1px solid ${currentUser?.role === 'admin' ? '#A7F3D0' : '#BFDBFE'}`
                }}>
                  {currentUser?.role || 'User'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Keluar / Logout"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              color: '#E11D48',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Assigned WhatsApp Device for Sales */}
        {currentUser?.role === 'sales' && (
          <div style={{
            marginTop: '8px',
            padding: '7px 10px',
            background: '#FFFFFF',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'var(--text-secondary)'
          }}>
            <span style={{ fontWeight: 600 }}>📱 Saluran Anda:</span>
            {(() => {
              const myAcc = accounts.find(a => a.assignedUsername === currentUser?.username || a.assignedAgent === currentUser?.name);
              if (myAcc) {
                return (
                  <span style={{
                    fontWeight: 700,
                    color: myAcc.status === 'connected' ? '#059669' : '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {myAcc.name.split(' - ')[0]} ({myAcc.status === 'connected' ? 'Online' : 'Offline'})
                  </span>
                );
              }
              return <span style={{ color: 'var(--text-muted)' }}>Belum ditugaskan</span>;
            })()}
          </div>
        )}
      </div>
    </aside>
  );
}
