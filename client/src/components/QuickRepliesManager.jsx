import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Zap, Plus, Trash2, Copy, Check, X } from 'lucide-react';

export default function QuickRepliesManager({ quickReplies, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [shortcut, setShortcut] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!shortcut || !title || !content) return;

    try {
      const res = await fetch('/api/quick-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortcut, title, content })
      });
      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setShortcut('');
        setTitle('');
        setContent('');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      console.error('Failed to add quick reply:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus templat balasan cepat ini?')) return;
    try {
      await fetch(`/api/quick-replies/${id}`, { method: 'DELETE' });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Failed to delete quick reply:', err);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', width: '100%', background: '#FFFFFF', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: '4px' }}>
            Templat Balasan Cepat (Quick Replies)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Kelola pintasan pesan agar tim CS dan Sales dapat merespon pelanggan hanya dalam hitungan detik.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            border: 'none',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(16, 185, 129, 0.25)'
          }}
        >
          <Plus size={16} /> Tambah Balasan Cepat
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {quickReplies.map(qr => (
          <div
            key={qr.id}
            style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{
                  background: 'var(--wa-green-soft)',
                  color: 'var(--wa-green)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontFamily: 'monospace'
                }}>
                  {qr.shortcut}
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => copyToClipboard(qr.content, qr.id)}
                    title="Salin Isi Pesan"
                    style={{
                      background: '#F1F5F9',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '6px',
                      color: copiedId === qr.id ? '#10B981' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {copiedId === qr.id ? <Check size={14} /> : <Copy size={14} />}
                    {copiedId === qr.id && 'Tersalin!'}
                  </button>

                  <button
                    onClick={() => handleDelete(qr.id)}
                    title="Hapus Templat"
                    style={{
                      background: '#FFF1F2',
                      border: '1px solid #FECDD3',
                      borderRadius: '6px',
                      padding: '6px',
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                {qr.title}
              </h4>

              <p style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                background: '#F8FAFC',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                whiteSpace: 'pre-wrap'
              }}>
                {qr.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Quick Reply with React Portal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="modal-dialog">
            {/* Modal Header */}
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Tambah Balasan Cepat
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                  Simpan templat pesan agar dapat dipanggil dengan shortcut di chat
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form with Scrollable Body & Fixed Footer */}
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, margin: 0 }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '5px' }}>
                    Pintasan / Shortcut (Awali dengan /) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: /diskon atau /alamat"
                    value={shortcut}
                    onChange={(e) => setShortcut(e.target.value)}
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
                    Judul Templat *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Informasi Diskon Khusus Akhir Pekan"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                    Isi Pesan Templat *
                  </label>
                  <textarea
                    rows={5}
                    required
                    placeholder="Tuliskan isi pesan otomatis..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#F8FAFC',
                      border: '1px solid var(--border-color)',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      color: '#0F172A',
                      outline: 'none',
                      resize: 'vertical',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  Simpan Templat
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
