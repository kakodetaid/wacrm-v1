import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Users, 
  MessageSquare, 
  Clock, 
  CheckCheck, 
  ShieldCheck, 
  Filter,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function AdminChatAudit({ agents = [], accounts = [], onHistoryCleared }) {
  const [reportData, setReportData] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const url = new URL('/api/admin/chat-reports', window.location.origin);
      if (selectedAgent !== 'all') url.searchParams.append('agent', selectedAgent);
      if (selectedAccount !== 'all') url.searchParams.append('accountId', selectedAccount);
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setReportData(json.data);
      }
    } catch (err) {
      console.error('Failed to load chat reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedAgent, selectedAccount]);

  const exportAuditCSV = () => {
    if (!reportData?.recentMessages) return;
    const headers = ['ID Pesan', 'Waktu', 'Saluran WA', 'Petugas Sales', 'Arah Pesan', 'Pelanggan', 'Nomor WA', 'Isi Pesan'];
    const rows = reportData.recentMessages.map(m => [
      m.id,
      `"${new Date(m.timestamp).toLocaleString('id-ID')}"`,
      `"${m.accountName || m.accountId}"`,
      `"${m.assignedAgent || m.senderName || '-'}"`,
      m.fromMe ? 'Keluar (CS/Sales)' : 'Masuk (Pelanggan)',
      `"${m.contactName || '-'}"`,
      `"+${m.contactPhone || '-'}"`,
      `"${(m.text || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_chat_report_${selectedAgent}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMessages = (reportData?.recentMessages || []).filter(m => {
    const q = search.toLowerCase();
    return (
      (m.text || '').toLowerCase().includes(q) ||
      (m.senderName || '').toLowerCase().includes(q) ||
      (m.assignedAgent || '').toLowerCase().includes(q) ||
      (m.contactName || '').toLowerCase().includes(q) ||
      (m.contactPhone || '').includes(q)
    );
  });

  return (
    <div className="animate-fade-in" style={{ padding: '28px', width: '100%', background: '#FFFFFF', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: '4px' }}>
              Laporan & Audit Percakapan Tim
            </h1>
            <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
              Khusus Admin
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Pantau seluruh riwayat interaksi pesan pelanggan dengan tim CS & Sales untuk menjaga kualitas layanan (*Quality Assurance*).
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={exportAuditCSV}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Download size={16} /> Ekspor Audit CSV
          </button>
          <button
            onClick={fetchReports}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#F8FAFC',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '18px',
        marginBottom: '28px'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Pesan Masuk & Keluar</span>
            <MessageSquare size={18} color="#3B82F6" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0F172A' }}>
            {reportData?.totalMessages || 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Pesan Masuk: {reportData?.receivedCount || 0} • Pesan Terkirim: {reportData?.sentCount || 0}
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Rata-rata Waktu Respon</span>
            <Clock size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#059669' }}>
            &lt; 3 Menit
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
            Kecepatan respon tim sangat baik ⚡
          </div>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Petugas CS & Sales Aktif</span>
            <Users size={18} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: '#0F172A' }}>
            {agents.length} Petugas
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Siap melayani 3 nomor WA Bisnis
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        background: '#FFFFFF',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        alignItems: 'center'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#F8FAFC',
          borderRadius: '8px',
          padding: '8px 12px',
          border: '1px solid var(--border-color)'
        }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Cari kata kunci pesan, nama agen, pelanggan, atau nomor telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {/* Filter Saluran WA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Saluran WA:</span>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            style={{
              background: '#F8FAFC',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">Semua Saluran (3 WA)</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name.split('-')[0].trim()} ({acc.assignedAgent || 'Umum'})
              </option>
            ))}
          </select>
        </div>

        {/* Filter Petugas Sales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Petugas Sales:</span>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            style={{
              background: '#F8FAFC',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">Semua Petugas (Seluruh Tim)</option>
            {agents.map(ag => (
              <option key={ag.id} value={ag.name}>{ag.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 18px', width: '140px' }}>Waktu</th>
              <th style={{ padding: '14px 18px', width: '130px' }}>Saluran WA</th>
              <th style={{ padding: '14px 18px', width: '150px' }}>Petugas / Sales</th>
              <th style={{ padding: '14px 18px', width: '170px' }}>Pelanggan</th>
              <th style={{ padding: '14px 18px', width: '110px' }}>Arah</th>
              <th style={{ padding: '14px 18px' }}>Isi Pesan Chat</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat log audit pesan...</td></tr>
            ) : filteredMessages.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada aktivitas percakapan pada filter ini.</td></tr>
            ) : (
              filteredMessages.map(m => {
                const acc = accounts.find(a => a.id === m.accountId);
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {new Date(m.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: `${acc?.color || '#10B981'}15`,
                        color: acc?.color || '#10B981',
                        border: `1px solid ${acc?.color || '#10B981'}30`,
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: acc?.color || '#10B981' }} />
                        {acc ? acc.name.split('-')[0].trim() : (m.accountId || 'WA 1')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#334155',
                        background: '#F1F5F9',
                        padding: '3px 9px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0'
                      }}>
                        {m.assignedAgent || (m.fromMe ? m.senderName : 'Tim CS/Sales')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{m.contactName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#059669', fontFamily: 'monospace' }}>+{m.contactPhone}</div>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: m.fromMe ? '#059669' : '#2563EB',
                        background: m.fromMe ? '#ECFDF5' : '#EFF6FF',
                        border: `1px solid ${m.fromMe ? '#A7F3D0' : '#BFDBFE'}`,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        whiteSpace: 'nowrap'
                      }}>
                        {m.fromMe ? 'Keluar (Sales)' : 'Masuk (Lead)'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {m.text}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
