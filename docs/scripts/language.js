// ============================================
// Language Management
// ============================================

const LANGUAGE_KEY = 'storymakers_language';
const DEFAULT_LANGUAGE = 'zh';

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
    initLanguage();
    setupLanguageToggle();
    updatePageLanguage();
});

function initLanguage() {
    // Get language from localStorage or default to Chinese
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    if (!savedLanguage) {
        localStorage.setItem(LANGUAGE_KEY, DEFAULT_LANGUAGE);
    }
}

function getCurrentLanguage() {
    return localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
}

function setLanguage(lang) {
    localStorage.setItem(LANGUAGE_KEY, lang);
    
    // Get current page path
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';
    
    // Skip language switching for admin and guide pages (they don't have language versions)
    if (currentFile === 'admin.html' || currentFile === 'admin-en.html' || currentFile.includes('shilin-2hr') || currentFile.includes('shilin-halfday') || currentFile.includes('shilin-fullday')) {
        // Just update toggle display and reload to update links
        const toggle = document.getElementById('language-toggle');
        if (toggle) {
            updateToggleDisplay(toggle, lang);
        }
        window.location.reload();
        return;
    }
    
    // Determine target file based on language
    let targetFile;
    if (lang === 'en') {
        // Convert to English version
        if (currentFile === 'index.html' || currentFile === '') {
            targetFile = 'index-en.html';
        } else if (!currentFile.includes('-en.html') && !currentFile.includes('admin')) {
            targetFile = currentFile.replace('.html', '-en.html');
        } else {
            targetFile = currentFile; // Already English or admin page
        }
    } else {
        // Convert to Chinese version
        if (currentFile === 'index-en.html') {
            targetFile = 'index.html';
        } else if (currentFile.includes('-en.html')) {
            targetFile = currentFile.replace('-en.html', '.html');
        } else {
            targetFile = currentFile; // Already Chinese or admin page
        }
    }
    
    // Only redirect if file changed, keeping the same base URL
    if (targetFile !== currentFile && targetFile !== '') {
        // Build new URL with same protocol and host
        const newUrl = targetFile + window.location.search + window.location.hash;
        window.location.href = newUrl;
    } else {
        // Update toggle display immediately
        const toggle = document.getElementById('language-toggle');
        if (toggle) {
            updateToggleDisplay(toggle, lang);
        }
    }
}

function setupLanguageToggle() {
    const toggle = document.getElementById('language-toggle');
    if (toggle) {
        const currentLang = getCurrentLanguage();
        updateToggleDisplay(toggle, currentLang);
        
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            // Get current language fresh from localStorage each time
            const currentLang = getCurrentLanguage();
            const newLang = currentLang === 'zh' ? 'en' : 'zh';
            setLanguage(newLang);
        });
    }
}

function updateToggleDisplay(toggle, lang) {
    if (lang === 'en') {
        toggle.textContent = '中文';
        toggle.setAttribute('aria-label', 'Switch to Chinese');
    } else {
        toggle.textContent = 'EN';
        toggle.setAttribute('aria-label', 'Switch to English');
    }
}

function updatePageLanguage() {
    const currentLang = getCurrentLanguage();
    const currentPath = window.location.pathname;
    const currentFile = currentPath.split('/').pop() || 'index.html';
    const currentHash = window.location.hash;
    const currentSearch = window.location.search;
    
    // Skip redirect for admin page and guide pages (they don't have language versions)
    if (currentFile === 'admin.html' || currentFile === 'admin-en.html' || currentFile.includes('shilin-2hr') || currentFile.includes('shilin-halfday') || currentFile.includes('shilin-fullday')) {
        return;
    }
    
    // Check if we're on an English page
    const isEnglishPage = currentFile.includes('-en.html');
    const isChinesePage = !isEnglishPage && currentFile.endsWith('.html') && currentFile !== 'admin.html';
    
    // Redirect if language doesn't match (only on initial page load, not on toggle)
    if (currentLang === 'en' && isChinesePage) {
        // Redirect to English version
        let englishFile;
        if (currentFile === 'index.html' || currentFile === '') {
            englishFile = 'index-en.html';
        } else {
            englishFile = currentFile.replace('.html', '-en.html');
        }
        if (englishFile !== currentFile) {
            // Use relative URL to keep same host
            window.location.href = englishFile + currentSearch + currentHash;
            return;
        }
    } else if (currentLang === 'zh' && isEnglishPage) {
        // Redirect to Chinese version
        let chineseFile;
        if (currentFile === 'index-en.html') {
            chineseFile = 'index.html';
        } else {
            chineseFile = currentFile.replace('-en.html', '.html');
        }
        if (chineseFile !== currentFile) {
            // Use relative URL to keep same host
            window.location.href = chineseFile + currentSearch + currentHash;
            return;
        }
    }
}

// Helper function to get language-aware link
function getLanguageLink(basePath) {
    // Don't modify guide pages or admin pages (check for both old guides/ path and new root path)
    if (basePath.includes('guides/') || basePath.includes('shilin-2hr') || basePath.includes('shilin-halfday') || basePath.includes('shilin-fullday') || basePath === 'admin.html' || basePath.includes('admin.html')) {
        return basePath;
    }
    
    const currentLang = getCurrentLanguage();
    if (currentLang === 'en') {
        // Convert to English version if it exists
        if (basePath.endsWith('.html') && !basePath.includes('-en.html') && basePath !== 'admin.html') {
            return basePath.replace('.html', '-en.html');
        }
    } else {
        // Convert to Chinese version
        if (basePath.includes('-en.html')) {
            return basePath.replace('-en.html', '.html');
        }
    }
    return basePath;
}

// Update all internal links on the page
function updateInternalLinks() {
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        const href = link.getAttribute('href');
        // Only update internal HTML links (not anchors alone, external links, admin, or guide pages)
        if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.includes('admin.html') && !href.includes('guides/') && !href.includes('shilin-2hr') && !href.includes('shilin-halfday') && !href.includes('shilin-fullday')) {
            // Split href into path and hash/query
            const urlParts = href.split('#');
            const pathPart = urlParts[0];
            const hashPart = urlParts.length > 1 ? '#' + urlParts.slice(1).join('#') : '';
            
            // Only process .html files
            if (pathPart.endsWith('.html') || pathPart === '' || pathPart.endsWith('/')) {
                const newPath = getLanguageLink(pathPart || 'index.html');
                if (newPath !== pathPart) {
                    link.setAttribute('href', newPath + hashPart);
                }
            }
        }
    });
}

// Call on page load (after a short delay to ensure DOM is ready)
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateInternalLinks, 100);
});

