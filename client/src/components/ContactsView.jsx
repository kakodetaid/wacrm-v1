import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Search, 
  Plus, 
  Download, 
  MessageSquare, 
  Phone, 
  Building, 
  Tag, 
  UserCheck,
  Check,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

function normalizeIndonesianPhone(input) {
  if (!input) return '';
  let clean = input.toString().replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

export default function ContactsView({ onOpenChat, accounts, pipelineStages, agents, currentUser, onHistoryCleared }) {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTags, setFormTags] = useState('Lead Baru');
  const [formAccount, setFormAccount] = useState('account_1');
  const [formStage, setFormStage] = useState('lead');
  const [formDealValue, setFormDealValue] = useState(0);

  const fetchContacts = async () => {
    try {
      const url = new URL('/api/contacts', window.location.origin);
      if (currentUser && currentUser.role === 'sales') {
        url.searchParams.append('agent', currentUser.name);
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setContacts(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [currentUser]);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!formPhone.trim()) return;

    const normalizedPhone = normalizeIndonesianPhone(formPhone);

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName || 'Kontak Baru',
          phone: normalizedPhone,
          company: formCompany,
          email: formEmail,
          tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
          accountId: formAccount,
          stage: formStage,
          dealValue: Number(formDealValue) || 0,
          assignedAgent: currentUser?.role === 'sales' ? currentUser.name : (agents[0]?.name || 'Dewi CS')
        })
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setFormName('');
        setFormPhone('');
        setFormCompany('');
        setFormEmail('');
        fetchContacts();
      }
    } catch (err) {
      console.error('Failed to add contact:', err);
    }
  };

  const handleClearAllHistory = async () => {
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh kontak dan riwayat chat? Sesi nomor WhatsApp fisik tetap aktif dan tidak akan terputus.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/clear-history', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchContacts();
        if (onHistoryCleared) onHistoryCleared();
      }
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Nama', 'Nomor WhatsApp', 'Perusahaan', 'Email', 'Tahap Pipeline', 'Nilai Deal (IDR)', 'Akun WA'];
    const rows = contacts.map(c => [
      c.id,
      `"${c.name}"`,
      `"+${normalizeIndonesianPhone(c.phone)}"`,
      `"${c.company || '-'}"`,
      `"${c.email || '-'}"`,
      `"${c.stage}"`,
      c.dealValue || 0,
      c.accountId
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wacrm_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q) || ((c.company || '').toLowerCase().includes(q));
    const matchTag = selectedTag ? (c.tags && c.tags.includes(selectedTag)) : true;
    return matchSearch && matchTag;
  });

  const previewNormalized = normalizeIndonesianPhone(formPhone);

  return (
    <div className="animate-fade-in" style={{ padding: '28px', width: '100%', background: '#FFFFFF', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: '4px' }}>
              Database Kontak & Prospek
            </h1>
            {currentUser?.role === 'sales' && (
              <span style={{ fontSize: '0.72rem', background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                Data Sales: {currentUser.name}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Data seluruh pelanggan yang pernah berinteraksi dengan 3 nomor WhatsApp Anda.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {currentUser?.role === 'admin' && (
            <button
              onClick={handleClearAllHistory}
              title="Bersihkan kontak dan pesan"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FFF1F2',
                border: '1px solid #FECDD3',
                color: '#E11D48',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Trash2 size={15} /> Bersihkan Data
            </button>
          )}

          <button
            onClick={exportCSV}
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
            <Download size={16} /> Ekspor CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              border: 'none',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 3px 10px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Plus size={16} /> Tambah Kontak Baru
          </button>
        </div>
      </div>

      {/* Search & Tag Filter Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        background: '#FFFFFF',
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)'
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
            placeholder="Cari kontak berdasarkan nama, perusahaan, atau nomor WhatsApp..."
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
      </div>

      {/* Table of Contacts */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '14px 20px' }}>Pelanggan</th>
              <th style={{ padding: '14px 20px' }}>Nomor WhatsApp</th>
              <th style={{ padding: '14px 20px' }}>Perusahaan</th>
              <th style={{ padding: '14px 20px' }}>Tahap Pipeline</th>
              <th style={{ padding: '14px 20px' }}>Potensi Deal</th>
              <th style={{ padding: '14px 20px' }}>Akun Penampung</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data kontak...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada kontak terdaftar.</td></tr>
            ) : (
              filtered.map(c => {
                const acc = accounts.find(a => a.id === c.accountId);
                const displayPhone = normalizeIndonesianPhone(c.phone);
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email || '-'}</div>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#059669', fontWeight: 700 }}>
                      +{displayPhone}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      {c.company || '-'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE'
                      }}>
                        {pipelineStages?.find(s => s.id === c.stage)?.title || c.stage}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#B45309', fontWeight: 700 }}>
                      Rp {(Number(c.dealValue) || 0).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: `${acc?.color || '#10B981'}15`,
                        color: acc?.color || '#10B981',
                        border: `1px solid ${acc?.color || '#10B981'}30`,
                        fontWeight: 600
                      }}>
                        {acc ? acc.name.split('-')[0].trim() : 'WA 1'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => onOpenChat && onOpenChat(c.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          color: '#059669',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <MessageSquare size={13} /> Chat di Inbox
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Kontak with React Portal */}
      {showAddModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="modal-backdrop" 
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
        >
          <div className="modal-dialog">
            {/* Modal Header (Fixed) */}
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Tambah Kontak / Prospek Baru
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Simpan data prospek & hubungkan ke nomor WhatsApp
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748B',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form with Scrollable Body & Fixed Footer */}
            <form onSubmit={handleAddContact} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#F8FAFC',
                      border: '1px solid var(--border-color)',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      color: '#0F172A',
                      outline: 'none',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                    Nomor WhatsApp (Ketik 08xx / 628xx / +62) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 081234567890"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#F8FAFC',
                      border: '1px solid var(--border-color)',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      color: '#0F172A',
                      outline: 'none',
                      fontSize: '0.875rem'
                    }}
                  />
                  {/* Live Auto +62 Indicator */}
                  {formPhone && (
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Otomatis disimpan sebagai: <strong>+{previewNormalized}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Perusahaan / Toko
                    </label>
                    <input
                      type="text"
                      placeholder="PT / CV / Toko"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#F8FAFC',
                        border: '1px solid var(--border-color)',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        color: '#0F172A',
                        outline: 'none',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="email@perusahaan.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#F8FAFC',
                        border: '1px solid var(--border-color)',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        color: '#0F172A',
                        outline: 'none',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Nomor WA Penampung
                    </label>
                    <select
                      value={formAccount}
                      onChange={(e) => setFormAccount(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#F8FAFC',
                        border: '1px solid var(--border-color)',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        color: '#0F172A',
                        outline: 'none',
                        fontSize: '0.875rem'
                      }}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                      Nilai Potensi Deal (IDR)
                    </label>
                    <input
                      type="number"
                      value={formDealValue}
                      onChange={(e) => setFormDealValue(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#F8FAFC',
                        border: '1px solid var(--border-color)',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        color: '#0F172A',
                        outline: 'none',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer (Fixed at bottom) */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    border: 'none',
                    color: '#fff',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Simpan Kontak
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
