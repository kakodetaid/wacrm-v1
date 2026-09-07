const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  delay
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const store = require('../data/store');

class WhatsAppManager {
  constructor() {
    this.sessions = new Map(); // accountId -> { sock, qrDataUrl, status }
    this.io = null; // Socket.IO instance
    this.baseSessionDir = process.env.WACRM_DATA_PATH
      ? path.join(process.env.WACRM_DATA_PATH, 'sessions')
      : path.join(__dirname, '..', 'sessions');

    if (!fs.existsSync(this.baseSessionDir)) {
      fs.mkdirSync(this.baseSessionDir, { recursive: true });
    }
  }

  setIO(io) {
    this.io = io;
  }

  emit(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  async initAll() {
    const accounts = store.getAccounts();
    console.log(`[WhatsAppManager] Inisialisasi ${accounts.length} nomor akun WhatsApp...`);
    for (const acc of accounts) {
      const sessionPath = path.join(this.baseSessionDir, acc.id);
      // Jika folder session ada creds.json, coba connect otomatis
      if (fs.existsSync(path.join(sessionPath, 'creds.json'))) {
        console.log(`[WhatsAppManager] Menemukan sesi tersimpan untuk ${acc.id} (${acc.name}), menghubungkan...`);
        this.connectAccount(acc.id).catch(err => {
          console.error(`Gagal menghubungkan ${acc.id}:`, err.message);
        });
      } else {
        this.sessions.set(acc.id, {
          sock: null,
          qrDataUrl: null,
          status: 'disconnected'
        });
      }
    }
  }

  async connectAccount(accountId) {
    const account = store.getAccount(accountId);
    if (!account) throw new Error('Akun tidak ditemukan');

    const sessionPath = path.join(this.baseSessionDir, accountId);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    let { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    store.updateAccountStatus(accountId, 'connecting');
    this.emit('wa:status', { accountId, status: 'connecting' });

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: state,
      browser: ['CRM Multi-Device', 'Chrome', '120.0.0.0'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: false
    });

    this.sessions.set(accountId, {
      sock,
      qrDataUrl: null,
      status: 'connecting'
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await qrcode.toDataURL(qr, { width: 300, margin: 2 });
          const current = this.sessions.get(accountId) || {};
          current.qrDataUrl = qrDataUrl;
          current.status = 'qr_ready';
          this.sessions.set(accountId, current);

          store.updateAccountStatus(accountId, 'qr_ready');
          this.emit('wa:qr', { accountId, qr: qrDataUrl });
          this.emit('wa:status', { accountId, status: 'qr_ready' });
          console.log(`[${accountId}] QR Code siap di-scan dari HP WhatsApp Bisnis.`);
        } catch (qrErr) {
          console.error(`Error generating QR code for ${accountId}:`, qrErr);
        }
      }

      if (connection === 'open') {
        const user = sock.user;
        const current = this.sessions.get(accountId) || {};
        current.status = 'connected';
        current.qrDataUrl = null;
        this.sessions.set(accountId, current);

        const updatedAcc = store.updateAccountStatus(accountId, 'connected', user);
        this.emit('wa:status', {
          accountId,
          status: 'connected',
          account: updatedAcc
        });
        console.log(`[${accountId}] WhatsApp berhasil terhubung! User: ${user?.id || user?.name}`);
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`[${accountId}] Koneksi terputus: code=${statusCode}, shouldReconnect=${shouldReconnect}`);

        const current = this.sessions.get(accountId) || {};
        current.status = 'disconnected';
        current.qrDataUrl = null;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log(`[${accountId}] User logout dari HP. Menghapus sesi lama...`);
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          } catch (e) {}
          store.updateAccountStatus(accountId, 'disconnected', null);
          this.emit('wa:status', { accountId, status: 'disconnected' });
        } else if (shouldReconnect) {
          store.updateAccountStatus(accountId, 'connecting');
          this.emit('wa:status', { accountId, status: 'connecting' });
          setTimeout(() => {
            this.connectAccount(accountId).catch(console.error);
          }, 3000);
        } else {
          store.updateAccountStatus(accountId, 'disconnected');
          this.emit('wa:status', { accountId, status: 'disconnected' });
        }
      }
    });

    // Handle Pesan Masuk
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message) continue;
        const remoteJid = msg.key.remoteJid;
        if (!remoteJid || remoteJid.includes('@broadcast') || remoteJid.includes('@g.us')) {
          // Hanya tangani chat pribadi / direct message untuk CRM (group dan status diabaikan)
          continue;
        }

        const isFromMe = !!msg.key.fromMe;
        const resolved = await this.resolveSenderPhone(accountId, msg, sock);
        const senderPhone = resolved.phone;
        const senderLid = resolved.lid;
        const pushName = msg.pushName || '';

        // Ekstraksi isi pesan teks
        let textContent = '';
        if (msg.message.conversation) {
          textContent = msg.message.conversation;
        } else if (msg.message.extendedTextMessage?.text) {
          textContent = msg.message.extendedTextMessage.text;
        } else if (msg.message.imageMessage?.caption) {
          textContent = `[Gambar]: ${msg.message.imageMessage.caption}`;
        } else if (msg.message.imageMessage) {
          textContent = '[Gambar]';
        } else if (msg.message.documentMessage?.fileName) {
          textContent = `[Dokumen]: ${msg.message.documentMessage.fileName}`;
        } else if (msg.message.audioMessage) {
          textContent = '[Pesan Suara]';
        } else {
          textContent = '[Media/Sticker]';
        }

        // Cari atau buat kontak otomatis dengan dukungan LID
        const contact = store.findOrCreateContactByPhone(senderPhone, pushName, accountId, senderLid);

        const newMsg = store.addMessage({
          contactId: contact.id,
          accountId,
          fromMe: isFromMe,
          senderName: isFromMe ? (sock.user?.name || 'Agen CRM') : (pushName || contact.name),
          text: textContent,
          timestamp: new Date(msg.messageTimestamp ? msg.messageTimestamp * 1000 : Date.now()).toISOString(),
          status: isFromMe ? 'sent' : 'delivered'
        });

        // Broadcast pesan baru ke semua client CRM
        this.emit('wa:message', {
          accountId,
          contact,
          message: newMsg
        });
      }
    });

    return { success: true };
  }

  // Helper untuk menyelesaikan nomor HP asli dari WhatsApp LID (@lid)
  async resolveSenderPhone(accountId, msg, sock) {
    const remoteJid = msg.key.remoteJid || '';
    let foundLid = null;

    // 1. Cek remoteJidAlt / participantAlt jika Baileys sudah menyertakan nomor HP
    const altJid = msg.key.remoteJidAlt || msg.key.participantAlt || '';
    if (altJid && altJid.includes('@s.whatsapp.net')) {
      const pn = altJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
      if (pn) {
        if (remoteJid.includes('@lid')) {
          foundLid = remoteJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        }
        return { phone: pn, lid: foundLid };
      }
    }

    // 2. Jika remoteJid adalah nomor biasa (@s.whatsapp.net)
    if (remoteJid.includes('@s.whatsapp.net')) {
      const pn = remoteJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
      return { phone: pn, lid: null };
    }

    // 3. Jika remoteJid adalah WhatsApp Linked Identity (@lid)
    if (remoteJid.includes('@lid')) {
      foundLid = remoteJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');

      // Metode A: Query ke signalRepository Baileys
      try {
        if (sock?.signalRepository?.lidMapping?.getPNForLID) {
          const pnJid = await sock.signalRepository.lidMapping.getPNForLID(remoteJid);
          if (pnJid) {
            const pn = pnJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            if (pn) return { phone: pn, lid: foundLid };
          }
        }
      } catch (e) {}

      // Metode B: Baca file sesi lid-mapping-<lid>_reverse.json
      try {
        const sessionPath = path.join(this.baseSessionDir, accountId);
        const mapFile = path.join(sessionPath, `lid-mapping-${foundLid}_reverse.json`);
        if (fs.existsSync(mapFile)) {
          const raw = fs.readFileSync(mapFile, 'utf8');
          const pn = JSON.parse(raw);
          if (pn) {
            return { phone: pn.toString().replace(/[^0-9]/g, ''), lid: foundLid };
          }
        }
      } catch (e) {}

      // Metode C: Cek kontak di store yang sudah memiliki LID ini
      const contactWithLid = store.findContactByLid(foundLid);
      if (contactWithLid) {
        return { phone: contactWithLid.phone, lid: foundLid };
      }
    }

    // Fallback: ambil digit nomor
    const fallbackDigits = remoteJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
    return { phone: fallbackDigits, lid: foundLid };
  }

  async disconnectAccount(accountId) {
    const session = this.sessions.get(accountId);
    if (session && session.sock) {
      try {
        await session.sock.logout();
      } catch (err) {
        console.warn(`Logout error on ${accountId}:`, err.message);
      }
    }
    const sessionPath = path.join(this.baseSessionDir, accountId);
    try {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    } catch (e) {}

    this.sessions.set(accountId, { sock: null, qrDataUrl: null, status: 'disconnected' });
    store.updateAccountStatus(accountId, 'disconnected', null);
    this.emit('wa:status', { accountId, status: 'disconnected' });
    return { success: true };
  }

  async sendMessage(accountId, phone, text) {
    const session = this.sessions.get(accountId);
    if (!session || !session.sock || session.status !== 'connected') {
      throw new Error(`WhatsApp untuk akun ${accountId} sedang tidak terhubung.`);
    }

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const jid = `${cleanPhone}@s.whatsapp.net`;

    // Kirim via Baileys socket
    const sent = await session.sock.sendMessage(jid, { text });

    // Deteksi WhatsApp LID penerima jika sudah tersimpan di signal repository
    let foundLid = null;
    try {
      if (session.sock?.signalRepository?.lidMapping?.getLIDForPN) {
        const mappedLid = await session.sock.signalRepository.lidMapping.getLIDForPN(jid);
        if (mappedLid) {
          foundLid = mappedLid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        }
      }
    } catch (e) {}

    // Simpan ke database CRM
    const contact = store.findOrCreateContactByPhone(cleanPhone, '', accountId, foundLid);
    const savedMsg = store.addMessage({
      contactId: contact.id,
      accountId,
      fromMe: true,
      senderName: 'Agen CRM',
      text,
      status: 'sent',
      timestamp: new Date().toISOString()
    });

    this.emit('wa:message', {
      accountId,
      contact,
      message: savedMsg
    });

    return savedMsg;
  }

  getStatus(accountId) {
    const session = this.sessions.get(accountId);
    const acc = store.getAccount(accountId);
    return {
      id: accountId,
      name: acc ? acc.name : accountId,
      phone: acc ? acc.phone : '',
      status: session ? session.status : 'disconnected',
      qr: session ? session.qrDataUrl : null,
      user: acc ? acc.user : null
    };
  }

  getAllStatuses() {
    const accounts = store.getAccounts();
    return accounts.map(acc => this.getStatus(acc.id));
  }
}

module.exports = new WhatsAppManager();
