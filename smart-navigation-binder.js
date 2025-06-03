/**
 * Side Scroller Extension - Smart Navigation Key Binder
 * Main orchestrator class that coordinates all components and handles global functionality
 */

import { NavigationElementDetector } from './navigation-detector.js';
import { KeyBindingManager } from './key-binding-manager.js';
import { TrainingMode } from './training-mode.js';
import { ELEMENT_SELECTORS, KEY_CONFIG } from './patterns.js';

export class SmartNavigationKeyBinder {
    constructor() {
        this.detector = new NavigationElementDetector();
        this.keyManager = new KeyBindingManager();
        this.trainingMode = new TrainingMode();
        this.isInitialized = false;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.debugMode = false;
        this.mutationObserver = null;
        this.reinitializeTimeout = null;
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
            
            // Check for trained elements first
            const trainedElements = await this.trainingMode.getTrainedElements();
            let navigationElements;
            
            if (trainedElements.previous || trainedElements.next) {
                console.log('[Side Scroller] Using trained navigation elements');
                navigationElements = trainedElements;
            } else {
                // Fall back to automatic detection
                navigationElements = this.detector.detectNavigationElements();
            }
            
            // Bind keys to detected elements
            this.bindNavigationKeys(navigationElements);
            
            // Start watching for DOM changes (lightbox expansions, etc.)
            this.startDOMWatcher();
            
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
            const success = this.keyManager.bindKeyToElement(KEY_CONFIG.codes.LEFT_ARROW, previousPage, 'previous');
            if (success) {
                console.log('[Side Scroller] Left arrow key bound to previous page navigation');
            }
        } else {
            console.log('[Side Scroller] No previous page navigation element detected');
        }
        
        // Bind right arrow to next page (if found)
        if (nextPage) {
            const success = this.keyManager.bindKeyToElement(KEY_CONFIG.codes.RIGHT_ARROW, nextPage, 'next');
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
        // Stop DOM watching
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
            this.debugLog('DOM watcher stopped');
        }

        // Clear any pending reinitialization
        if (this.reinitializeTimeout) {
            clearTimeout(this.reinitializeTimeout);
            this.reinitializeTimeout = null;
        }

        // Clean up key bindings
        this.keyManager.unbindAllKeys();
        this.detector.detectedNavigationElements = { nextPage: null, previousPage: null };
        console.log('[Side Scroller] Cleanup complete');
    }

    /**
     * Starts watching for DOM changes that might affect navigation detection
     */
    startDOMWatcher() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }

        this.mutationObserver = new MutationObserver((mutations) => {
            let shouldReinitialize = false;

            mutations.forEach((mutation) => {
                // Check for added/removed nodes (lightbox content changes)
                if (mutation.type === 'childList') {
                    const addedNodes = Array.from(mutation.addedNodes);
                    const removedNodes = Array.from(mutation.removedNodes);
                    
                    // Check if lightbox-related elements were added/removed
                    const hasLightboxChanges = [...addedNodes, ...removedNodes].some(node => {
                        if (node.nodeType !== Node.ELEMENT_NODE) return false;
                        
                        return this.isLightboxRelatedElement(node);
                    });

                    if (hasLightboxChanges) {
                        this.debugLog('DOM change detected: Lightbox content added/removed');
                        shouldReinitialize = true;
                    }
                }

                // Check for attribute changes (class changes, style changes)
                if (mutation.type === 'attributes') {
                    const target = mutation.target;
                    
                    // Check for class or style changes that might indicate lightbox state change
                    if ((mutation.attributeName === 'class' || mutation.attributeName === 'style') &&
                        this.isLightboxRelatedElement(target)) {
                        this.debugLog(`DOM change detected: ${mutation.attributeName} changed on lightbox element`);
                        shouldReinitialize = true;
                    }
                }
            });

            if (shouldReinitialize) {
                this.scheduleReinitialize();
            }
        });

        // Start observing
        this.mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'aria-hidden', 'data-state']
        });

        this.debugLog('DOM watcher started - monitoring for lightbox changes');
    }

    /**
     * Checks if an element is related to lightbox functionality
     */
    isLightboxRelatedElement(element) {
        if (!element || !element.tagName) return false;

        const lightboxSelectors = ELEMENT_SELECTORS.lightbox;

        return lightboxSelectors.some(selector => {
            try {
                return element.matches(selector) || element.querySelector(selector);
            } catch (e) {
                return false;
            }
        });
    }

    /**
     * Schedules a reinitialization with debouncing to avoid too frequent updates
     */
    scheduleReinitialize() {
        // Clear any existing timeout
        if (this.reinitializeTimeout) {
            clearTimeout(this.reinitializeTimeout);
        }

        // Schedule reinitialization after a short delay
        this.reinitializeTimeout = setTimeout(() => {
            this.debugLog('Reinitializing due to DOM changes...');
            this.reinitialize();
        }, 500); // 500ms delay to debounce rapid changes
    }

    /**
     * Enables debug mode for verbose logging across all components
     */
    enableDebugMode() {
        this.debugMode = true;
        this.detector.enableDebugMode();
        this.keyManager.debugMode = true;
        this.trainingMode.debugMode = true;
        console.log('[Side Scroller] Debug mode enabled for all components');
    }

    /**
     * Disables debug mode across all components
     */
    disableDebugMode() {
        this.debugMode = false;
        this.detector.disableDebugMode();
        this.keyManager.debugMode = false;
        this.trainingMode.debugMode = false;
        console.log('[Side Scroller] Debug mode disabled for all components');
    }

    /**
     * Debug logging utility
     */
    debugLog(message) {
        if (this.debugMode) {
            console.log(`[SmartNavigationKeyBinder] ${message}`);
        }
    }
}

// Global instance
let smartNavigationBinder = null;

// Initialize when DOM is ready
export function initializeSmartNavigation() {
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
export function detectUrlChange() {
    if (location.href !== lastUrl) {
        lastUrl = location.href;
        console.log('[Side Scroller] URL change detected, reinitializing...');
        if (smartNavigationBinder) {
            setTimeout(() => smartNavigationBinder.reinitialize(), 1000);
        }
    }
}

// Add message handling for popup communication
export function setupMessageHandlers() {
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

                case 'toggleTraining':
                    toggleTrainingMode();
                    sendResponse({ status: 'success', message: 'Training mode toggled' });
                    break;

                case 'getTrainingStatus':
                    getTrainingStatus().then(status => {
                        sendResponse({ status: 'success', data: status });
                    });
                    return true; // Async response

                case 'clearTraining':
                    clearTrainingData().then(() => {
                        sendResponse({ status: 'success', message: 'Training data cleared' });
                    });
                    return true; // Async response

                default:
                    sendResponse({ status: 'error', message: 'Unknown action' });
            }
        } catch (error) {
            sendResponse({ status: 'error', message: error.message });
        }
        
        // Return true to indicate we will send a response asynchronously
        return true;
    });
}

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
            leftArrowBound: keyManager.boundKeys.has(KEY_CONFIG.codes.LEFT_ARROW),
            rightArrowBound: keyManager.boundKeys.has(KEY_CONFIG.codes.RIGHT_ARROW),
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
            smartNavigationBinder.disableDebugMode();
        }
    }
}

/**
 * Toggles training mode
 */
async function toggleTrainingMode() {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        const isActive = await smartNavigationBinder.trainingMode.toggleTrainingMode();
        
        // If training mode was turned off, reinitialize to use trained elements
        if (!isActive) {
            smartNavigationBinder.reinitialize();
        }
    }
}

/**
 * Gets training status for current site
 */
async function getTrainingStatus() {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        return await smartNavigationBinder.trainingMode.getTrainingStatus();
    }
    
    return { isActive: false, hasData: false, trainedElements: 0 };
}

/**
 * Clears training data for current site
 */
async function clearTrainingData() {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        return await smartNavigationBinder.trainingMode.clearTrainingData();
    }
    return null;
}

/**
 * Test navigation detection with intelligent content analysis
 * Call this from console: testNavigationDetection()
 */
export function testNavigationDetection(customTestCases = []) {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        return smartNavigationBinder.detector.testNavigationDetection(customTestCases);
    } else {
        console.log('❌ Side Scroller extension not initialized');
        return null;
    }
}

/**
 * Analyze a specific element on the page for navigation detection
 * Usage: analyzeElement(document.querySelector('a[href*="community"]'))
 */
export function analyzeElement(element) {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        if (!element) {
            console.log('❌ No element provided');
            return null;
        }
        
        const detector = smartNavigationBinder.detector;
        const elementText = detector.getElementText(element);
        const direction = detector.determineNavigationDirection(element, elementText);
        const score = direction ? detector.calculateElementScore(element, elementText, direction) : 0;
        const browserUIAnalysis = detector.browserUIFilter && detector.browserUIFilter.shouldExcludeElement(element);
        
        console.log('\n🔍 Element Analysis:');
        console.log('Element:', element);
        console.log('Text:', elementText);
        console.log('Navigation Direction:', direction || 'none');
        console.log('Score:', score);
        console.log('Browser UI Excluded:', browserUIAnalysis);
        console.log('False Positive Check:', detector.containsFalsePositivePatterns(elementText.toLowerCase()));
        
        return {
            element,
            text: elementText,
            direction,
            score,
            browserUIExcluded: browserUIAnalysis,
            isFalsePositive: detector.containsFalsePositivePatterns(elementText.toLowerCase())
        };
    } else {
        console.log('❌ Side Scroller extension not initialized');
        return null;
    }
}

/**
 * Quick test of false positive detection
 * Call this from console: testFalsePositives()
 */
export function testFalsePositives() {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        const detector = smartNavigationBinder.detector;
        
        console.log('\n🧪 Testing False Positive Detection:');
        
        const testTexts = [
            'community',
            'create a community', 
            'r/community',
            'join community',
            'comments',
            'share',
            'upvote',
            'next',
            'previous',
            'next page'
        ];
        
        testTexts.forEach(text => {
            const isFalsePositive = detector.containsFalsePositivePatterns(text.toLowerCase());
            const result = isFalsePositive ? '❌ BLOCKED' : '✅ ALLOWED';
            console.log(`${result} "${text}"`);
        });
        
        return true;
    } else {
        console.log('❌ Side Scroller extension not initialized');
        return null;
    }
}

// Event handlers for page lifecycle
export function setupEventHandlers() {
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
}

// Make global functions available on window for console access
export function exposeGlobalFunctions() {
    window.testNavigationDetection = testNavigationDetection;
    window.analyzeElement = analyzeElement;
    window.testFalsePositives = testFalsePositives;
}

export { smartNavigationBinder }; 