// Common utilities and functions
const API_BASE = window.location.origin;

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond) {
    if (bytesPerSecond === 0) return '0 KB/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateFileIcon(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'movie';
    if (mimetype.startsWith('audio/')) return 'music_note';
    if (mimetype.includes('pdf')) return 'picture_as_pdf';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'description';
    if (mimetype.includes('sheet') || mimetype.includes('excel')) return 'table_chart';
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'slideshow';
    if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('tar')) return 'archive';
    if (mimetype.includes('text/')) return 'text_snippet';
    return 'insert_drive_file';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    // Insert at the top of the main card
    const mainCard = document.querySelector('.main-card');
    mainCard.insertBefore(errorDiv, mainCard.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    
    // Insert at the top of the main card
    const mainCard = document.querySelector('.main-card');
    mainCard.insertBefore(successDiv, mainCard.firstChild);
    
    // Remove after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function goBack() {
    window.history.back();
}

// API functions
async function createRoom() {
    try {
        const response = await fetch(`${API_BASE}/api/create-room`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error('Failed to create room');
        }
        
        const data = await response.json();
        return data.roomCode;
    } catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
}

async function getRoomInfo(roomCode) {
    try {
        const response = await fetch(`${API_BASE}/api/room/${roomCode}`);
        
        if (!response.ok) {
            throw new Error('Room not found');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error getting room info:', error);
        throw error;
    }
}

async function uploadFile(roomCode, file, onProgress) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                onProgress(percentComplete, e.loaded, e.total);
            }
        });
        
        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
            } else {
                reject(new Error('Upload failed'));
            }
        });
        
        xhr.addEventListener('error', () => {
            reject(new Error('Upload failed'));
        });
        
        xhr.open('POST', `${API_BASE}/api/upload/${roomCode}`);
        xhr.send(formData);
    });
}

function downloadFile(roomCode, filename, originalName) {
    const link = document.createElement('a');
    link.href = `${API_BASE}/api/download/${roomCode}/${filename}`;
    link.download = originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Copy to clipboard function
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            textArea.remove();
            return true;
        } catch (err) {
            textArea.remove();
            return false;
        }
    }
}

// Validate room code
function isValidRoomCode(code) {
    return /^\d{6}$/.test(code);
}

// Generate QR code URL
function generateQRCodeURL(roomCode) {
    return `${window.location.origin}/receiver?room=${roomCode}`;
}

// Speed calculation helper
class SpeedCalculator {
    constructor() {
        this.measurements = [];
        this.maxMeasurements = 10; // Keep last 10 measurements for smoothing
    }
    
    addMeasurement(bytesTransferred, timestamp) {
        this.measurements.push({ bytes: bytesTransferred, time: timestamp });
        
        // Remove old measurements
        if (this.measurements.length > this.maxMeasurements) {
            this.measurements.shift();
        }
    }
    
    getCurrentSpeed() {
        if (this.measurements.length < 2) return 0;
        
        const recent = this.measurements.slice(-2);
        const timeDiff = (recent[1].time - recent[0].time) / 1000; // Convert to seconds
        const bytesDiff = recent[1].bytes - recent[0].bytes;
        
        if (timeDiff <= 0) return 0;
        
        return bytesDiff / timeDiff;
    }
    
    getAverageSpeed() {
        if (this.measurements.length < 2) return 0;
        
        const first = this.measurements[0];
        const last = this.measurements[this.measurements.length - 1];
        
        const timeDiff = (last.time - first.time) / 1000;
        const bytesDiff = last.bytes - first.bytes;
        
        if (timeDiff <= 0) return 0;
        
        return bytesDiff / timeDiff;
    }
    
    reset() {
        this.measurements = [];
    }
}

// Export for use in other files
window.FileTransferUtils = {
    formatFileSize,
    formatSpeed,
    generateFileIcon,
    showError,
    showSuccess,
    createRoom,
    getRoomInfo,
    uploadFile,
    downloadFile,
    copyToClipboard,
    isValidRoomCode,
    generateQRCodeURL,
    SpeedCalculator,
    API_BASE
};