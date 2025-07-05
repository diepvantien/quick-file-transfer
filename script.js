// Performance tracking variables
let transferStats = {
    totalSent: 0,
    totalReceived: 0,
    filesTransferred: 0,
    currentSpeed: 0,
    averageSpeed: 0,
    startTime: null,
    lastUpdateTime: null,
    bytesTransferred: 0,
    speedHistory: []
};

// Load stats from localStorage on page load
window.addEventListener('load', function() {
    loadStatsFromStorage();
    updateStatsDisplay();
    
    // Initialize file upload functionality
    initializeFileUpload();
});

// Initialize file upload functionality
function initializeFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    // File input change event
    fileInput.addEventListener('change', handleFileSelection);
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Initialize other UI elements
    document.getElementById('generateLinkBtn').addEventListener('click', generateShareLink);
    document.getElementById('qrCodeBtn').addEventListener('click', showQRCode);
}

// File selection handler
function handleFileSelection(event) {
    const files = event.target.files;
    if (files.length > 0) {
        displaySelectedFiles(files);
        // Start simulated transfer for demo purposes
        startFileTransfer(files);
    }
}

// Drag and drop handlers
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        document.getElementById('fileInput').files = files;
        displaySelectedFiles(files);
        startFileTransfer(files);
    }
}

// Display selected files
function displaySelectedFiles(files) {
    const filesList = document.getElementById('filesList');
    const filesContainer = document.getElementById('filesContainer');
    
    filesContainer.innerHTML = '';
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item fade-in';
        fileItem.innerHTML = `
            <div class="file-icon">📄</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
        `;
        filesContainer.appendChild(fileItem);
    }
    
    filesList.style.display = 'block';
}

// Start file transfer simulation
function startFileTransfer(files) {
    const progressArea = document.getElementById('progressArea');
    const fileName = document.getElementById('fileName');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const transferSpeed = document.getElementById('transferSpeed');
    const timeRemaining = document.getElementById('timeRemaining');
    
    // Calculate total size
    let totalSize = 0;
    for (let i = 0; i < files.length; i++) {
        totalSize += files[i].size;
    }
    
    // Initialize transfer stats
    transferStats.startTime = Date.now();
    transferStats.lastUpdateTime = Date.now();
    transferStats.bytesTransferred = 0;
    transferStats.speedHistory = [];
    
    progressArea.style.display = 'block';
    fileName.textContent = files.length > 1 ? `${files.length} files` : files[0].name;
    
    // Simulate file transfer
    let transferred = 0;
    const transferInterval = setInterval(() => {
        // Simulate variable transfer speed (between 100KB/s to 5MB/s)
        const minSpeed = 100 * 1024; // 100KB/s
        const maxSpeed = 5 * 1024 * 1024; // 5MB/s
        const randomSpeed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        
        // Calculate bytes to transfer in this interval (100ms)
        const bytesToTransfer = Math.min(randomSpeed * 0.1, totalSize - transferred);
        transferred += bytesToTransfer;
        
        // Update progress
        const progress = (transferred / totalSize) * 100;
        progressFill.style.width = progress + '%';
        progressPercent.textContent = Math.round(progress) + '%';
        
        // Update speed calculations
        updateSpeedTracking(bytesToTransfer);
        
        // Update UI
        transferSpeed.textContent = formatSpeed(transferStats.currentSpeed);
        const remaining = (totalSize - transferred) / transferStats.currentSpeed;
        timeRemaining.textContent = formatTime(remaining);
        
        // Update stats
        transferStats.totalSent += bytesToTransfer;
        transferStats.bytesTransferred += bytesToTransfer;
        
        // Update stats display
        updateStatsDisplay();
        
        // Check if transfer is complete
        if (transferred >= totalSize) {
            clearInterval(transferInterval);
            completeTransfer(files.length);
        }
    }, 100);
}

// Update speed tracking
function updateSpeedTracking(bytesTransferred) {
    const now = Date.now();
    const timeDiff = (now - transferStats.lastUpdateTime) / 1000; // Convert to seconds
    
    if (timeDiff > 0) {
        // Calculate instantaneous speed
        const instantaneousSpeed = bytesTransferred / timeDiff;
        transferStats.currentSpeed = instantaneousSpeed;
        
        // Add to speed history for average calculation
        transferStats.speedHistory.push(instantaneousSpeed);
        
        // Keep only last 20 speed measurements for rolling average
        if (transferStats.speedHistory.length > 20) {
            transferStats.speedHistory.shift();
        }
        
        // Calculate average speed
        const sum = transferStats.speedHistory.reduce((a, b) => a + b, 0);
        transferStats.averageSpeed = sum / transferStats.speedHistory.length;
        
        transferStats.lastUpdateTime = now;
    }
}

// Complete transfer
function completeTransfer(fileCount) {
    transferStats.filesTransferred += fileCount;
    
    // Save stats to localStorage
    saveStatsToStorage();
    
    // Show completion message
    setTimeout(() => {
        alert(`Transfer complete! ${fileCount} file(s) sent successfully.`);
        document.getElementById('progressArea').style.display = 'none';
        
        // Reset for next transfer
        transferStats.currentSpeed = 0;
        updateStatsDisplay();
    }, 500);
}

// Stats dashboard functions
function toggleStats() {
    const dashboard = document.getElementById('statsDashboard');
    const toggle = document.getElementById('statsToggle');
    
    dashboard.classList.toggle('collapsed');
    toggle.textContent = dashboard.classList.contains('collapsed') ? '+' : '−';
}

function resetStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
        transferStats = {
            totalSent: 0,
            totalReceived: 0,
            filesTransferred: 0,
            currentSpeed: 0,
            averageSpeed: 0,
            startTime: null,
            lastUpdateTime: null,
            bytesTransferred: 0,
            speedHistory: []
        };
        
        saveStatsToStorage();
        updateStatsDisplay();
    }
}

function hideStats() {
    const dashboard = document.getElementById('statsDashboard');
    dashboard.classList.add('hidden');
    
    // Save visibility state
    localStorage.setItem('statsHidden', 'true');
}

function showStats() {
    const dashboard = document.getElementById('statsDashboard');
    dashboard.classList.remove('hidden');
    
    // Save visibility state
    localStorage.setItem('statsHidden', 'false');
}

// Update stats display
function updateStatsDisplay() {
    document.getElementById('currentSpeed').textContent = formatSpeed(transferStats.currentSpeed);
    document.getElementById('totalSent').textContent = formatFileSize(transferStats.totalSent);
    document.getElementById('totalReceived').textContent = formatFileSize(transferStats.totalReceived);
    document.getElementById('filesCount').textContent = transferStats.filesTransferred;
    
    // Add animation classes for updated values
    const elements = ['currentSpeed', 'totalSent', 'totalReceived', 'filesCount'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        element.classList.add('updated');
        setTimeout(() => element.classList.remove('updated'), 500);
    });
}

// Save stats to localStorage
function saveStatsToStorage() {
    const statsToSave = {
        totalSent: transferStats.totalSent,
        totalReceived: transferStats.totalReceived,
        filesTransferred: transferStats.filesTransferred
    };
    
    localStorage.setItem('transferStats', JSON.stringify(statsToSave));
}

// Load stats from localStorage
function loadStatsFromStorage() {
    const savedStats = localStorage.getItem('transferStats');
    if (savedStats) {
        const parsed = JSON.parse(savedStats);
        transferStats.totalSent = parsed.totalSent || 0;
        transferStats.totalReceived = parsed.totalReceived || 0;
        transferStats.filesTransferred = parsed.filesTransferred || 0;
    }
    
    // Load visibility state
    const statsHidden = localStorage.getItem('statsHidden');
    if (statsHidden === 'true') {
        document.getElementById('statsDashboard').classList.add('hidden');
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond) {
    if (bytesPerSecond === 0) return '0 KB/s';
    
    const k = 1024;
    const speeds = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + speeds[i];
}

function formatTime(seconds) {
    if (!seconds || seconds === Infinity) return '--:--';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Share link functionality
function generateShareLink() {
    const shareLink = document.getElementById('shareLink');
    const linkInput = document.getElementById('linkInput');
    
    // Generate a mock share link
    const linkId = Math.random().toString(36).substring(2, 15);
    const mockLink = `https://quicktransfer.app/share/${linkId}`;
    
    linkInput.value = mockLink;
    shareLink.style.display = 'flex';
    shareLink.classList.add('fade-in');
}

function copyLink() {
    const linkInput = document.getElementById('linkInput');
    linkInput.select();
    document.execCommand('copy');
    
    // Show feedback
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    button.style.background = '#4CAF50';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '#667eea';
    }, 2000);
}

function showQRCode() {
    alert('QR Code functionality would be implemented here. This would generate a QR code for the share link.');
}

// Simulate receiving files (for demo purposes)
function simulateReceiveFile() {
    const fileSize = Math.random() * 10 * 1024 * 1024; // Random file size up to 10MB
    transferStats.totalReceived += fileSize;
    transferStats.filesTransferred += 1;
    
    saveStatsToStorage();
    updateStatsDisplay();
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + S to toggle stats
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        toggleStats();
    }
    
    // Ctrl/Cmd + R to reset stats
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        resetStats();
    }
});

// Add demo button for receiving files (for testing purposes)
document.addEventListener('DOMContentLoaded', function() {
    // Add a demo button for receiving files
    setTimeout(() => {
        const demoButton = document.createElement('button');
        demoButton.textContent = 'Demo: Receive File';
        demoButton.className = 'method-btn';
        demoButton.style.marginTop = '10px';
        demoButton.onclick = simulateReceiveFile;
        
        const connectionMethods = document.querySelector('.connection-methods');
        connectionMethods.appendChild(demoButton);
    }, 1000);
});

// Performance monitoring
setInterval(() => {
    // Update current speed display even when not transferring
    if (transferStats.currentSpeed === 0) {
        document.getElementById('currentSpeed').textContent = '0 KB/s';
    }
}, 1000);

// Add tooltips for better UX
document.addEventListener('DOMContentLoaded', function() {
    const statsItems = document.querySelectorAll('.stat-item');
    
    const tooltips = {
        'Speed:': 'Current transfer speed',
        '📤 Sent:': 'Total data sent in all sessions',
        '📥 Received:': 'Total data received in all sessions',
        '📁 Files:': 'Total number of files transferred'
    };
    
    statsItems.forEach(item => {
        const label = item.querySelector('.stat-label').textContent;
        if (tooltips[label]) {
            item.title = tooltips[label];
        }
    });
});

// Console log for debugging
console.log('Quick File Transfer initialized with performance tracking');
console.log('Available keyboard shortcuts: Ctrl+S (toggle stats), Ctrl+R (reset stats)');