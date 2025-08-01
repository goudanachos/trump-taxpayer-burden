// Social sharing functionality for TrumpTaxBurden.com

function shareToTwitter(date, cost, location) {
    const text = `💰 ${cost} of taxpayer money spent on recreation on ${date} at ${location}. See daily updates at TrumpTaxBurden.com #TaxpayerTransparency #GovernmentAccountability`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, '_blank', 'width=550,height=420');
}

function shareToFacebook(date, cost) {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(`${cost} of taxpayer money spent on recreation on ${date}. Learn more about government spending transparency.`)}`;
    window.open(url, '_blank', 'width=580,height=350');
}

function copyToClipboard(text) {
    // Create a temporary textarea element
    const textarea = document.createElement('textarea');
    textarea.value = text + ' - ' + window.location.href;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showCopySuccess();
    } catch (err) {
        console.error('Failed to copy text: ', err);
        showCopyError();
    }
    
    document.body.removeChild(textarea);
}

function showCopySuccess() {
    // Create success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
    notification.innerHTML = '✅ Copied to clipboard!';
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showCopyError() {
    // Create error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-up';
    notification.innerHTML = '❌ Failed to copy. Please try again.';
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Advanced sharing with Web Share API (for mobile devices)
function shareNative(title, text, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        })
        .then(() => console.log('Successful share'))
        .catch((error) => console.log('Error sharing', error));
    } else {
        // Fallback to copying to clipboard
        copyToClipboard(text);
    }
}

// Initialize sharing functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add keyboard shortcuts for sharing
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Shift + T for Twitter
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
            e.preventDefault();
            const firstCard = document.querySelector('[data-date]');
            if (firstCard) {
                const date = firstCard.dataset.date;
                const cost = firstCard.dataset.cost;
                const location = firstCard.dataset.location;
                shareToTwitter(date, cost, location);
            }
        }
        
        // Ctrl/Cmd + Shift + C for copy
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            copyToClipboard('Check out TrumpTaxBurden.com - tracking recreational expenses paid by American taxpayers!');
        }
    });
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add loading animation for images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.classList.add('animate-fade-in');
        });
    });
});

// Analytics tracking for social shares (privacy-friendly)
function trackShare(platform) {
    // Only track if user hasn't opted out
    if (localStorage.getItem('analytics-opt-out') !== 'true') {
        console.log(`Share tracked: ${platform}`);
        // You could send this to a privacy-friendly analytics service
    }
}

// Export functions for use in other scripts
window.TaxpayerBurdenSharing = {
    shareToTwitter,
    shareToFacebook,
    copyToClipboard,
    shareNative,
    trackShare
};