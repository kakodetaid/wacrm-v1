import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  Zap, 
  Phone, 
  Building, 
  Mail, 
  Tag, 
  UserCheck, 
  FileText, 
  Plus, 
  Check, 
  CheckCheck, 
  Clock, 
  Filter, 
  MessageSquare,
  DollarSign,
  ChevronDown,
  PanelRight
} from 'lucide-react';

export default function SharedInbox({ 
  accounts, 
  activeAgent, 
  quickReplies, 
  pipelineStages = [],
  agents = [],
  onUpdateDealStage,
  currentUser
}) {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Filters
  const [selectedAccountFilter, setSelectedAccountFilter] = useState('all');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState('');

  // Find assigned WhatsApp account for this sales user
  const myAssignedAccount = accounts.find(a => 
    a.assignedUsername === currentUser?.username || 
    a.assignedAgent === currentUser?.name
  );

  // Sync assigned device on login if role is sales
  useEffect(() => {
    if (currentUser?.role === 'sales' && myAssignedAccount) {
      setSelectedAccountFilter(myAssignedAccount.id);
      setSendFromAccount(myAssignedAccount.id);
    }
  }, [currentUser, accounts]);

  // Input States
  const [inputText, setInputText] = useState('');
  const [sendFromAccount, setSendFromAccount] = useState('account_1');
  const [showQuickReplyMenu, setShowQuickReplyMenu] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [dealValueInput, setDealValueInput] = useState('');
  const [isEditingDealValue, setIsEditingDealValue] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(true);

  const messagesEndRef = useRef(null);

  // Load Chats list
  const fetchChats = async () => {
    try {
      const url = new URL('/api/chats', window.location.origin);
      if (selectedAccountFilter !== 'all') url.searchParams.append('accountId', selectedAccountFilter);
      if (searchQuery) url.searchParams.append('search', searchQuery);
      if (selectedTagFilter) url.searchParams.append('tag', selectedTagFilter);
      
      if (currentUser && currentUser.role === 'sales') {
        url.searchParams.append('agent', currentUser.name);
      } else if (selectedAgentFilter !== 'all') {
        url.searchParams.append('agent', selectedAgentFilter);
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setChats(json.data);
        if (!selectedChat && json.data.length > 0) {
          selectChat(json.data[0]);
        } else if (selectedChat) {
          const updated = json.data.find(c => c.contact.id === selectedChat.contact.id);
          if (updated) setSelectedChat(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, [selectedAccountFilter, selectedAgentFilter, searchQuery, selectedTagFilter]);

  // Polling fallback to keep message stream fresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats();
      if (selectedChat) {
        loadMessages(selectedChat.contact.id, false);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedChat]);

  // Load Messages for a specific contact
  const loadMessages = async (contactId, showLoader = true) => {
    if (showLoader) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chats/${contactId}/messages`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data.messages);
        setNotes(json.data.notes || []);
        if (json.data.contact) {
          setDealValueInput(json.data.contact.dealValue || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (showLoader) setLoadingMessages(false);
      scrollToBottom();
    }
  };

  const selectChat = (chatItem) => {
    setSelectedChat(chatItem);
    setSendFromAccount(chatItem.contact.accountId || 'account_1');
    setDealValueInput(chatItem.contact.dealValue || 0);
    loadMessages(chatItem.contact.id);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Send Message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedChat) return;

    const textToSend = inputText;
    setInputText('');
    setShowQuickReplyMenu(false);

    try {
      const res = await fetch(`/api/chats/${selectedChat.contact.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSend,
          accountId: sendFromAccount,
          senderName: currentUser?.name || activeAgent
        })
      });
      const json = await res.json();
      if (json.success) {
        loadMessages(selectedChat.contact.id, false);
        fetchChats();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Insert Quick Reply
  const handleSelectQuickReply = (qr) => {
    setInputText(prev => (prev ? `${prev} ${qr.content}` : qr.content));
    setShowQuickReplyMenu(false);
  };

  // Add Internal Note
  const handleAddNote = async () => {
    if (!newNoteText.trim() || !selectedChat) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.contact.id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: currentUser?.name || activeAgent,
          text: newNoteText
        })
      });
      const json = await res.json();
      if (json.success) {
        setNewNoteText('');
        setShowAddNote(false);
        loadMessages(selectedChat.contact.id, false);
      }
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  // Update Contact Attribute (Stage, Agent, Deal Value)
  const handleUpdateContact = async (updates) => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/contacts/${selectedChat.contact.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const json = await res.json();
      if (json.success) {
        setSelectedChat(prev => ({
          ...prev,
          contact: { ...prev.contact, ...updates }
        }));
        fetchChats();
        if (updates.stage && onUpdateDealStage) {
          onUpdateDealStage();
        }
      }
    } catch (err) {
      console.error('Error updating contact:', err);
    }
  };

  const getAccountColor = (accId) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.color : '#10B981';
  };

  const getAccountName = (accId) => {
    const acc = accounts.find(a => a.id === accId);
    return acc ? acc.name.split('-')[0].trim() : 'WA';
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      background: '#FFFFFF',
      overflow: 'hidden'
    }}>
      {/* ======================================================== */}
      {/* 1. LEFT COLUMN: CHAT LIST & FILTER */}
      {/* ======================================================== */}
      <div style={{
        width: '320px',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        background: '#F8FAFC',
        flexShrink: 0
      }}>
        {/* WhatsApp Account Filter Header */}
        {currentUser?.role === 'sales' ? (
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border-color)',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Saluran WA Ditugaskan:
              </div>
              <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span className={`pulse-dot ${myAssignedAccount?.status === 'connected' ? 'online' : 'offline'}`} />
                {myAssignedAccount ? myAssignedAccount.name.split('-')[0].trim() : 'WA Anda'}
                {myAssignedAccount?.phone && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    (+{myAssignedAccount.phone})
                  </span>
                )}
              </div>
            </div>
            <span style={{
              fontSize: '0.7rem',
              background: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 700
            }}>
              {currentUser.name}
            </span>
          </div>
        ) : (
          <div style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border-color)',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
              <button
                onClick={() => setSelectedAccountFilter('all')}
                style={{
                  padding: '5px 9px',
                  borderRadius: '8px',
                  border: `1px solid ${selectedAccountFilter === 'all' ? 'transparent' : 'var(--border-color)'}`,
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: selectedAccountFilter === 'all' ? '#10B981' : '#FFFFFF',
                  color: selectedAccountFilter === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}
              >
                Semua WA (3)
              </button>
              {accounts.map((acc, i) => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountFilter(acc.id)}
                  title={`Petugas: ${acc.assignedAgent || 'Umum'}`}
                  style={{
                    padding: '5px 9px',
                    borderRadius: '8px',
                    border: `1px solid ${selectedAccountFilter === acc.id ? 'transparent' : 'var(--border-color)'}`,
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: selectedAccountFilter === acc.id ? acc.color : '#FFFFFF',
                    color: selectedAccountFilter === acc.id ? '#FFFFFF' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: selectedAccountFilter === acc.id ? '#fff' : acc.color }} />
                  WA {i + 1}
                </button>
              ))}
            </div>

            {/* Admin Sales Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Petugas:</span>
              <select
                value={selectedAgentFilter}
                onChange={(e) => setSelectedAgentFilter(e.target.value)}
                style={{
                  flex: 1,
                  background: '#F8FAFC',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 6px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: '#334155',
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
        )}

        {/* Search Bar */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', background: '#FFFFFF' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#F8FAFC',
            borderRadius: '8px',
            padding: '8px 12px',
            border: '1px solid var(--border-color)'
          }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Cari nama, PT, atau nomor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Chat Items List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Memuat percakapan...
            </div>
          ) : chats.length === 0 ? (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div>Belum ada percakapan.</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Pesan masuk dari nomor fisik akan muncul otomatis di sini.</div>
            </div>
          ) : (
            chats.map((item) => {
              const isSelected = selectedChat?.contact.id === item.contact.id;
              const accColor = getAccountColor(item.contact.accountId);
              const initials = item.contact.name ? item.contact.name.slice(0, 2).toUpperCase() : 'WA';

              return (
                <div
                  key={item.contact.id}
                  onClick={() => selectChat(item)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    background: isSelected ? '#ECFDF5' : '#FFFFFF',
                    borderLeft: isSelected ? '3px solid #10B981' : '3px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Contact Avatar */}
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${accColor}cc, ${accColor})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}>
                      {initials}
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: '-2px',
                      right: '-2px',
                      width: '13px',
                      height: '13px',
                      borderRadius: '50%',
                      background: accColor,
                      border: '2px solid #FFFFFF'
                    }} title={`Diterima di ${item.contact.accountId}`} />
                  </div>

                  {/* Chat Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.contact.name}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {item.lastMessage 
                          ? new Date(item.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    </div>

                    <div style={{
                      fontSize: '0.78rem',
                      color: item.unreadCount > 0 ? '#0F172A' : 'var(--text-muted)',
                      fontWeight: item.unreadCount > 0 ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginBottom: '6px'
                    }}>
                      {item.lastMessage ? item.lastMessage.text : 'Belum ada pesan'}
                    </div>

                    {/* Tags & Account Pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: `${accColor}15`,
                        color: accColor,
                        fontWeight: 700
                      }}>
                        {getAccountName(item.contact.accountId)}
                      </span>

                      {item.contact.tags?.slice(0, 1).map(tag => (
                        <span key={tag} style={{
                          fontSize: '0.65rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#F1F5F9',
                          color: 'var(--text-secondary)',
                          border: '1px solid #E2E8F0'
                        }}>
                          {tag}
                        </span>
                      ))}

                      {item.unreadCount > 0 && (
                        <span style={{
                          marginLeft: 'auto',
                          background: '#10B981',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '10px'
                        }}>
                          {item.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. CENTER COLUMN: ACTIVE CHAT CONVERSATION */}
      {/* ======================================================== */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        minWidth: 0
      }}>
        {selectedChat ? (
          <>
            {/* Conversation Header */}
            <div style={{
              padding: '14px 24px',
              borderBottom: '1px solid var(--border-color)',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}>
                  {selectedChat.contact.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>{selectedChat.contact.name}</h3>
                    <span style={{
                      fontSize: '0.7rem',
                      background: `${getAccountColor(selectedChat.contact.accountId)}15`,
                      color: getAccountColor(selectedChat.contact.accountId),
                      border: `1px solid ${getAccountColor(selectedChat.contact.accountId)}30`,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 700
                    }}>
                      Terhubung ke {getAccountName(selectedChat.contact.accountId)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    +{selectedChat.contact.phone} • {selectedChat.contact.company || 'Pribadi'}
                  </div>
                </div>
              </div>

              {/* Quick Pipeline Stage Pill & CRM Profile Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tahap:</span>
                <select
                  value={selectedChat.contact.stage || 'lead'}
                  onChange={(e) => handleUpdateContact({ stage: e.target.value })}
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid var(--border-color)',
                    color: '#0F172A',
                    fontSize: '0.8rem',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  {pipelineStages.map(st => (
                    <option key={st.id} value={st.id}>{st.title}</option>
                  ))}
                </select>

                <button
                  onClick={() => setShowProfilePanel(!showProfilePanel)}
                  title={showProfilePanel ? 'Sembunyikan Panel Profil' : 'Tampilkan Panel Profil'}
                  style={{
                    background: showProfilePanel ? '#ECFDF5' : '#FFFFFF',
                    border: `1px solid ${showProfilePanel ? '#A7F3D0' : 'var(--border-color)'}`,
                    color: showProfilePanel ? '#059669' : 'var(--text-secondary)',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <PanelRight size={15} />
                  <span style={{ display: 'inline-block' }}>{showProfilePanel ? 'Tutup Panel' : 'Panel CRM'}</span>
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div style={{
              flex: 1,
              padding: '20px 24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#F8FAFC'
            }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '20px' }}>
                  Memuat riwayat chat...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '40px' }}>
                  Belum ada riwayat pesan dengan kontak ini.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.fromMe;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        alignSelf: isMe ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {/* Sender Name */}
                      <span style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        marginBottom: '3px',
                        padding: '0 4px'
                      }}>
                        {isMe ? `${msg.senderName || activeAgent} (Keluar)` : selectedChat.contact.name}
                      </span>

                      {/* Bubble */}
                      <div style={{
                        padding: '12px 16px',
                        borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMe ? '#10B981' : '#FFFFFF',
                        color: isMe ? '#FFFFFF' : '#0F172A',
                        border: isMe ? 'none' : '1px solid var(--border-color)',
                        fontSize: '0.875rem',
                        lineHeight: 1.5,
                        boxShadow: 'var(--shadow-sm)',
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {msg.text}

                        {/* Timestamp & Status */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px',
                          marginTop: '4px',
                          fontSize: '0.65rem',
                          color: isMe ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)'
                        }}>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && (
                            msg.status === 'read' 
                              ? <CheckCheck size={13} color="#FFFFFF" /> 
                              : <Check size={13} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Reply Popup Menu */}
            {showQuickReplyMenu && (
              <div style={{
                margin: '0 20px',
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: 'var(--shadow-lg)',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  <span>PILIH QUICK REPLY (BALASAN CEPAT):</span>
                  <span onClick={() => setShowQuickReplyMenu(false)} style={{ cursor: 'pointer', color: '#E11D48' }}>Tutup</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {quickReplies.map(qr => (
                    <div
                      key={qr.id}
                      onClick={() => handleSelectQuickReply(qr)}
                      style={{
                        padding: '8px 10px',
                        background: '#F8FAFC',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#059669' }}>{qr.shortcut} - {qr.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {qr.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Input Bar */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-color)',
              background: '#FFFFFF'
            }}>
              {/* Account Selector Strip */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {currentUser?.role === 'sales' ? 'Saluran WA Anda:' : 'Kirim melalui saluran:'}
                  </span>
                  {currentUser?.role === 'sales' && myAssignedAccount ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#F1F5F9',
                      border: '1px solid var(--border-color)',
                      color: getAccountColor(myAssignedAccount.id),
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      borderRadius: '6px'
                    }}>
                      📱 {myAssignedAccount.name} {myAssignedAccount.status === 'connected' ? '🟢 Terhubung' : '⚪ Disconnect'}
                    </span>
                  ) : (
                    <select
                      value={sendFromAccount}
                      onChange={(e) => setSendFromAccount(e.target.value)}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid var(--border-color)',
                        color: getAccountColor(sendFromAccount),
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} style={{ background: '#FFFFFF', color: '#0F172A' }}>
                          {acc.name} {acc.status === 'connected' ? '🟢 (Online)' : '⚪ (Offline)'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <button
                  onClick={() => setShowQuickReplyMenu(!showQuickReplyMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: '#ECFDF5',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#059669',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Zap size={13} />
                  Quick Reply
                </button>
              </div>

              {/* Text Input Row */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  padding: '8px 14px'
                }}>
                  <textarea
                    rows={1}
                    placeholder="Ketik pesan WhatsApp... (Tekan Enter untuk kirim)"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'none',
                      maxHeight: '100px'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    background: inputText.trim() ? '#10B981' : '#E2E8F0',
                    border: 'none',
                    color: inputText.trim() ? '#ffffff' : '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: inputText.trim() ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Send size={17} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}>
            <MessageSquare size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A' }}>Pilih kontak di sebelah kiri</div>
            <div style={{ fontSize: '0.85rem' }}>Pilih percakapan untuk mulai berkirim pesan dan mengelola pipeline</div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. RIGHT COLUMN: CONTACT CRM PROFILE & INTERNAL NOTES */}
      {/* ======================================================== */}
      {selectedChat && showProfilePanel && (
        <div style={{
          width: '300px',
          borderLeft: '1px solid var(--border-color)',
          background: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          <div style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
              Profil Prospek & Pelanggan
            </h4>

            {/* Profile Avatar Box */}
            <div style={{
              textAlign: 'center',
              padding: '16px',
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: '1.1rem',
                margin: '0 auto 10px',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
              }}>
                {selectedChat.contact.name.slice(0, 2).toUpperCase()}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '2px' }}>
                {selectedChat.contact.name}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {selectedChat.contact.company || 'Personal / Belum ada PT'}
              </div>
            </div>

            {/* Deal Value Widget */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              marginBottom: '16px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nilai Potensi Deal:</span>
                <span 
                  onClick={() => setIsEditingDealValue(!isEditingDealValue)}
                  style={{ fontSize: '0.72rem', color: '#059669', cursor: 'pointer', fontWeight: 700 }}
                >
                  {isEditingDealValue ? 'Simpan' : 'Edit Nilai'}
                </span>
              </div>
              {isEditingDealValue ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="number"
                    value={dealValueInput}
                    onChange={(e) => setDealValueInput(e.target.value)}
                    style={{
                      flex: 1,
                      background: '#F8FAFC',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      color: '#0F172A',
                      padding: '4px 8px',
                      fontSize: '0.85rem'
                    }}
                  />
                  <button
                    onClick={() => {
                      handleUpdateContact({ dealValue: Number(dealValueInput) || 0 });
                      setIsEditingDealValue(false);
                    }}
                    style={{
                      background: '#10B981',
                      color: '#fff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    OK
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#B45309' }}>
                  Rp {(Number(selectedChat.contact.dealValue) || 0).toLocaleString('id-ID')}
                </div>
              )}
            </div>

            {/* Assigned Agent */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Ditugaskan ke Agen (CS/Sales):
              </label>
              <select
                value={selectedChat.contact.assignedAgent || ''}
                onChange={(e) => handleUpdateContact({ assignedAgent: e.target.value })}
                style={{
                  width: '100%',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {agents.map(ag => (
                  <option key={ag.id} value={ag.name}>{ag.name} ({ag.role})</option>
                ))}
              </select>
            </div>

            {/* Tags Section */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Label / Tags:</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedChat.contact.tags?.map(t => (
                  <span
                    key={t}
                    style={{
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      background: '#EFF6FF',
                      color: '#1D4ED8',
                      border: '1px solid #BFDBFE',
                      borderRadius: '6px',
                      fontWeight: 600
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Internal Team Notes */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Catatan Internal Tim
                </span>
                <button
                  onClick={() => setShowAddNote(!showAddNote)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#059669',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700
                  }}
                >
                  <Plus size={14} /> Tambah
                </button>
              </div>

              {/* Note Creator Form */}
              {showAddNote && (
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '12px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <textarea
                    rows={2}
                    placeholder="Tulis catatan internal untuk tim (pelanggan tidak melihat ini)..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    style={{
                      width: '100%',
                      background: '#F8FAFC',
                      border: '1px solid var(--border-color)',
                      color: '#0F172A',
                      fontSize: '0.8rem',
                      padding: '6px',
                      borderRadius: '6px',
                      outline: 'none',
                      marginBottom: '6px'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      onClick={() => setShowAddNote(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.72rem',
                        cursor: 'pointer'
                      }}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleAddNote}
                      style={{
                        background: '#10B981',
                        border: 'none',
                        color: '#fff',
                        fontSize: '0.72rem',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      Simpan Catatan
                    </button>
                  </div>
                </div>
              )}

              {/* Notes List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notes.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Belum ada catatan internal.
                  </div>
                ) : (
                  notes.map(note => (
                    <div
                      key={note.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '0.78rem',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{note.author}</span>
                        <span>{new Date(note.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {note.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
