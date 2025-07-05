/**
 * Quick File Transfer - Room Page
 * WebRTC P2P file transfer functionality
 */

class FileTransferRoom {
    constructor() {
        this.socket = null;
        this.qrGenerator = null;
        this.peers = new Map();
        this.roomId = null;
        this.roomData = null;
        this.files = [];
        this.fileHistory = [];
        this.baseUrl = window.location.origin;
        this.init();
    }

    init() {
        // Get room ID from URL
        this.roomId = this.getRoomIdFromUrl();
        
        if (!this.roomId) {
            this.showError('Không tìm thấy mã phòng trong URL');
            return;
        }

        // Initialize Socket.IO
        this.socket = io();
        
        // Initialize QR Generator
        this.qrGenerator = new QRGenerator();
        
        // Set up event listeners
        this.setupEventListeners();
        this.setupSocketListeners();
        
        // Join room
        this.joinRoom();
    }

    getRoomIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    setupEventListeners() {
        // File drop zone
        const fileDropZone = document.getElementById('fileDropZone');
        const fileInput = document.getElementById('fileInput');

        fileDropZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileDropZone.classList.add('dragover');
        });

        fileDropZone.addEventListener('dragleave', () => {
            fileDropZone.classList.remove('dragover');
        });

        fileDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            fileDropZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Room controls
        document.getElementById('copyRoomLink').addEventListener('click', () => {
            this.copyRoomLink();
        });

        document.getElementById('shareRoom').addEventListener('click', () => {
            this.shareRoom();
        });

        document.getElementById('leaveRoom').addEventListener('click', () => {
            this.leaveRoom();
        });

        // QR controls
        document.getElementById('copyQR').addEventListener('click', () => {
            this.copyQR();
        });

        document.getElementById('downloadQR').addEventListener('click', () => {
            this.downloadQR();
        });

        // Window beforeunload
        window.addEventListener('beforeunload', () => {
            this.leaveRoom();
        });
    }

    setupSocketListeners() {
        this.socket.on('room-joined', (data) => {
            this.handleRoomJoined(data);
        });

        this.socket.on('room-info', (data) => {
            this.updateRoomInfo(data);
        });

        this.socket.on('participant-joined', (data) => {
            this.handleParticipantJoined(data);
        });

        this.socket.on('participant-left', (data) => {
            this.handleParticipantLeft(data);
        });

        this.socket.on('webrtc-signal', (data) => {
            this.handleWebRTCSignal(data);
        });

        this.socket.on('room-error', (error) => {
            this.showError(error.message);
        });

        this.socket.on('connect', () => {
            this.updateConnectionStatus('connected', 'Đã kết nối');
        });

        this.socket.on('disconnect', () => {
            this.updateConnectionStatus('disconnected', 'Mất kết nối');
        });
    }

    joinRoom() {
        this.updateConnectionStatus('connecting', 'Đang tham gia phòng...');
        this.socket.emit('join-room', { roomId: this.roomId });
    }

    handleRoomJoined(data) {
        this.roomData = data.room;
        this.updateRoomInfo(data.room);
        this.generateRoomQR();
        this.updateConnectionStatus('connected', 'Đã tham gia phòng');
    }

    updateRoomInfo(room) {
        document.getElementById('roomName').textContent = room.name || 'Phòng không tên';
        document.getElementById('roomId').textContent = room.id;
        document.getElementById('participantCount').textContent = room.participants?.length || 0;
        
        const roomLink = `${this.baseUrl}/room.html?id=${room.id}`;
        document.getElementById('roomLink').textContent = roomLink;
        
        // Update participants list
        this.updateParticipantsList(room.participants || []);
    }

    updateParticipantsList(participants) {
        const participantsList = document.getElementById('participantsList');
        
        if (participants.length === 0) {
            participantsList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Chỉ có bạn trong phòng</p>';
            return;
        }

        const participantsHtml = participants.map(participant => `
            <div class="participant">
                <div class="participant-info">
                    <div class="participant-status ${participant.connected ? '' : 'offline'}"></div>
                    <div class="participant-name">${participant.name || 'Người dùng'}</div>
                </div>
                <div class="participant-actions">
                    <button class="copy-btn" onclick="fileTransferRoom.connectToPeer('${participant.id}')">
                        <i class="fas fa-link"></i> Kết nối
                    </button>
                </div>
            </div>
        `).join('');

        participantsList.innerHTML = participantsHtml;
    }

    generateRoomQR() {
        if (!this.roomData) return;
        
        const roomUrl = `${this.baseUrl}/room.html?id=${this.roomData.id}`;
        const qrHtml = this.qrGenerator.generateQR(roomUrl, 250);
        document.getElementById('qrContainer').innerHTML = qrHtml;
    }

    handleParticipantJoined(data) {
        console.log('Participant joined:', data);
        // Update participants list
        if (this.roomData) {
            this.roomData.participants = this.roomData.participants || [];
            this.roomData.participants.push(data.participant);
            this.updateParticipantsList(this.roomData.participants);
        }
        
        // Auto-connect to new participant
        this.connectToPeer(data.participant.id, true);
    }

    handleParticipantLeft(data) {
        console.log('Participant left:', data);
        // Remove from participants list
        if (this.roomData && this.roomData.participants) {
            this.roomData.participants = this.roomData.participants.filter(p => p.id !== data.participantId);
            this.updateParticipantsList(this.roomData.participants);
        }
        
        // Close peer connection
        if (this.peers.has(data.participantId)) {
            this.peers.get(data.participantId).destroy();
            this.peers.delete(data.participantId);
        }
    }

    connectToPeer(peerId, initiator = false) {
        if (this.peers.has(peerId)) {
            console.log('Already connected to peer:', peerId);
            return;
        }

        const peer = new SimplePeer({
            initiator: initiator,
            channelName: 'fileTransfer'
        });

        peer.on('signal', (data) => {
            this.socket.emit('webrtc-signal', {
                roomId: this.roomId,
                targetId: peerId,
                signal: data
            });
        });

        peer.on('connect', () => {
            console.log('Connected to peer:', peerId);
            this.updateConnectionStatus('connected', 'Đã kết nối P2P');
        });

        peer.on('data', (data) => {
            this.handlePeerData(peerId, data);
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
            this.showError('Lỗi kết nối P2P: ' + err.message);
        });

        peer.on('close', () => {
            console.log('Peer connection closed:', peerId);
            this.peers.delete(peerId);
        });

        this.peers.set(peerId, peer);
    }

    handleWebRTCSignal(data) {
        const peer = this.peers.get(data.fromId);
        if (peer) {
            peer.signal(data.signal);
        } else {
            // Create new peer connection if we don't have one
            this.connectToPeer(data.fromId, false);
            // Signal after peer is created
            setTimeout(() => {
                const newPeer = this.peers.get(data.fromId);
                if (newPeer) {
                    newPeer.signal(data.signal);
                }
            }, 100);
        }
    }

    handleFiles(files) {
        Array.from(files).forEach(file => {
            const fileId = this.generateFileId();
            const fileData = {
                id: fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified,
                file: file
            };
            
            this.files.push(fileData);
            this.displayFile(fileData);
        });
        
        this.showFileList();
    }

    displayFile(fileData) {
        const fileListContent = document.getElementById('fileListContent');
        
        const fileHtml = `
            <div class="file-item" data-file-id="${fileData.id}">
                <div class="file-info">
                    <div class="file-name">${fileData.name}</div>
                    <div class="file-size">${this.formatFileSize(fileData.size)}</div>
                    <div class="file-progress">
                        <div class="file-progress-bar" style="width: 0%"></div>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="copy-btn" onclick="fileTransferRoom.sendFile('${fileData.id}')">
                        <i class="fas fa-paper-plane"></i> Gửi
                    </button>
                    <button class="remove-btn" onclick="fileTransferRoom.removeFile('${fileData.id}')">
                        <i class="fas fa-trash"></i> Xóa
                    </button>
                </div>
            </div>
        `;
        
        fileListContent.insertAdjacentHTML('beforeend', fileHtml);
    }

    showFileList() {
        document.getElementById('fileList').style.display = 'block';
    }

    sendFile(fileId) {
        const fileData = this.files.find(f => f.id === fileId);
        if (!fileData) return;

        // Send file to all connected peers
        this.peers.forEach((peer, peerId) => {
            if (peer.connected) {
                this.sendFileToPeer(fileData, peer, peerId);
            }
        });
    }

    sendFileToPeer(fileData, peer, peerId) {
        // Send file metadata first
        const metadata = {
            type: 'file-metadata',
            id: fileData.id,
            name: fileData.name,
            size: fileData.size,
            fileType: fileData.type,
            lastModified: fileData.lastModified
        };

        peer.send(metadata);

        // Read and send file in chunks
        const reader = new FileReader();
        const chunkSize = 16384; // 16KB chunks
        let offset = 0;

        const sendChunk = () => {
            const chunk = fileData.file.slice(offset, offset + chunkSize);
            reader.readAsArrayBuffer(chunk);
        };

        reader.onload = (e) => {
            const chunkData = {
                type: 'file-chunk',
                id: fileData.id,
                chunk: e.target.result,
                offset: offset,
                total: fileData.size
            };

            peer.send(chunkData);
            
            offset += chunkSize;
            const progress = Math.min(100, (offset / fileData.size) * 100);
            this.updateFileProgress(fileData.id, progress);

            if (offset < fileData.size) {
                sendChunk();
            } else {
                // Send file complete message
                peer.send({
                    type: 'file-complete',
                    id: fileData.id
                });
                this.addToFileHistory(fileData, 'sent', 'completed');
            }
        };

        sendChunk();
    }

    handlePeerData(peerId, data) {
        if (typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse peer data:', e);
                return;
            }
        }

        switch (data.type) {
            case 'file-metadata':
                this.handleFileMetadata(data);
                break;
            case 'file-chunk':
                this.handleFileChunk(data);
                break;
            case 'file-complete':
                this.handleFileComplete(data);
                break;
        }
    }

    handleFileMetadata(metadata) {
        // Create a new file entry for receiving
        const fileData = {
            id: metadata.id,
            name: metadata.name,
            size: metadata.size,
            type: metadata.fileType,
            lastModified: metadata.lastModified,
            chunks: [],
            receivedSize: 0
        };

        this.files.push(fileData);
        this.displayReceivingFile(fileData);
        this.addToFileHistory(fileData, 'received', 'in-progress');
    }

    handleFileChunk(chunkData) {
        const fileData = this.files.find(f => f.id === chunkData.id);
        if (!fileData) return;

        fileData.chunks.push(chunkData.chunk);
        fileData.receivedSize += chunkData.chunk.byteLength;

        const progress = (fileData.receivedSize / fileData.size) * 100;
        this.updateFileProgress(fileData.id, progress);
    }

    handleFileComplete(data) {
        const fileData = this.files.find(f => f.id === data.id);
        if (!fileData) return;

        // Combine all chunks into a single file
        const blob = new Blob(fileData.chunks, { type: fileData.type });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name;
        a.click();
        
        URL.revokeObjectURL(url);
        
        // Update history
        this.addToFileHistory(fileData, 'received', 'completed');
        
        // Remove from files list
        this.removeFile(fileData.id);
    }

    displayReceivingFile(fileData) {
        const fileListContent = document.getElementById('fileListContent');
        
        const fileHtml = `
            <div class="file-item" data-file-id="${fileData.id}">
                <div class="file-info">
                    <div class="file-name">📥 ${fileData.name}</div>
                    <div class="file-size">${this.formatFileSize(fileData.size)}</div>
                    <div class="file-progress">
                        <div class="file-progress-bar" style="width: 0%"></div>
                    </div>
                </div>
                <div class="file-actions">
                    <span style="color: #667eea; font-size: 0.9rem;">Đang nhận...</span>
                </div>
            </div>
        `;
        
        fileListContent.insertAdjacentHTML('beforeend', fileHtml);
        this.showFileList();
    }

    updateFileProgress(fileId, progress) {
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileItem) {
            const progressBar = fileItem.querySelector('.file-progress-bar');
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
        }
    }

    removeFile(fileId) {
        // Remove from files array
        this.files = this.files.filter(f => f.id !== fileId);
        
        // Remove from DOM
        const fileItem = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileItem) {
            fileItem.remove();
        }
        
        // Hide file list if empty
        if (this.files.length === 0) {
            document.getElementById('fileList').style.display = 'none';
        }
    }

    addToFileHistory(fileData, direction, status) {
        const historyItem = {
            id: fileData.id,
            name: fileData.name,
            size: fileData.size,
            direction: direction, // 'sent' or 'received'
            status: status, // 'completed', 'failed', 'in-progress'
            timestamp: new Date()
        };

        this.fileHistory.push(historyItem);
        this.updateFileHistory();
    }

    updateFileHistory() {
        const fileHistory = document.getElementById('fileHistory');
        
        if (this.fileHistory.length === 0) {
            fileHistory.innerHTML = '<p style="text-align: center; color: #666; font-style: italic;">Chưa có file nào được chuyển</p>';
            return;
        }

        const historyHtml = this.fileHistory.map(item => `
            <div class="file-history-item">
                <div class="file-history-info">
                    <div class="file-history-name">
                        ${item.direction === 'sent' ? '📤' : '📥'} ${item.name}
                    </div>
                    <div class="file-history-details">
                        ${this.formatFileSize(item.size)} • ${item.timestamp.toLocaleString()}
                    </div>
                </div>
                <div class="file-history-status ${item.status}">
                    ${this.getStatusText(item.status)}
                </div>
            </div>
        `).join('');

        fileHistory.innerHTML = historyHtml;
    }

    getStatusText(status) {
        switch (status) {
            case 'completed': return 'Hoàn thành';
            case 'failed': return 'Thất bại';
            case 'in-progress': return 'Đang xử lý';
            default: return 'Không xác định';
        }
    }

    updateConnectionStatus(status, message) {
        const statusElement = document.getElementById('connectionStatus');
        const icons = {
            connecting: 'fas fa-circle-notch fa-spin',
            connected: 'fas fa-check-circle',
            disconnected: 'fas fa-times-circle',
            error: 'fas fa-exclamation-triangle'
        };

        statusElement.className = `connection-status ${status}`;
        statusElement.innerHTML = `
            <i class="${icons[status]}"></i>
            <span>${message}</span>
        `;
    }

    async copyRoomLink() {
        const roomLink = `${this.baseUrl}/room.html?id=${this.roomId}`;
        try {
            await navigator.clipboard.writeText(roomLink);
            this.showSuccess('Đã copy link phòng!');
        } catch (error) {
            this.showError('Không thể copy link: ' + error.message);
        }
    }

    shareRoom() {
        const roomLink = `${this.baseUrl}/room.html?id=${this.roomId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Quick File Transfer',
                text: 'Tham gia phòng chuyển file',
                url: roomLink
            });
        } else {
            // Fallback to copy
            this.copyRoomLink();
        }
    }

    leaveRoom() {
        // Close all peer connections
        this.peers.forEach(peer => {
            peer.destroy();
        });
        this.peers.clear();
        
        // Leave room
        if (this.socket) {
            this.socket.emit('leave-room', { roomId: this.roomId });
        }
        
        // Redirect to home
        window.location.href = '/';
    }

    async copyQR() {
        try {
            const success = await this.qrGenerator.copyQR();
            if (success) {
                this.showSuccess('Đã copy QR code!');
            } else {
                this.showError('Không thể copy QR code');
            }
        } catch (error) {
            this.showError('Lỗi copy QR: ' + error.message);
        }
    }

    downloadQR() {
        const filename = `qr-room-${this.roomId}`;
        this.qrGenerator.downloadQR(filename);
        this.showSuccess('Đang tải QR code...');
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'error');
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alertId = 'alert-' + Date.now();
        const alertTypes = {
            success: 'alert-success',
            error: 'alert-error',
            info: 'alert-info'
        };
        
        const alertClass = alertTypes[type] || 'alert-info';
        
        const alertHtml = `
            <div id="${alertId}" class="alert ${alertClass}" style="position: fixed; top: 20px; right: 20px; z-index: 1000; opacity: 0; transform: translateX(100%);">
                ${message}
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', alertHtml);
        
        // Animate in
        const alertElement = document.getElementById(alertId);
        setTimeout(() => {
            alertElement.style.opacity = '1';
            alertElement.style.transform = 'translateX(0)';
            alertElement.style.transition = 'all 0.3s ease';
        }, 10);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (alertElement && alertElement.parentNode) {
                alertElement.style.opacity = '0';
                alertElement.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (alertElement && alertElement.parentNode) {
                        alertElement.parentNode.removeChild(alertElement);
                    }
                }, 300);
            }
        }, 3000);
    }

    generateFileId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize room when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fileTransferRoom = new FileTransferRoom();
});