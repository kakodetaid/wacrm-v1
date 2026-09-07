const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const waManager = require('./whatsapp/manager');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Sambungkan Socket.io ke WhatsApp Manager
waManager.setIO(io);

// Mount API routes
app.use('/api', apiRoutes);

// Serve static frontend files from client/dist (Desktop / Production Mode)
const fs = require('fs');
const potentialDistPaths = [
  path.join(__dirname, '..', 'client', 'dist'),
  path.join(__dirname, '..', '..', 'app.asar.unpacked', 'client', 'dist'),
  path.join(process.resourcesPath || '', 'app.asar.unpacked', 'client', 'dist'),
  path.join(process.resourcesPath || '', 'client', 'dist'),
  path.join(process.cwd(), 'client', 'dist')
];

let clientDistPath = potentialDistPaths.find(p => fs.existsSync(path.join(p, 'index.html')));

if (clientDistPath) {
  console.log(`[Server] Menyajikan antarmuka frontend dari: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  // SPA fallback yang kompatibel dengan Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
} else {
  console.warn('[Server] client/dist/index.html tidak ditemukan!');
  app.get('/', (req, res) => {
    res.send('<h2>WACRM Pro Backend Online</h2><p>Frontend sedang disiapkan...</p>');
  });
}

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client web terhubung: ${socket.id}`);

  // Kirim status akun terbaru saat client baru membuka tab
  socket.emit('wa:all_statuses', waManager.getAllStatuses());

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(`🚀 CRM Backend Server berjalan di http://localhost:${PORT}`);
  console.log(`====================================================`);
  // Inisialisasi sesi WhatsApp yang tersimpan
  await waManager.initAll();
});
