/**
 * Side Scroller Extension - Key Binding Manager
 * Manages arrow key bindings and prevents conflicts with existing handlers
 */

import { KEY_CONFIG } from './patterns.js';

export class KeyBindingManager {
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
        return KEY_CONFIG.names[keyCode] || `Key${keyCode}`;
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