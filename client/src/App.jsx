import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import WhatsAppConnections from './components/WhatsAppConnections';
import SharedInbox from './components/SharedInbox';
import PipelineKanban from './components/PipelineKanban';
import ContactsView from './components/ContactsView';
import BroadcastCampaign from './components/BroadcastCampaign';
import QuickRepliesManager from './components/QuickRepliesManager';
import AnalyticsView from './components/AnalyticsView';
import AdminChatAudit from './components/AdminChatAudit';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('wacrm_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('inbox');
  const [accounts, setAccounts] = useState([
    { id: 'account_1', name: 'WA 1 - CS & Layanan', color: '#10B981', role: 'CS & Info', status: 'disconnected', phone: '', user: null },
    { id: 'account_2', name: 'WA 2 - Sales & Deals', color: '#3B82F6', role: 'Sales & Prospek', status: 'disconnected', phone: '', user: null },
    { id: 'account_3', name: 'WA 3 - Aftersales & Tagihan', color: '#F59E0B', role: 'Aftersales & Billing', status: 'disconnected', phone: '', user: null }
  ]);
  const [agents, setAgents] = useState([
    { id: 'ag1', name: 'Dewi CS', role: 'Customer Service' },
    { id: 'ag2', name: 'Rian Sales', role: 'Sales Executive' },
    { id: 'ag3', name: 'Fajar Support', role: 'Technical Support' }
  ]);
  const [quickReplies, setQuickReplies] = useState([]);
  const [pipelineStages, setPipelineStages] = useState([
    { id: 'lead', title: 'Lead Masuk', color: '#94A3B8' },
    { id: 'contacted', title: 'Dihubungi / Follow Up', color: '#3B82F6' },
    { id: 'qualified', title: 'Kualifikasi Kebutuhan', color: '#8B5CF6' },
    { id: 'negotiation', title: 'Penawaran & Negosiasi', color: '#F59E0B' },
    { id: 'won', title: 'Closing / Deal', color: '#10B981' },
    { id: 'lost', title: 'Tidak Tertarik / Batal', color: '#EF4444' }
  ]);
  const [refreshing, setRefreshing] = useState(false);

  // Auth Handlers
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('wacrm_user', JSON.stringify(user));
    setActiveTab('inbox');
  };

  const handleLogout = () => {
    localStorage.removeItem('wacrm_user');
    setCurrentUser(null);
  };

  // Fetch Accounts Status
  const fetchAccounts = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/accounts');
      const json = await res.json();
      if (json.success) {
        setAccounts(json.data);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch Quick Replies
  const fetchQuickReplies = async () => {
    try {
      const res = await fetch('/api/quick-replies');
      const json = await res.json();
      if (json.success) setQuickReplies(json.data);
    } catch (err) {
      console.error('Failed to load quick replies:', err);
    }
  };

  // Socket.io Real-Time Connection
  useEffect(() => {
    if (!currentUser) return;

    fetchAccounts();
    fetchQuickReplies();

    const socket = io();

    socket.on('wa:status', (data) => {
      console.log('[Socket] wa:status event:', data);
      setAccounts(prev => prev.map(acc => {
        if (acc.id === data.accountId) {
          return {
            ...acc,
            status: data.status,
            ...(data.account || {})
          };
        }
        return acc;
      }));
    });

    socket.on('wa:qr', (data) => {
      console.log('[Socket] wa:qr event for:', data.accountId);
      setAccounts(prev => prev.map(acc => {
        if (acc.id === data.accountId) {
          return {
            ...acc,
            status: 'qr_ready',
            qr: data.qr
          };
        }
        return acc;
      }));
    });

    socket.on('wa:all_statuses', (statuses) => {
      if (Array.isArray(statuses)) {
        setAccounts(prev => prev.map(acc => {
          const match = statuses.find(s => s.id === acc.id);
          return match ? { ...acc, ...match } : acc;
        }));
      }
    });

    socket.on('data:cleared', () => {
      fetchAccounts();
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // WhatsApp Connect Action
  const handleConnect = async (accountId) => {
    try {
      await fetch(`/api/accounts/${accountId}/connect`, { method: 'POST' });
      fetchAccounts();
    } catch (err) {
      console.error('Connect failed:', err);
    }
  };

  // WhatsApp Disconnect Action
  const handleDisconnect = async (accountId) => {
    if (!confirm(`Yakin ingin memutuskan koneksi WhatsApp untuk ${accountId}?`)) return;
    try {
      await fetch(`/api/accounts/${accountId}/disconnect`, { method: 'POST' });
      fetchAccounts();
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  // Open specific chat in Inbox
  const handleOpenChat = (contactId) => {
    setActiveTab('inbox');
  };

  // If user is not logged in, display the Login Screen
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#FFFFFF', overflow: 'hidden' }}>
      {/* Modern Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        accounts={accounts}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto', background: '#FFFFFF' }}>
        {activeTab === 'inbox' && (
          <SharedInbox
            accounts={accounts}
            activeAgent={currentUser?.name || 'Dewi CS'}
            quickReplies={quickReplies}
            pipelineStages={pipelineStages}
            agents={agents}
            onUpdateDealStage={fetchAccounts}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelineKanban
            onOpenChat={handleOpenChat}
            pipelineStages={pipelineStages}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsView
            onOpenChat={handleOpenChat}
            accounts={accounts}
            pipelineStages={pipelineStages}
            agents={agents}
            currentUser={currentUser}
            onHistoryCleared={fetchAccounts}
          />
        )}

        {activeTab === 'wa_connections' && (
          <WhatsAppConnections
            accounts={accounts}
            agents={agents}
            currentUser={currentUser}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            refreshing={refreshing}
            onRefresh={fetchAccounts}
          />
        )}

        {activeTab === 'broadcast' && (
          <BroadcastCampaign
            accounts={accounts}
          />
        )}

        {activeTab === 'quick_replies' && (
          <QuickRepliesManager
            quickReplies={quickReplies}
            onRefresh={fetchQuickReplies}
          />
        )}

        {activeTab === 'chat_audit' && (
          <AdminChatAudit
            agents={agents}
            accounts={accounts}
            onHistoryCleared={fetchAccounts}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            accounts={accounts}
          />
        )}
      </main>
    </div>
  );
}
