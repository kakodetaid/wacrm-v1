const express = require('express');
const router = express.Router();
const store = require('../data/store');
const waManager = require('../whatsapp/manager');

// ==========================================
// 1. Auth & Roles (Admin & Sales)
// ==========================================
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'Username wajib diisi' });
  }

  const user = store.authenticate(username, password);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Username atau password salah' });
  }

  res.json({ success: true, data: user });
});

router.get('/auth/users', (req, res) => {
  const users = store.getUsers().map(({ password, ...u }) => u);
  res.json({ success: true, data: users });
});

router.post('/auth/users', (req, res) => {
  const { username, password, name, role, email } = req.body;
  if (!username || !name) {
    return res.status(400).json({ success: false, error: 'Username dan Nama wajib diisi' });
  }
  const newUser = store.addUser({ username, password, name, role, email });
  res.json({ success: true, data: newUser });
});

// Admin endpoint: Clear all contacts & messages history
router.post('/admin/clear-history', (req, res) => {
  const result = store.clearAllHistory();
  waManager.emit('data:cleared', {});
  res.json({ success: true, message: 'Semua riwayat chat dan kontak berhasil dibersihkan.' });
});

// Admin endpoint: Chat Reports & Audit Log
router.get('/admin/chat-reports', (req, res) => {
  const { agent, accountId } = req.query;
  const report = store.getChatReports(agent, accountId);
  res.json({ success: true, data: report });
});

// ==========================================
// 2. WhatsApp Accounts & Connection
// ==========================================
router.get('/accounts', (req, res) => {
  const accounts = store.getAccounts().map(acc => {
    const live = waManager.getStatus(acc.id);
    return {
      ...acc,
      status: live.status,
      qr: live.qr,
      user: live.user || acc.user
    };
  });
  res.json({ success: true, data: accounts });
});

// Assign account / device to a specific sales agent
router.post('/accounts/:id/assign', (req, res) => {
  const { id } = req.params;
  const { assignedAgent, assignedUsername } = req.body;
  const updated = store.assignAccountToAgent(id, assignedAgent, assignedUsername);
  if (updated) {
    waManager.emit('account:updated', updated);
    res.json({ success: true, data: updated, message: `Perangkat ${id} berhasil ditugaskan ke ${assignedAgent}.` });
  } else {
    res.status(404).json({ success: false, error: 'Akun tidak ditemukan' });
  }
});

router.post('/accounts/:id/connect', async (req, res) => {
  try {
    const { id } = req.params;
    await waManager.connectAccount(id);
    res.json({ success: true, message: `Inisialisasi koneksi ${id}...` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/accounts/:id/disconnect', async (req, res) => {
  try {
    const { id } = req.params;
    await waManager.disconnectAccount(id);
    res.json({ success: true, message: `Akun ${id} diputuskan.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 3. Chats & Omnichannel Inbox
// ==========================================
router.get('/chats', (req, res) => {
  const { accountId, search, tag, agent } = req.query;
  const contacts = store.getContacts();
  const allMessages = store.getMessages();

  let filteredContacts = contacts;

  // Filter per akun WA
  if (accountId && accountId !== 'all') {
    filteredContacts = filteredContacts.filter(c => c.accountId === accountId);
  }

  // Filter per agen (Role Sales hanya melihat kontak miliknya)
  if (agent && agent !== 'all') {
    filteredContacts = filteredContacts.filter(c => c.assignedAgent === agent);
  }

  // Filter per tag
  if (tag) {
    filteredContacts = filteredContacts.filter(c => c.tags && c.tags.includes(tag));
  }

  // Filter search
  if (search) {
    const q = search.toLowerCase();
    filteredContacts = filteredContacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  }

  // Gabungkan dengan pesan terakhir
  const chats = filteredContacts.map(contact => {
    const contactMessages = allMessages.filter(m => m.contactId === contact.id);
    const lastMsg = contactMessages[contactMessages.length - 1] || null;
    const unreadCount = contactMessages.filter(m => !m.fromMe && m.status !== 'read').length;

    return {
      contact,
      lastMessage: lastMsg,
      unreadCount,
      totalMessages: contactMessages.length
    };
  });

  // Urutkan berdasarkan waktu pesan terakhir
  chats.sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp) : new Date(a.contact.createdAt);
    const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp) : new Date(b.contact.createdAt);
    return timeB - timeA;
  });

  res.json({ success: true, data: chats });
});

router.get('/chats/:contactId/messages', (req, res) => {
  const { contactId } = req.params;
  const contact = store.getContact(contactId);
  if (!contact) {
    return res.status(404).json({ success: false, error: 'Kontak tidak ditemukan' });
  }

  const messages = store.getMessages(contactId);

  // Tandai pesan sudah dibaca
  let updated = false;
  messages.forEach(m => {
    if (!m.fromMe && m.status !== 'read') {
      m.status = 'read';
      updated = true;
    }
  });
  if (updated) store.save();

  res.json({
    success: true,
    data: {
      contact,
      messages,
      notes: contact.notes || []
    }
  });
});

router.post('/chats/:contactId/send', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { text, accountId, senderName } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Pesan tidak boleh kosong' });
    }

    const contact = store.getContact(contactId);
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Kontak tidak ditemukan' });
    }

    const targetAccount = accountId || contact.accountId || 'account_1';
    const sentMsg = await waManager.sendMessage(targetAccount, contact.phone, text);

    res.json({ success: true, data: sentMsg });
  } catch (err) {
    console.warn('Gagal kirim via live WA:', err.message);
    const { contactId } = req.params;
    const { text, accountId, senderName } = req.body;
    const contact = store.getContact(contactId);

    const fallbackMsg = store.addMessage({
      contactId: contact.id,
      accountId: accountId || contact.accountId || 'account_1',
      fromMe: true,
      senderName: senderName || 'Agen CRM',
      text,
      status: 'sent',
      timestamp: new Date().toISOString()
    });

    waManager.emit('wa:message', {
      accountId: accountId || contact.accountId || 'account_1',
      contact,
      message: fallbackMsg
    });

    res.json({
      success: true,
      data: fallbackMsg,
      warning: 'WhatsApp fisik belum terhubung. Pesan disimpan secara internal di CRM.'
    });
  }
});

router.post('/chats/:contactId/note', (req, res) => {
  const { contactId } = req.params;
  const { author, text } = req.body;
  if (!text) {
    return res.status(400).json({ success: false, error: 'Catatan tidak boleh kosong' });
  }

  const note = store.addContactNote(contactId, author, text);
  if (!note) {
    return res.status(404).json({ success: false, error: 'Kontak tidak ditemukan' });
  }

  res.json({ success: true, data: note });
});

// ==========================================
// 4. Contacts Management
// ==========================================
router.get('/contacts', (req, res) => {
  const { agent } = req.query;
  let contacts = store.getContacts();
  if (agent && agent !== 'all') {
    contacts = contacts.filter(c => c.assignedAgent === agent);
  }
  res.json({ success: true, data: contacts });
});

router.post('/contacts', (req, res) => {
  const { name, phone, company, email, tags, stage, dealValue, assignedAgent, accountId } = req.body;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Nomor telepon wajib diisi' });
  }

  const contact = store.findOrCreateContactByPhone(phone, name, accountId || 'account_1');
  store.updateContact(contact.id, {
    name: name || contact.name,
    company: company || contact.company,
    email: email || contact.email,
    tags: tags || contact.tags,
    stage: stage || contact.stage,
    dealValue: Number(dealValue) || contact.dealValue,
    assignedAgent: assignedAgent || contact.assignedAgent,
    accountId: accountId || contact.accountId
  });

  res.json({ success: true, data: contact });
});

router.put('/contacts/:id', (req, res) => {
  const updated = store.updateContact(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Kontak tidak ditemukan' });
  }
  res.json({ success: true, data: updated });
});

// ==========================================
// 5. Sales Pipeline (Kanban Deals)
// ==========================================
router.get('/pipeline', (req, res) => {
  const { agent } = req.query;
  const stages = store.getPipelineStages();
  let contacts = store.getContacts();

  if (agent && agent !== 'all') {
    contacts = contacts.filter(c => c.assignedAgent === agent);
  }

  const board = stages.map(stage => {
    const deals = contacts.filter(c => (c.stage || 'lead') === stage.id);
    const totalValue = deals.reduce((sum, d) => sum + (Number(d.dealValue) || 0), 0);
    return {
      ...stage,
      deals,
      totalValue,
      count: deals.length
    };
  });

  res.json({ success: true, data: board });
});

router.post('/pipeline/move', (req, res) => {
  const { contactId, targetStageId } = req.body;
  const contact = store.moveDealStage(contactId, targetStageId);
  if (!contact) {
    return res.status(404).json({ success: false, error: 'Kontak tidak ditemukan' });
  }
  res.json({ success: true, data: contact });
});

// ==========================================
// 6. Quick Replies
// ==========================================
router.get('/quick-replies', (req, res) => {
  res.json({ success: true, data: store.getQuickReplies() });
});

router.post('/quick-replies', (req, res) => {
  const { shortcut, title, content } = req.body;
  if (!shortcut || !title || !content) {
    return res.status(400).json({ success: false, error: 'Semua kolom wajib diisi' });
  }
  const item = store.addQuickReply({ shortcut, title, content });
  res.json({ success: true, data: item });
});

router.delete('/quick-replies/:id', (req, res) => {
  store.deleteQuickReply(req.params.id);
  res.json({ success: true });
});

// ==========================================
// 7. Broadcast Campaign
// ==========================================
router.get('/broadcasts', (req, res) => {
  res.json({ success: true, data: store.getBroadcasts() });
});

router.post('/broadcasts', async (req, res) => {
  const { title, message, targetTag, accountId, minDelay = 6, maxDelay = 12 } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Isi pesan broadcast wajib diisi' });
  }

  const contacts = store.getContacts();
  let targetRecipients = contacts;

  if (targetTag && targetTag !== 'all') {
    targetRecipients = contacts.filter(c => c.tags && c.tags.includes(targetTag));
  }

  const campaign = store.addBroadcast({
    title: title || 'Broadcast Tanpa Judul',
    message,
    targetTag: targetTag || 'all',
    accountId: accountId || 'account_1',
    totalRecipients: targetRecipients.length,
    status: 'processing',
    sentCount: 0,
    failedCount: 0,
    minDelay,
    maxDelay
  });

  (async () => {
    for (let i = 0; i < targetRecipients.length; i++) {
      const c = targetRecipients[i];
      const personalized = message
        .replace(/\{nama\}/gi, c.name)
        .replace(/\{perusahaan\}/gi, c.company || 'Pelanggan');

      try {
        await waManager.sendMessage(campaign.accountId, c.phone, personalized);
        campaign.sentCount++;
      } catch (err) {
        store.addMessage({
          contactId: c.id,
          accountId: campaign.accountId,
          fromMe: true,
          senderName: 'Broadcast CRM',
          text: personalized,
          status: 'sent',
          timestamp: new Date().toISOString()
        });
        campaign.sentCount++;
      }

      store.save();
      waManager.emit('broadcast:progress', {
        campaignId: campaign.id,
        current: i + 1,
        total: targetRecipients.length,
        sent: campaign.sentCount
      });

      if (i < targetRecipients.length - 1) {
        const randomSeconds = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        await new Promise(resolve => setTimeout(resolve, randomSeconds * 1000));
      }
    }

    campaign.status = 'completed';
    store.save();
    waManager.emit('broadcast:completed', { campaignId: campaign.id });
  })();

  res.json({
    success: true,
    message: `Kampanye broadcast dimulai ke ${targetRecipients.length} kontak.`,
    data: campaign
  });
});

// ==========================================
// 8. Dashboard Statistics
// ==========================================
router.get('/stats', (req, res) => {
  const contacts = store.getContacts();
  const messages = store.getMessages();
  const accounts = store.getAccounts();

  const totalValueDeals = contacts.reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);
  const wonDeals = contacts.filter(c => c.stage === 'won');
  const wonValue = wonDeals.reduce((sum, c) => sum + (Number(c.dealValue) || 0), 0);

  res.json({
    success: true,
    data: {
      totalContacts: contacts.length,
      totalMessages: messages.length,
      activeLeads: contacts.filter(c => c.stage !== 'won' && c.stage !== 'lost').length,
      wonDealsCount: wonDeals.length,
      totalPipelineValue: totalValueDeals,
      wonRevenue: wonValue,
      connectedAccountsCount: accounts.filter(a => a.status === 'connected').length,
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        color: a.color,
        status: waManager.getStatus(a.id).status
      }))
    }
  });
});

module.exports = router;
