import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  MoreVertical, 
  MessageCircle, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  User,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PipelineKanban({ onOpenChat, pipelineStages = [], currentUser }) {
  const [pipelineData, setPipelineData] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultStages = [
    { id: 'lead', title: 'Lead Masuk', color: '#94A3B8' },
    { id: 'contacted', title: 'Dihubungi / Follow Up', color: '#3B82F6' },
    { id: 'qualified', title: 'Kualifikasi Kebutuhan', color: '#8B5CF6' },
    { id: 'negotiation', title: 'Penawaran & Negosiasi', color: '#F59E0B' },
    { id: 'won', title: 'Closing / Deal', color: '#10B981' },
    { id: 'lost', title: 'Tidak Tertarik / Batal', color: '#EF4444' }
  ];

  const availableStages = (pipelineStages && pipelineStages.length > 0) ? pipelineStages : defaultStages;

  const fetchPipeline = async () => {
    try {
      const url = new URL('/api/pipeline', window.location.origin);
      if (currentUser && currentUser.role === 'sales') {
        url.searchParams.append('agent', currentUser.name);
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setPipelineData(Array.isArray(json.data) ? json.data : []);
      }
    } catch (err) {
      console.error('Failed to load pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [currentUser]);

  const handleMoveDeal = async (contactId, targetStageId) => {
    try {
      const res = await fetch('/api/pipeline/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, targetStageId })
      });
      const json = await res.json();
      if (json.success) {
        if (targetStageId === 'won') {
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          } catch (e) {}
        }
        fetchPipeline();
      }
    } catch (err) {
      console.error('Error moving deal:', err);
    }
  };

  const totalAllDeals = (pipelineData || []).reduce((sum, stage) => sum + (Number(stage?.totalValue) || 0), 0);
  const totalWonDeals = (pipelineData || []).find(s => s?.id === 'won')?.totalValue || 0;

  return (
    <div className="animate-fade-in" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', background: '#FFFFFF', minHeight: 'calc(100vh - 40px)' }}>
      {/* Top Metric Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', marginBottom: '4px' }}>
              Pipeline Penjualan & Deals
            </h1>
            {currentUser?.role === 'sales' && (
              <span style={{ fontSize: '0.72rem', background: '#EFF6FF', color: '#2563EB', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                Filter Sales: {currentUser.name}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Pantau pergerakan prospek dari pesan WhatsApp masuk hingga mencapai tahap closing kesepakatan.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '14px' }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            padding: '10px 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Nilai Pipeline</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                Rp {totalAllDeals.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid #A7F3D0',
            padding: '10px 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>Closing / Won Deal</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
                Rp {totalWonDeals.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        gap: '16px',
        overflowX: 'auto',
        paddingBottom: '16px'
      }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '24px' }}>Memuat kanban pipeline...</div>
        ) : (
          (pipelineData || []).map(stage => (
            <div
              key={stage.id}
              style={{
                width: '310px',
                flexShrink: 0,
                background: '#F8FAFC',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Stage Header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border-color)',
                borderTop: `4px solid ${stage.color || '#10B981'}`,
                background: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                    {stage.title}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #E2E8F0',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {stage.count || 0}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: stage.color || '#10B981', fontWeight: 700 }}>
                  Rp {(stage.totalValue || 0).toLocaleString('id-ID')}
                </div>
              </div>

              {/* Cards List in this Stage */}
              <div style={{
                flex: 1,
                padding: '12px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {(!stage.deals || stage.deals.length === 0) ? (
                  <div style={{
                    padding: '24px 12px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    border: '1px dashed #CBD5E1',
                    borderRadius: '10px'
                  }}>
                    Tidak ada prospek di tahap ini
                  </div>
                ) : (
                  stage.deals.map(deal => (
                    <div
                      key={deal.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '14px',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Deal Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0F172A' }}>
                            {deal.name || 'Prospek'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {deal.company || (deal.phone ? `+${deal.phone}` : '-')}
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenChat && onOpenChat(deal.id)}
                          title="Buka Chat di Inbox"
                          style={{
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            color: '#059669',
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <MessageCircle size={14} />
                        </button>
                      </div>

                      {/* Deal Value */}
                      <div style={{
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        color: '#B45309',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        marginBottom: '10px'
                      }}>
                        Rp {(Number(deal.dealValue) || 0).toLocaleString('id-ID')}
                      </div>

                      {/* Tags & Agent */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} /> {deal.assignedAgent || 'Unassigned'}
                        </span>
                        <span>WA {deal.accountId === 'account_2' ? 'Sales' : deal.accountId === 'account_3' ? 'Support' : 'CS'}</span>
                      </div>

                      {/* Stage Mover Selector */}
                      <div style={{
                        borderTop: '1px solid #F1F5F9',
                        paddingTop: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pindahkan:</span>
                        <select
                          value={stage.id}
                          onChange={(e) => handleMoveDeal(deal.id, e.target.value)}
                          style={{
                            background: '#F8FAFC',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontSize: '0.72rem',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          {availableStages.map(st => (
                            <option key={st.id} value={st.id}>{st.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
