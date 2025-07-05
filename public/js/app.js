/**
 * Quick File Transfer - Main Application
 * Home page functionality with QR code integration
 */

class QuickFileTransfer {
    constructor() {
        this.socket = null;
        this.qrGenerator = null;
        this.currentRoom = null;
        this.baseUrl = window.location.origin;
        this.init();
    }

    init() {
        // Initialize Socket.IO
        this.socket = io();
        
        // Initialize QR Generator
        this.qrGenerator = new QRGenerator();
        
        // Display initial placeholder
        this.displayQRPlaceholder();
        
        // Event listeners
        this.setupEventListeners();
        this.setupSocketListeners();
    }

    setupEventListeners() {
        // Create room button
        document.getElementById('createRoom').addEventListener('click', () => {
            this.createRoom();
        });

        // Join room button
        document.getElementById('joinRoom').addEventListener('click', () => {
            this.joinRoom();
        });

        // Enter key support
        document.getElementById('roomName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.createRoom();
            }
        });

        document.getElementById('joinRoomId').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });

        // QR controls
        document.getElementById('copyQR').addEventListener('click', () => {
            this.copyQR();
        });

        document.getElementById('downloadQR').addEventListener('click', () => {
            this.downloadQR();
        });

        document.getElementById('copyLink').addEventListener('click', () => {
            this.copyLink();
        });

        document.getElementById('joinRoomFromQR').addEventListener('click', () => {
            this.joinRoomFromQR();
        });

        // Auto-join from URL
        this.checkUrlForRoom();
    }

    setupSocketListeners() {
        this.socket.on('room-created', (data) => {
            this.handleRoomCreated(data);
        });

        this.socket.on('room-joined', (data) => {
            this.handleRoomJoined(data);
        });

        this.socket.on('room-error', (error) => {
            this.showAlert('Lỗi: ' + error.message, 'error');
        });

        this.socket.on('connect', () => {
            console.log('Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }

    createRoom() {
        const roomName = document.getElementById('roomName').value.trim();
        const createBtn = document.getElementById('createRoom');
        
        // Disable button during creation
        createBtn.disabled = true;
        createBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo...';

        // Emit create room event
        this.socket.emit('create-room', { name: roomName || null });
    }

    joinRoom() {
        const roomInput = document.getElementById('joinRoomId').value.trim();
        
        if (!roomInput) {
            this.showAlert('Vui lòng nhập mã phòng hoặc link phòng', 'error');
            return;
        }

        // Extract room ID from URL or use as is
        const roomId = this.extractRoomIdFromInput(roomInput);
        
        if (!roomId) {
            this.showAlert('Mã phòng hoặc link không hợp lệ', 'error');
            return;
        }

        // Redirect to room page
        window.location.href = `/room.html?id=${roomId}`;
    }

    joinRoomFromQR() {
        if (this.currentRoom) {
            window.location.href = `/room.html?id=${this.currentRoom.id}`;
        }
    }

    extractRoomIdFromInput(input) {
        // Check if input is a URL
        if (input.includes('room.html?id=')) {
            const match = input.match(/room\.html\?id=([^&]+)/);
            return match ? match[1] : null;
        }
        
        // Otherwise treat as room ID
        return input;
    }

    handleRoomCreated(data) {
        this.currentRoom = data.room;
        
        // Re-enable create button
        const createBtn = document.getElementById('createRoom');
        createBtn.disabled = false;
        createBtn.innerHTML = '<i class="fas fa-plus"></i> Tạo phòng';
        
        // Display room info
        this.displayRoomInfo(data.room);
        
        // Generate and display QR code
        this.generateRoomQR(data.room);
        
        // Show success message
        this.showAlert(`Phòng "${data.room.name}" đã được tạo thành công!`, 'success');
        
        // Clear room name input
        document.getElementById('roomName').value = '';
    }

    handleRoomJoined(data) {
        // This is handled on the room page
        console.log('Room joined:', data);
    }

    displayRoomInfo(room) {
        const roomInfo = document.getElementById('roomInfo');
        const roomName = document.getElementById('displayRoomName');
        const roomId = document.getElementById('displayRoomId');
        const roomLink = document.getElementById('roomLink');
        
        roomName.textContent = room.name || 'Phòng không tên';
        roomId.textContent = room.id;
        roomLink.textContent = `${this.baseUrl}/room.html?id=${room.id}`;
        
        roomInfo.style.display = 'block';
        roomInfo.classList.add('fade-in');
    }

    generateRoomQR(room) {
        const roomUrl = `${this.baseUrl}/room.html?id=${room.id}`;
        const qrHtml = this.qrGenerator.generateQR(roomUrl, 280);
        
        // Display QR code
        document.getElementById('qrContainer').innerHTML = qrHtml;
        
        // Show QR controls
        document.getElementById('qrControls').style.display = 'flex';
        document.getElementById('qrControls').classList.add('fade-in');
    }

    displayQRPlaceholder() {
        const placeholder = this.qrGenerator.getPlaceholder();
        document.getElementById('qrContainer').innerHTML = placeholder;
        document.getElementById('qrControls').style.display = 'none';
    }

    async copyQR() {
        try {
            const success = await this.qrGenerator.copyQR();
            if (success) {
                this.showAlert('Đã copy QR code vào clipboard!', 'success');
            } else {
                this.showAlert('Không thể copy QR code', 'error');
            }
        } catch (error) {
            this.showAlert('Lỗi copy QR code: ' + error.message, 'error');
        }
    }

    downloadQR() {
        if (this.currentRoom) {
            const filename = `qr-${this.currentRoom.name || this.currentRoom.id}`;
            this.qrGenerator.downloadQR(filename);
            this.showAlert('Đang tải QR code...', 'info');
        }
    }

    async copyLink() {
        if (this.currentRoom) {
            const roomUrl = `${this.baseUrl}/room.html?id=${this.currentRoom.id}`;
            try {
                await navigator.clipboard.writeText(roomUrl);
                this.showAlert('Đã copy link phòng vào clipboard!', 'success');
            } catch (error) {
                this.showAlert('Không thể copy link: ' + error.message, 'error');
            }
        }
    }

    checkUrlForRoom() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room');
        
        if (roomId) {
            // Auto-fill join room input
            document.getElementById('joinRoomId').value = roomId;
            
            // Show notification
            this.showAlert('Phát hiện mã phòng trong URL. Nhấn "Tham gia" để vào phòng.', 'info');
        }
    }

    showAlert(message, type = 'info') {
        const alertsContainer = document.getElementById('alerts');
        const alertId = 'alert-' + Date.now();
        
        const alertTypes = {
            success: 'alert-success',
            error: 'alert-error',
            info: 'alert-info'
        };
        
        const alertClass = alertTypes[type] || 'alert-info';
        
        const alertHtml = `
            <div id="${alertId}" class="alert ${alertClass}" style="opacity: 0; transform: translateY(-10px);">
                ${message}
            </div>
        `;
        
        alertsContainer.insertAdjacentHTML('beforeend', alertHtml);
        
        // Animate in
        const alertElement = document.getElementById(alertId);
        setTimeout(() => {
            alertElement.style.opacity = '1';
            alertElement.style.transform = 'translateY(0)';
            alertElement.style.transition = 'all 0.3s ease';
        }, 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertElement && alertElement.parentNode) {
                alertElement.style.opacity = '0';
                alertElement.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (alertElement && alertElement.parentNode) {
                        alertElement.parentNode.removeChild(alertElement);
                    }
                }, 300);
            }
        }, 5000);
    }

    // Utility function to generate random room ID
    generateRoomId() {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    // Utility function to format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quickFileTransfer = new QuickFileTransfer();
});