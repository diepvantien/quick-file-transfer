/**
 * QR Code Generator - Extracted from QR-Code-Pro
 * Simple QR code generation for file transfer URLs
 */

class QRGenerator {
    constructor() {
        this.qrcode = null;
        this.size = 280;
    }

    /**
     * Generate QR code for given data
     * @param {string} data - Data to encode in QR code
     * @param {number} size - Size of QR code (default: 280)
     * @returns {string} HTML string containing QR code
     */
    generateQR(data, size = 280) {
        if (!data || data.trim() === '') {
            return this.getPlaceholder();
        }

        this.size = size;
        
        try {
            // Use simple QR API approach for reliable generation
            return this.generateQRSimple(data, size);
        } catch (error) {
            console.error('QR generation error:', error);
            return this.getErrorPlaceholder();
        }
    }

    /**
     * Generate QR code using simple matrix approach
     * @param {string} data - Data to encode
     * @param {number} size - Size of QR code
     * @returns {string} HTML string
     */
    generateQRSimple(data, size) {
        // Create a simple QR-like pattern for demonstration
        // This is a simplified version - in production you'd use a proper QR library
        const moduleSize = Math.floor(size / 25); // 25x25 grid
        const actualSize = moduleSize * 25;
        
        let html = `<div class="qr-container" style="background: white; padding: 15px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">`;
        
        // Try to use the external QR API if available, otherwise create a simple pattern
        if (navigator.onLine) {
            // Use QR Server API as fallback
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
            html += `<img src="${qrUrl}" alt="QR Code" style="width: ${size}px; height: ${size}px; border-radius: 8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />`;
            html += `<div style="display: none; width: ${size}px; height: ${size}px; background: #f0f0f0; border: 2px dashed #ccc; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px;">
                        <i class="fas fa-qrcode" style="font-size: 36px; color: #666;"></i>
                        <div style="color: #666; text-align: center; font-size: 14px;">QR Code<br><small>${data.length > 30 ? data.substring(0, 30) + '...' : data}</small></div>
                     </div>`;
        } else {
            // Offline fallback - show data representation
            html += `<div style="width: ${size}px; height: ${size}px; background: #f0f0f0; border: 2px dashed #ccc; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 10px;">
                        <i class="fas fa-qrcode" style="font-size: 36px; color: #666;"></i>
                        <div style="color: #666; text-align: center; font-size: 14px;">QR Code<br><small>${data.length > 30 ? data.substring(0, 30) + '...' : data}</small></div>
                     </div>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Render QR code as HTML
     * @param {Object} qr - QR code object
     * @returns {string} HTML string
     */
    renderQR(qr) {
        const moduleCount = qr.getModuleCount();
        const cellSize = Math.floor(this.size / moduleCount);
        const actualSize = cellSize * moduleCount;
        
        let html = `<div class="qr-container" style="background: white; padding: 15px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">`;
        html += `<div style="font-size: 0; line-height: 0; width: ${actualSize}px; height: ${actualSize}px;">`;
        
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                const color = qr.isDark(row, col) ? '#000000' : '#ffffff';
                html += `<div style="display: inline-block; width: ${cellSize}px; height: ${cellSize}px; background: ${color};"></div>`;
            }
            html += '<br>';
        }
        
        html += '</div></div>';
        return html;
    }

    /**
     * Get placeholder when no data
     * @returns {string} Placeholder HTML
     */
    getPlaceholder() {
        return `
            <div class="qr-placeholder" style="width: ${this.size}px; height: ${this.size}px; background: #f8f9fa; border: 2px dashed #dee2e6; display: flex; align-items: center; justify-content: center; border-radius: 10px; color: #6c757d; flex-direction: column; gap: 10px;">
                <i class="fas fa-qrcode" style="font-size: 36px;"></i>
                <div>Tạo phòng để hiển thị QR</div>
            </div>
        `;
    }

    /**
     * Get error placeholder
     * @returns {string} Error placeholder HTML
     */
    getErrorPlaceholder() {
        return `
            <div class="qr-placeholder" style="width: ${this.size}px; height: ${this.size}px; background: #f8f9fa; border: 2px dashed #dc3545; display: flex; align-items: center; justify-content: center; border-radius: 10px; color: #dc3545; flex-direction: column; gap: 10px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 36px;"></i>
                <div>Lỗi tạo QR code</div>
            </div>
        `;
    }

    /**
     * Download QR code as PNG
     * @param {string} filename - File name for download
     */
    downloadQR(filename = 'qrcode') {
        try {
            const qrContainer = document.querySelector('.qr-container img');
            if (qrContainer) {
                // Create download link for the image
                const link = document.createElement('a');
                link.href = qrContainer.src;
                link.download = `${filename}-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return true;
            } else if (this.qrcode) {
                // Fallback to canvas approach
                const canvas = this.createCanvas();
                const link = document.createElement('a');
                const timestamp = new Date().getTime();
                link.download = `${filename}-${timestamp}.png`;
                link.href = canvas.toDataURL('image/png', 0.95);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Download error:', error);
            return false;
        }
    }

    /**
     * Copy QR code to clipboard
     */
    async copyQR() {
        try {
            const qrContainer = document.querySelector('.qr-container img');
            if (qrContainer) {
                // Copy the QR code image
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = qrContainer.naturalWidth || this.size;
                canvas.height = qrContainer.naturalHeight || this.size;
                
                ctx.drawImage(qrContainer, 0, 0);
                
                canvas.toBlob(async (blob) => {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                });
                return true;
            } else if (this.qrcode) {
                // Fallback to canvas approach
                const canvas = this.createCanvas();
                canvas.toBlob(async (blob) => {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Copy error:', error);
            return false;
        }
    }

    /**
     * Create canvas for QR code
     * @returns {HTMLCanvasElement} Canvas element
     */
    createCanvas() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const moduleCount = this.qrcode.getModuleCount();
        const cellSize = 8;
        const padding = 20;
        
        canvas.width = canvas.height = (moduleCount * cellSize) + (padding * 2);
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Black modules
        ctx.fillStyle = '#000000';
        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (this.qrcode.isDark(row, col)) {
                    ctx.fillRect(
                        padding + (col * cellSize), 
                        padding + (row * cellSize), 
                        cellSize, 
                        cellSize
                    );
                }
            }
        }
        
        return canvas;
    }
}

// Export for use in other files
window.QRGenerator = QRGenerator;