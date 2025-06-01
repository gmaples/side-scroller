/**
 * Popup Script for Side Scroller
 * Handles the extension popup interface and user interactions
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
        showError('Unable to access current tab');
        return;
    }

    // Initialize popup
    await initializePopup(tab.id);

    // Set up event listeners
    setupEventListeners(tab.id);
});

/**
 * Initializes the popup with current extension status
 */
async function initializePopup(tabId) {
    try {
        // Get extension status
        const response = await sendMessageToTab(tabId, { action: 'getStatus' });
        
        if (response && response.status === 'success') {
            updateStatusDisplay(response.data);
        } else {
            showError('Extension not active on this page');
        }

        // Get training status
        const trainingStatus = await getTrainingStatus(tabId);
        updateTrainingDisplay(trainingStatus);

    } catch (error) {
        console.error('Failed to initialize popup:', error);
        showError('Failed to connect to extension');
    }
}

/**
 * Sets up all event listeners for popup controls
 */
function setupEventListeners(tabId) {
    // Refresh button
    document.getElementById('refreshButton').addEventListener('click', async () => {
        await refreshDetection(tabId);
    });

    // Debug toggle
    document.getElementById('debugToggle').addEventListener('click', async () => {
        await toggleDebugMode(tabId);
    });

    // Training mode toggle
    document.getElementById('trainingToggle').addEventListener('click', async () => {
        await toggleTrainingMode(tabId);
    });

    // Clear training data
    document.getElementById('clearTraining').addEventListener('click', async () => {
        await clearTrainingData(tabId);
    });
}

/**
 * Updates the status display with current detection results
 */
function updateStatusDisplay(data) {
    const leftIndicator = document.getElementById('leftArrowIndicator');
    const rightIndicator = document.getElementById('rightArrowIndicator');

    // Update indicators
    if (data.leftArrowBound) {
        leftIndicator.classList.add('active');
    } else {
        leftIndicator.classList.remove('active');
    }

    if (data.rightArrowBound) {
        rightIndicator.classList.add('active');
    } else {
        rightIndicator.classList.remove('active');
    }

    // Update debug button
    const debugButton = document.getElementById('debugToggle');
    debugButton.textContent = data.debugMode ? '🐛 Disable Debug Mode' : '🐛 Enable Debug Mode';
}

/**
 * Updates the training mode display
 */
function updateTrainingDisplay(trainingStatus) {
    const trainingToggle = document.getElementById('trainingToggle');
    const trainingStatusElement = document.getElementById('trainingStatus');
    const clearButton = document.getElementById('clearTraining');

    if (trainingStatus.isActive) {
        trainingToggle.textContent = 'Exit Training';
        trainingToggle.classList.add('training-active');
        trainingStatusElement.textContent = '👆 Click on navigation arrows to train';
    } else {
        trainingToggle.textContent = 'Start Training';
        trainingToggle.classList.remove('training-active');
        
        if (trainingStatus.hasData) {
            trainingStatusElement.textContent = `✅ Trained: ${trainingStatus.trainedElements} elements`;
            clearButton.style.display = 'block';
        } else {
            trainingStatusElement.textContent = 'Click below to start training mode';
            clearButton.style.display = 'none';
        }
    }
}

/**
 * Refreshes navigation detection
 */
async function refreshDetection(tabId) {
    try {
        const response = await sendMessageToTab(tabId, { action: 'reinitialize' });
        
        if (response && response.status === 'success') {
            // Wait a moment for detection to complete
            setTimeout(async () => {
                const statusResponse = await sendMessageToTab(tabId, { action: 'getStatus' });
                if (statusResponse && statusResponse.status === 'success') {
                    updateStatusDisplay(statusResponse.data);
                }
            }, 1000);
        }
    } catch (error) {
        console.error('Failed to refresh detection:', error);
        showError('Failed to refresh detection');
    }
}

/**
 * Toggles debug mode
 */
async function toggleDebugMode(tabId) {
    try {
        const debugButton = document.getElementById('debugToggle');
        const isEnabled = debugButton.textContent.includes('Disable');
        
        const response = await sendMessageToTab(tabId, { 
            action: 'toggleDebug', 
            enabled: !isEnabled 
        });

        if (response && response.status === 'success') {
            debugButton.textContent = !isEnabled ? '🐛 Disable Debug Mode' : '🐛 Enable Debug Mode';
        }
    } catch (error) {
        console.error('Failed to toggle debug mode:', error);
        showError('Failed to toggle debug mode');
    }
}

/**
 * Toggles training mode
 */
async function toggleTrainingMode(tabId) {
    try {
        const response = await sendMessageToTab(tabId, { action: 'toggleTraining' });
        
        if (response && response.status === 'success') {
            const trainingStatus = await getTrainingStatus(tabId);
            updateTrainingDisplay(trainingStatus);
        }
    } catch (error) {
        console.error('Failed to toggle training mode:', error);
        showError('Failed to toggle training mode');
    }
}

/**
 * Clears training data for current site
 */
async function clearTrainingData(tabId) {
    try {
        const response = await sendMessageToTab(tabId, { action: 'clearTraining' });
        
        if (response && response.status === 'success') {
            const trainingStatus = await getTrainingStatus(tabId);
            updateTrainingDisplay(trainingStatus);
            
            // Refresh detection after clearing training
            await refreshDetection(tabId);
        }
    } catch (error) {
        console.error('Failed to clear training data:', error);
        showError('Failed to clear training data');
    }
}

/**
 * Gets training status for current site
 */
async function getTrainingStatus(tabId) {
    try {
        const response = await sendMessageToTab(tabId, { action: 'getTrainingStatus' });
        
        if (response && response.status === 'success') {
            return response.data;
        }
    } catch (error) {
        console.error('Failed to get training status:', error);
    }
    
    return { isActive: false, hasData: false, trainedElements: 0 };
}

/**
 * Sends a message to the content script in the specified tab
 */
async function sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Shows an error message in the popup
 */
function showError(message) {
    const statusContainer = document.querySelector('.status-container');
    statusContainer.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #ff6b6b;">
            <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
            <div style="font-size: 14px;">${message}</div>
        </div>
    `;
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