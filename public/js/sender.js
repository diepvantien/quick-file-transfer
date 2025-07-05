// Sender functionality
class FileSender {
    constructor() {
        this.selectedFiles = [];
        this.roomCode = null;
        this.socket = null;
        this.speedCalculator = new FileTransferUtils.SpeedCalculator();
        this.isUploading = false;
        
        this.initializeEventListeners();
        this.connectSocket();
    }
    
    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const selectBtn = document.getElementById('selectBtn');
        const uploadBtn = document.getElementById('uploadBtn');
        const clearBtn = document.getElementById('clearBtn');
        const copyBtn = document.getElementById('copyBtn');
        const backBtn = document.getElementById('backBtn');
        
        // Back button
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                window.history.back();
            });
        }
        
        // Select files button
        if (selectBtn) {
            selectBtn.addEventListener('click', () => {
                if (!this.isUploading) {
                    fileInput.click();
                }
            });
        }
        
        // Upload button
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                this.uploadFiles();
            });
        }
        
        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFiles();
            });
        }
        
        // Copy button
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const roomCode = document.getElementById('roomCode').textContent;
                
                FileTransferUtils.copyToClipboard(roomCode).then(success => {
                    if (success) {
                        FileTransferUtils.showSuccess('Room code copied to clipboard!');
                    } else {
                        FileTransferUtils.showError('Failed to copy room code.');
                    }
                });
            });
        }
        
        // Drag and drop events
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files);
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFiles(files);
        });
        
        // Click to select files
        uploadArea.addEventListener('click', () => {
            if (!this.isUploading) {
                fileInput.click();
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
        });
        
        this.socket.on('fileUploaded', (fileInfo) => {
            console.log('File uploaded:', fileInfo);
        });
        
        this.socket.on('roomExpired', () => {
            FileTransferUtils.showError('Room has expired. Please create a new room.');
            this.resetSender();
        });
    }
    
    handleFiles(files) {
        if (this.isUploading) {
            FileTransferUtils.showError('Upload in progress. Please wait.');
            return;
        }
        
        // Validate files
        const validFiles = [];
        let totalSize = 0;
        
        for (const file of files) {
            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                FileTransferUtils.showError(`File "${file.name}" is too large. Maximum size is 100MB.`);
                continue;
            }
            
            totalSize += file.size;
            validFiles.push(file);
        }
        
        if (validFiles.length === 0) {
            return;
        }
        
        // Check if adding files would exceed total limit
        const currentSize = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
        if (currentSize + totalSize > 500 * 1024 * 1024) { // 500MB total limit
            FileTransferUtils.showError('Total file size would exceed 500MB limit.');
            return;
        }
        
        // Add files to selection
        this.selectedFiles = [...this.selectedFiles, ...validFiles];
        this.updateFileList();
        this.showFileList();
    }
    
    updateFileList() {
        const filesContainer = document.getElementById('filesContainer');
        filesContainer.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <span class="material-icons">${FileTransferUtils.generateFileIcon(file.type)}</span>
                    <div class="file-details">
                        <h4>${file.name}</h4>
                        <p>${FileTransferUtils.formatFileSize(file.size)}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="remove-btn" data-index="${index}">
                        <span class="material-icons">close</span>
                    </button>
                </div>
            `;
            
            // Add event listener for remove button
            const removeBtn = fileItem.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => {
                this.removeFile(index);
            });
            
            filesContainer.appendChild(fileItem);
        });
    }
    
    removeFile(index) {
        if (this.isUploading) {
            FileTransferUtils.showError('Cannot remove files during upload.');
            return;
        }
        
        this.selectedFiles.splice(index, 1);
        this.updateFileList();
        
        if (this.selectedFiles.length === 0) {
            this.hideFileList();
        }
    }
    
    showFileList() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('fileList').style.display = 'block';
    }
    
    hideFileList() {
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('fileList').style.display = 'none';
    }
    
    clearFiles() {
        if (this.isUploading) {
            FileTransferUtils.showError('Cannot clear files during upload.');
            return;
        }
        
        this.selectedFiles = [];
        this.hideFileList();
        
        // Reset file input
        const fileInput = document.getElementById('fileInput');
        fileInput.value = '';
    }
    
    async uploadFiles() {
        if (this.selectedFiles.length === 0) {
            FileTransferUtils.showError('Please select files to upload.');
            return;
        }
        
        if (this.isUploading) {
            FileTransferUtils.showError('Upload already in progress.');
            return;
        }
        
        try {
            this.isUploading = true;
            
            // Create room first
            this.roomCode = await FileTransferUtils.createRoom();
            
            // Join room via socket
            this.socket.emit('joinRoom', this.roomCode);
            
            // Show QR code
            this.showQRCode();
            
            // Start upload process
            await this.uploadFilesSequentially();
            
            FileTransferUtils.showSuccess('All files uploaded successfully!');
            
            // Update stats
            const totalSize = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
            updateStats('sent', totalSize, this.selectedFiles.length, this.speedCalculator.getAverageSpeed());
            
        } catch (error) {
            console.error('Upload error:', error);
            FileTransferUtils.showError('Upload failed: ' + error.message);
            this.resetSender();
        } finally {
            this.isUploading = false;
        }
    }
    
    async uploadFilesSequentially() {
        const totalSize = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
        let uploadedSize = 0;
        
        // Show progress section
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('totalSize').textContent = FileTransferUtils.formatFileSize(totalSize);
        
        this.speedCalculator.reset();
        const startTime = Date.now();
        
        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            
            await FileTransferUtils.uploadFile(this.roomCode, file, (percent, loaded, total) => {
                const currentFileProgress = loaded;
                const totalProgress = uploadedSize + currentFileProgress;
                const overallPercent = (totalProgress / totalSize) * 100;
                
                // Update progress bar
                document.getElementById('progressFill').style.width = overallPercent + '%';
                document.getElementById('progressPercent').textContent = Math.round(overallPercent) + '%';
                
                // Update uploaded size
                document.getElementById('uploadedSize').textContent = FileTransferUtils.formatFileSize(totalProgress);
                
                // Calculate speed
                const now = Date.now();
                this.speedCalculator.addMeasurement(totalProgress, now);
                const speed = this.speedCalculator.getCurrentSpeed();
                document.getElementById('progressSpeed').textContent = FileTransferUtils.formatSpeed(speed);
                
                // Emit progress to other clients
                this.socket.emit('uploadProgress', {
                    roomCode: this.roomCode,
                    percent: overallPercent,
                    uploadedSize: totalProgress,
                    totalSize: totalSize,
                    speed: speed,
                    currentFile: file.name,
                    fileIndex: i + 1,
                    totalFiles: this.selectedFiles.length
                });
            });
            
            uploadedSize += file.size;
        }
    }
    
    showQRCode() {
        const qrSection = document.getElementById('qrSection');
        const qrCode = document.getElementById('qrCode');
        const roomCodeSpan = document.getElementById('roomCode');
        
        // Set room code
        roomCodeSpan.textContent = this.roomCode;
        
        // Generate QR code
        const qrUrl = FileTransferUtils.generateQRCodeURL(this.roomCode);
        qrCode.innerHTML = '';
        
        QRCode.toCanvas(qrCode, qrUrl, {
            width: 200,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (error) => {
            if (error) {
                console.error('QR code generation error:', error);
                qrCode.innerHTML = '<p>QR Code generation failed</p>';
            }
        });
        
        // Show QR section
        qrSection.style.display = 'block';
    }
    
    resetSender() {
        this.selectedFiles = [];
        this.roomCode = null;
        this.isUploading = false;
        this.speedCalculator.reset();
        
        // Hide all sections except upload
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('fileList').style.display = 'none';
        document.getElementById('qrSection').style.display = 'none';
        document.getElementById('progressSection').style.display = 'none';
        
        // Reset file input
        const fileInput = document.getElementById('fileInput');
        fileInput.value = '';
    }
}

// Initialize sender when page loads
let sender;
document.addEventListener('DOMContentLoaded', () => {
    sender = new FileSender();
});