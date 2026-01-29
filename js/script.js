// Global error handler
window.onerror = function(msg, url, line, col, error) {
    const errorDisplay = document.getElementById('jsErrorDisplay');
    const errorMessage = document.getElementById('jsErrorMessage');
    if (errorDisplay && errorMessage) {
        errorDisplay.style.display = 'block';
        errorMessage.textContent = msg + ' (line ' + line + ')';
    }
    console.error('JS Error:', msg, 'at', url, 'line', line);
    return false;
};

// DOMContentLoaded wrapper to ensure all elements exist
document.addEventListener('DOMContentLoaded', function() {
    console.log('Rainbow Magic Hat: DOM loaded');
});

const AFFILIATE_TAG = 'crystalrockma-20';

const TRACKING_PARAMS = [
    'ref', 'ref_', 'pf_rd_p', 'pf_rd_r', 'pf_rd_s', 'pf_rd_t', 'pf_rd_i',
    'pd_rd_i', 'pd_rd_r', 'pd_rd_w', 'pd_rd_wg', 'psc', 'qid', 'sr',
    'dchild', 'keywords', 'crid', 'sprefix', 'spLa', 'smid', 'linkCode',
    'linkId', 'camp', 'creative', 'creativeASIN', 'tag', 'ascsubtag',
    'th', 'ie', 'encoding', 'pd_rd_p', 'content-id', 'cv_ct_cx',
    '_encoding', 'rnid', 'rps', 'dib', 'dib_tag'
];

const ASIN_PATTERNS = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
    /\/exec\/obidos\/asin\/([A-Z0-9]{10})/i,
    /\/o\/ASIN\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
];

function extractASIN(url) {
    for (const pattern of ASIN_PATTERNS) {
        const match = url.match(pattern);
        if (match) return match[1].toUpperCase();
    }
    return null;
}

function normalizeAmazonDomain(url) {
    return url
        .replace(/^(https?:\/\/)?(smile\.|m\.)?amazon\.com/, 'https://www.amazon.com')
        .replace(/^(https?:\/\/)?(smile\.|m\.)?amazon\.(co\.uk|de|fr|es|it|ca|com\.au|co\.jp|in|com\.mx|com\.br|nl|se|pl|sg|ae|sa|eg|tr)/, 'https://www.amazon.com');
}

function stripTrackingParams(url) {
    try {
        const urlObj = new URL(url);
        TRACKING_PARAMS.forEach(param => {
            urlObj.searchParams.delete(param);
            for (let i = 0; i < 10; i++) {
                urlObj.searchParams.delete(param + i);
            }
        });
        return urlObj;
    } catch {
        return null;
    }
}

function convertUrl(inputUrl) {
    let url = inputUrl.trim();
    
    if (!url) {
        throw new Error('Please paste an Amazon link');
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    if (!url.includes('amazon.')) {
        throw new Error('That doesn\'t look like an Amazon link');
    }

    if (url.includes('amzn.to') || url.includes('amzn.com')) {
        throw new Error('Short links (amzn.to) aren\'t supported — use the full Amazon URL');
    }

    url = normalizeAmazonDomain(url);
    const asin = extractASIN(url);

    if (asin) {
        return {
            url: `https://www.amazon.com/dp/${asin}?tag=${AFFILIATE_TAG}`,
            type: 'clean',
            asin: asin
        };
    } else {
        const urlObj = stripTrackingParams(url);
        if (!urlObj) {
            throw new Error('Couldn\'t parse that URL');
        }
        urlObj.searchParams.set('tag', AFFILIATE_TAG);
        return {
            url: urlObj.toString(),
            type: 'fallback',
            asin: null
        };
    }
}

// DOM - with null checks
const inputEl = document.getElementById('inputUrl');
const convertBtn = document.getElementById('convertBtn');
const outputSection = document.getElementById('outputSection');
const outputUrl = document.getElementById('outputUrl');
const outputType = document.getElementById('outputType');
const copyBtn = document.getElementById('copyBtn');
const openBtn = document.getElementById('openBtn');
const errorMessage = document.getElementById('errorMessage');

// Verify all elements exist
const allElements = [inputEl, convertBtn, outputSection, outputUrl, outputType, copyBtn, openBtn, errorMessage];
const missingElements = allElements.filter(el => el === null).map((_, i) => allElements[i]?.id || 'unknown');

if (missingElements.length > 0) {
    console.error('Missing DOM elements:', missingElements);
    document.getElementById('jsErrorMessage').textContent = 'Missing elements: ' + missingElements.join(', ');
    document.getElementById('jsErrorDisplay').style.display = 'block';
}

let currentAffiliateUrl = '';

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
    outputSection.classList.remove('visible');
}

function hideError() {
    errorMessage.classList.remove('visible');
}

// Only attach event listeners if elements exist
if (convertBtn && inputEl) {
convertBtn.addEventListener('click', () => {
    try {
        const result = convertUrl(inputEl.value);
        showOutput(result);
    } catch (err) {
        showError(err.message);
    }
});

inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        convertBtn.click();
    }
});

inputEl.addEventListener('paste', () => {
    setTimeout(() => convertBtn.click(), 50);
});
}

if (copyBtn) {
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(currentAffiliateUrl);
        copyBtn.classList.add('copied');
        copyBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.querySelector('span').textContent = 'Copy';
        }, 2000);
    } catch {
        const textarea = document.createElement('textarea');
        textarea.value = currentAffiliateUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copyBtn.classList.add('copied');
        copyBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.querySelector('span').textContent = 'Copy';
        }, 2000);
    }
});
}

if (openBtn) {
openBtn.addEventListener('click', () => {
    window.open(currentAffiliateUrl, '_blank');
});
}

// Links converted counter (manual update - see HTML comment)
const linksCounter = document.getElementById('linksCounter');

// Success celebration
const successFlash = document.getElementById('successFlash');
const confettiContainer = document.getElementById('confettiContainer');
const colors = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#74c0fc', '#9775fa', '#da77f2'];

function createConfetti() {
    confettiContainer.innerHTML = '';
    confettiContainer.classList.add('active');
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
        confetti.style.width = (Math.random() * 8 + 6) + 'px';
        confetti.style.height = (Math.random() * 8 + 6) + 'px';
        
        const duration = Math.random() * 2 + 1;
        const delay = Math.random() * 0.5;
        const drift = (Math.random() - 0.5) * 200;
        
        confetti.animate([
            { opacity: 1, transform: `translateY(0) translateX(0) rotate(0deg)` },
            { opacity: 1, transform: `translateY(${window.innerHeight}px) translateX(${drift}px) rotate(${Math.random() * 720}deg)` },
            { opacity: 0, transform: `translateY(${window.innerHeight + 100}px) translateX(${drift}px) rotate(${Math.random() * 720}deg)` }
        ], {
            duration: duration * 1000,
            delay: delay * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        confettiContainer.appendChild(confetti);
    }
    
    setTimeout(() => {
        confettiContainer.classList.remove('active');
    }, 3500);
}

function celebrateSuccess() {
    // Flash emoji
    successFlash.classList.add('animate');
    setTimeout(() => {
        successFlash.classList.remove('animate');
    }, 600);
    
    // Confetti
    createConfetti();
    
    // Pulse the output box
    outputSection.classList.add('celebrate');
    setTimeout(() => {
        outputSection.classList.remove('celebrate');
    }, 500);
}

// Update showOutput to trigger celebration
function showOutput(result) {
    currentAffiliateUrl = result.url;
    outputUrl.textContent = result.url;
    
    if (result.type === 'clean') {
        outputType.textContent = `✓ Clean link ready`;
        outputType.className = 'output-type clean';
    } else {
        outputType.textContent = '⚡ Link ready (search/category page)';
        outputType.className = 'output-type fallback';
    }
    
    outputSection.classList.add('visible');
    hideError();
    
    copyBtn.classList.remove('copied');
    copyBtn.querySelector('span').textContent = 'Copy';
    
    // Celebrate!
    celebrateSuccess();
}

// Bookmark modal
const bookmarkBtn = document.getElementById('bookmarkBtn');
const bookmarkModal = document.getElementById('bookmarkModal');
const bookmarkModalClose = document.getElementById('bookmarkModalClose');

bookmarkBtn.addEventListener('click', () => {
    bookmarkModal.classList.add('visible');
});

bookmarkModalClose.addEventListener('click', () => {
    bookmarkModal.classList.remove('visible');
});

bookmarkModal.addEventListener('click', (e) => {
    if (e.target === bookmarkModal) {
        bookmarkModal.classList.remove('visible');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bookmarkModal.classList.contains('visible')) {
        bookmarkModal.classList.remove('visible');
    }
});

// Accordion functionality - FAQ
const accordionHeaders = document.querySelectorAll('.accordion-header');
    
accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const isActive = item.classList.contains('active');
        
        // Close all other FAQ items
        document.querySelectorAll('.accordion-item').forEach(i => {
            i.classList.remove('active');
        });
        
        // Toggle current item
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// Main page accordion
const mainAccordionHeaders = document.querySelectorAll('.main-accordion-header');
    
mainAccordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const isActive = item.classList.contains('active');
        
        // Toggle current item (allow multiple open)
        item.classList.toggle('active');
    });
});

// Copy page link button
const copyLinkBtn = document.getElementById('copyLinkBtn');
const pageUrl = window.location.href;

if (copyLinkBtn) {
copyLinkBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(pageUrl);
        copyLinkBtn.classList.add('copied');
        copyLinkBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
            copyLinkBtn.classList.remove('copied');
            copyLinkBtn.querySelector('span').textContent = 'Copy Link';
        }, 2000);
    } catch {
        const textarea = document.createElement('textarea');
        textarea.value = pageUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        copyLinkBtn.classList.add('copied');
        copyLinkBtn.querySelector('span').textContent = 'Copied!';
        setTimeout(() => {
            copyLinkBtn.classList.remove('copied');
            copyLinkBtn.querySelector('span').textContent = 'Copy Link';
        }, 2000);
    }
});
}