/**
 * Side Scroller Extension - Pattern Definitions
 * Contains all navigation patterns, false positive patterns, and configuration data
 */

/**
 * Intelligent navigation patterns with context-aware scoring
 */
export const INTELLIGENT_NAVIGATION_PATTERNS = {
    next: [
        // Exact word matches with word boundaries
        { pattern: /\bnext\b/i, score: 15, context: 'navigation' },
        { pattern: /\bforward\b/i, score: 12, context: 'navigation' },
        { pattern: /\bcontinue\b/i, score: 10, context: 'navigation' },
        { pattern: /\bnewer\b/i, score: 12, context: 'temporal' },
        { pattern: /\bright\b/i, score: 8, context: 'directional' },
        
        // Navigation-specific phrases
        { pattern: /next\s+page/i, score: 20, context: 'navigation' },
        { pattern: /next\s+chapter/i, score: 18, context: 'navigation' },
        { pattern: /next\s+post/i, score: 16, context: 'navigation' },
        { pattern: /more\s+posts/i, score: 14, context: 'navigation' },
        { pattern: /load\s+more/i, score: 14, context: 'navigation' },
        { pattern: /show\s+more/i, score: 12, context: 'navigation' },
        { pattern: /view\s+more/i, score: 12, context: 'navigation' },
        
        // Webtoon and episode-specific patterns
        { pattern: /next\s+episode/i, score: 22, context: 'webtoon' },
        { pattern: /next\s+recurrence/i, score: 20, context: 'webtoon' },
        { pattern: /\bepisode\s+\d+/i, score: 18, context: 'webtoon' },
        { pattern: /episode\s+(\d+)/i, score: 16, context: 'webtoon' },
        { pattern: /\bep\s+\d+/i, score: 15, context: 'webtoon' },
        { pattern: /continue\s+reading/i, score: 14, context: 'webtoon' },
        
        // Arrow symbols and icons (exact match)
        { pattern: /^→$/, score: 18, context: 'symbol' },
        { pattern: /^▶$/, score: 18, context: 'symbol' },
        { pattern: /^►$/, score: 18, context: 'symbol' },
        { pattern: /^>$/, score: 15, context: 'symbol' },
        
        // Icon class patterns
        { pattern: /right-fill/i, score: 16, context: 'icon' },
        { pattern: /arrow-right/i, score: 16, context: 'icon' },
        { pattern: /chevron-right/i, score: 16, context: 'icon' }
    ],
    
    previous: [
        // Exact word matches with word boundaries
        { pattern: /\bprev\b/i, score: 15, context: 'navigation' },
        { pattern: /\bprevious\b/i, score: 15, context: 'navigation' },
        { pattern: /\bback\b/i, score: 12, context: 'navigation' },
        { pattern: /\bolder\b/i, score: 12, context: 'temporal' },
        { pattern: /\bleft\b/i, score: 8, context: 'directional' },
        
        // Navigation-specific phrases
        { pattern: /previous\s+page/i, score: 20, context: 'navigation' },
        { pattern: /previous\s+chapter/i, score: 18, context: 'navigation' },
        { pattern: /previous\s+post/i, score: 16, context: 'navigation' },
        { pattern: /go\s+back/i, score: 14, context: 'navigation' },
        
        // Webtoon and episode-specific patterns
        { pattern: /previous\s+episode/i, score: 22, context: 'webtoon' },
        { pattern: /prev\s+episode/i, score: 20, context: 'webtoon' },
        { pattern: /previous\s+recurrence/i, score: 20, context: 'webtoon' },
        { pattern: /prev\s+recurrence/i, score: 18, context: 'webtoon' },
        { pattern: /back\s+to\s+previous/i, score: 16, context: 'webtoon' },
        
        // Arrow symbols and icons (exact match)
        { pattern: /^←$/, score: 18, context: 'symbol' },
        { pattern: /^◀$/, score: 18, context: 'symbol' },
        { pattern: /^◄$/, score: 18, context: 'symbol' },
        { pattern: /^<$/, score: 15, context: 'symbol' },
        
        // Icon class patterns
        { pattern: /left-fill/i, score: 16, context: 'icon' },
        { pattern: /arrow-left/i, score: 16, context: 'icon' },
        { pattern: /chevron-left/i, score: 16, context: 'icon' }
    ]
};

/**
 * False positive patterns - content that should NOT be considered navigation
 */
export const FALSE_POSITIVE_PATTERNS = [
    // Social media and community terms
    /\bcommunity\b/i,
    /\bcomments\b/i,
    /\bdiscussion\b/i,
    /\bupvote\b/i,
    /\bdownvote\b/i,
    /\bshare\b/i,
    /\bsave\b/i,
    /\breport\b/i,
    /\bfollow\b/i,
    /\bunfollow\b/i,
    /\bsubscribe\b/i,
    /\bunsubscribe\b/i,
    
    // Reddit-specific creation and community actions
    /\bcreate\s+a\s+community/i,
    /\bcreate\s+community/i,
    /\bcreate\s+post/i,
    /\bjoin\s+community/i,
    /\bleave\s+community/i,
    /\bstart\s+community/i,
    /\bnew\s+community/i,
    
    // Content-related terms that aren't navigation
    /\bmore\s+info/i,
    /\bmore\s+details/i,
    /\bmore\s+about/i,
    /\bmore\s+options/i,
    /\bmore\s+settings/i,
    /\blearn\s+more/i,
    /\bread\s+more/i,
    /\bfind\s+out\s+more/i,
    
    // UI elements that aren't page navigation
    /\bmenu\b/i,
    /\bdropdown\b/i,
    /\bfilter\b/i,
    /\bsort\b/i,
    /\bsearch\b/i,
    /\bprofile\b/i,
    /\bsettings\b/i,
    /\bnotifications\b/i,
    
    // Reddit-specific false positives
    /\br\/\w+/i,        // Subreddit links like r/community
    /\bu\/\w+/i,        // User links like u/username
    /\bcross-?post/i,
    /\bx-post/i,
    
    // Generic content terms
    /\bcategory\b/i,
    /\btag\b/i,
    /\blabel\b/i,
    /\bbadge\b/i,
    /\bstatus\b/i,
    
    // Action terms that aren't navigation
    /\bcreate\b/i,       // Generic create actions
    /\badd\b/i,          // Add actions
    /\bedit\b/i,         // Edit actions
    /\bdelete\b/i,       // Delete actions
    /\bremove\b/i,       // Remove actions
    
    // Long text content (likely not navigation)
    /.{100,}/  // More than 100 characters is probably not a navigation button
];

/**
 * Content penalty patterns - elements that should be penalized but not completely filtered
 */
export const CONTENT_PENALTY_PATTERNS = [
    { pattern: /\bmore\b/i, penalty: -15 }, // Generic "more" without context
    { pattern: /\bless\b/i, penalty: -10 },
    { pattern: /\bother\b/i, penalty: -8 },
    { pattern: /\brelated\b/i, penalty: -8 },
    { pattern: /\bsimilar\b/i, penalty: -8 },
    { pattern: /\badditional\b/i, penalty: -10 },
    { pattern: /\bextra\b/i, penalty: -8 }
];

/**
 * Legacy keyword arrays for backward compatibility
 */
export const LEGACY_KEYWORDS = {
    next: [
        'next', 'forward', 'continue', 'more', 'older', 'right',
        '→', '▶', '►', '▷', '⇨', '⇾', '→', '>',
        // Lightbox and icon-specific terms
        'right-fill', 'right-arrow', 'arrow-right', 'chevron-right',
        'next-arrow', 'forward-arrow', 'lightbox-next'
    ],
    
    previous: [
        'prev', 'previous', 'back', 'newer', 'left',
        '←', '◀', '◄', '◁', '⇦', '⇽', '←', '<',
        // Lightbox and icon-specific terms  
        'left-fill', 'left-arrow', 'arrow-left', 'chevron-left',
        'prev-arrow', 'back-arrow', 'lightbox-prev'
    ]
};

/**
 * Browser UI zone definitions and constraints
 */
export const BROWSER_UI_CONFIG = {
    zones: {
        topBarHeight: 100, // Top browser bar and tabs area
        bottomBarHeight: 50, // Bottom browser bar (if any)
        sideMargin: 5, // Far left/right edges where browser controls might appear
        minDistanceFromTopForWebContent: 120 // Minimum distance from top for valid web content
    },
    
    selectors: [
        // Chrome/Chromium browser UI
        '[class*="chrome-"]',
        '[id*="chrome-"]',
        '[class*="browser-"]',
        '[id*="browser-"]',
        
        // Extension UI elements
        '[class*="extension-"]',
        '[id*="extension-"]',
        '[class*="crx-"]',
        '[id*="crx-"]',
        
        // Browser navigation specific
        '[class*="navigation-bar"]',
        '[class*="nav-bar"]',
        '[class*="toolbar"]',
        '[id*="toolbar"]',
        
        // Browser back/forward specific
        '[aria-label*="Back"]',
        '[aria-label*="Forward"]',
        '[title*="Back"]',
        '[title*="Forward"]',
        '[alt*="Back"]',
        '[alt*="Forward"]',
        
        // PDF viewer controls
        '[class*="pdf-viewer"]',
        '[id*="pdf-viewer"]',
        '#viewerContainer',
        '.toolbar'
    ],
    
    internalURLPatterns: [
        'chrome://',
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
        'edge://',
        'about:',
        'view-source:',
        'data:',
        'javascript:',
        'blob:'
    ],
    
    sizeConstraints: {
        minWidth: 8,
        minHeight: 8,
        maxWidth: 500, // Unusually large elements are often not navigation
        maxHeight: 200,
        minClickableArea: 64 // Minimum area for a reasonable click target
    },
    
    zIndexThresholds: {
        suspicious: 2147483647, // Max z-index often used by browser UI
        high: 999999 // Very high z-index threshold
    }
};

/**
 * Element selection configuration
 */
export const ELEMENT_SELECTORS = {
    clickable: [
        'a[href]',
        'button',
        '[onclick]',
        '[role="button"]',
        '.btn',
        '.button',
        '.nav-link',
        '.pagination a',
        '.pager a',
        'input[type="button"]',
        'input[type="submit"]',
        '[tabindex="0"]',
        '[data-toggle]',
        '[data-action]',
        // Lightbox and interactive element selectors
        'svg[icon-name]',
        '[class*="lightbox"]',
        '[class*="modal"]',
        '[class*="overlay"]',
        'div[onclick]',
        'span[onclick]',
        '[style*="cursor: pointer"]',
        '[style*="cursor:pointer"]'
    ],
    
    lightbox: [
        '[class*="lightbox"]',
        '[class*="modal"]', 
        '[class*="overlay"]',
        '[class*="dialog"]',
        '[role="dialog"]',
        '[aria-label*="lightbox"]',
        'svg[icon-name*="fill"]',
        'button[aria-label*="page"]',
        '[class*="carousel"]',
        '[class*="gallery"]'
    ],
    
    training: [
        'a[href]', 
        'button', 
        '[onclick]', 
        '[role="button"]',
        '.btn', 
        '.button', 
        'svg', 
        '[class*="arrow"]',
        '[class*="next"]', 
        '[class*="prev"]', 
        '[class*="nav"]'
    ]
};

/**
 * Training mode configuration
 */
export const TRAINING_CONFIG = {
    overlay: {
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.1)'
    },
    
    banner: {
        zIndex: 1000000,
        gradient: 'linear-gradient(45deg, #667eea, #764ba2)',
        text: '🎯 Training Mode: Click navigation arrows to train'
    },
    
    highlight: {
        zIndex: 999998,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderWidth: '2px'
    },
    
    feedback: {
        duration: 2000,
        backgroundColor: '#2ed573'
    }
};

/**
 * Key binding configuration
 */
export const KEY_CONFIG = {
    codes: {
        LEFT_ARROW: 37,
        RIGHT_ARROW: 39
    },
    
    names: {
        37: 'ArrowLeft',
        39: 'ArrowRight'
    }
};

/**
 * Detection scoring configuration
 */
export const SCORING_CONFIG = {
    minimumScore: 8,
    bonuses: {
        multiplePatterns: 2,
        explicitNavAttributes: 25,
        paginationClass: 20,
        navigationClass: 15,
        singleCharacter: 5,
        linkElement: 5,
        buttonElement: 3,
        webtoonElement: 25,
        lightboxElement: 20,
        leftPosition: 5,
        rightPosition: 5
    },
    penalties: {
        falsePositive: -50,
        smallElement: -5,
        largeElement: -8,
        noTextContent: -5,
        verboseText: -15
    },
    thresholds: {
        smallElementArea: 16,
        largeElementArea: 10000,
        verboseTextLength: 75,
        maxProximityDistance: 0.3,
        maxProximityScore: 12
    }
};

export default {
    INTELLIGENT_NAVIGATION_PATTERNS,
    FALSE_POSITIVE_PATTERNS,
    CONTENT_PENALTY_PATTERNS,
    LEGACY_KEYWORDS,
    BROWSER_UI_CONFIG,
    ELEMENT_SELECTORS,
    TRAINING_CONFIG,
    KEY_CONFIG,
    SCORING_CONFIG
}; 