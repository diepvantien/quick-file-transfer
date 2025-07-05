const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store active rooms and their data
const activeRooms = new Map();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Generate random 6-digit room code
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/sender', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sender.html'));
});

app.get('/receiver', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'receiver.html'));
});

// Create new room
app.post('/api/create-room', (req, res) => {
  const roomCode = generateRoomCode();
  const roomId = uuidv4();
  
  activeRooms.set(roomCode, {
    id: roomId,
    code: roomCode,
    created: new Date(),
    file: null,
    sender: null,
    receiver: null,
    status: 'waiting'
  });

  // Clean up room after 1 hour
  setTimeout(() => {
    const room = activeRooms.get(roomCode);
    if (room && room.file) {
      // Delete uploaded file if exists
      const filePath = path.join(__dirname, 'uploads', room.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    activeRooms.delete(roomCode);
  }, 60 * 60 * 1000); // 1 hour

  res.json({ roomCode, roomId });
});

// Upload file
app.post('/api/upload/:roomCode', upload.single('file'), (req, res) => {
  const roomCode = req.params.roomCode;
  const room = activeRooms.get(roomCode);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  room.file = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype
  };
  room.status = 'ready';

  // Notify receiver if connected
  if (room.receiver) {
    io.to(room.receiver).emit('file-ready', {
      fileName: room.file.originalName,
      fileSize: room.file.size,
      fileType: room.file.mimetype
    });
  }

  res.json({ success: true, file: room.file });
});

// Download file
app.get('/api/download/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode;
  const room = activeRooms.get(roomCode);

  if (!room || !room.file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(__dirname, 'uploads', room.file.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on server' });
  }

  res.download(filePath, room.file.originalName, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).json({ error: 'Download failed' });
    } else {
      // Notify sender that download completed
      if (room.sender) {
        io.to(room.sender).emit('download-complete');
      }
    }
  });
});

// Get room info
app.get('/api/room/:roomCode', (req, res) => {
  const roomCode = req.params.roomCode;
  const room = activeRooms.get(roomCode);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  res.json({
    code: room.code,
    status: room.status,
    file: room.file ? {
      originalName: room.file.originalName,
      size: room.file.size,
      mimetype: room.file.mimetype
    } : null
  });
});

// Generate QR code
app.get('/api/qr/:roomCode', async (req, res) => {
  const roomCode = req.params.roomCode;
  const room = activeRooms.get(roomCode);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  try {
    const url = `${req.protocol}://${req.get('host')}/receiver?code=${roomCode}`;
    const qrCode = await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.json({ qrCode, url });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (data) => {
    const { roomCode, role } = data;
    const room = activeRooms.get(roomCode);

    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    socket.join(roomCode);
    
    if (role === 'sender') {
      room.sender = socket.id;
      socket.emit('room-joined', { role: 'sender', room: room });
    } else if (role === 'receiver') {
      room.receiver = socket.id;
      socket.emit('room-joined', { role: 'receiver', room: room });
      
      // If file is ready, notify receiver
      if (room.file) {
        socket.emit('file-ready', {
          fileName: room.file.originalName,
          fileSize: room.file.size,
          fileType: room.file.mimetype
        });
      }
    }

    // Notify other users in the room
    socket.to(roomCode).emit('user-joined', { role });
  });

  socket.on('upload-progress', (data) => {
    const { roomCode, progress } = data;
    socket.to(roomCode).emit('upload-progress', { progress });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Clean up room references
    for (const [code, room] of activeRooms.entries()) {
      if (room.sender === socket.id) {
        room.sender = null;
      } else if (room.receiver === socket.id) {
        room.receiver = null;
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the application at http://localhost:${PORT}`);
});