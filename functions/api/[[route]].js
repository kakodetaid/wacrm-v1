// Cloudflare Pages Functions API Router dengan Cloudflare D1
// Menghandle seluruh route /api/* secara serverless di Edge Network

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-gateway-key'
    }
  });
}

function normalizePhone(phone) {
  if (!phone) return '';
  let clean = phone.toString().replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  else if (clean.startsWith('8')) clean = '62' + clean;
  return clean;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api/, '');
  const method = request.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-gateway-key'
      }
    });
  }

  // D1 Database Binding
  const db = env.DB || env.wacrm_d1_db;
  if (!db) {
    return jsonResponse({ success: false, error: 'Database D1 binding tidak ditemukan' }, 500);
  }

  try {
    // ==========================================
    // 1. AUTH & USERS
    // ==========================================
    if (path === '/auth/login' && method === 'POST') {
      const body = await request.json();
      const { username, password } = body;
      const user = await db.prepare("SELECT id, username, name, role, email FROM users WHERE LOWER(username) = LOWER(?) AND password = ?")
        .bind(username || '', password || '')
        .first();

      if (!user) {
        return jsonResponse({ success: false, error: 'Username atau password salah' }, 401);
      }
      return jsonResponse({ success: true, data: user });
    }

    if (path === '/auth/users' && method === 'GET') {
      const { results } = await db.prepare("SELECT id, username, name, role, email FROM users").all();
      return jsonResponse({ success: true, data: results });
    }

    // ==========================================
    // 2. WHATSAPP ACCOUNTS
    // ==========================================
    if (path === '/accounts' && method === 'GET') {
      const { results } = await db.prepare("SELECT id, name, phone, color, role, assigned_agent as assignedAgent, assigned_username as assignedUsername, status FROM accounts").all();
      return jsonResponse({ success: true, data: results });
    }

    const assignMatch = path.match(/^\/accounts\/([^\/]+)\/assign$/);
    if (assignMatch && method === 'POST') {
      const accountId = assignMatch[1];
      const body = await request.json();
      const { assignedAgent, assignedUsername } = body;

      await db.prepare("UPDATE accounts SET assigned_agent = ?, assigned_username = ? WHERE id = ?")
        .bind(assignedAgent || '', assignedUsername || '', accountId)
        .run();

      const updated = await db.prepare("SELECT id, name, phone, color, role, assigned_agent as assignedAgent, assigned_username as assignedUsername, status FROM accounts WHERE id = ?")
        .bind(accountId)
        .first();

      return jsonResponse({ success: true, data: updated, message: `Perangkat ${accountId} ditugaskan ke ${assignedAgent}` });
    }

    // ==========================================
    // 3. CONTACTS
    // ==========================================
    if (path === '/contacts' && method === 'GET') {
      const { results } = await db.prepare("SELECT * FROM contacts ORDER BY created_at DESC").all();
      const formatted = results.map(c => ({
        ...c,
        assignedAgent: c.assigned_agent,
        accountId: c.account_id,
        dealValue: c.deal_value,
        createdAt: c.created_at,
        tags: c.tags ? JSON.parse(c.tags) : [],
        notes: c.notes ? JSON.parse(c.notes) : []
      }));
      return jsonResponse({ success: true, data: formatted });
    }

    if (path === '/contacts' && method === 'POST') {
      const body = await request.json();
      const id = 'c_' + crypto.randomUUID().substring(0, 8);
      const cleanPhone = normalizePhone(body.phone);
      const now = new Date().toISOString();
      const tags = JSON.stringify(body.tags || ['Lead Baru']);
      const notes = JSON.stringify([]);

      await db.prepare(`
        INSERT INTO contacts (id, name, phone, company, email, tags, assigned_agent, account_id, stage, deal_value, created_at, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        body.name || 'Kontak Baru',
        cleanPhone,
        body.company || '-',
        body.email || '',
        tags,
        body.assignedAgent || 'Dewi CS',
        body.accountId || 'account_1',
        body.stage || 'lead',
        Number(body.dealValue || 0),
        now,
        notes
      ).run();

      const newContact = {
        id,
        name: body.name || 'Kontak Baru',
        phone: cleanPhone,
        company: body.company || '-',
        email: body.email || '',
        tags: body.tags || ['Lead Baru'],
        assignedAgent: body.assignedAgent || 'Dewi CS',
        accountId: body.accountId || 'account_1',
        stage: body.stage || 'lead',
        dealValue: Number(body.dealValue || 0),
        createdAt: now,
        notes: []
      };

      return jsonResponse({ success: true, data: newContact }, 201);
    }

    // Update Stage
    const stageMatch = path.match(/^\/contacts\/([^\/]+)\/stage$/);
    if (stageMatch && method === 'PUT') {
      const contactId = stageMatch[1];
      const body = await request.json();
      await db.prepare("UPDATE contacts SET stage = ? WHERE id = ?").bind(body.stage || 'lead', contactId).run();
      return jsonResponse({ success: true, message: 'Stage diperbarui' });
    }

    // Update Deal Value
    const dealMatch = path.match(/^\/contacts\/([^\/]+)\/deal-value$/);
    if (dealMatch && method === 'PUT') {
      const contactId = dealMatch[1];
      const body = await request.json();
      await db.prepare("UPDATE contacts SET deal_value = ? WHERE id = ?").bind(Number(body.dealValue || 0), contactId).run();
      return jsonResponse({ success: true, message: 'Deal value diperbarui' });
    }

    // Add Note
    const noteMatch = path.match(/^\/contacts\/([^\/]+)\/notes$/);
    if (noteMatch && method === 'POST') {
      const contactId = noteMatch[1];
      const body = await request.json();
      const contact = await db.prepare("SELECT notes FROM contacts WHERE id = ?").bind(contactId).first();
      if (contact) {
        const notes = contact.notes ? JSON.parse(contact.notes) : [];
        const newNote = {
          id: 'n_' + crypto.randomUUID().substring(0, 8),
          author: body.author || 'Admin',
          text: body.text,
          createdAt: new Date().toISOString()
        };
        notes.unshift(newNote);
        await db.prepare("UPDATE contacts SET notes = ? WHERE id = ?").bind(JSON.stringify(notes), contactId).run();
        return jsonResponse({ success: true, data: newNote });
      }
      return jsonResponse({ success: false, error: 'Kontak tidak ditemukan' }, 404);
    }

    // Delete Contact
    const contactDelMatch = path.match(/^\/contacts\/([^\/]+)$/);
    if (contactDelMatch && method === 'DELETE') {
      const contactId = contactDelMatch[1];
      await db.prepare("DELETE FROM messages WHERE contact_id = ?").bind(contactId).run();
      await db.prepare("DELETE FROM contacts WHERE id = ?").bind(contactId).run();
      return jsonResponse({ success: true, message: 'Kontak berhasil dihapus' });
    }

    // ==========================================
    // 4. CHATS & INBOX
    // ==========================================
    if (path === '/chats' && method === 'GET') {
      const accountId = url.searchParams.get('accountId');
      const agent = url.searchParams.get('agent');
      const tag = url.searchParams.get('tag');
      const search = url.searchParams.get('search');

      let query = "SELECT * FROM contacts WHERE 1=1";
      const params = [];

      if (accountId && accountId !== 'all') {
        query += " AND account_id = ?";
        params.push(accountId);
      }
      if (agent && agent !== 'all') {
        query += " AND assigned_agent = ?";
        params.push(agent);
      }
      if (search) {
        query += " AND (LOWER(name) LIKE ? OR phone LIKE ? OR LOWER(company) LIKE ?)";
        const term = `%${search.toLowerCase()}%`;
        params.push(term, `%${search}%`, term);
      }

      query += " ORDER BY created_at DESC";

      const stmt = db.prepare(query);
      const { results: rawContacts } = await (params.length ? stmt.bind(...params) : stmt).all();

      let contacts = rawContacts.map(c => ({
        ...c,
        assignedAgent: c.assigned_agent,
        accountId: c.account_id,
        dealValue: c.deal_value,
        createdAt: c.created_at,
        tags: c.tags ? JSON.parse(c.tags) : [],
        notes: c.notes ? JSON.parse(c.notes) : []
      }));

      if (tag) {
        contacts = contacts.filter(c => c.tags && c.tags.includes(tag));
      }

      // Gabungkan dengan pesan terakhir untuk tiap kontak
      const chats = await Promise.all(contacts.map(async (contact) => {
        const lastMsg = await db.prepare("SELECT * FROM messages WHERE contact_id = ? ORDER BY timestamp DESC LIMIT 1").bind(contact.id).first();
        const unreadCountRow = await db.prepare("SELECT COUNT(*) as count FROM messages WHERE contact_id = ? AND from_me = 0 AND status != 'read'").bind(contact.id).first();
        const totalCountRow = await db.prepare("SELECT COUNT(*) as count FROM messages WHERE contact_id = ?").bind(contact.id).first();

        return {
          contact,
          lastMessage: lastMsg ? {
            id: lastMsg.id,
            contactId: lastMsg.contact_id,
            accountId: lastMsg.account_id,
            fromMe: !!lastMsg.from_me,
            senderName: lastMsg.sender_name,
            text: lastMsg.text,
            timestamp: lastMsg.timestamp,
            status: lastMsg.status
          } : null,
          unreadCount: unreadCountRow ? unreadCountRow.count : 0,
          totalMessages: totalCountRow ? totalCountRow.count : 0
        };
      }));

      // Urutkan waktu terbaru
      chats.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.timestamp) : new Date(a.contact.createdAt);
        const timeB = b.lastMessage ? new Date(b.lastMessage.timestamp) : new Date(b.contact.createdAt);
        return timeB - timeA;
      });

      return jsonResponse({ success: true, data: chats });
    }

    const messagesMatch = path.match(/^\/chats\/([^\/]+)\/messages$/);
    if (messagesMatch && method === 'GET') {
      const contactId = messagesMatch[1];
      const rawContact = await db.prepare("SELECT * FROM contacts WHERE id = ?").bind(contactId).first();
      if (!rawContact) return jsonResponse({ success: false, error: 'Kontak tidak ditemukan' }, 404);

      const contact = {
        ...rawContact,
        assignedAgent: rawContact.assigned_agent,
        accountId: rawContact.account_id,
        dealValue: rawContact.deal_value,
        createdAt: rawContact.created_at,
        tags: rawContact.tags ? JSON.parse(rawContact.tags) : [],
        notes: rawContact.notes ? JSON.parse(rawContact.notes) : []
      };

      const { results: rawMsgs } = await db.prepare("SELECT * FROM messages WHERE contact_id = ? ORDER BY timestamp ASC").bind(contactId).all();
      const messages = rawMsgs.map(m => ({
        id: m.id,
        contactId: m.contact_id,
        accountId: m.account_id,
        fromMe: !!m.from_me,
        senderName: m.sender_name,
        text: m.text,
        timestamp: m.timestamp,
        status: m.status
      }));

      // Tandai pesan sudah dibaca
      await db.prepare("UPDATE messages SET status = 'read' WHERE contact_id = ? AND from_me = 0").bind(contactId).run();

      return jsonResponse({
        success: true,
        data: {
          contact,
          messages,
          notes: contact.notes || []
        }
      });
    }

    if (messagesMatch && method === 'POST') {
      const contactId = messagesMatch[1];
      const body = await request.json();
      const id = 'm_' + crypto.randomUUID().substring(0, 8);
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO messages (id, contact_id, account_id, from_me, sender_name, text, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        contactId,
        body.accountId || 'account_1',
        body.fromMe !== false ? 1 : 0,
        body.senderName || 'Agen CRM',
        body.text || '',
        now,
        'sent'
      ).run();

      const newMsg = {
        id,
        contactId,
        accountId: body.accountId || 'account_1',
        fromMe: body.fromMe !== false,
        senderName: body.senderName || 'Agen CRM',
        text: body.text || '',
        timestamp: now,
        status: 'sent'
      };

      return jsonResponse({ success: true, data: newMsg }, 201);
    }

    // ==========================================
    // 5. QUICK REPLIES & PIPELINE
    // ==========================================
    if (path === '/quick-replies' && method === 'GET') {
      const { results } = await db.prepare("SELECT * FROM quick_replies").all();
      return jsonResponse({ success: true, data: results });
    }

    if (path === '/quick-replies' && method === 'POST') {
      const body = await request.json();
      const id = 'qr_' + crypto.randomUUID().substring(0, 8);
      await db.prepare("INSERT INTO quick_replies (id, shortcut, title, content) VALUES (?, ?, ?, ?)")
        .bind(id, body.shortcut, body.title, body.content)
        .run();
      return jsonResponse({ success: true, data: { id, ...body } }, 201);
    }

    const qrDelMatch = path.match(/^\/quick-replies\/([^\/]+)$/);
    if (qrDelMatch && method === 'DELETE') {
      await db.prepare("DELETE FROM quick_replies WHERE id = ?").bind(qrDelMatch[1]).run();
      return jsonResponse({ success: true, message: 'Quick reply dihapus' });
    }

    if (path === '/pipeline/stages' && method === 'GET') {
      const { results } = await db.prepare("SELECT id, title, color FROM pipeline_stages ORDER BY sort_order ASC").all();
      return jsonResponse({ success: true, data: results });
    }

    // ==========================================
    // 6. ADMIN AUDIT LOG
    // ==========================================
    if (path === '/admin/chat-reports' && method === 'GET') {
      const agent = url.searchParams.get('agent');
      const accountId = url.searchParams.get('accountId');

      let query = `
        SELECT m.*, c.name as contactName, c.phone as contactPhone, c.assigned_agent as assignedAgent, a.name as accountName
        FROM messages m
        JOIN contacts c ON m.contact_id = c.id
        LEFT JOIN accounts a ON m.account_id = a.id
        WHERE 1=1
      `;
      const params = [];

      if (agent && agent !== 'all') {
        query += " AND (c.assigned_agent = ? OR (m.from_me = 1 AND m.sender_name = ?))";
        params.push(agent, agent);
      }
      if (accountId && accountId !== 'all') {
        query += " AND m.account_id = ?";
        params.push(accountId);
      }

      query += " ORDER BY m.timestamp DESC LIMIT 100";

      const stmt = db.prepare(query);
      const { results } = await (params.length ? stmt.bind(...params) : stmt).all();

      const recentMessages = results.map(r => ({
        id: r.id,
        contactId: r.contact_id,
        accountId: r.account_id,
        fromMe: !!r.from_me,
        senderName: r.sender_name,
        text: r.text,
        timestamp: r.timestamp,
        status: r.status,
        contactName: r.contactName,
        contactPhone: r.contactPhone,
        assignedAgent: r.assignedAgent,
        accountName: r.accountName || r.account_id
      }));

      // Ringkasan Stats
      const totalMsgRow = await db.prepare("SELECT COUNT(*) as count FROM messages").first();
      const outRow = await db.prepare("SELECT COUNT(*) as count FROM messages WHERE from_me = 1").first();
      const inRow = await db.prepare("SELECT COUNT(*) as count FROM messages WHERE from_me = 0").first();
      const totalContactsRow = await db.prepare("SELECT COUNT(*) as count FROM contacts").first();

      return jsonResponse({
        success: true,
        data: {
          stats: {
            totalMessages: totalMsgRow ? totalMsgRow.count : 0,
            outgoingMessages: outRow ? outRow.count : 0,
            incomingMessages: inRow ? inRow.count : 0,
            totalContacts: totalContactsRow ? totalContactsRow.count : 0
          },
          recentMessages
        }
      });
    }

    // ==========================================
    // 7. GATEWAY SYNC WEBHOOK (Untuk WhatsApp Runner)
    // ==========================================
    if (path === '/gateway/sync-message' && method === 'POST') {
      const body = await request.json();
      const { accountId, phone, lid, pushName, fromMe, senderName, text, timestamp } = body;
      const cleanPhone = normalizePhone(phone);

      // Cari atau buat kontak otomatis di D1
      let contact = await db.prepare("SELECT * FROM contacts WHERE phone = ?").bind(cleanPhone).first();
      if (!contact && lid) {
        contact = await db.prepare("SELECT * FROM contacts WHERE lid = ?").bind(lid).first();
      }

      if (!contact) {
        const contactId = 'c_' + crypto.randomUUID().substring(0, 8);
        const acc = await db.prepare("SELECT assigned_agent FROM accounts WHERE id = ?").bind(accountId).first();
        const agentName = acc?.assigned_agent || 'Dewi CS';
        const now = new Date().toISOString();

        await db.prepare(`
          INSERT INTO contacts (id, name, phone, lid, company, email, tags, assigned_agent, account_id, stage, deal_value, created_at, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          contactId,
          pushName || `Kontak ${cleanPhone.slice(-4)}`,
          cleanPhone,
          lid || null,
          '-',
          '',
          '["Lead Baru"]',
          agentName,
          accountId,
          'lead',
          0,
          now,
          '[]'
        ).run();

        contact = { id: contactId };
      } else if (lid && !contact.lid) {
        await db.prepare("UPDATE contacts SET lid = ? WHERE id = ?").bind(lid, contact.id).run();
      }

      // Masukkan pesan ke D1
      const msgId = 'm_' + crypto.randomUUID().substring(0, 8);
      await db.prepare(`
        INSERT INTO messages (id, contact_id, account_id, from_me, sender_name, text, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        msgId,
        contact.id,
        accountId,
        fromMe ? 1 : 0,
        senderName || 'Pelanggan',
        text || '',
        timestamp || new Date().toISOString(),
        fromMe ? 'sent' : 'delivered'
      ).run();

      return jsonResponse({ success: true, messageId: msgId, contactId: contact.id });
    }

    return jsonResponse({ success: false, error: `Route ${method} ${path} tidak ditemukan` }, 404);
  } catch (err) {
    console.error('API Error:', err);
    return jsonResponse({ success: false, error: err.message }, 500);
  }
}
