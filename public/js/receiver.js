// Receiver page JavaScript
let socket;
let roomCode = null;
let fileInfo = null;

// Initialize socket connection
function initSocket() {
    socket = io();
    
    socket.on('connect', function() {
        console.log('Connected to server');
    });
    
    socket.on('room-joined', function(data) {
        console.log('Room joined:', data);
    });
    
    socket.on('file-ready', function(data) {
        fileInfo = data;
        showFileInfo(data);
    });
    
    socket.on('error', function(error) {
        console.error('Socket error:', error);
        showError('Connection error: ' + error);
    });
}

// Show/hide steps
function showStep(stepId) {
    document.querySelectorAll('.step').forEach(step => {
        step.style.display = 'none';
    });
    document.getElementById(stepId).style.display = 'block';
}

// Setup room code input
function setupRoomCodeInput() {
    const roomCodeInput = document.getElementById('room-code-input');
    const joinBtn = document.getElementById('join-btn');
    
    // Auto-format room code input
    roomCodeInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length > 6) {
            value = value.slice(0, 6);
        }
        e.target.value = value;
        
        // Enable/disable join button
        joinBtn.disabled = value.length !== 6;
    });
    
    // Join on Enter key
    roomCodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && roomCodeInput.value.length === 6) {
            joinRoom();
        }
    });
    
    // Join button click
    joinBtn.addEventListener('click', function() {
        joinRoom();
    });
}

function joinRoom() {
    const roomCodeInput = document.getElementById('room-code-input');
    roomCode = roomCodeInput.value.trim();
    
    if (roomCode.length !== 6) {
        showError('Please enter a valid 6-digit room code');
        return;
    }
    
    // Check if room exists and get file info
    fetch(`/api/room/${roomCode}`)
        .then(response => response.json())
        .then(data => {
            if (data.code) {
                if (data.file) {
                    fileInfo = data.file;
                    showFileInfo(data.file);
                } else {
                    // Room exists but no file yet, connect via socket
                    initSocket();
                    socket.emit('join-room', { roomCode: roomCode, role: 'receiver' });
                    showWaitingForFile();
                }
            } else {
                showError('Room not found. Please check the code and try again.');
            }
        })
        .catch(error => {
            console.error('Room check error:', error);
            showError('Failed to join room. Please try again.');
        });
}

function showWaitingForFile() {
    showStep('file-info-step');
    document.getElementById('file-name').textContent = 'Waiting for file...';
    document.getElementById('file-size').textContent = '';
    document.getElementById('file-type').textContent = '';
    document.getElementById('download-btn').disabled = true;
    document.getElementById('download-btn').textContent = 'Waiting for file...';
}

function showFileInfo(file) {
    document.getElementById('file-name').textContent = file.fileName || file.originalName;
    document.getElementById('file-size').textContent = formatFileSize(file.fileSize || file.size);
    document.getElementById('file-type').textContent = file.fileType || file.mimetype;
    
    // Set appropriate file icon
    const fileIcon = document.getElementById('file-icon');
    const fileType = (file.fileType || file.mimetype || '').toLowerCase();
    
    if (fileType.includes('image')) {
        fileIcon.textContent = '🖼️';
    } else if (fileType.includes('video')) {
        fileIcon.textContent = '🎥';
    } else if (fileType.includes('audio')) {
        fileIcon.textContent = '🎵';
    } else if (fileType.includes('pdf')) {
        fileIcon.textContent = '📄';
    } else if (fileType.includes('word') || fileType.includes('document')) {
        fileIcon.textContent = '📝';
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
        fileIcon.textContent = '📊';
    } else if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
        fileIcon.textContent = '📊';
    } else if (fileType.includes('zip') || fileType.includes('archive')) {
        fileIcon.textContent = '📦';
    } else {
        fileIcon.textContent = '📄';
    }
    
    // Enable download button
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.disabled = false;
    downloadBtn.innerHTML = '<span>📥 Download File</span>';
    
    // Setup download button
    downloadBtn.addEventListener('click', function() {
        downloadFile();
    });
    
    showStep('file-info-step');
}

function downloadFile() {
    if (!roomCode) {
        showError('No room code available');
        return;
    }
    
    showStep('download-step');
    
    // Create download link
    const downloadUrl = `/api/download/${roomCode}`;
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = fileInfo.fileName || fileInfo.originalName;
    downloadLink.style.display = 'none';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Show success after a short delay
    setTimeout(() => {
        showStep('success-step');
    }, 1000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    showStep('error-step');
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

function startOver() {
    roomCode = null;
    fileInfo = null;
    document.getElementById('room-code-input').value = '';
    showStep('code-step');
}

function goHome() {
    window.location.href = '/';
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupRoomCodeInput();
    
    // Check if room code is provided in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && code.length === 6) {
        document.getElementById('room-code-input').value = code;
        joinRoom();
    }
});