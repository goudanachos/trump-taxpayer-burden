/**
 * Modern Social Sharing Implementation
 * Progressive enhancement with Web Share API and fallbacks
 * Government-themed notifications and feedback
 */

// Initialize sharing functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSharing();
});

function initializeSharing() {
    // Feature detection for Web Share API
    const supportsWebShare = navigator.share && navigator.canShare;
    
    // Show appropriate buttons based on browser support
    const primaryButtons = document.querySelectorAll('.share-btn-primary');
    const fallbackContainers = document.querySelectorAll('.fallback-share-buttons');
    
    if (supportsWebShare) {
        // Show native share buttons
        primaryButtons.forEach(btn => {
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
        });
    } else {
        // Show fallback buttons
        fallbackContainers.forEach(container => {
            container.style.display = 'flex';
        });
    }
}

/**
 * Primary share function using Web Share API
 */
async function shareExpenditure(button) {
    const container = button.closest('[data-share-url]');
    const shareData = {
        title: container.dataset.shareTitle,
        text: container.dataset.shareText,
        url: container.dataset.shareUrl
    };
    
    try {
        // Check if the data can be shared
        if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            showNotification('SHARED SUCCESSFULLY', 'success');
        } else {
            throw new Error('Share data not supported');
        }
    } catch (error) {
        console.warn('Web Share API failed:', error);
        // Fallback to copy link
        await copyShareLink(button);
    }
}

/**
 * Copy link to clipboard fallback
 */
async function copyShareLink(button) {
    const container = button.closest('[data-share-url]');
    const url = container.dataset.shareUrl;
    
    try {
        await navigator.clipboard.writeText(url);
        showNotification('LINK COPIED TO CLIPBOARD', 'success');
        
        // Temporarily update button text
        const originalText = button.textContent;
        button.textContent = 'COPIED!';
        setTimeout(() => {
            button.innerHTML = `
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                COPY
            `;
        }, 2000);
        
    } catch (error) {
        console.error('Clipboard write failed:', error);
        showNotification('COPY FAILED - CHECK PERMISSIONS', 'error');
        
        // Fallback: select text in a temporary input
        fallbackCopyToClipboard(url);
    }
}

/**
 * Twitter/X sharing function
 */
function shareToTwitter(button) {
    const container = button.closest('[data-share-url]');
    const text = container.dataset.shareText;
    const url = container.dataset.shareUrl;
    const hashtags = container.dataset.shareHashtags;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
    
    // Open in new window with specific dimensions
    const windowFeatures = 'width=550,height=420,scrollbars=yes,resizable=yes';
    const newWindow = window.open(twitterUrl, 'twitter-share', windowFeatures);
    
    if (newWindow) {
        showNotification('OPENING X/TWITTER', 'info');
        // Focus the new window if it opened successfully
        newWindow.focus();
    } else {
        showNotification('POPUP BLOCKED - ALLOW POPUPS', 'error');
    }
}

/**
 * Fallback clipboard function for older browsers
 */
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Make the textarea invisible but focusable
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('LINK COPIED (LEGACY METHOD)', 'success');
        } else {
            showNotification('COPY FAILED - MANUAL COPY REQUIRED', 'error');
        }
    } catch (error) {
        console.error('Fallback copy failed:', error);
        showNotification('COPY NOT SUPPORTED', 'error');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Government-themed notification system
 */
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.share-notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'share-notification';
    
    // Set styles based on type
    const colors = {
        success: 'var(--color-text-alert)',
        error: '#FF4444',
        info: 'var(--color-text-primary)'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-bg-command);
        color: var(--color-text-inverse);
        border: var(--border-width-standard) solid ${colors[type]};
        padding: var(--space-md) var(--space-lg);
        font-family: 'Source Sans Pro', sans-serif;
        font-size: var(--text-detail);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        z-index: 9999;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        transform: translateX(400px);
    `;
    
    // Add classification styling
    notification.innerHTML = `
        <div style="border-bottom: 1px solid ${colors[type]}; padding-bottom: 4px; margin-bottom: 4px; font-size: 10px; opacity: 0.8;">
            /// SYSTEM NOTIFICATION ///
        </div>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Analytics tracking (optional)
 */
function trackSharingEvent(action, method) {
    // This could be connected to analytics services
    console.log(`Sharing Event: ${action} via ${method}`);
    
    // Example: Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', 'share', {
            'method': method,
            'content_type': 'expenditure_record',
            'content_id': window.location.pathname
        });
    }
}