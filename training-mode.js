/**
 * Side Scroller Extension - Training Mode
 * Allows manual training of navigation elements for specific websites
 */

import { TRAINING_CONFIG, ELEMENT_SELECTORS } from './patterns.js';

export class TrainingMode {
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
            background: ${TRAINING_CONFIG.overlay.backgroundColor};
            z-index: ${TRAINING_CONFIG.overlay.zIndex};
            pointer-events: none;
        `;

        // Create info banner
        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${TRAINING_CONFIG.banner.gradient};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: ${TRAINING_CONFIG.banner.zIndex};
            pointer-events: none;
        `;
        banner.textContent = TRAINING_CONFIG.banner.text;

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
        const clickableSelectors = ELEMENT_SELECTORS.training;

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
            border: ${TRAINING_CONFIG.highlight.borderWidth} solid ${TRAINING_CONFIG.highlight.borderColor};
            background: ${TRAINING_CONFIG.highlight.backgroundColor};
            pointer-events: none;
            z-index: ${TRAINING_CONFIG.highlight.zIndex};
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
            background: ${TRAINING_CONFIG.feedback.backgroundColor};
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

        setTimeout(() => feedback.remove(), TRAINING_CONFIG.feedback.duration);
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