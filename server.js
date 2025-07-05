/**
 * Quick File Transfer Server
 * WebRTC signaling server with Socket.IO
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for rooms
const rooms = new Map();
const participants = new Map();

// Room management
class Room {
    constructor(id, name = null) {
        this.id = id;
        this.name = name || `Phòng ${id}`;
        this.participants = new Map();
        this.createdAt = new Date();
        this.lastActivity = new Date();
    }

    addParticipant(socketId, participantData) {
        this.participants.set(socketId, {
            id: socketId,
            name: participantData.name || `Người dùng ${this.participants.size + 1}`,
            joinedAt: new Date(),
            connected: true
        });
        this.lastActivity = new Date();
    }

    removeParticipant(socketId) {
        this.participants.delete(socketId);
        this.lastActivity = new Date();
    }

    getParticipants() {
        return Array.from(this.participants.values());
    }

    isEmpty() {
        return this.participants.size === 0;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            participants: this.getParticipants(),
            createdAt: this.createdAt,
            lastActivity: this.lastActivity
        };
    }
}

// Utility functions
function generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(name = null) {
    const roomId = generateRoomId();
    const room = new Room(roomId, name);
    rooms.set(roomId, room);
    return room;
}

function getRoom(roomId) {
    return rooms.get(roomId);
}

function deleteRoom(roomId) {
    rooms.delete(roomId);
}

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create room
    socket.on('create-room', (data) => {
        try {
            const room = createRoom(data.name);
            
            // Add creator to room
            room.addParticipant(socket.id, { name: data.creatorName });
            participants.set(socket.id, room.id);
            
            // Join socket room
            socket.join(room.id);
            
            console.log(`Room created: ${room.id} by ${socket.id}`);
            
            // Send room created event
            socket.emit('room-created', {
                room: room.toJSON(),
                participantId: socket.id
            });
            
        } catch (error) {
            console.error('Create room error:', error);
            socket.emit('room-error', { message: 'Không thể tạo phòng' });
        }
    });

    // Join room
    socket.on('join-room', (data) => {
        try {
            const { roomId, participantName } = data;
            const room = getRoom(roomId);
            
            if (!room) {
                socket.emit('room-error', { message: 'Phòng không tồn tại' });
                return;
            }
            
            // Add participant to room
            room.addParticipant(socket.id, { name: participantName });
            participants.set(socket.id, roomId);
            
            // Join socket room
            socket.join(roomId);
            
            console.log(`User ${socket.id} joined room: ${roomId}`);
            
            // Send room joined event to user
            socket.emit('room-joined', {
                room: room.toJSON(),
                participantId: socket.id
            });
            
            // Send room info to all participants
            io.to(roomId).emit('room-info', room.toJSON());
            
            // Notify other participants
            socket.to(roomId).emit('participant-joined', {
                participant: {
                    id: socket.id,
                    name: participantName || `Người dùng ${room.participants.size}`,
                    joinedAt: new Date(),
                    connected: true
                }
            });
            
        } catch (error) {
            console.error('Join room error:', error);
            socket.emit('room-error', { message: 'Không thể tham gia phòng' });
        }
    });

    // Leave room
    socket.on('leave-room', (data) => {
        try {
            const { roomId } = data;
            const room = getRoom(roomId);
            
            if (room) {
                room.removeParticipant(socket.id);
                socket.leave(roomId);
                
                // Notify other participants
                socket.to(roomId).emit('participant-left', {
                    participantId: socket.id
                });
                
                // Send updated room info
                io.to(roomId).emit('room-info', room.toJSON());
                
                // Delete room if empty
                if (room.isEmpty()) {
                    deleteRoom(roomId);
                    console.log(`Room deleted: ${roomId}`);
                }
            }
            
            participants.delete(socket.id);
            
        } catch (error) {
            console.error('Leave room error:', error);
        }
    });

    // WebRTC signaling
    socket.on('webrtc-signal', (data) => {
        try {
            const { roomId, targetId, signal } = data;
            const room = getRoom(roomId);
            
            if (!room) {
                socket.emit('room-error', { message: 'Phòng không tồn tại' });
                return;
            }
            
            // Forward signal to target peer
            socket.to(targetId).emit('webrtc-signal', {
                fromId: socket.id,
                signal: signal
            });
            
        } catch (error) {
            console.error('WebRTC signal error:', error);
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        const roomId = participants.get(socket.id);
        if (roomId) {
            const room = getRoom(roomId);
            if (room) {
                room.removeParticipant(socket.id);
                
                // Notify other participants
                socket.to(roomId).emit('participant-left', {
                    participantId: socket.id
                });
                
                // Send updated room info
                io.to(roomId).emit('room-info', room.toJSON());
                
                // Delete room if empty
                if (room.isEmpty()) {
                    deleteRoom(roomId);
                    console.log(`Room deleted: ${roomId}`);
                }
            }
            
            participants.delete(socket.id);
        }
    });

    // Get room info
    socket.on('get-room-info', (data) => {
        try {
            const { roomId } = data;
            const room = getRoom(roomId);
            
            if (room) {
                socket.emit('room-info', room.toJSON());
            } else {
                socket.emit('room-error', { message: 'Phòng không tồn tại' });
            }
        } catch (error) {
            console.error('Get room info error:', error);
            socket.emit('room-error', { message: 'Không thể lấy thông tin phòng' });
        }
    });
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/room.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

// API endpoints
app.get('/api/rooms', (req, res) => {
    const roomList = Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        participantCount: room.participants.size,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
    }));
    
    res.json(roomList);
});

app.get('/api/rooms/:roomId', (req, res) => {
    const room = getRoom(req.params.roomId);
    if (room) {
        res.json(room.toJSON());
    } else {
        res.status(404).json({ error: 'Phòng không tồn tại' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date(),
        rooms: rooms.size,
        participants: participants.size
    });
});

// Clean up empty rooms periodically
setInterval(() => {
    const now = new Date();
    const cutoff = 30 * 60 * 1000; // 30 minutes
    
    for (const [roomId, room] of rooms.entries()) {
        if (room.isEmpty() && (now - room.lastActivity) > cutoff) {
            deleteRoom(roomId);
            console.log(`Cleaned up empty room: ${roomId}`);
        }
    }
}, 5 * 60 * 1000); // Check every 5 minutes

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Quick File Transfer Server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});