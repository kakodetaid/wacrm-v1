const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'storage');
const DB_FILE = path.join(DATA_DIR, 'crm_db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function normalizeIndonesianPhone(phone) {
  if (!phone) return '';
  let clean = phone.toString().replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean;
}

const defaultData = {
  users: [
    {
      id: 'u1',
      username: 'admin',
      password: 'admin123',
      name: 'Super Admin',
      role: 'admin',
      email: 'admin@crm.local'
    },
    {
      id: 'u2',
      username: 'sales',
      password: 'sales123',
      name: 'Rian Sales',
      role: 'sales',
      email: 'rian@crm.local'
    },
    {
      id: 'u3',
      username: 'cs',
      password: 'cs123',
      name: 'Dewi CS',
      role: 'sales',
      email: 'dewi@crm.local'
    },
    {
      id: 'u4',
      username: 'support',
      password: 'support123',
      name: 'Fajar Support',
      role: 'sales',
      email: 'fajar@crm.local'
    }
  ],
  accounts: [
    {
      id: 'account_1',
      name: 'WA 1 - CS & Layanan Utama',
      phone: '',
      color: '#10B981',
      role: 'Layanan Pelanggan & Informasi',
      assignedAgent: 'Dewi CS',
      assignedUsername: 'cs',
      status: 'disconnected',
      user: null
    },
    {
      id: 'account_2',
      name: 'WA 2 - Sales & Akuisisi',
      phone: '',
      color: '#3B82F6',
      role: 'Penjualan & Penawaran Prospek',
      assignedAgent: 'Rian Sales',
      assignedUsername: 'sales',
      status: 'disconnected',
      user: null
    },
    {
      id: 'account_3',
      name: 'WA 3 - Aftersales & Tagihan',
      phone: '',
      color: '#F59E0B',
      role: 'Dukungan Teknis & Penagihan',
      assignedAgent: 'Fajar Support',
      assignedUsername: 'support',
      status: 'disconnected',
      user: null
    }
  ],
  contacts: [],
  messages: [],
  quickReplies: [
    {
      id: 'qr1',
      shortcut: '/salam',
      title: 'Salam Pembuka Ramah',
      content: 'Halo Kak! Terima kasih sudah menghubungi kami. Ada yang bisa kami bantu seputar kebutuhan bisnis Anda hari ini? 😊'
    },
    {
      id: 'qr2',
      shortcut: '/rek',
      title: 'Informasi Rekening Bank',
      content: 'Pembayaran resmi dapat ditransfer melalui:\n💳 Bank BCA: 8870-123-456 a.n PT Bisnis Solusi Digital\nMohon sertakan bukti transfer setelah melakukan transaksi ya Kak. Terima kasih!'
    },
    {
      id: 'qr3',
      shortcut: '/jamkerja',
      title: 'Jam Operasional Kantor',
      content: 'Jam operasional layanan kami:\nSenin - Jumat: 08.30 - 17.00 WIB\nSabtu: 09.00 - 14.00 WIB\nPesan di luar jam kerja akan kami respon segera pada jam kerja berikutnya 🙏'
    },
    {
      id: 'qr4',
      shortcut: '/katalog',
      title: 'Pricelist & Brosur',
      content: 'Berikut tautan brosur dan pricelist paket lengkap kami:\n👉 https://example.com/pricelist-2026\nSilakan dipelajari terlebih dahulu, kami siap bantu jelaskan detailnya.'
    }
  ],
  pipelineStages: [
    { id: 'lead', title: 'Lead Masuk', color: '#94A3B8' },
    { id: 'contacted', title: 'Dihubungi / Follow Up', color: '#3B82F6' },
    { id: 'qualified', title: 'Kualifikasi Kebutuhan', color: '#8B5CF6' },
    { id: 'negotiation', title: 'Penawaran & Negosiasi', color: '#F59E0B' },
    { id: 'won', title: 'Closing / Deal', color: '#10B981' },
    { id: 'lost', title: 'Tidak Tertarik / Batal', color: '#EF4444' }
  ],
  agents: [
    { id: 'ag1', name: 'Dewi CS', role: 'Customer Service', email: 'dewi@crm.local', active: true },
    { id: 'ag2', name: 'Rian Sales', role: 'Sales Executive', email: 'rian@crm.local', active: true },
    { id: 'ag3', name: 'Fajar Support', role: 'Technical Support', email: 'fajar@crm.local', active: true }
  ],
  broadcastCampaigns: []
};

class Store {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.users) parsed.users = defaultData.users;
        if (!parsed.pipelineStages) parsed.pipelineStages = defaultData.pipelineStages;
        
        // Ensure support user exists in users
        if (!parsed.users.some(u => u.username === 'support')) {
          parsed.users.push({
            id: 'u4',
            username: 'support',
            password: 'support123',
            name: 'Fajar Support',
            role: 'sales',
            email: 'fajar@crm.local'
          });
        }

        // Backfill assignedAgent and assignedUsername on accounts
        if (parsed.accounts) {
          parsed.accounts.forEach(acc => {
            if (!acc.assignedAgent) {
              if (acc.id === 'account_1') {
                acc.assignedAgent = 'Dewi CS';
                acc.assignedUsername = 'cs';
              } else if (acc.id === 'account_2') {
                acc.assignedAgent = 'Rian Sales';
                acc.assignedUsername = 'sales';
              } else if (acc.id === 'account_3') {
                acc.assignedAgent = 'Fajar Support';
                acc.assignedUsername = 'support';
              }
            }
          });
        }

        // Auto-heal & merge duplicate contacts created from WhatsApp LID (e.g. 4510437093482 -> 6287898586605)
        if (parsed.contacts && parsed.messages) {
          const sessionDir = path.join(__dirname, '..', 'sessions');
          const contactsToRemove = new Set();

          parsed.contacts.forEach(contact => {
            const phoneDigits = contact.phone ? contact.phone.replace(/[^0-9]/g, '') : '';
            let mappedPn = null;

            // Search session directory for reverse LID mapping
            if (fs.existsSync(sessionDir)) {
              const accDirs = fs.readdirSync(sessionDir);
              for (const accDir of accDirs) {
                const reverseFile = path.join(sessionDir, accDir, `lid-mapping-${phoneDigits}_reverse.json`);
                if (fs.existsSync(reverseFile)) {
                  try {
                    mappedPn = JSON.parse(fs.readFileSync(reverseFile, 'utf8'));
                    if (mappedPn) break;
                  } catch (e) {}
                }
              }
            }

            if (mappedPn) {
              const realPhone = normalizeIndonesianPhone(mappedPn);
              const realContact = parsed.contacts.find(c => c.id !== contact.id && normalizeIndonesianPhone(c.phone) === realPhone);
              if (realContact) {
                realContact.lid = phoneDigits;
                // Re-link all messages from LID contact to real contact
                parsed.messages.forEach(m => {
                  if (m.contactId === contact.id) {
                    m.contactId = realContact.id;
                  }
                });
                contactsToRemove.add(contact.id);
                console.log(`[Store] Berhasil menggabungkan kontak LID ${contact.name} (${contact.phone}) ke kontak asli ${realContact.name} (${realContact.phone})`);
              } else {
                contact.phone = realPhone;
                contact.lid = phoneDigits;
                console.log(`[Store] Memperbaiki nomor kontak LID ${contact.name} dari ${phoneDigits} ke ${realPhone}`);
              }
            }
          });

          if (contactsToRemove.size > 0) {
            parsed.contacts = parsed.contacts.filter(c => !contactsToRemove.has(c.id));
          }
        }

        return parsed;
      }
    } catch (e) {
      console.error('Error reading database file, using defaults:', e);
    }
    this.save(defaultData);
    return defaultData;
  }

  save(data = this.data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to persist store:', e);
    }
  }

  // Clear contacts & messages history
  clearAllHistory() {
    this.data.contacts = [];
    this.data.messages = [];
    this.data.broadcastCampaigns = [];
    this.save();
    return { success: true, message: 'Semua kontak dan riwayat chat berhasil dibersihkan.' };
  }

  // Auth & Users
  getUsers() {
    return this.data.users || defaultData.users;
  }

  authenticate(username, password) {
    const user = this.getUsers().find(u => 
      u.username.toLowerCase() === (username || '').toLowerCase() && u.password === password
    );
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  addUser(userData) {
    const newUser = {
      id: 'u_' + uuidv4().substring(0, 8),
      username: userData.username.toLowerCase(),
      password: userData.password || '123456',
      name: userData.name,
      role: userData.role || 'sales',
      email: userData.email || ''
    };
    if (!this.data.users) this.data.users = [];
    this.data.users.push(newUser);
    this.save();
    const { password: _, ...safe } = newUser;
    return safe;
  }

  // Account Helpers
  getAccounts() {
    return this.data.accounts;
  }

  getAccount(id) {
    return this.data.accounts.find(a => a.id === id);
  }

  updateAccountStatus(id, status, user = null) {
    const acc = this.getAccount(id);
    if (acc) {
      acc.status = status;
      if (user) {
        acc.user = user;
        if (user.id) {
          const rawId = user.id.split(':')[0] || user.id.split('@')[0];
          acc.phone = normalizeIndonesianPhone(rawId);
        }
      } else if (status === 'disconnected') {
        acc.user = null;
      }
      this.save();
    }
    return acc;
  }

  assignAccountToAgent(id, assignedAgent, assignedUsername = null) {
    const acc = this.getAccount(id);
    if (acc) {
      acc.assignedAgent = assignedAgent;
      if (assignedUsername) {
        acc.assignedUsername = assignedUsername;
      } else {
        const u = this.getUsers().find(user => user.name === assignedAgent);
        if (u) acc.assignedUsername = u.username;
      }
      this.save();
      return acc;
    }
    return null;
  }

  // Contact Helpers
  getContacts() {
    return this.data.contacts || [];
  }

  getContact(id) {
    return this.data.contacts.find(c => c.id === id);
  }

  getContactByPhone(phone) {
    const normalized = normalizeIndonesianPhone(phone);
    return (this.data.contacts || []).find(c => normalizeIndonesianPhone(c.phone) === normalized);
  }

  findContactByLid(lid) {
    if (!lid) return null;
    const clean = lid.toString().replace(/[^0-9]/g, '');
    return (this.data.contacts || []).find(c => c.lid === clean);
  }

  findOrCreateContactByPhone(phone, name = '', accountId = 'account_1', lid = '') {
    const normalizedPhone = normalizeIndonesianPhone(phone);
    const cleanLid = lid ? lid.toString().replace(/[^0-9]/g, '') : '';
    
    // 1. Cari berdasarkan nomor telepon
    let contact = this.getContactByPhone(normalizedPhone);

    // 2. Jika belum ditemukan, coba cari berdasarkan WhatsApp LID
    if (!contact && cleanLid) {
      contact = this.findContactByLid(cleanLid);
    }

    if (contact) {
      // Hubungkan LID ke kontak jika belum terdata
      if (cleanLid && !contact.lid) {
        contact.lid = cleanLid;
        this.save();
      }
      // Perbarui nama kontak jika nama sebelumnya masih placeholder bawaan
      if (name && contact.name.startsWith('Kontak ') && !name.startsWith('Kontak ')) {
        contact.name = name;
        this.save();
      }
      return contact;
    }

    const acc = this.getAccount(accountId);
    const defaultAgent = acc?.assignedAgent || 'Dewi CS';

    contact = {
      id: 'c_' + uuidv4().substring(0, 8),
      name: name || `Kontak ${normalizedPhone.slice(-4)}`,
      phone: normalizedPhone,
      lid: cleanLid || null,
      company: '-',
      email: '',
      tags: ['Lead Baru'],
      assignedAgent: defaultAgent,
      accountId: accountId,
      stage: 'lead',
      dealValue: 0,
      createdAt: new Date().toISOString(),
      notes: []
    };
    if (!this.data.contacts) this.data.contacts = [];
    this.data.contacts.unshift(contact);
    this.save();
    return contact;
  }

  updateContact(id, updates) {
    const contact = this.getContact(id);
    if (contact) {
      if (updates.phone) {
        updates.phone = normalizeIndonesianPhone(updates.phone);
      }
      Object.assign(contact, updates);
      this.save();
    }
    return contact;
  }

  addContactNote(id, author, text) {
    const contact = this.getContact(id);
    if (contact) {
      if (!contact.notes) contact.notes = [];
      const note = {
        id: 'n_' + uuidv4().substring(0, 8),
        author: author || 'Admin',
        text,
        createdAt: new Date().toISOString()
      };
      contact.notes.unshift(note);
      this.save();
      return note;
    }
    return null;
  }

  // Messages
  getMessages(contactId) {
    if (!this.data.messages) this.data.messages = [];
    if (!contactId) return this.data.messages;
    return this.data.messages
      .filter(m => m.contactId === contactId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  addMessage(msg) {
    if (!this.data.messages) this.data.messages = [];
    const newMsg = {
      id: msg.id || 'm_' + uuidv4().substring(0, 10),
      contactId: msg.contactId,
      accountId: msg.accountId,
      fromMe: !!msg.fromMe,
      senderName: msg.senderName || '',
      text: msg.text || '',
      timestamp: msg.timestamp || new Date().toISOString(),
      status: msg.status || 'sent',
      mediaUrl: msg.mediaUrl || null,
      mediaType: msg.mediaType || null
    };
    this.data.messages.push(newMsg);
    this.save();
    return newMsg;
  }

  // Quick Replies
  getQuickReplies() {
    return this.data.quickReplies || [];
  }

  addQuickReply(qr) {
    const item = {
      id: 'qr_' + uuidv4().substring(0, 8),
      shortcut: qr.shortcut.startsWith('/') ? qr.shortcut : '/' + qr.shortcut,
      title: qr.title,
      content: qr.content
    };
    if (!this.data.quickReplies) this.data.quickReplies = [];
    this.data.quickReplies.push(item);
    this.save();
    return item;
  }

  deleteQuickReply(id) {
    this.data.quickReplies = this.data.quickReplies.filter(q => q.id !== id);
    this.save();
  }

  // Pipeline Stages & Deals
  getPipelineStages() {
    return this.data.pipelineStages || defaultData.pipelineStages;
  }

  moveDealStage(contactId, stageId) {
    return this.updateContact(contactId, { stage: stageId });
  }

  // Agents
  getAgents() {
    return this.data.agents || [];
  }

  // Broadcast
  getBroadcasts() {
    return this.data.broadcastCampaigns || [];
  }

  addBroadcast(campaign) {
    const c = {
      id: 'bc_' + uuidv4().substring(0, 8),
      createdAt: new Date().toISOString(),
      ...campaign
    };
    if (!this.data.broadcastCampaigns) this.data.broadcastCampaigns = [];
    this.data.broadcastCampaigns.unshift(c);
    this.save();
    return c;
  }

  // Chat Audit Report for Admin with Per-Sales and Per-Device Filtering
  getChatReports(agentName = null, accountId = null) {
    const messages = this.getMessages();
    const contacts = this.getContacts();
    const accounts = this.getAccounts();

    const contactMap = {};
    contacts.forEach(c => {
      contactMap[c.id] = c;
    });

    const accountMap = {};
    accounts.forEach(a => {
      accountMap[a.id] = a;
    });

    let filtered = messages;

    // Filter by Account / Saluran WA
    if (accountId && accountId !== 'all') {
      filtered = filtered.filter(m => m.accountId === accountId);
    }

    // Filter by Petugas / Sales
    if (agentName && agentName !== 'all') {
      filtered = filtered.filter(m => {
        const contact = contactMap[m.contactId];
        const account = accountMap[m.accountId];

        // 1. Message sent by this agent
        if (m.fromMe && (m.senderName === agentName || m.senderName?.includes(agentName))) {
          return true;
        }
        // 2. Incoming message for a contact assigned to this agent
        if (contact && (contact.assignedAgent === agentName || contact.assignedAgent?.includes(agentName))) {
          return true;
        }
        // 3. Message through WA device assigned to this agent
        if (account && (account.assignedAgent === agentName || account.assignedAgent?.includes(agentName))) {
          return true;
        }
        return false;
      });
    }

    const reportByAgent = {};
    messages.forEach(m => {
      const contact = contactMap[m.contactId];
      const account = accountMap[m.accountId];
      const agent = m.fromMe 
        ? (m.senderName || account?.assignedAgent || 'Sales') 
        : (contact?.assignedAgent || account?.assignedAgent || 'Pelanggan');
      
      if (!reportByAgent[agent]) {
        reportByAgent[agent] = { sent: 0, received: 0 };
      }
      if (m.fromMe) {
        reportByAgent[agent].sent++;
      } else {
        reportByAgent[agent].received++;
      }
    });

    return {
      totalMessages: messages.length,
      filteredTotal: filtered.length,
      sentCount: filtered.filter(m => m.fromMe).length,
      receivedCount: filtered.filter(m => !m.fromMe).length,
      reportByAgent,
      recentMessages: filtered.slice(-100).reverse().map(m => {
        const contact = contactMap[m.contactId];
        const account = accountMap[m.accountId];
        return {
          ...m,
          contactName: contact ? contact.name : 'Unknown',
          contactPhone: contact ? contact.phone : '',
          assignedAgent: contact?.assignedAgent || account?.assignedAgent || (m.fromMe ? m.senderName : 'Tim CS/Sales'),
          accountName: account ? account.name : m.accountId
        };
      })
    };
  }
}

module.exports = new Store();
