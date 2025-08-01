// SIMPLIFIED CRYPTO QR - Federal Command Center
// Classification: UNCLASSIFIED // For Patriot Use Only

// Global variables for modal state
let currentQRAddress = '';
let currentQRCryptoName = '';

// Initialize functionality on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🦅 Simplified Crypto System Initialized - Federal Authority');
});

// Show QR image modal
function showQRImage(imagePath, cryptoName, address) {
    currentQRAddress = address;
    currentQRCryptoName = cryptoName;
    
    // Update modal content
    document.getElementById('qr-image').src = imagePath;
    document.getElementById('qr-image').alt = `${cryptoName} QR Code`;
    document.getElementById('qr-address').textContent = address;
    
    // Show modal
    const modal = document.getElementById('qr-modal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Close on escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeQRModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Close on backdrop click
    modal.onclick = function(e) {
        if (e.target === modal) {
            closeQRModal();
        }
    };
}

// Close QR modal
function closeQRModal() {
    const modal = document.getElementById('qr-modal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    
    // Clear QR image
    document.getElementById('qr-image').src = '';
}

// Copy QR address to clipboard
async function copyQRAddress() {
    if (!currentQRAddress) {
        showFederalNotification('No address to copy', 'error');
        return;
    }
    
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(currentQRAddress);
        } else {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = currentQRAddress;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
        }
        
        showFederalNotification(`${currentQRCryptoName} address copied`, 'success');
    } catch (error) {
        console.error('Copy failed:', error);
        showFederalNotification('Copy failed', 'error');
    }
}

// Show federal-styled notifications
function showFederalNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.federal-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'federal-notification';
    
    const bgColor = type === 'success' ? 'var(--color-bg-command)' : 
                   type === 'error' ? 'var(--color-crimson-alert)' : 
                   'var(--color-steel-gray)';
    
    notification.style.cssText = `
        position: fixed;
        top: var(--space-lg);
        right: var(--space-lg);
        background: ${bgColor};
        color: var(--color-text-inverse);
        padding: var(--space-md) var(--space-lg);
        border: var(--border-width-thin) solid var(--color-text-inverse);
        font-family: 'Public Sans', system-ui, sans-serif;
        font-size: var(--text-detail);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Add classification header
    const header = document.createElement('div');
    header.style.cssText = `
        font-size: var(--text-caption);
        margin-bottom: var(--space-xs);
        opacity: 0.8;
        letter-spacing: 0.1em;
    `;
    header.textContent = '/// SYSTEM STATUS ///';
    
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    
    notification.appendChild(header);
    notification.appendChild(messageDiv);
    document.body.appendChild(notification);
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
    
    // Click to dismiss
    notification.onclick = function() {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    };
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @media (max-width: 768px) {
        .federal-notification {
            right: var(--space-sm) !important;
            left: var(--space-sm) !important;
            max-width: none !important;
        }
    }
`;
document.head.appendChild(style);

console.log('🔐 Simplified Crypto System - Federal Authority Initialized');