/**
 * Side Scroller Content Script
 * Automatically detects navigation elements and binds arrow keys for enhanced web browsing
 */

class NavigationElementDetector {
    constructor() {
        this.nextPageKeywords = [
            'next', 'forward', 'continue', 'more', 'older', 'right',
            '→', '▶', '►', '▷', '⇨', '⇾', '→', '>',
            // Lightbox and icon-specific terms
            'right-fill', 'right-arrow', 'arrow-right', 'chevron-right',
            'next-arrow', 'forward-arrow', 'lightbox-next'
        ];
        
        this.previousPageKeywords = [
            'prev', 'previous', 'back', 'newer', 'left',
            '←', '◀', '◄', '◁', '⇦', '⇽', '←', '<',
            // Lightbox and icon-specific terms  
            'left-fill', 'left-arrow', 'arrow-left', 'chevron-left',
            'prev-arrow', 'back-arrow', 'lightbox-prev'
        ];
        
        this.detectedNavigationElements = {
            nextPage: null,
            previousPage: null
        };
        
        this.debugMode = false;
    }

    /**
     * Main detection method that finds navigation elements based on position and content
     */
    detectNavigationElements() {
        console.log('[Navigation Detector] Starting navigation element detection...');
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const middleY = viewportHeight / 2;
        
        // Define detection zones
        const leftZone = { x: 0, width: viewportWidth * 0.15 }; // Far left 15%
        const rightZone = { x: viewportWidth * 0.85, width: viewportWidth * 0.15 }; // Far right 15%
        const verticalTolerance = viewportHeight * 0.3; // 30% tolerance around middle
        
        this.debugLog(`Detection zones - Left: ${leftZone.x}-${leftZone.width}, Right: ${rightZone.x}-${rightZone.x + rightZone.width}`);
        this.debugLog(`Middle Y: ${middleY}, Tolerance: ±${verticalTolerance}`);
        
        // Get all clickable elements
        const clickableElements = this.getAllClickableElements();
        this.debugLog(`Found ${clickableElements.length} clickable elements`);
        
        // Filter elements by position and content
        const candidateElements = this.filterElementsByPositionAndContent(
            clickableElements, 
            leftZone, 
            rightZone, 
            middleY, 
            verticalTolerance
        );
        
        this.debugLog(`Found ${candidateElements.previous.length} previous candidates, ${candidateElements.next.length} next candidates`);
        
        // Select best candidates
        this.detectedNavigationElements.previousPage = this.selectBestCandidate(candidateElements.previous, 'previous');
        this.detectedNavigationElements.nextPage = this.selectBestCandidate(candidateElements.next, 'next');
        
        this.logDetectionResults();
        
        return this.detectedNavigationElements;
    }

    /**
     * Retrieves all potentially clickable elements from the DOM
     */
    getAllClickableElements() {
        const selectors = [
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
        ];
        
        const elements = [];
        selectors.forEach(selector => {
            try {
                const found = document.querySelectorAll(selector);
                elements.push(...Array.from(found));
            } catch (e) {
                this.debugLog(`Error with selector ${selector}: ${e.message}`);
            }
        });
        
        // Remove duplicates and hidden elements
        const uniqueElements = [...new Set(elements)];
        return uniqueElements.filter(el => this.isElementVisible(el));
    }

    /**
     * Checks if an element is visible and interactable
     */
    isElementVisible(element) {
        if (!element || !element.offsetParent) return false;
        
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            return false;
        }
        
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    /**
     * Filters elements by their position and navigation-related content
     */
    filterElementsByPositionAndContent(elements, leftZone, rightZone, middleY, verticalTolerance) {
        const candidates = { previous: [], next: [] };
        
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const elementCenterX = rect.left + rect.width / 2;
            const elementCenterY = rect.top + rect.height / 2;
            
            // Check if element is in vertical middle zone
            if (Math.abs(elementCenterY - middleY) > verticalTolerance) {
                return;
            }
            
            const elementText = this.getElementText(element);
            const navigationDirection = this.determineNavigationDirection(element, elementText);
            
            // Check position and direction match
            if (navigationDirection === 'previous' && this.isInZone(elementCenterX, leftZone)) {
                candidates.previous.push({
                    element,
                    text: elementText,
                    score: this.calculateElementScore(element, elementText, 'previous'),
                    rect,
                    centerY: elementCenterY
                });
            } else if (navigationDirection === 'next' && this.isInZone(elementCenterX, rightZone)) {
                candidates.next.push({
                    element,
                    text: elementText,
                    score: this.calculateElementScore(element, elementText, 'next'),
                    rect,
                    centerY: elementCenterY
                });
            }
        });
        
        return candidates;
    }

    /**
     * Determines if a point is within a specified zone
     */
    isInZone(x, zone) {
        return x >= zone.x && x <= zone.x + zone.width;
    }

    /**
     * Extracts text content and icon information from an element
     */
    getElementText(element) {
        const textSources = [
            element.textContent?.trim(),
            element.innerText?.trim(),
            element.getAttribute('aria-label'),
            element.getAttribute('title'),
            element.getAttribute('alt'),
            element.getAttribute('data-original-title'),
            element.querySelector('img')?.getAttribute('alt'),
            element.querySelector('[aria-label]')?.getAttribute('aria-label')
        ];
        
        // Check for SVG icons with direction indicators
        const svgElement = element.querySelector('svg[icon-name]') || (element.tagName === 'SVG' ? element : null);
        if (svgElement) {
            const iconName = svgElement.getAttribute('icon-name');
            if (iconName) {
                textSources.push(iconName);
                this.debugLog(`Found SVG icon: ${iconName}`);
            }
        }
        
        // Check for other icon indicators
        const iconSources = [
            element.querySelector('[class*="arrow"]')?.className,
            element.querySelector('[class*="chevron"]')?.className,
            element.querySelector('[class*="next"]')?.className,
            element.querySelector('[class*="prev"]')?.className,
            element.querySelector('[class*="right"]')?.className,
            element.querySelector('[class*="left"]')?.className
        ];
        
        iconSources.forEach(iconClass => {
            if (iconClass) textSources.push(iconClass);
        });
        
        const text = textSources.find(text => text && text.length > 0) || '';
        return text.toLowerCase().replace(/\s+/g, ' ');
    }

    /**
     * Determines navigation direction based on element attributes and content
     */
    determineNavigationDirection(element, text) {
        // Check for explicit navigation attributes
        const rel = element.getAttribute('rel');
        if (rel === 'next') return 'next';
        if (rel === 'prev' || rel === 'previous') return 'previous';
        
        // Check for CSS classes
        const className = element.className.toLowerCase();
        if (className.includes('next') || className.includes('forward')) return 'next';
        if (className.includes('prev') || className.includes('back')) return 'previous';
        
        // Check text content
        if (this.containsKeywords(text, this.nextPageKeywords)) return 'next';
        if (this.containsKeywords(text, this.previousPageKeywords)) return 'previous';
        
        return null;
    }

    /**
     * Checks if text contains any of the specified keywords
     */
    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    /**
     * Calculates a relevance score for a navigation element
     */
    calculateElementScore(element, text, direction) {
        let score = 0;
        
        // Base score for text match
        const keywords = direction === 'next' ? this.nextPageKeywords : this.previousPageKeywords;
        keywords.forEach(keyword => {
            if (text.includes(keyword)) {
                score += keyword.length === 1 ? 5 : 10; // Symbols get lower score than words
            }
        });
        
        // Bonus for navigation-specific attributes
        if (element.getAttribute('rel') === direction || element.getAttribute('rel') === 'prev') score += 20;
        
        // Bonus for navigation-specific classes
        const className = element.className.toLowerCase();
        if (className.includes(direction) || className.includes('nav') || className.includes('pager')) score += 15;
        
        // Penalty for too much text (likely not a simple navigation button)
        if (text.length > 50) score -= 10;
        
        // Bonus for being closer to exact middle vertically
        const viewportHeight = window.innerHeight;
        const middleY = viewportHeight / 2;
        const rect = element.getBoundingClientRect();
        const elementCenterY = rect.top + rect.height / 2;
        const distanceFromMiddle = Math.abs(elementCenterY - middleY);
        const maxDistance = viewportHeight * 0.3;
        const proximityScore = Math.max(0, 10 * (1 - distanceFromMiddle / maxDistance));
        score += proximityScore;
        
        return score;
    }

    /**
     * Selects the best candidate from a list of potential navigation elements
     */
    selectBestCandidate(candidates, direction) {
        if (candidates.length === 0) return null;
        
        // Sort by score (highest first)
        candidates.sort((a, b) => b.score - a.score);
        
        this.debugLog(`Best ${direction} candidate: "${candidates[0].text}" (score: ${candidates[0].score})`);
        
        return candidates[0].element;
    }

    /**
     * Logs detection results for debugging
     */
    logDetectionResults() {
        console.log('[Navigation Detector] Detection Results:');
        console.log('Previous Page Element:', this.detectedNavigationElements.previousPage);
        console.log('Next Page Element:', this.detectedNavigationElements.nextPage);
        
        if (this.detectedNavigationElements.previousPage) {
            console.log('Previous element text:', this.getElementText(this.detectedNavigationElements.previousPage));
        }
        if (this.detectedNavigationElements.nextPage) {
            console.log('Next element text:', this.getElementText(this.detectedNavigationElements.nextPage));
        }
    }

    /**
     * Debug logging utility
     */
    debugLog(message) {
        if (this.debugMode) {
            console.log(`[Navigation Detector Debug] ${message}`);
        }
    }
}

class KeyBindingManager {
    constructor() {
        this.boundKeys = new Set();
        this.originalKeyHandlers = new Map();
        this.debugMode = false;
    }

    /**
     * Checks if a specific key is already bound to prevent conflicts
     */
    isKeyBound(keyCode) {
        // Check for existing event listeners that might handle this key
        const testEvent = new KeyboardEvent('keydown', { 
            keyCode: keyCode, 
            which: keyCode,
            key: this.getKeyName(keyCode),
            bubbles: true 
        });
        
        let isHandled = false;
        
        // Create a temporary handler to detect if the event gets prevented
        const testHandler = (e) => {
            if (e.keyCode === keyCode || e.which === keyCode) {
                if (e.defaultPrevented) {
                    isHandled = true;
                }
            }
        };
        
        document.addEventListener('keydown', testHandler, true);
        document.dispatchEvent(testEvent);
        document.removeEventListener('keydown', testHandler, true);
        
        return isHandled || this.boundKeys.has(keyCode);
    }

    /**
     * Gets the human-readable name for a key code
     */
    getKeyName(keyCode) {
        const keyNames = {
            37: 'ArrowLeft',
            39: 'ArrowRight'
        };
        return keyNames[keyCode] || `Key${keyCode}`;
    }

    /**
     * Binds a key to trigger a navigation element
     */
    bindKeyToElement(keyCode, element, direction) {
        if (this.isKeyBound(keyCode)) {
            console.log(`[Key Binding] ${this.getKeyName(keyCode)} is already bound, skipping`);
            return false;
        }

        const keyHandler = (event) => {
            // Only trigger on exact key match and no modifiers
            if ((event.keyCode === keyCode || event.which === keyCode) && 
                !event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
                
                // Don't interfere with form inputs
                const activeElement = document.activeElement;
                if (activeElement && (
                    activeElement.tagName === 'INPUT' ||
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.contentEditable === 'true'
                )) {
                    return;
                }
                
                event.preventDefault();
                event.stopPropagation();
                
                this.debugLog(`Triggering ${direction} navigation via ${this.getKeyName(keyCode)}`);
                this.triggerElementClick(element);
            }
        };

        document.addEventListener('keydown', keyHandler, true);
        this.boundKeys.add(keyCode);
        this.originalKeyHandlers.set(keyCode, keyHandler);
        
        console.log(`[Key Binding] Successfully bound ${this.getKeyName(keyCode)} to ${direction} navigation`);
        return true;
    }

    /**
     * Simulates a click on an element with proper event handling
     */
    triggerElementClick(element) {
        try {
            // For links, navigate directly
            if (element.tagName === 'A' && element.href) {
                if (element.target === '_blank') {
                    window.open(element.href, '_blank');
                } else {
                    window.location.href = element.href;
                }
                return;
            }
            
            // For other elements, simulate click events
            const events = ['mousedown', 'mouseup', 'click'];
            events.forEach(eventType => {
                const event = new MouseEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                element.dispatchEvent(event);
            });
            
        } catch (error) {
            console.error('[Key Binding] Error triggering element click:', error);
        }
    }

    /**
     * Removes all key bindings created by this manager
     */
    unbindAllKeys() {
        this.originalKeyHandlers.forEach((handler, keyCode) => {
            document.removeEventListener('keydown', handler, true);
        });
        
        this.boundKeys.clear();
        this.originalKeyHandlers.clear();
        console.log('[Key Binding] All key bindings removed');
    }

    /**
     * Debug logging utility
     */
    debugLog(message) {
        if (this.debugMode) {
            console.log(`[Key Binding Debug] ${message}`);
        }
    }
}

class SmartNavigationKeyBinder {
    constructor() {
        this.detector = new NavigationElementDetector();
        this.keyManager = new KeyBindingManager();
        this.isInitialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.debugMode = false;
    }

    /**
     * Initializes the navigation key binder
     */
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('[Side Scroller] Initializing Side Scroller...');
        
        try {
            // Wait for page to be fully loaded
            await this.waitForPageLoad();
            
            // Detect navigation elements
            const navigationElements = this.detector.detectNavigationElements();
            
            // Bind keys to detected elements
            this.bindNavigationKeys(navigationElements);
            
            this.isInitialized = true;
            console.log('[Side Scroller] Initialization complete');
            
        } catch (error) {
            console.error('[Side Scroller] Initialization error:', error);
            this.handleInitializationError();
        }
    }

    /**
     * Waits for the page to be fully loaded and stable
     */
    waitForPageLoad() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete') {
                setTimeout(resolve, 500); // Small delay to ensure everything is rendered
            } else {
                window.addEventListener('load', () => {
                    setTimeout(resolve, 500);
                });
            }
        });
    }

    /**
     * Binds arrow keys to detected navigation elements
     */
    bindNavigationKeys(navigationElements) {
        const { previousPage, nextPage } = navigationElements;
        
        // Bind left arrow to previous page (if found)
        if (previousPage) {
            const success = this.keyManager.bindKeyToElement(37, previousPage, 'previous');
            if (success) {
                console.log('[Side Scroller] Left arrow key bound to previous page navigation');
            }
        } else {
            console.log('[Side Scroller] No previous page navigation element detected');
        }
        
        // Bind right arrow to next page (if found)
        if (nextPage) {
            const success = this.keyManager.bindKeyToElement(39, nextPage, 'next');
            if (success) {
                console.log('[Side Scroller] Right arrow key bound to next page navigation');
            }
        } else {
            console.log('[Side Scroller] No next page navigation element detected');
        }
    }

    /**
     * Handles initialization errors with retry logic
     */
    handleInitializationError() {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            console.log(`[Side Scroller] Retrying initialization (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.initialize(), 2000);
        } else {
            console.error('[Side Scroller] Failed to initialize after maximum retries');
        }
    }

    /**
     * Reinitializes the binder (useful for SPA navigation)
     */
    async reinitialize() {
        console.log('[Side Scroller] Reinitializing...');
        this.cleanup();
        this.isInitialized = false;
        this.retryCount = 0;
        await this.initialize();
    }

    /**
     * Cleans up all bindings and state
     */
    cleanup() {
        this.keyManager.unbindAllKeys();
        this.detector.detectedNavigationElements = { nextPage: null, previousPage: null };
        console.log('[Side Scroller] Cleanup complete');
    }

    /**
     * Enables debug mode for verbose logging
     */
    enableDebugMode() {
        this.debugMode = true;
        this.detector.debugMode = true;
        this.keyManager.debugMode = true;
        console.log('[Side Scroller] Debug mode enabled');
    }
}

// Global instance
let smartNavigationBinder = null;

// Initialize when DOM is ready
function initializeSmartNavigation() {
    if (smartNavigationBinder) {
        smartNavigationBinder.cleanup();
    }
    
    smartNavigationBinder = new SmartNavigationKeyBinder();
    
    // Enable debug mode if in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        smartNavigationBinder.enableDebugMode();
    }
    
    smartNavigationBinder.initialize();
}

// Handle SPA navigation changes
let lastUrl = location.href;
function detectUrlChange() {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('[Side Scroller] URL change detected, reinitializing...');
        if (smartNavigationBinder) {
            setTimeout(() => smartNavigationBinder.reinitialize(), 1000);
        }
    }
}

// Initialize the extension
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSmartNavigation);
} else {
    initializeSmartNavigation();
}

// Monitor for SPA navigation
setInterval(detectUrlChange, 1000);

// Listen for navigation events (for SPAs)
window.addEventListener('popstate', () => {
    setTimeout(() => {
        if (smartNavigationBinder) {
            smartNavigationBinder.reinitialize();
        }
    }, 500);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (smartNavigationBinder) {
        smartNavigationBinder.cleanup();
    }
});

// Add message handling for popup communication
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        switch (message.action) {
            case 'getStatus':
                sendResponse(getNavigationStatus());
                break;

            case 'reinitialize':
                reinitializeExtension();
                sendResponse({ status: 'success', message: 'Reinitialization started' });
                break;

            case 'toggleDebug':
                toggleDebugMode(message.enabled);
                sendResponse({ status: 'success', message: 'Debug mode toggled' });
                break;

            default:
                sendResponse({ status: 'error', message: 'Unknown action' });
        }
    } catch (error) {
        sendResponse({ status: 'error', message: error.message });
    }
    
    // Return true to indicate we will send a response asynchronously
    return true;
});

/**
 * Gets current navigation status for popup display
 */
function getNavigationStatus() {
    if (typeof smartNavigationBinder === 'undefined' || !smartNavigationBinder) {
        return {
            status: 'error',
            message: 'Extension not initialized'
        };
    }

    const detector = smartNavigationBinder.detector;
    const keyManager = smartNavigationBinder.keyManager;

    return {
        status: 'success',
        data: {
            previousPage: detector.detectedNavigationElements.previousPage !== null,
            nextPage: detector.detectedNavigationElements.nextPage !== null,
            leftArrowBound: keyManager.boundKeys.has(37),
            rightArrowBound: keyManager.boundKeys.has(39),
            debugMode: smartNavigationBinder.debugMode
        }
    };
}

/**
 * Reinitializes the extension
 */
function reinitializeExtension() {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        smartNavigationBinder.reinitialize();
    }
}

/**
 * Toggles debug mode
 */
function toggleDebugMode(enabled) {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        if (enabled) {
            smartNavigationBinder.enableDebugMode();
        } else {
            smartNavigationBinder.debugMode = false;
            smartNavigationBinder.detector.debugMode = false;
            smartNavigationBinder.keyManager.debugMode = false;
        }
    }
}

console.log('[Side Scroller] Content script loaded successfully'); 