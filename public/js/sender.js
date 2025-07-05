// Sender page JavaScript
let socket;
let roomCode = null;
let selectedFile = null;
let downloadCount = 0;

// Initialize socket connection
function initSocket() {
    socket = io();
    
    socket.on('connect', function() {
        console.log('Connected to server');
    });
    
    socket.on('room-joined', function(data) {
        console.log('Room joined:', data);
        document.getElementById('connection-status').textContent = 'Connected';
        // Don't auto-show status step - let QR code be visible first
    });
    
    socket.on('user-joined', function(data) {
        if (data.role === 'receiver') {
            document.getElementById('connection-status').textContent = 'Receiver connected';
        }
    });
    
    socket.on('download-complete', function() {
        downloadCount++;
        document.getElementById('download-count').textContent = downloadCount;
        showNotification('File downloaded successfully!');
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

// File upload handling
function setupFileUpload() {
    const fileInput = document.getElementById('file-input');
    const fileUploadArea = document.getElementById('file-upload');
    const fileInfo = document.getElementById('file-info');
    const uploadBtn = document.getElementById('upload-btn');
    
    // File input change
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleFileSelection(file);
        }
    });
    
    // Drag and drop
    fileUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        fileUploadArea.classList.add('drag-over');
    });
    
    fileUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('drag-over');
    });
    
    fileUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        fileUploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });
    
    // Upload button click
    uploadBtn.addEventListener('click', function() {
        if (selectedFile) {
            uploadFile();
        }
    });
}

function handleFileSelection(file) {
    selectedFile = file;
    
    // Display file info
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = formatFileSize(file.size);
    
    // Show file info and hide upload area
    document.getElementById('file-upload').style.display = 'none';
    document.getElementById('file-info').style.display = 'block';
}

function uploadFile() {
    if (!selectedFile) return;
    
    // Create room first
    fetch('/api/create-room', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        roomCode = data.roomCode;
        
        // Upload file
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        fetch(`/api/upload/${roomCode}`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                generateQRCode();
            } else {
                showError('Upload failed: ' + result.error);
            }
        })
        .catch(error => {
            console.error('Upload error:', error);
            showError('Upload failed. Please try again.');
        });
    })
    .catch(error => {
        console.error('Room creation error:', error);
        showError('Failed to create room. Please try again.');
    });
}

function generateQRCode() {
    fetch(`/api/qr/${roomCode}`)
        .then(response => response.json())
        .then(data => {
            if (data.qrCode) {
                const qrCodeElement = document.getElementById('qr-code');
                qrCodeElement.innerHTML = `<img src="${data.qrCode}" alt="QR Code">`;
                
                document.getElementById('room-code').textContent = roomCode;
                
                // Setup copy link functionality
                document.getElementById('copy-link').addEventListener('click', function() {
                    navigator.clipboard.writeText(data.url).then(() => {
                        showNotification('Link copied to clipboard!');
                    });
                });
                
                showStep('qr-step');
                
                // Initialize socket and connect after QR code is shown
                initSocket();
                socket.emit('join-room', { roomCode: roomCode, role: 'sender' });
            }
        })
        .catch(error => {
            console.error('QR code generation error:', error);
            showError('Failed to generate QR code.');
        });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message) {
    // Simple notification - you can enhance this with a better UI
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

function showError(message) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = '#f44336';
    notification.style.color = 'white';
    notification.style.padding = '15px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 5000);
}

function goHome() {
    window.location.href = '/';
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupFileUpload();
});