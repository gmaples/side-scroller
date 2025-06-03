#!/usr/bin/env node
/**
 * Real Extension Test Suite - Tests actual extension modules with proper imports
 * This tests the REAL functionality by importing the actual modules
 */

import { JSDOM } from 'jsdom';
import { pathToFileURL } from 'url';
import { resolve } from 'path';

class RealExtensionTestSuite {
    constructor() {
        this.testResults = [];
        this.dom = null;
        this.window = null;
        this.document = null;
        this.extensionModules = {};
    }

    /**
     * Initialize DOM environment with comprehensive navigation elements
     */
    async initializeDOMEnvironment() {
        console.log('🔧 Setting up comprehensive DOM test environment...');
        
        const testHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Extension Test Page</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body>
                <div class="content">
                    <h1>Navigation Test Page</h1>
                    
                    <!-- VALID NAVIGATION ELEMENTS -->
                    <nav class="pagination">
                        <a href="/page-1" class="prev-link">← Previous Page</a>
                        <span class="current">Page 2</span>
                        <a href="/page-3" class="next-link">Next Page →</a>
                    </nav>
                    
                    <div class="chapter-nav">
                        <button class="chapter-btn prev-chapter">Previous Chapter</button>
                        <button class="chapter-btn next-chapter">Next Chapter</button>
                    </div>
                    
                    <div class="comic-navigation">
                        <a href="/episode/1">← Previous Episode</a>
                        <a href="/episode/3">Next Episode →</a>
                    </div>
                    
                    <!-- LIGHTBOX NAVIGATION -->
                    <div class="lightbox" style="display: none;">
                        <button class="lightbox-prev">◀ Previous</button>
                        <button class="lightbox-next">Next ▶</button>
                    </div>
                    
                    <!-- BROWSER UI ELEMENTS (should be filtered) -->
                    <div style="position: fixed; top: 5px; left: 5px; z-index: 2147483647;">
                        <button class="chrome-back" aria-label="Back to previous page">⬅ Back</button>
                        <button class="chrome-forward" aria-label="Forward to next page">➡ Forward</button>
                    </div>
                    
                    <div class="extension-ui" style="position: fixed; top: 60px; right: 10px; z-index: 999999;">
                        <button class="extension-button">Extension Menu</button>
                    </div>
                    
                    <!-- FALSE POSITIVE ELEMENTS -->
                    <div class="reddit-content">
                        <a href="/r/community">r/community</a>
                        <a href="/r/nextlevel">r/nextlevel</a>
                        <button class="comments-btn">💬 Comments</button>
                        <button class="share-btn">📤 Share</button>
                        <a href="/create-community">Create Community</a>
                        <a href="/join-community">Join Community</a>
                    </div>
                    
                    <!-- SIZE EDGE CASES -->
                    <button style="width: 3px; height: 3px; display: block;">Tiny</button>
                    <button style="width: 700px; height: 400px; display: block;">Huge Navigation Button</button>
                    
                    <!-- FORM ELEMENTS (should not interfere) -->
                    <form class="search-form">
                        <input type="text" placeholder="Search..." id="search-input">
                        <button type="submit">Search</button>
                    </form>
                    
                    <!-- CONTENT NAVIGATION -->
                    <article>
                        <p>This is test content for the extension.</p>
                        <div class="article-nav">
                            <a href="/articles/prev">← Previous Article</a>
                            <a href="/articles/next">Next Article →</a>
                        </div>
                    </article>
                </div>
            </body>
            </html>
        `;

        this.dom = new JSDOM(testHTML, {
            url: 'http://localhost:8001/test-extension',
            pretendToBeVisual: true,
            resources: 'usable'
        });
        
        this.window = this.dom.window;
        this.document = this.window.document;
        
        // Setup complete browser-like environment
        global.window = this.window;
        global.document = this.document;
        global.HTMLElement = this.window.HTMLElement;
        global.Element = this.window.Element;
        global.Node = this.window.Node;
        global.MutationObserver = this.window.MutationObserver;
        
        // Mock Chrome APIs comprehensively
        global.chrome = {
            runtime: {
                onMessage: {
                    addListener: () => {},
                    removeListener: () => {}
                },
                id: 'test-extension-id'
            },
            storage: {
                local: {
                    get: async (keys) => ({}),
                    set: async (data) => ({ success: true }),
                    remove: async (keys) => ({ success: true })
                }
            },
            tabs: {
                query: async (options) => ([{ id: 1, url: 'http://localhost:8001/test' }])
            }
        };
        
        console.log('✅ DOM environment initialized with comprehensive test elements');
    }

    /**
     * Load actual extension modules using dynamic imports
     */
    async loadRealExtensionModules() {
        console.log('📦 Loading REAL extension modules...');
        
        try {
            // Import patterns first
            const patternsPath = pathToFileURL(resolve('./patterns.js')).href;
            const patterns = await import(patternsPath);
            this.extensionModules.patterns = patterns;
            
            if (patterns.INTELLIGENT_NAVIGATION_PATTERNS) {
                console.log('✅ Patterns module loaded successfully');
                this.recordTest('Module Loading', 'Patterns Module', true, 'Real module imported');
            } else {
                throw new Error('Patterns module missing expected exports');
            }
            
            // Import browser UI filter
            const browserUIPath = pathToFileURL(resolve('./browser-ui-filter.js')).href;
            const browserUI = await import(browserUIPath);
            this.extensionModules.browserUI = browserUI;
            
            if (browserUI.BrowserUIElementFilter) {
                console.log('✅ BrowserUIElementFilter module loaded successfully');
                this.recordTest('Module Loading', 'BrowserUI Module', true, 'Real class imported');
            }
            
            // Import navigation detector
            const detectorPath = pathToFileURL(resolve('./navigation-detector.js')).href;
            const detector = await import(detectorPath);
            this.extensionModules.detector = detector;
            
            if (detector.NavigationElementDetector) {
                console.log('✅ NavigationElementDetector module loaded successfully');
                this.recordTest('Module Loading', 'Detector Module', true, 'Real class imported');
            }
            
            // Import key binding manager
            const keyManagerPath = pathToFileURL(resolve('./key-binding-manager.js')).href;
            const keyManager = await import(keyManagerPath);
            this.extensionModules.keyManager = keyManager;
            
            if (keyManager.KeyBindingManager) {
                console.log('✅ KeyBindingManager module loaded successfully');
                this.recordTest('Module Loading', 'KeyManager Module', true, 'Real class imported');
            }
            
            return true;
            
        } catch (error) {
            console.log('❌ Failed to load real modules:', error.message);
            this.recordTest('Module Loading', 'Real Extension Modules', false, error.message);
            return false;
        }
    }

    /**
     * Test real browser UI filtering functionality
     */
    async testRealBrowserUIFiltering() {
        console.log('🛡️ Testing REAL browser UI filtering...');
        
        if (!this.extensionModules.browserUI?.BrowserUIElementFilter) {
            this.recordTest('Browser UI Filtering', 'Module Not Available', false, 'BrowserUIElementFilter not loaded');
            return false;
        }
        
        const filter = new this.extensionModules.browserUI.BrowserUIElementFilter();
        
        const testCases = [
            {
                name: 'Chrome Back Button',
                selector: '.chrome-back',
                shouldExclude: true,
                reason: 'Browser navigation button'
            },
            {
                name: 'Extension UI Element',
                selector: '.extension-button',
                shouldExclude: true,
                reason: 'High z-index extension UI'
            },
            {
                name: 'Valid Next Page Link',
                selector: '.next-link',
                shouldExclude: false,
                reason: 'Valid webpage navigation'
            },
            {
                name: 'Valid Previous Chapter',
                selector: '.prev-chapter',
                shouldExclude: false,
                reason: 'Valid content navigation'
            },
            {
                name: 'Tiny Button',
                selector: 'button[style*="width: 3px"]',
                shouldExclude: true,
                reason: 'Too small for navigation'
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
                
                const shouldExclude = filter.shouldExcludeElement(element);
                const testPassed = shouldExclude === testCase.shouldExclude;
                
                if (testPassed) {
                    passedTests++;
                    this.recordTest('Browser UI Filtering', testCase.name, true, testCase.reason);
                } else {
                    this.recordTest('Browser UI Filtering', testCase.name, false, 
                        `Expected ${testCase.shouldExclude}, got ${shouldExclude}`);
                }
                
            } catch (error) {
                this.recordTest('Browser UI Filtering', testCase.name, false, error.message);
            }
        }
        
        console.log(`✅ Real Browser UI Filtering: ${passedTests}/${testCases.length} tests passed`);
        return passedTests === testCases.length;
    }

    /**
     * Test real navigation element detection
     */
    async testRealNavigationDetection() {
        console.log('🧭 Testing REAL navigation element detection...');
        
        if (!this.extensionModules.detector?.NavigationElementDetector) {
            this.recordTest('Navigation Detection', 'Module Not Available', false, 'NavigationElementDetector not loaded');
            return false;
        }
        
        const detector = new this.extensionModules.detector.NavigationElementDetector();
        
        const testCases = [
            {
                name: 'Previous Page Link',
                selector: '.prev-link',
                expectedDirection: 'previous',
                shouldDetect: true
            },
            {
                name: 'Next Page Link', 
                selector: '.next-link',
                expectedDirection: 'next',
                shouldDetect: true
            },
            {
                name: 'Previous Chapter Button',
                selector: '.prev-chapter',
                expectedDirection: 'previous', 
                shouldDetect: true
            },
            {
                name: 'Next Chapter Button',
                selector: '.next-chapter',
                expectedDirection: 'next',
                shouldDetect: true
            },
            {
                name: 'Reddit Community Link',
                selector: 'a[href="/r/community"]',
                expectedDirection: null,
                shouldDetect: false
            },
            {
                name: 'Comments Button',
                selector: '.comments-btn',
                expectedDirection: null,
                shouldDetect: false
            },
            {
                name: 'Chrome Back Button',
                selector: '.chrome-back',
                expectedDirection: null,
                shouldDetect: false
            }
        ];

        let passedTests = 0;
        const detectionResult = detector.detectNavigationElements();
        
        for (const testCase of testCases) {
            try {
                const element = this.document.querySelector(testCase.selector);
                
                if (!element) {
                    this.recordTest('Navigation Detection', testCase.name, false, 'Element not found');
                    continue;
                }
                
                // Check if element was detected as navigation
                const isDetectedAsPrevious = detectionResult.previousPage === element;
                const isDetectedAsNext = detectionResult.nextPage === element;
                const isDetected = isDetectedAsPrevious || isDetectedAsNext;
                
                const testPassed = isDetected === testCase.shouldDetect;
                
                if (testPassed) {
                    passedTests++;
                    const direction = isDetectedAsPrevious ? 'previous' : isDetectedAsNext ? 'next' : 'none';
                    this.recordTest('Navigation Detection', testCase.name, true, 
                        `Correctly ${testCase.shouldDetect ? 'detected as ' + direction : 'excluded'}`);
                } else {
                    this.recordTest('Navigation Detection', testCase.name, false, 
                        `Expected ${testCase.shouldDetect}, got ${isDetected}`);
                }
                
            } catch (error) {
                this.recordTest('Navigation Detection', testCase.name, false, error.message);
            }
        }
        
        console.log(`✅ Real Navigation Detection: ${passedTests}/${testCases.length} tests passed`);
        console.log(`📊 Detection Results: Previous=${detectionResult.previousPage?.textContent || 'none'}, Next=${detectionResult.nextPage?.textContent || 'none'}`);
        
        return passedTests === testCases.length;
    }

    /**
     * Test real key binding functionality
     */
    async testRealKeyBinding() {
        console.log('⌨️ Testing REAL key binding functionality...');
        
        if (!this.extensionModules.keyManager?.KeyBindingManager) {
            this.recordTest('Key Binding', 'Module Not Available', false, 'KeyBindingManager not loaded');
            return false;
        }
        
        const keyManager = new this.extensionModules.keyManager.KeyBindingManager();
        let keyEventCaptured = false;
        let targetElementClicked = false;
        
        // Create a test navigation element
        const testElement = this.document.createElement('button');
        testElement.textContent = 'Test Navigation';
        testElement.onclick = () => { targetElementClicked = true; };
        this.document.body.appendChild(testElement);
        
        // Bind a key to the element
        const bindingSuccess = keyManager.bindKeyToElement(39, testElement, 'next'); // Right arrow
        
        if (bindingSuccess) {
            this.recordTest('Key Binding', 'Key Binding Setup', true, 'Successfully bound key to element');
            
            // Simulate key press
            const keyEvent = new this.window.KeyboardEvent('keydown', {
                key: 'ArrowRight',
                keyCode: 39,
                bubbles: true,
                cancelable: true
            });
            
            this.document.dispatchEvent(keyEvent);
            
            // Wait a moment for event processing
            await new Promise(resolve => setTimeout(resolve, 50));
            
            if (targetElementClicked) {
                this.recordTest('Key Binding', 'Key Event Processing', true, 'Key press successfully triggered element click');
            } else {
                this.recordTest('Key Binding', 'Key Event Processing', false, 'Key press did not trigger element click');
            }
        } else {
            this.recordTest('Key Binding', 'Key Binding Setup', false, 'Failed to bind key to element');
        }
        
        console.log(`✅ Real Key Binding: Setup=${bindingSuccess}, Event=${targetElementClicked}`);
        return bindingSuccess && targetElementClicked;
    }

    /**
     * Record test result with detailed information
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
     * Run all comprehensive real extension tests
     */
    async runAllRealTests() {
        console.log('🚀 Starting COMPREHENSIVE REAL EXTENSION TESTS...\n');
        
        try {
            await this.initializeDOMEnvironment();
            
            const moduleLoadingSuccess = await this.loadRealExtensionModules();
            
            if (!moduleLoadingSuccess) {
                console.log('❌ Cannot proceed with tests - modules failed to load');
                this.printTestSummary();
                return false;
            }
            
            const testResults = await Promise.all([
                this.testRealBrowserUIFiltering(),
                this.testRealNavigationDetection(),
                this.testRealKeyBinding()
            ]);
            
            const allTestsPassed = testResults.every(result => result === true);
            
            console.log('\n📊 COMPREHENSIVE TEST SUMMARY:');
            this.printTestSummary();
            
            console.log(`\n🎯 FINAL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED - EXTENSION FULLY FUNCTIONAL' : '❌ SOME TESTS FAILED - ISSUES DETECTED'}`);
            
            return allTestsPassed;
            
        } catch (error) {
            console.error('❌ FATAL ERROR during comprehensive testing:', error);
            console.log('\n📊 PARTIAL TEST SUMMARY:');
            this.printTestSummary();
            return false;
        }
    }

    /**
     * Print detailed test summary with pass/fail analysis
     */
    printTestSummary() {
        const categories = [...new Set(this.testResults.map(r => r.category))];
        let totalTests = 0;
        let totalPassed = 0;
        
        categories.forEach(category => {
            const categoryTests = this.testResults.filter(r => r.category === category);
            const passed = categoryTests.filter(r => r.passed).length;
            const total = categoryTests.length;
            
            totalTests += total;
            totalPassed += passed;
            
            const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
            console.log(`\n${category}: ${passed}/${total} tests passed (${percentage}%)`);
            
            categoryTests.forEach(test => {
                const status = test.passed ? '✅' : '❌';
                console.log(`  ${status} ${test.testName}: ${test.details}`);
            });
        });
        
        const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
        console.log(`\n📈 OVERALL: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);
    }
}

// Run comprehensive tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const testSuite = new RealExtensionTestSuite();
    testSuite.runAllRealTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

export default RealExtensionTestSuite; 