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

// Root health check
app.get('/', (req, res) => {
  res.json({
    name: 'Multi-WhatsApp CRM Gateway & Backend',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

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
