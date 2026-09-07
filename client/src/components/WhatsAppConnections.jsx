import React, { useState } from 'react';
import { 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  LogOut, 
  ShieldCheck, 
  HelpCircle,
  Wifi,
  Sparkles
} from 'lucide-react';

export default function WhatsAppConnections({ 
  accounts, 
  agents = [], 
  currentUser, 
  onConnect, 
  onDisconnect, 
  refreshing, 
  onRefresh 
}) {
  const [updatingAssign, setUpdatingAssign] = useState(null);

  const handleAssignAgent = async (accountId, agentName) => {
    setUpdatingAssign(accountId);
    try {
      const res = await fetch(`/api/accounts/${accountId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedAgent: agentName })
      });
      const json = await res.json();
      if (json.success && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to assign account:', err);
    } finally {
      setUpdatingAssign(null);
    }
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ECFDF5',
            color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <span className="pulse-dot online" /> Terhubung
          </span>
        );
      case 'qr_ready':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FEF3C7',
            color: '#B45309',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <span className="pulse-dot warning" /> Siap Scan QR
          </span>
        );
      case 'connecting':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#EFF6FF',
            color: '#2563EB',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <RefreshCw size={12} className="animate-spin" /> Menghubungkan...
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#F1F5F9',
            color: '#64748B',
            border: '1px solid #CBD5E1',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <span className="pulse-dot offline" /> Terputus
          </span>
        );
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', width: '100%', background: '#FFFFFF', boxSizing: 'border-box' }}>
      {/* Header Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: '6px' }}>
            Koneksi Multi-Device 3 WhatsApp Fisik
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '700px' }}>
            Hubungkan hingga 3 nomor WhatsApp Bisnis dari HP fisik Anda secara mandiri. Cukup scan QR code satu kali, semua percakapan akan tersinkronisasi langsung ke CRM.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '10px 18px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s ease'
          }}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh Status
        </button>
      </div>

      {/* 3 WhatsApp Slots Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: '24px',
        marginBottom: '36px'
      }}>
        {accounts.map((acc, idx) => {
          const isConnected = acc.status === 'connected';
          const isQRReady = acc.status === 'qr_ready';
          const isConnecting = acc.status === 'connecting';

          return (
            <div
              key={acc.id}
              style={{
                background: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'}`,
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isConnected ? '0 4px 20px rgba(16, 185, 129, 0.08)' : 'var(--shadow-sm)',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Top Accent bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: acc.color || '#10B981'
              }} />

              <div>
                {/* Slot Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${acc.color}15`,
                    border: `1px solid ${acc.color}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: acc.color,
                    fontWeight: 800,
                    fontSize: '0.9rem'
                  }}>
                    #{idx + 1}
                  </div>
                  {getStatusBadge(acc.status)}
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>
                  {acc.name}
                </h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Fokus: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{acc.role}</span>
                </div>

                {/* Petugas / Sales Penanggung Jawab Perangkat */}
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Sales / Petugas Penanggung Jawab:
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <ShieldCheck size={14} color="#10B981" />
                      {acc.assignedAgent || 'Belum Ditugaskan'}
                    </div>
                  </div>

                  {currentUser?.role === 'admin' ? (
                    <select
                      value={acc.assignedAgent || ''}
                      onChange={(e) => handleAssignAgent(acc.id, e.target.value)}
                      disabled={updatingAssign === acc.id}
                      title="Ubah sales yang memegang nomor WA ini"
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#2563EB',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {agents.map(ag => (
                        <option key={ag.id} value={ag.name}>{ag.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{
                      fontSize: '0.72rem',
                      background: acc.assignedAgent === currentUser?.name ? '#ECFDF5' : '#F1F5F9',
                      color: acc.assignedAgent === currentUser?.name ? '#059669' : '#64748B',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: `1px solid ${acc.assignedAgent === currentUser?.name ? '#A7F3D0' : '#E2E8F0'}`
                    }}>
                      {acc.assignedAgent === currentUser?.name ? 'Saluran Anda' : 'Tim Lain'}
                    </span>
                  )}
                </div>

                {/* Device / Phone Information Box */}
                <div style={{
                  background: '#F8FAFC',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nomor WhatsApp:</span>
                    <span style={{ fontWeight: 700, color: isConnected ? '#059669' : '#0F172A' }}>
                      {acc.phone ? `+${acc.phone}` : (isConnected ? 'Terhubung di HP' : 'Belum ditautkan')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nama Profil WA:</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {acc.user?.name || acc.user?.notify || (isConnected ? 'WhatsApp Bisnis' : '-')}
                    </span>
                  </div>
                </div>

                {/* Inline QR Preview if QR Ready */}
                {isQRReady && acc.qr && (
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #E2E8F0',
                    padding: '16px',
                    textAlign: 'center',
                    marginBottom: '20px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
                  }}>
                    <img
                      src={acc.qr}
                      alt={`QR Code ${acc.name}`}
                      style={{ width: '180px', height: '180px', margin: '0 auto', display: 'block' }}
                    />
                    <div style={{ color: '#0F172A', fontSize: '0.8rem', fontWeight: 700, marginTop: '8px' }}>
                      Scan QR dari WhatsApp HP Anda Sekarang
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                {isConnected ? (
                  <button
                    onClick={() => onDisconnect(acc.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: '#FFF1F2',
                      border: '1px solid #FECDD3',
                      color: '#E11D48',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <LogOut size={16} /> Putuskan Sesi
                  </button>
                ) : (
                  <button
                    onClick={() => onConnect(acc.id)}
                    disabled={isConnecting}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: isQRReady 
                        ? 'linear-gradient(135deg, #F59E0B, #D97706)' 
                        : 'linear-gradient(135deg, #10B981, #059669)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '12px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: isConnecting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 3px 12px rgba(16, 185, 129, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Menyiapkan Sesi...
                      </>
                    ) : isQRReady ? (
                      <>
                        <QrCode size={16} />
                        Perbarui QR Code
                      </>
                    ) : (
                      <>
                        <QrCode size={16} />
                        Hubungkan / Scan QR
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guide / Panduan Scan HP Fisik */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px',
        display: 'flex',
        gap: '24px',
        alignItems: 'center',
        flexWrap: 'wrap',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#2563EB',
          flexShrink: 0
        }}>
          <HelpCircle size={26} />
        </div>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '6px' }}>
            Cara Menghubungkan WhatsApp Bisnis dari HP Fisik:
          </h4>
          <ol style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            paddingLeft: '20px',
            lineHeight: 1.6
          }}>
            <li>Buka aplikasi <strong>WhatsApp</strong> atau <strong>WhatsApp Bisnis</strong> di HP fisik nomor yang ingin Anda hubungkan.</li>
            <li>Ketuk ikon <strong>Titik Tiga ⋮</strong> di pojok kanan atas (Android) atau menu <strong>Pengaturan ⚙️</strong> (iPhone).</li>
            <li>Pilih menu <strong>Perangkat Tertaut (Linked Devices)</strong> &rarr; lalu ketuk <strong>Tautkan Perangkat</strong>.</li>
            <li>Arahkan kamera HP Anda ke QR Code pada kartu nomor di atas. Sesi akan otomatis aktif dalam hitungan detik!</li>
          </ol>
        </div>
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: '12px',
          padding: '16px',
          maxWidth: '340px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
            <ShieldCheck size={18} /> Bebas Biaya Meta API
          </div>
          <p style={{ fontSize: '0.78rem', color: '#065F46', lineHeight: 1.5 }}>
            Sistem ini menggunakan protokol Multi-Device resmi WhatsApp. Anda tidak perlu membayar biaya template per percakapan (Meta conversation fee).
          </p>
        </div>
      </div>
    </div>
  );
}
