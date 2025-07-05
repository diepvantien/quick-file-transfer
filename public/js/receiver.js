// Receiver functionality
class FileReceiver {
    constructor() {
        this.currentRoom = null;
        this.socket = null;
        this.availableFiles = [];
        this.speedCalculator = new FileTransferUtils.SpeedCalculator();
        this.isDownloading = false;
        this.qrScanner = null;
        
        this.initializeEventListeners();
        this.connectSocket();
        this.checkURLParams();
    }
    
    initializeEventListeners() {
        const roomCodeInput = document.getElementById('roomCodeInput');
        const joinBtn = document.getElementById('joinBtn');
        const scanBtn = document.getElementById('scanBtn');
        const stopScanBtn = document.getElementById('stopScanBtn');
        const backBtn = document.getElementById('backBtn');
        
        // Back button
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }
        
        // Join button
        if (joinBtn) {
            joinBtn.addEventListener('click', () => {
                this.joinRoom();
            });
        }
        
        // Scan button
        if (scanBtn) {
            scanBtn.addEventListener('click', () => {
                this.startQRScanner();
            });
        }
        
        // Stop scan button
        if (stopScanBtn) {
            stopScanBtn.addEventListener('click', () => {
                this.stopQRScanner();
            });
        }
        
        // Room code input validation
        roomCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
        
        // Enter key to join room
        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });
    }
    
    connectSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateConnectionStatus(false);
        });
        
        this.socket.on('roomInfo', (data) => {
            this.handleRoomInfo(data);
        });
        
        this.socket.on('fileUploaded', (fileInfo) => {
            this.addFileToList(fileInfo);
        });
        
        this.socket.on('uploadProgress', (data) => {
            this.updateUploadProgress(data);
        });
        
        this.socket.on('roomExpired', () => {
            FileTransferUtils.showError('Room has expired.');
            this.resetReceiver();
        });
    }
    
    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomCode = urlParams.get('room');
        
        if (roomCode && FileTransferUtils.isValidRoomCode(roomCode)) {
            document.getElementById('roomCodeInput').value = roomCode;
            this.joinRoom();
        }
    }
    
    async joinRoom() {
        const roomCodeInput = document.getElementById('roomCodeInput');
        const roomCode = roomCodeInput.value.trim();
        
        if (!FileTransferUtils.isValidRoomCode(roomCode)) {
            FileTransferUtils.showError('Please enter a valid 6-digit room code.');
            return;
        }
        
        try {
            // Get room info from server
            const roomInfo = await FileTransferUtils.getRoomInfo(roomCode);
            
            this.currentRoom = roomCode;
            this.availableFiles = roomInfo.files || [];
            
            // Join room via socket
            this.socket.emit('joinRoom', roomCode);
            
            // Show files section
            this.showFilesSection();
            this.updateFilesList();
            this.updateConnectionStatus(true);
            
            FileTransferUtils.showSuccess('Successfully joined room!');
            
        } catch (error) {
            console.error('Join room error:', error);
            FileTransferUtils.showError('Room not found or has expired.');
        }
    }
    
    handleRoomInfo(data) {
        this.currentRoom = data.roomCode;
        this.availableFiles = data.files || [];
        this.updateFilesList();
    }
    
    addFileToList(fileInfo) {
        if (!this.availableFiles.find(f => f.filename === fileInfo.filename)) {
            this.availableFiles.push(fileInfo);
            this.updateFilesList();
        }
    }
    
    updateFilesList() {
        const availableFiles = document.getElementById('availableFiles');
        const currentRoom = document.getElementById('currentRoom');
        
        if (this.currentRoom) {
            currentRoom.textContent = this.currentRoom;
        }
        
        if (this.availableFiles.length === 0) {
            availableFiles.innerHTML = '<p>No files available yet. Waiting for files to be uploaded...</p>';
            return;
        }
        
        availableFiles.innerHTML = '';
        
        this.availableFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="material-icons">${FileTransferUtils.generateFileIcon(file.mimetype)}</span>
                    <div class="file-details">
                        <h4>${file.originalName}</h4>
                        <p>${FileTransferUtils.formatFileSize(file.size)} • ${new Date(file.uploadedAt).toLocaleString()}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="download-btn" data-filename="${file.filename}" data-original="${file.originalName}" data-size="${file.size}">
                        <span class="material-icons">download</span>
                    </button>
                </div>
            `;
            
            // Add event listener for download button
            const downloadBtn = fileItem.querySelector('.download-btn');
            downloadBtn.addEventListener('click', () => {
                this.downloadFile(file.filename, file.originalName, file.size);
            });
            
            availableFiles.appendChild(fileItem);
        });
    }
    
    downloadFile(filename, originalName, size) {
        if (this.isDownloading) {
            FileTransferUtils.showError('Download in progress. Please wait.');
            return;
        }
        
        this.isDownloading = true;
        
        // Show download progress
        this.showDownloadProgress(originalName, size);
        
        // Start download
        this.performDownload(filename, originalName, size);
    }
    
    performDownload(filename, originalName, size) {
        const xhr = new XMLHttpRequest();
        const startTime = Date.now();
        this.speedCalculator.reset();
        
        xhr.open('GET', `${FileTransferUtils.API_BASE}/api/download/${this.currentRoom}/${filename}`, true);
        xhr.responseType = 'blob';
        
        xhr.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = (e.loaded / e.total) * 100;
                const now = Date.now();
                
                // Update progress bar
                document.getElementById('downloadProgressFill').style.width = percent + '%';
                document.getElementById('downloadProgressPercent').textContent = Math.round(percent) + '%';
                
                // Update downloaded size
                document.getElementById('downloadedSize').textContent = FileTransferUtils.formatFileSize(e.loaded);
                
                // Calculate speed
                this.speedCalculator.addMeasurement(e.loaded, now);
                const speed = this.speedCalculator.getCurrentSpeed();
                document.getElementById('downloadProgressSpeed').textContent = FileTransferUtils.formatSpeed(speed);
                
                // Emit progress to other clients
                this.socket.emit('downloadProgress', {
                    roomCode: this.currentRoom,
                    percent: percent,
                    downloadedSize: e.loaded,
                    totalSize: e.total,
                    speed: speed,
                    filename: originalName
                });
            }
        };
        
        xhr.onload = () => {
            if (xhr.status === 200) {
                // Create download link
                const blob = new Blob([xhr.response]);
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = originalName;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                window.URL.revokeObjectURL(url);
                
                FileTransferUtils.showSuccess(`Downloaded: ${originalName}`);
                
                // Update stats
                updateStats('received', size, 1, this.speedCalculator.getAverageSpeed());
                
                this.hideDownloadProgress();
                
            } else {
                FileTransferUtils.showError('Download failed.');
                this.hideDownloadProgress();
            }
            
            this.isDownloading = false;
        };
        
        xhr.onerror = () => {
            FileTransferUtils.showError('Download failed.');
            this.hideDownloadProgress();
            this.isDownloading = false;
        };
        
        xhr.send();
    }
    
    showDownloadProgress(filename, size) {
        const downloadProgressSection = document.getElementById('downloadProgressSection');
        const downloadTotalSize = document.getElementById('downloadTotalSize');
        
        downloadTotalSize.textContent = FileTransferUtils.formatFileSize(size);
        downloadProgressSection.style.display = 'block';
        
        // Reset progress
        document.getElementById('downloadProgressFill').style.width = '0%';
        document.getElementById('downloadProgressPercent').textContent = '0%';
        document.getElementById('downloadedSize').textContent = '0 MB';
        document.getElementById('downloadProgressSpeed').textContent = '0 KB/s';
    }
    
    hideDownloadProgress() {
        document.getElementById('downloadProgressSection').style.display = 'none';
    }
    
    updateUploadProgress(data) {
        // Could show upload progress from sender if needed
        console.log('Upload progress received:', data);
    }
    
    updateConnectionStatus(connected) {
        const connectionStatus = document.getElementById('connectionStatus');
        
        if (connected) {
            connectionStatus.innerHTML = '<span class="material-icons">wifi</span> Connected';
            connectionStatus.style.color = '#28a745';
        } else {
            connectionStatus.innerHTML = '<span class="material-icons">wifi_off</span> Disconnected';
            connectionStatus.style.color = '#dc3545';
        }
    }
    
    showFilesSection() {
        document.getElementById('roomInputSection').style.display = 'none';
        document.getElementById('filesSection').style.display = 'block';
    }
    
    hideFilesSection() {
        document.getElementById('roomInputSection').style.display = 'block';
        document.getElementById('filesSection').style.display = 'none';
    }
    
    resetReceiver() {
        this.currentRoom = null;
        this.availableFiles = [];
        this.isDownloading = false;
        this.speedCalculator.reset();
        
        // Reset UI
        document.getElementById('roomCodeInput').value = '';
        this.hideFilesSection();
        this.hideDownloadProgress();
        this.updateConnectionStatus(false);
    }
    
    // QR Scanner functionality
    async startQRScanner() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            
            const video = document.getElementById('qrVideo');
            const canvas = document.getElementById('qrCanvas');
            const context = canvas.getContext('2d');
            
            video.srcObject = stream;
            document.getElementById('qrScanner').style.display = 'block';
            
            this.qrScanner = setInterval(() => {
                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0);
                    
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, canvas.width, canvas.height);
                    
                    if (code) {
                        this.handleQRCode(code.data);
                    }
                }
            }, 100);
            
        } catch (error) {
            console.error('QR scanner error:', error);
            FileTransferUtils.showError('Camera access denied or not available.');
        }
    }
    
    stopQRScanner() {
        if (this.qrScanner) {
            clearInterval(this.qrScanner);
            this.qrScanner = null;
        }
        
        const video = document.getElementById('qrVideo');
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }
        
        document.getElementById('qrScanner').style.display = 'none';
    }
    
    handleQRCode(data) {
        try {
            const url = new URL(data);
            const roomCode = url.searchParams.get('room');
            
            if (roomCode && FileTransferUtils.isValidRoomCode(roomCode)) {
                this.stopQRScanner();
                document.getElementById('roomCodeInput').value = roomCode;
                this.joinRoom();
            } else {
                FileTransferUtils.showError('Invalid QR code.');
            }
        } catch (error) {
            FileTransferUtils.showError('Invalid QR code format.');
        }
    }
}

// Initialize receiver when page loads
let receiver;
document.addEventListener('DOMContentLoaded', () => {
    receiver = new FileReceiver();
});