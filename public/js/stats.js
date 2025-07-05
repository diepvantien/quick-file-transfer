// Statistics tracking functionality
class StatsManager {
    constructor() {
        this.stats = this.loadStats();
        this.initializeStats();
    }
    
    loadStats() {
        try {
            const saved = localStorage.getItem('fileTransferStats');
            return saved ? JSON.parse(saved) : this.getDefaultStats();
        } catch (error) {
            console.error('Error loading stats:', error);
            return this.getDefaultStats();
        }
    }
    
    saveStats() {
        try {
            localStorage.setItem('fileTransferStats', JSON.stringify(this.stats));
        } catch (error) {
            console.error('Error saving stats:', error);
        }
    }
    
    getDefaultStats() {
        return {
            totalSent: 0,
            totalReceived: 0,
            filesTransferred: 0,
            bestSpeed: 0,
            sessions: 0,
            lastUpdate: Date.now()
        };
    }
    
    initializeStats() {
        this.updateDisplay();
    }
    
    updateSentStats(bytes, files, speed) {
        this.stats.totalSent += bytes;
        this.stats.filesTransferred += files;
        this.stats.sessions++;
        
        if (speed > this.stats.bestSpeed) {
            this.stats.bestSpeed = speed;
        }
        
        this.stats.lastUpdate = Date.now();
        this.saveStats();
        this.updateDisplay();
    }
    
    updateReceivedStats(bytes, files, speed) {
        this.stats.totalReceived += bytes;
        this.stats.filesTransferred += files;
        this.stats.sessions++;
        
        if (speed > this.stats.bestSpeed) {
            this.stats.bestSpeed = speed;
        }
        
        this.stats.lastUpdate = Date.now();
        this.saveStats();
        this.updateDisplay();
    }
    
    updateDisplay() {
        const totalSentEl = document.getElementById('totalSent');
        const totalReceivedEl = document.getElementById('totalReceived');
        const filesTransferredEl = document.getElementById('filesTransferred');
        const bestSpeedEl = document.getElementById('bestSpeed');
        
        if (totalSentEl) {
            totalSentEl.textContent = FileTransferUtils.formatFileSize(this.stats.totalSent);
        }
        
        if (totalReceivedEl) {
            totalReceivedEl.textContent = FileTransferUtils.formatFileSize(this.stats.totalReceived);
        }
        
        if (filesTransferredEl) {
            filesTransferredEl.textContent = this.stats.filesTransferred.toString();
        }
        
        if (bestSpeedEl) {
            bestSpeedEl.textContent = FileTransferUtils.formatSpeed(this.stats.bestSpeed);
        }
    }
    
    getStats() {
        return { ...this.stats };
    }
    
    resetStats() {
        this.stats = this.getDefaultStats();
        this.saveStats();
        this.updateDisplay();
    }
    
    exportStats() {
        const stats = this.getStats();
        stats.exportDate = new Date().toISOString();
        
        const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `file-transfer-stats-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
}

// Real-time performance monitoring
class PerformanceMonitor {
    constructor() {
        this.measurements = [];
        this.maxMeasurements = 50;
        this.isMonitoring = false;
        this.monitorInterval = null;
    }
    
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.monitorInterval = setInterval(() => {
            this.collectMeasurement();
        }, 1000); // Collect every second
    }
    
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }
    
    collectMeasurement() {
        const measurement = {
            timestamp: Date.now(),
            memory: this.getMemoryUsage(),
            networkSpeed: this.getNetworkSpeed(),
            activeConnections: this.getActiveConnections()
        };
        
        this.measurements.push(measurement);
        
        if (this.measurements.length > this.maxMeasurements) {
            this.measurements.shift();
        }
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }
    
    getNetworkSpeed() {
        if (navigator.connection) {
            return {
                downlink: navigator.connection.downlink,
                effectiveType: navigator.connection.effectiveType,
                rtt: navigator.connection.rtt
            };
        }
        return null;
    }
    
    getActiveConnections() {
        // This would need to be implemented based on actual connection tracking
        return 1; // Placeholder
    }
    
    getMeasurements() {
        return [...this.measurements];
    }
    
    getAverageSpeed() {
        if (this.measurements.length < 2) return 0;
        
        const speeds = this.measurements
            .map(m => m.networkSpeed?.downlink || 0)
            .filter(s => s > 0);
        
        if (speeds.length === 0) return 0;
        
        return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
    }
}

// Initialize global stats manager
const statsManager = new StatsManager();
const performanceMonitor = new PerformanceMonitor();

// Global functions for updating stats
function updateStats(type, bytes, files, speed) {
    if (type === 'sent') {
        statsManager.updateSentStats(bytes, files, speed);
    } else if (type === 'received') {
        statsManager.updateReceivedStats(bytes, files, speed);
    }
}

function updateStatsDisplay() {
    statsManager.updateDisplay();
}

function resetAllStats() {
    if (confirm('Are you sure you want to reset all statistics? This action cannot be undone.')) {
        statsManager.resetStats();
        FileTransferUtils.showSuccess('Statistics reset successfully.');
    }
}

function exportStats() {
    statsManager.exportStats();
    FileTransferUtils.showSuccess('Statistics exported successfully.');
}

// Enhanced stats display with charts (if Chart.js is available)
class StatsVisualizer {
    constructor() {
        this.charts = {};
        this.initializeVisualizations();
    }
    
    initializeVisualizations() {
        // Only initialize if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.createSpeedChart();
            this.createTransferChart();
        }
    }
    
    createSpeedChart() {
        const ctx = document.getElementById('speedChart');
        if (!ctx) return;
        
        this.charts.speed = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Transfer Speed',
                    data: [],
                    borderColor: '#4facfe',
                    backgroundColor: 'rgba(79, 172, 254, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return FileTransferUtils.formatSpeed(value);
                            }
                        }
                    }
                }
            }
        });
    }
    
    createTransferChart() {
        const ctx = document.getElementById('transferChart');
        if (!ctx) return;
        
        this.charts.transfer = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sent', 'Received'],
                datasets: [{
                    data: [statsManager.stats.totalSent, statsManager.stats.totalReceived],
                    backgroundColor: ['#4facfe', '#43e97b']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.label + ': ' + FileTransferUtils.formatFileSize(context.raw);
                            }
                        }
                    }
                }
            }
        });
    }
    
    updateSpeedChart(speed) {
        if (!this.charts.speed) return;
        
        const chart = this.charts.speed;
        const now = new Date().toLocaleTimeString();
        
        chart.data.labels.push(now);
        chart.data.datasets[0].data.push(speed);
        
        // Keep only last 20 data points
        if (chart.data.labels.length > 20) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        
        chart.update();
    }
    
    updateTransferChart() {
        if (!this.charts.transfer) return;
        
        const chart = this.charts.transfer;
        chart.data.datasets[0].data = [statsManager.stats.totalSent, statsManager.stats.totalReceived];
        chart.update();
    }
}

// Initialize visualizer if needed
let statsVisualizer;
document.addEventListener('DOMContentLoaded', () => {
    statsVisualizer = new StatsVisualizer();
});

// Export for global use
window.StatsManager = StatsManager;
window.PerformanceMonitor = PerformanceMonitor;
window.updateStats = updateStats;
window.updateStatsDisplay = updateStatsDisplay;
window.resetAllStats = resetAllStats;
window.exportStats = exportStats;