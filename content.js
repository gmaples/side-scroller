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
            
            const elementText = this.getElementText(element);
            const navigationDirection = this.determineNavigationDirection(element, elementText);
            
            // Debug every element that has navigation direction
            if (navigationDirection) {
                this.debugLog(`Found ${navigationDirection} element: "${elementText}"`);
                this.debugLog(`Position: X=${elementCenterX.toFixed(1)}, Y=${elementCenterY.toFixed(1)}`);
                this.debugLog(`Left zone: ${leftZone.x}-${leftZone.x + leftZone.width}, Right zone: ${rightZone.x}-${rightZone.x + rightZone.width}`);
                this.debugLog(`Middle Y: ${middleY.toFixed(1)}, Tolerance: ±${verticalTolerance.toFixed(1)}`);
                this.debugLog(`Vertical check: ${Math.abs(elementCenterY - middleY).toFixed(1)} <= ${verticalTolerance.toFixed(1)} = ${Math.abs(elementCenterY - middleY) <= verticalTolerance}`);
            }
            
            // Check if element is in vertical middle zone
            if (Math.abs(elementCenterY - middleY) > verticalTolerance) {
                if (navigationDirection) {
                    this.debugLog(`❌ ${navigationDirection} element filtered out: not in vertical middle zone`);
                }
                return;
            }
            
            // Check if this is a lightbox element (more flexible positioning)
            const isLightboxElement = this.isLightboxElement(element, elementText);
            
            if (isLightboxElement) {
                this.debugLog(`🎯 Lightbox element detected: "${elementText}" - using flexible positioning`);
                
                if (navigationDirection === 'previous') {
                    this.debugLog(`✅ Previous lightbox element added: "${elementText}"`);
                    candidates.previous.push({
                        element,
                        text: elementText,
                        score: this.calculateElementScore(element, elementText, 'previous') + 15, // Bonus for lightbox
                        rect,
                        centerY: elementCenterY
                    });
                } else if (navigationDirection === 'next') {
                    this.debugLog(`✅ Next lightbox element added: "${elementText}"`);
                    candidates.next.push({
                        element,
                        text: elementText,
                        score: this.calculateElementScore(element, elementText, 'next') + 15, // Bonus for lightbox
                        rect,
                        centerY: elementCenterY
                    });
                }
                return;
            }
            
            // Standard position-based detection for non-lightbox elements
            if (navigationDirection === 'previous' && this.isInZone(elementCenterX, leftZone)) {
                this.debugLog(`✅ Previous element added: "${elementText}"`);
                candidates.previous.push({
                    element,
                    text: elementText,
                    score: this.calculateElementScore(element, elementText, 'previous'),
                    rect,
                    centerY: elementCenterY
                });
            } else if (navigationDirection === 'next' && this.isInZone(elementCenterX, rightZone)) {
                this.debugLog(`✅ Next element added: "${elementText}"`);
                candidates.next.push({
                    element,
                    text: elementText,
                    score: this.calculateElementScore(element, elementText, 'next'),
                    rect,
                    centerY: elementCenterY
                });
            } else if (navigationDirection) {
                this.debugLog(`❌ ${navigationDirection} element filtered out: not in correct horizontal zone`);
                if (navigationDirection === 'next') {
                    this.debugLog(`Element X: ${elementCenterX.toFixed(1)}, Right zone starts at: ${rightZone.x.toFixed(1)}`);
                }
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
        
        // Check for SVG icons with direction indicators - improved detection
        const svgElements = element.querySelectorAll('svg[icon-name]');
        svgElements.forEach(svg => {
            const iconName = svg.getAttribute('icon-name');
            if (iconName) {
                textSources.push(iconName);
                this.debugLog(`Found SVG icon: ${iconName}`);
            }
        });
        
        // Also check if the element itself is an SVG
        if (element.tagName === 'SVG' && element.getAttribute('icon-name')) {
            const iconName = element.getAttribute('icon-name');
            textSources.push(iconName);
            this.debugLog(`Found direct SVG icon: ${iconName}`);
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
        
        const text = textSources.filter(t => t && t.length > 0).join(' ').toLowerCase().replace(/\s+/g, ' ');
        this.debugLog(`Element text extracted: "${text}" from element: ${element.tagName}.${element.className}`);
        return text;
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

    /**
     * Determines if an element is a lightbox navigation element
     */
    isLightboxElement(element, elementText) {
        // Check for lightbox-specific indicators
        const lightboxIndicators = [
            // Aria labels
            elementText.includes('next page'),
            elementText.includes('previous page'),
            elementText.includes('lightbox'),
            
            // SVG icons
            elementText.includes('right-fill'),
            elementText.includes('left-fill'),
            
            // Element context
            element.closest('[class*="lightbox"]') !== null,
            element.closest('[class*="modal"]') !== null,
            element.closest('[class*="overlay"]') !== null,
            element.closest('[role="dialog"]') !== null,
            
            // Check for SVG navigation icons
            element.querySelector('svg[icon-name*="fill"]') !== null,
            element.querySelector('svg[icon-name*="arrow"]') !== null
        ];
        
        return lightboxIndicators.some(indicator => indicator);
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

class TrainingMode {
    constructor() {
        this.isActive = false;
        this.trainedElements = { previous: null, next: null };
        this.overlay = null;
        this.clickHandler = null;
        this.highlightedElements = [];
        this.debugMode = false;
    }

    /**
     * Gets trained navigation elements for current domain
     */
    async getTrainedElements() {
        try {
            const domain = window.location.hostname;
            const result = await chrome.storage.local.get(`training_${domain}`);
            const trainingData = result[`training_${domain}`];
            
            if (trainingData) {
                this.debugLog(`Found training data for ${domain}`);
                
                // Find elements using stored selectors
                const previous = trainingData.previous ? document.querySelector(trainingData.previous.selector) : null;
                const next = trainingData.next ? document.querySelector(trainingData.next.selector) : null;
                
                return { previous, next };
            }
        } catch (error) {
            console.error('[Training Mode] Error loading trained elements:', error);
        }
        
        return { previous: null, next: null };
    }

    /**
     * Saves trained element to storage
     */
    async saveTrainedElement(element, direction) {
        try {
            const domain = window.location.hostname;
            const selector = this.generateSelector(element);
            
            // Get existing training data
            const result = await chrome.storage.local.get(`training_${domain}`);
            const trainingData = result[`training_${domain}`] || {};
            
            // Update training data
            trainingData[direction] = {
                selector: selector,
                text: element.textContent?.trim() || '',
                timestamp: Date.now()
            };
            
            // Save back to storage
            await chrome.storage.local.set({ [`training_${domain}`]: trainingData });
            
            this.debugLog(`Saved ${direction} training: ${selector}`);
            
        } catch (error) {
            console.error('[Training Mode] Error saving trained element:', error);
        }
    }

    /**
     * Clears all training data for current domain
     */
    async clearTrainingData() {
        try {
            const domain = window.location.hostname;
            await chrome.storage.local.remove(`training_${domain}`);
            this.debugLog(`Cleared training data for ${domain}`);
        } catch (error) {
            console.error('[Training Mode] Error clearing training data:', error);
        }
    }

    /**
     * Gets training status for current domain
     */
    async getTrainingStatus() {
        try {
            const domain = window.location.hostname;
            const result = await chrome.storage.local.get(`training_${domain}`);
            const trainingData = result[`training_${domain}`];
            
            if (trainingData) {
                const elementCount = (trainingData.previous ? 1 : 0) + (trainingData.next ? 1 : 0);
                return {
                    isActive: this.isActive,
                    hasData: true,
                    trainedElements: elementCount
                };
            }
        } catch (error) {
            console.error('[Training Mode] Error getting training status:', error);
        }
        
        return {
            isActive: this.isActive,
            hasData: false,
            trainedElements: 0
        };
    }

    /**
     * Toggles training mode on/off
     */
    async toggleTrainingMode() {
        if (this.isActive) {
            this.exitTrainingMode();
        } else {
            this.enterTrainingMode();
        }
        
        return this.isActive;
    }

    /**
     * Enters training mode with visual overlay
     */
    enterTrainingMode() {
        this.isActive = true;
        this.createTrainingOverlay();
        this.addTrainingClickHandler();
        console.log('[Training Mode] Training mode activated');
    }

    /**
     * Exits training mode and cleans up
     */
    exitTrainingMode() {
        this.isActive = false;
        this.removeTrainingOverlay();
        this.removeTrainingClickHandler();
        console.log('[Training Mode] Training mode deactivated');
    }

    /**
     * Creates visual overlay for training mode
     */
    createTrainingOverlay() {
        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.id = 'side-scroller-training-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.1);
            z-index: 999999;
            pointer-events: none;
        `;

        // Create info banner
        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, #667eea, #764ba2);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 1000000;
            pointer-events: none;
        `;
        banner.textContent = '🎯 Training Mode: Click navigation arrows to train';

        // Add to page
        document.body.appendChild(this.overlay);
        document.body.appendChild(banner);

        // Highlight clickable elements
        this.highlightClickableElements();
    }

    /**
     * Removes training overlay
     */
    removeTrainingOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        // Remove banner
        const banner = document.querySelector('[style*="Training Mode"]');
        if (banner) banner.remove();

        // Remove highlights
        this.clearHighlights();
    }

    /**
     * Highlights clickable elements that could be navigation
     */
    highlightClickableElements() {
        const clickableSelectors = [
            'a[href]', 'button', '[onclick]', '[role="button"]',
            '.btn', '.button', 'svg', '[class*="arrow"]',
            '[class*="next"]', '[class*="prev"]', '[class*="nav"]'
        ];

        clickableSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (this.isElementVisible(element)) {
                    this.addHighlight(element);
                }
            });
        });
    }

    /**
     * Adds highlight to an element
     */
    addHighlight(element) {
        const highlight = document.createElement('div');
        highlight.className = 'side-scroller-highlight';
        
        const rect = element.getBoundingClientRect();
        highlight.style.cssText = `
            position: fixed;
            top: ${rect.top}px;
            left: ${rect.left}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: 2px solid #667eea;
            background: rgba(102, 126, 234, 0.1);
            pointer-events: none;
            z-index: 999998;
            border-radius: 4px;
            transition: all 0.2s ease;
        `;

        document.body.appendChild(highlight);
        this.highlightedElements.push(highlight);
    }

    /**
     * Clears all highlights
     */
    clearHighlights() {
        this.highlightedElements.forEach(highlight => highlight.remove());
        this.highlightedElements = [];
    }

    /**
     * Adds click handler for training
     */
    addTrainingClickHandler() {
        this.clickHandler = (event) => {
            if (!this.isActive) return;

            event.preventDefault();
            event.stopPropagation();

            const element = event.target.closest('a, button, [onclick], [role="button"], svg');
            if (element) {
                this.handleTrainingClick(element);
            }
        };

        document.addEventListener('click', this.clickHandler, true);
    }

    /**
     * Removes click handler
     */
    removeTrainingClickHandler() {
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler, true);
            this.clickHandler = null;
        }
    }

    /**
     * Handles click during training mode
     */
    async handleTrainingClick(element) {
        const choice = await this.showDirectionDialog();
        
        if (choice) {
            await this.saveTrainedElement(element, choice);
            this.showTrainingFeedback(element, choice);
        }
    }

    /**
     * Shows dialog to choose navigation direction
     */
    showDirectionDialog() {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 8px 40px rgba(0,0,0,0.3);
                z-index: 1000001;
                font-family: 'Segoe UI', sans-serif;
                color: #333;
                min-width: 300px;
                text-align: center;
            `;

            dialog.innerHTML = `
                <h3 style="margin: 0 0 15px 0; font-size: 16px;">Select Navigation Direction</h3>
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button id="train-previous" style="padding: 10px 20px; border: none; border-radius: 6px; background: #667eea; color: white; cursor: pointer; font-size: 14px;">← Previous</button>
                    <button id="train-next" style="padding: 10px 20px; border: none; border-radius: 6px; background: #764ba2; color: white; cursor: pointer; font-size: 14px;">Next →</button>
                    <button id="train-cancel" style="padding: 10px 20px; border: 1px solid #ccc; border-radius: 6px; background: white; color: #666; cursor: pointer; font-size: 14px;">Cancel</button>
                </div>
            `;

            document.body.appendChild(dialog);

            dialog.querySelector('#train-previous').onclick = () => {
                dialog.remove();
                resolve('previous');
            };

            dialog.querySelector('#train-next').onclick = () => {
                dialog.remove();
                resolve('next');
            };

            dialog.querySelector('#train-cancel').onclick = () => {
                dialog.remove();
                resolve(null);
            };
        });
    }

    /**
     * Shows feedback after training an element
     */
    showTrainingFeedback(element, direction) {
        const feedback = document.createElement('div');
        feedback.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #2ed573;
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            z-index: 1000000;
            animation: slideIn 0.3s ease;
        `;

        feedback.textContent = `✅ Trained as ${direction} navigation`;
        document.body.appendChild(feedback);

        setTimeout(() => feedback.remove(), 2000);
    }

    /**
     * Generates a unique CSS selector for an element
     */
    generateSelector(element) {
        const path = [];
        let current = element;

        while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
            let selector = current.tagName.toLowerCase();
            
            if (current.id) {
                selector += `#${current.id}`;
                path.unshift(selector);
                break;
            }
            
            if (current.className) {
                const classes = current.className.trim().split(/\s+/).slice(0, 2);
                if (classes.length > 0) {
                    selector += '.' + classes.join('.');
                }
            }

            const siblings = Array.from(current.parentNode?.children || []);
            const sameTagSiblings = siblings.filter(sibling => sibling.tagName === current.tagName);
            
            if (sameTagSiblings.length > 1) {
                const index = sameTagSiblings.indexOf(current) + 1;
                selector += `:nth-of-type(${index})`;
            }

            path.unshift(selector);
            current = current.parentNode;
        }

        return path.join(' > ');
    }

    /**
     * Checks if element is visible
     */
    isElementVisible(element) {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               rect.width > 0 && 
               rect.height > 0;
    }

    /**
     * Debug logging utility
     */
    debugLog(message) {
        if (this.debugMode) {
            console.log(`[Training Mode Debug] ${message}`);
        }
    }
}

class SmartNavigationKeyBinder {
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
     * Enables debug mode for verbose logging
     */
    enableDebugMode() {
        this.debugMode = true;
        this.detector.debugMode = true;
        this.keyManager.debugMode = true;
        console.log('[Side Scroller] Debug mode enabled');
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

        const lightboxSelectors = [
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
        ];

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
        await smartNavigationBinder.trainingMode.clearTrainingData();
    }
}

console.log('[Side Scroller] Content script loaded successfully'); 