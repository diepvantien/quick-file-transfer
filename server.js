const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// File storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow all file types but validate size
    cb(null, true);
  }
});

// Room management
const rooms = new Map();
const roomTimeout = 30 * 60 * 1000; // 30 minutes

// Generate random 6-digit room code
function generateRoomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Clean up expired rooms
function cleanupRooms() {
  const now = Date.now();
  for (const [roomCode, room] of rooms.entries()) {
    if (now - room.createdAt > roomTimeout) {
      // Delete associated files
      if (room.files) {
        room.files.forEach(file => {
          const filePath = path.join(__dirname, 'uploads', file.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }
      rooms.delete(roomCode);
      io.to(roomCode).emit('roomExpired');
    }
  }
}

// Clean up rooms every 5 minutes
setInterval(cleanupRooms, 5 * 60 * 1000);

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

// Create room endpoint
app.post('/api/create-room', (req, res) => {
  const roomCode = generateRoomCode();
  rooms.set(roomCode, {
    code: roomCode,
    createdAt: Date.now(),
    files: [],
    active: true
  });
  
  res.json({ roomCode });
});

// Upload file endpoint
app.post('/api/upload/:roomCode', upload.single('file'), (req, res) => {
  const { roomCode } = req.params;
  const room = rooms.get(roomCode);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileInfo = {
    originalName: req.file.originalname,
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploadedAt: Date.now()
  };
  
  room.files.push(fileInfo);
  
  // Notify room participants
  io.to(roomCode).emit('fileUploaded', fileInfo);
  
  res.json({ success: true, file: fileInfo });
});

// Get room info endpoint
app.get('/api/room/:roomCode', (req, res) => {
  const { roomCode } = req.params;
  const room = rooms.get(roomCode);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    roomCode: room.code,
    files: room.files,
    createdAt: room.createdAt
  });
});

// Download file endpoint
app.get('/api/download/:roomCode/:filename', (req, res) => {
  const { roomCode, filename } = req.params;
  const room = rooms.get(roomCode);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const file = room.files.find(f => f.filename === filename);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  const filePath = path.join(__dirname, 'uploads', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found on server' });
  }
  
  res.download(filePath, file.originalName);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join room
  socket.on('joinRoom', (roomCode) => {
    socket.join(roomCode);
    console.log(`Client ${socket.id} joined room ${roomCode}`);
    
    // Send current room info
    const room = rooms.get(roomCode);
    if (room) {
      socket.emit('roomInfo', {
        roomCode: room.code,
        files: room.files
      });
    }
  });
  
  // Handle upload progress
  socket.on('uploadProgress', (data) => {
    socket.to(data.roomCode).emit('uploadProgress', data);
  });
  
  // Handle download progress
  socket.on('downloadProgress', (data) => {
    socket.to(data.roomCode).emit('downloadProgress', data);
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open your browser and navigate to http://localhost:${PORT}`);
});