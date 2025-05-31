/**
 * Popup Script for Side Scroller
 * Handles the extension popup interface and user interactions
 */

class PopupController {
    constructor() {
        this.isDebugMode = false;
        this.currentTab = null;
        this.statusCheckInterval = null;
        
        this.initializeUI();
        this.setupEventListeners();
        this.loadCurrentTabStatus();
    }

    /**
     * Initializes the popup UI elements
     */
    initializeUI() {
        this.elements = {
            loading: document.getElementById('loading'),
            mainContent: document.getElementById('main-content'),
            leftArrowStatus: document.getElementById('left-arrow-status'),
            rightArrowStatus: document.getElementById('right-arrow-status'),
            refreshBtn: document.getElementById('refresh-btn'),
            debugBtn: document.getElementById('debug-btn')
        };
    }

    /**
     * Sets up event listeners for popup interactions
     */
    setupEventListeners() {
        this.elements.refreshBtn.addEventListener('click', () => {
            this.handleRefreshDetection();
        });

        this.elements.debugBtn.addEventListener('click', () => {
            this.handleToggleDebugMode();
        });

        // Check status periodically while popup is open
        this.statusCheckInterval = setInterval(() => {
            this.updateStatusDisplay();
        }, 2000);
    }

    /**
     * Loads the current tab and initializes status checking
     */
    async loadCurrentTabStatus() {
        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            this.currentTab = tab;

            // Wait a moment for content script to initialize
            setTimeout(() => {
                this.updateStatusDisplay();
                this.showMainContent();
            }, 1000);

        } catch (error) {
            console.error('Error loading tab status:', error);
            this.showErrorState();
        }
    }

    /**
     * Updates the status display by querying the content script
     */
    async updateStatusDisplay() {
        if (!this.currentTab) return;

        try {
            // Send message to content script to get current status
            const response = await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'getStatus'
            });

            if (response && response.status === 'success') {
                this.displayNavigationStatus(response.data);
            } else {
                this.displayFallbackStatus();
            }

        } catch (error) {
            // Content script might not be ready or available
            this.displayFallbackStatus();
        }
    }

    /**
     * Displays the navigation status in the UI
     */
    displayNavigationStatus(statusData) {
        const { previousPage, nextPage, leftArrowBound, rightArrowBound } = statusData;

        // Update left arrow status
        this.updateArrowStatus(
            this.elements.leftArrowStatus,
            previousPage,
            leftArrowBound,
            'previous'
        );

        // Update right arrow status
        this.updateArrowStatus(
            this.elements.rightArrowStatus,
            nextPage,
            rightArrowBound,
            'next'
        );
    }

    /**
     * Updates the status indicator for a specific arrow key
     */
    updateArrowStatus(element, navigationElement, isBound, direction) {
        // Clear existing classes
        element.className = 'status-indicator';

        if (navigationElement && isBound) {
            element.classList.add('status-bound');
            element.textContent = 'Bound';
            element.title = `${direction} page navigation is active`;
        } else if (navigationElement && !isBound) {
            element.classList.add('status-not-bound');
            element.textContent = 'Available';
            element.title = `${direction} page navigation detected but key already in use`;
        } else {
            element.classList.add('status-not-detected');
            element.textContent = 'Not Found';
            element.title = `No ${direction} page navigation detected`;
        }
    }

    /**
     * Displays fallback status when content script is not available
     */
    displayFallbackStatus() {
        const fallbackClass = 'status-not-detected';
        const fallbackText = 'Unknown';

        this.elements.leftArrowStatus.className = `status-indicator ${fallbackClass}`;
        this.elements.leftArrowStatus.textContent = fallbackText;

        this.elements.rightArrowStatus.className = `status-indicator ${fallbackClass}`;
        this.elements.rightArrowStatus.textContent = fallbackText;
    }

    /**
     * Handles refresh detection button click
     */
    async handleRefreshDetection() {
        if (!this.currentTab) return;

        // Update button to show loading state
        const originalText = this.elements.refreshBtn.textContent;
        this.elements.refreshBtn.textContent = '🔄 Refreshing...';
        this.elements.refreshBtn.disabled = true;

        try {
            // Send message to content script to reinitialize
            await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'reinitialize'
            });

            // Update status after a short delay
            setTimeout(() => {
                this.updateStatusDisplay();
            }, 1000);

        } catch (error) {
            console.error('Error refreshing detection:', error);
        } finally {
            // Restore button state
            setTimeout(() => {
                this.elements.refreshBtn.textContent = originalText;
                this.elements.refreshBtn.disabled = false;
            }, 1500);
        }
    }

    /**
     * Handles debug mode toggle button click
     */
    async handleToggleDebugMode() {
        if (!this.currentTab) return;

        this.isDebugMode = !this.isDebugMode;

        // Update button text
        this.elements.debugBtn.textContent = this.isDebugMode 
            ? '🐛 Debug ON' 
            : '🐛 Toggle Debug Mode';

        try {
            // Send message to content script to toggle debug mode
            await chrome.tabs.sendMessage(this.currentTab.id, {
                action: 'toggleDebug',
                enabled: this.isDebugMode
            });

            // Show feedback
            const originalText = this.elements.debugBtn.textContent;
            this.elements.debugBtn.textContent = this.isDebugMode 
                ? '✅ Debug Enabled' 
                : '❌ Debug Disabled';

            setTimeout(() => {
                this.elements.debugBtn.textContent = originalText;
            }, 1500);

        } catch (error) {
            console.error('Error toggling debug mode:', error);
        }
    }

    /**
     * Shows the main content and hides loading state
     */
    showMainContent() {
        this.elements.loading.style.display = 'none';
        this.elements.mainContent.style.display = 'block';
    }

    /**
     * Shows an error state when extension cannot function
     */
    showErrorState() {
        this.elements.loading.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p>❌ Extension not available on this page</p>
                <p style="font-size: 12px; opacity: 0.8;">
                    This extension works on regular web pages but not on Chrome internal pages.
                </p>
            </div>
        `;
    }

    /**
     * Cleanup when popup is closed
     */
    cleanup() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }
    }
}

// Enhanced content script message handler for popup communication
class PopupMessageHandler {
    /**
     * Handles incoming messages from popup
     */
    static handlePopupMessage(message, sender, sendResponse) {
        try {
            switch (message.action) {
                case 'getStatus':
                    sendResponse(PopupMessageHandler.getNavigationStatus());
                    break;

                case 'reinitialize':
                    PopupMessageHandler.reinitializeExtension();
                    sendResponse({ status: 'success', message: 'Reinitialization started' });
                    break;

                case 'toggleDebug':
                    PopupMessageHandler.toggleDebugMode(message.enabled);
                    sendResponse({ status: 'success', message: 'Debug mode toggled' });
                    break;

                default:
                    sendResponse({ status: 'error', message: 'Unknown action' });
            }
        } catch (error) {
            sendResponse({ status: 'error', message: error.message });
        }
    }

    /**
     * Gets current navigation status for popup display
     */
    static getNavigationStatus() {
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
    static reinitializeExtension() {
        if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
            smartNavigationBinder.reinitialize();
        }
    }

    /**
     * Toggles debug mode
     */
    static toggleDebugMode(enabled) {
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
}

// Initialize popup controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const popupController = new PopupController();

    // Cleanup when popup window is closed
    window.addEventListener('beforeunload', () => {
        popupController.cleanup();
    });
});

// Note: This script runs in popup context, not content script context
// The actual message handling needs to be added to content.js 