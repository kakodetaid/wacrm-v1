import React, { useState, useEffect } from 'react';
import { 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  Users, 
  CheckCircle2, 
  RefreshCw, 
  Zap,
  Sliders
} from 'lucide-react';

export default function BroadcastCampaign({ accounts }) {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('Halo {nama} dari {perusahaan}! Kami ingin menginformasikan penawaran spesial bulan ini khusus untuk Anda 😊');
  const [targetTag, setTargetTag] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('account_1');
  const [minDelay, setMinDelay] = useState(6);
  const [maxDelay, setMaxDelay] = useState(12);

  // Execution State
  const [sending, setSending] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(null);

  const fetchBroadcasts = async () => {
    try {
      const res = await fetch('/api/broadcasts');
      const json = await res.json();
      if (json.success) {
        setBroadcasts(json.data);
      }
    } catch (err) {
      console.error('Failed to load broadcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const handleStartBroadcast = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    setCurrentProgress({ current: 0, total: 10, status: 'Memulai antrean pengiriman dengan proteksi anti-ban...' });

    try {
      const res = await fetch('/api/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || 'Kampanye Promo & Follow Up',
          message,
          targetTag,
          accountId: selectedAccount,
          minDelay: Number(minDelay),
          maxDelay: Number(maxDelay)
        })
      });
      const json = await res.json();
      if (json.success) {
        setTitle('');
        fetchBroadcasts();
      }
    } catch (err) {
      console.error('Broadcast error:', err);
    } finally {
      setTimeout(() => {
        setSending(false);
        setCurrentProgress(null);
      }, 2000);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '28px', width: '100%', background: '#FFFFFF', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: '4px' }}>
          Broadcast & Follow-up Bertahap (Anti-Banned Guardrail)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Kirim pesan massal terpersonalisasi ke prospek/pelanggan dengan sistem jeda waktu acak (*human-like delay*) untuk melindungi kartu SIM fisik Anda dari blokir sistem WhatsApp.
        </p>
      </div>

      {/* Safety Notice Card */}
      <div style={{
        background: '#ECFDF5',
        border: '1px solid #A7F3D0',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: '#D1FAE5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#059669',
          flexShrink: 0
        }}>
          <ShieldCheck size={24} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#065F46', marginBottom: '4px' }}>
            Perlindungan Nomor Fisik Aktif
          </h4>
          <p style={{ fontSize: '0.82rem', color: '#047857', lineHeight: 1.5 }}>
            Sistem secara otomatis menyisipkan jeda acak (contoh: 6 - 12 detik) antar pesan dan mendukung variabel personalisasi (<code style={{ background: '#FFFFFF', padding: '1px 5px', borderRadius: '4px', border: '1px solid #A7F3D0', fontWeight: 700 }}>{'{nama}'}</code>, <code style={{ background: '#FFFFFF', padding: '1px 5px', borderRadius: '4px', border: '1px solid #A7F3D0', fontWeight: 700 }}>{'{perusahaan}'}</code>) agar setiap pesan unik dan tidak dianggap spam oleh server WhatsApp.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px' }}>
        {/* Broadcast Form */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '18px' }}>
            Buat Pesan Broadcast Baru
          </h3>

          <form onSubmit={handleStartBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Judul Kampanye (Internal)
              </label>
              <input
                type="text"
                placeholder="Contoh: Follow Up Diskon Akhir Bulan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  background: '#F8FAFC',
                  border: '1px solid var(--border-color)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  color: '#0F172A',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Kirim Melalui Nomor WA
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#F8FAFC',
                    border: '1px solid var(--border-color)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.status === 'connected' ? 'Online' : 'Offline'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Target Penerima (Label)
                </label>
                <select
                  value={targetTag}
                  onChange={(e) => setTargetTag(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#F8FAFC',
                    border: '1px solid var(--border-color)',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    color: '#0F172A',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Semua Kontak Prospek</option>
                  <option value="Hot Lead">Khusus Tag: Hot Lead</option>
                  <option value="Pertanyaan Produk">Khusus Tag: Pertanyaan Produk</option>
                  <option value="VIP">Khusus Tag: VIP</option>
                </select>
              </div>
            </div>

            {/* Delay Range Settings */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '12px 16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                <Clock size={15} color="#D97706" /> Jeda Waktu Acak Antar Pesan (Detik)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Min Delay:</span>
                  <input
                    type="number"
                    min="3"
                    max="30"
                    value={minDelay}
                    onChange={(e) => setMinDelay(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-color)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      color: '#0F172A',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Max Delay:</span>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={maxDelay}
                    onChange={(e) => setMaxDelay(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-color)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      color: '#0F172A',
                      fontSize: '0.8rem'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Message Template Editor */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Isi Pesan WhatsApp *
                </label>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                  Tag Variabel: {'{nama}'}, {'{perusahaan}'}
                </span>
              </div>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: '100%',
                  background: '#F8FAFC',
                  border: '1px solid var(--border-color)',
                  padding: '12px',
                  borderRadius: '8px',
                  color: '#0F172A',
                  fontSize: '0.85rem',
                  lineHeight: 1.5,
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sending}
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
                fontSize: '0.9rem',
                cursor: sending ? 'not-allowed' : 'pointer',
                boxShadow: '0 3px 12px rgba(16, 185, 129, 0.25)',
                marginTop: '8px'
              }}
            >
              {sending ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Mengirimkan Broadcast Terjadwal...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Mulai Pengiriman Broadcast Aman
                </>
              )}
            </button>
          </form>
        </div>

        {/* Campaign History & Tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sending && currentProgress && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: 'var(--radius-md)',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>
                <RefreshCw size={14} className="animate-spin" /> Broadcast Sedang Berjalan
              </div>
              <p style={{ fontSize: '0.8rem', color: '#047857', marginBottom: '8px' }}>
                {currentProgress.status}
              </p>
              <div style={{ height: '6px', background: '#D1FAE5', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: '45%', height: '100%', background: '#10B981', borderRadius: '3px' }} />
              </div>
            </div>
          )}

          {/* Past Broadcast History */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '20px',
            flex: 1,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginBottom: '14px' }}>
              Riwayat Kampanye Broadcast
            </h4>

            {broadcasts.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '24px 0' }}>
                Belum ada riwayat broadcast.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {broadcasts.map(bc => (
                  <div
                    key={bc.id}
                    style={{
                      background: '#F8FAFC',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{bc.title}</span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: bc.status === 'completed' ? '#059669' : '#D97706'
                      }}>
                        {bc.status === 'completed' ? 'Selesai' : 'Diproses'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Terkirim: {bc.sentCount} / {bc.totalRecipients} • Melalui {bc.accountId}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
