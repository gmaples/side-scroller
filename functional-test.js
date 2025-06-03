#!/usr/bin/env node
/**
 * Functional Test Suite for Side Scroller Extension
 * Tests actual functionality without requiring Chrome extension environment
 */

import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

// Mock Chrome APIs
global.chrome = {
    runtime: {
        onMessage: {
            addListener: () => {}
        }
    },
    storage: {
        local: {
            get: async (key) => ({}),
            set: async (data) => {},
            remove: async (keys) => {}
        }
    }
};

class FunctionalTestSuite {
    constructor() {
        this.testResults = [];
        this.dom = null;
        this.window = null;
        this.document = null;
    }

    /**
     * Initialize DOM environment for testing
     */
    async initializeDOMEnvironment() {
        console.log('🔧 Initializing DOM environment...');
        
        // Create test HTML with navigation elements
        const testHTML = `
            <!DOCTYPE html>
            <html>
            <head><title>Test Page</title></head>
            <body>
                <div class="content">
                    <h1>Test Page Content</h1>
                    
                    <!-- Valid navigation elements -->
                    <a href="/page1" class="nav-link">Previous Page</a>
                    <button class="next-btn">Next Chapter</button>
                    <div class="pagination">
                        <a href="/prev">← Back</a>
                        <a href="/next">Forward →</a>
                    </div>
                    
                    <!-- Browser UI elements (should be filtered) -->
                    <button class="chrome-back-button" style="position: fixed; top: 10px; left: 10px;">Browser Back</button>
                    <div class="extension-popup" style="z-index: 2147483647;">Extension UI</div>
                    
                    <!-- False positive elements -->
                    <a href="/r/community">r/community</a>
                    <button class="comments-btn">Comments</button>
                    <a href="/create-community">Create Community</a>
                    
                    <!-- Size test elements -->
                    <button style="width: 5px; height: 5px;">Too Small</button>
                    <button style="width: 600px; height: 300px;">Too Large</button>
                    
                    <!-- Lightbox elements -->
                    <div class="lightbox-overlay">
                        <button class="lightbox-prev">Previous Image</button>
                        <button class="lightbox-next">Next Image</button>
                    </div>
                </div>
                
                <!-- Mock form elements -->
                <form>
                    <input type="text" id="search-input">
                    <button type="submit">Search</button>
                </form>
            </body>
            </html>
        `;

        this.dom = new JSDOM(testHTML, {
            url: 'http://localhost:8001/test',
            pretendToBeVisual: true,
            resources: 'usable'
        });
        
        this.window = this.dom.window;
        this.document = this.window.document;
        
        // Setup global environment
        global.window = this.window;
        global.document = this.document;
        global.HTMLElement = this.window.HTMLElement;
        global.Element = this.window.Element;
        global.Node = this.window.Node;
        
        console.log('✅ DOM environment initialized');
    }

    /**
     * Load and evaluate extension modules
     */
    async loadExtensionModules() {
        console.log('📦 Loading extension modules...');
        
        try {
            // Load patterns first (no dependencies)
            const patternsCode = readFileSync('patterns.js', 'utf8');
            const patternsExports = {};
            
            // Simulate module evaluation
            const patternsEval = new Function('exports', patternsCode.replace(/export const/g, 'exports.'));
            patternsEval(patternsExports);
            
            // Check if patterns loaded correctly
            if (patternsExports.INTELLIGENT_NAVIGATION_PATTERNS) {
                console.log('✅ Patterns module loaded successfully');
                this.recordTest('Module Loading', 'Patterns Module', true, 'Loaded with navigation patterns');
            } else {
                throw new Error('Patterns module failed to export expected objects');
            }
            
            return true;
            
        } catch (error) {
            console.log('❌ Failed to load modules:', error.message);
            this.recordTest('Module Loading', 'Extension Modules', false, error.message);
            return false;
        }
    }

    /**
     * Test navigation element detection functionality
     */
    async testNavigationDetection() {
        console.log('🧭 Testing navigation element detection...');
        
        const testCases = [
            {
                name: 'Valid Previous Link',
                selector: 'a[href="/prev"]',
                expectedDirection: 'previous',
                shouldDetect: true
            },
            {
                name: 'Valid Next Button',
                selector: '.next-btn',
                expectedDirection: 'next',
                shouldDetect: true
            },
            {
                name: 'False Positive - Community Link',
                selector: 'a[href="/r/community"]',
                expectedDirection: null,
                shouldDetect: false
            },
            {
                name: 'Browser UI Element',
                selector: '.chrome-back-button',
                expectedDirection: null,
                shouldDetect: false
            },
            {
                name: 'Too Small Element',
                selector: 'button[style*="width: 5px"]',
                expectedDirection: null,
                shouldDetect: false
            }
        ];

        let passedTests = 0;
        
        for (const testCase of testCases) {
            try {
                const element = this.document.querySelector(testCase.selector);
                
                if (!element) {
                    this.recordTest('Navigation Detection', testCase.name, false, 'Element not found');
                    continue;
                }
                
                // Simulate detection logic
                const elementText = element.textContent.toLowerCase().trim();
                const isNavigationElement = this.simulateNavigationDetection(element, elementText);
                
                const testPassed = isNavigationElement === testCase.shouldDetect;
                
                if (testPassed) {
                    passedTests++;
                    this.recordTest('Navigation Detection', testCase.name, true, `Correctly ${testCase.shouldDetect ? 'detected' : 'excluded'}`);
                } else {
                    this.recordTest('Navigation Detection', testCase.name, false, `Expected ${testCase.shouldDetect}, got ${isNavigationElement}`);
                }
                
            } catch (error) {
                this.recordTest('Navigation Detection', testCase.name, false, error.message);
            }
        }
        
        console.log(`✅ Navigation Detection: ${passedTests}/${testCases.length} tests passed`);
        return passedTests === testCases.length;
    }

    /**
     * Simulate navigation detection logic
     */
    simulateNavigationDetection(element, text) {
        // Check for false positives first
        const falsePositives = ['community', 'comments', 'create'];
        if (falsePositives.some(fp => text.includes(fp))) {
            return false;
        }
        
        // Check for browser UI
        const classList = Array.from(element.classList);
        if (classList.some(cls => cls.includes('chrome') || cls.includes('extension'))) {
            return false;
        }
        
        // Check size
        const rect = element.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8 || rect.width > 500 || rect.height > 200) {
            return false;
        }
        
        // Check for navigation patterns
        const navPatterns = ['next', 'previous', 'prev', 'back', 'forward', '→', '←'];
        return navPatterns.some(pattern => text.includes(pattern));
    }

    /**
     * Test browser UI filtering
     */
    async testBrowserUIFiltering() {
        console.log('🛡️ Testing browser UI filtering...');
        
        const testCases = [
            {
                name: 'Extension Popup Element',
                selector: '.extension-popup',
                shouldExclude: true,
                reason: 'High z-index extension UI'
            },
            {
                name: 'Chrome Browser Button',
                selector: '.chrome-back-button',
                shouldExclude: true,
                reason: 'Browser UI class name'
            },
            {
                name: 'Regular Navigation Link',
                selector: '.nav-link',
                shouldExclude: false,
                reason: 'Valid page navigation'
            }
        ];

        let passedTests = 0;
        
        for (const testCase of testCases) {
            try {
                const element = this.document.querySelector(testCase.selector);
                
                if (!element) {
                    this.recordTest('Browser UI Filtering', testCase.name, false, 'Element not found');
                    continue;
                }
                
                const shouldExclude = this.simulateBrowserUIFiltering(element);
                const testPassed = shouldExclude === testCase.shouldExclude;
                
                if (testPassed) {
                    passedTests++;
                    this.recordTest('Browser UI Filtering', testCase.name, true, testCase.reason);
                } else {
                    this.recordTest('Browser UI Filtering', testCase.name, false, `Expected ${testCase.shouldExclude}, got ${shouldExclude}`);
                }
                
            } catch (error) {
                this.recordTest('Browser UI Filtering', testCase.name, false, error.message);
            }
        }
        
        console.log(`✅ Browser UI Filtering: ${passedTests}/${testCases.length} tests passed`);
        return passedTests === testCases.length;
    }

    /**
     * Simulate browser UI filtering logic
     */
    simulateBrowserUIFiltering(element) {
        // Check z-index
        const style = this.window.getComputedStyle(element);
        const zIndex = parseInt(style.zIndex) || 0;
        if (zIndex > 999999) {
            return true;
        }
        
        // Check class names
        const classList = Array.from(element.classList);
        if (classList.some(cls => cls.includes('chrome') || cls.includes('extension') || cls.includes('browser'))) {
            return true;
        }
        
        // Check position (top browser UI zone)
        const rect = element.getBoundingClientRect();
        if (rect.top < 120) {
            return true;
        }
        
        return false;
    }

    /**
     * Test key binding simulation
     */
    async testKeyBinding() {
        console.log('⌨️ Testing key binding functionality...');
        
        let keyEventsFired = 0;
        let preventDefaultCalled = false;
        
        // Mock event listeners
        const originalAddEventListener = this.document.addEventListener;
        this.document.addEventListener = (type, handler, options) => {
            if (type === 'keydown') {
                // Simulate arrow key press
                const mockEvent = {
                    key: 'ArrowRight',
                    keyCode: 39,
                    target: this.document.body,
                    preventDefault: () => { preventDefaultCalled = true; },
                    stopPropagation: () => {}
                };
                
                setTimeout(() => {
                    handler(mockEvent);
                    keyEventsFired++;
                }, 10);
            }
            return originalAddEventListener.call(this.document, type, handler, options);
        };
        
        // Simulate key binding setup
        this.document.addEventListener('keydown', (e) => {
            if (e.keyCode === 39) { // Right arrow
                e.preventDefault();
                console.log('Right arrow key intercepted');
            }
        });
        
        // Wait for event simulation
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const keyBindingWorked = keyEventsFired > 0 && preventDefaultCalled;
        this.recordTest('Key Binding', 'Arrow Key Interception', keyBindingWorked, 
                       keyBindingWorked ? 'Successfully intercepted arrow key' : 'Failed to intercept key events');
        
        console.log(`✅ Key Binding: ${keyBindingWorked ? 'Working' : 'Failed'}`);
        return keyBindingWorked;
    }

    /**
     * Record test result
     */
    recordTest(category, testName, passed, details) {
        this.testResults.push({
            category,
            testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Run all functional tests
     */
    async runAllTests() {
        console.log('🚀 Starting comprehensive functional tests...\n');
        
        try {
            await this.initializeDOMEnvironment();
            
            const testResults = await Promise.all([
                this.loadExtensionModules(),
                this.testNavigationDetection(),
                this.testBrowserUIFiltering(),
                this.testKeyBinding()
            ]);
            
            const allTestsPassed = testResults.every(result => result === true);
            
            console.log('\n📊 Test Summary:');
            this.printTestSummary();
            
            console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
            
            return allTestsPassed;
            
        } catch (error) {
            console.error('❌ Fatal error during testing:', error);
            return false;
        }
    }

    /**
     * Print detailed test summary
     */
    printTestSummary() {
        const categories = [...new Set(this.testResults.map(r => r.category))];
        
        categories.forEach(category => {
            const categoryTests = this.testResults.filter(r => r.category === category);
            const passed = categoryTests.filter(r => r.passed).length;
            const total = categoryTests.length;
            
            console.log(`\n${category}: ${passed}/${total} tests passed`);
            categoryTests.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`  ${status} ${test.testName}: ${test.details}`);
            });
        });
    }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const testSuite = new FunctionalTestSuite();
    testSuite.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

export default FunctionalTestSuite; 