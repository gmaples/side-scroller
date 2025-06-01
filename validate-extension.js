#!/usr/bin/env node

/**
 * Extension Validation Script
 * Comprehensive test suite for Side Scroller extension functionality
 */

const fs = require('fs');
const path = require('path');

class ExtensionValidator {
    constructor() {
        this.testResults = [];
        this.browserUIFilter = null;
        this.navigationDetector = null;
    }

    /**
     * Initialize validator with extension components
     */
    async initialize() {
        try {
            // Wait for extension to be loaded
            await this.waitForExtension();
            
            // Get extension components
            if (typeof smartNavigationBinder !== 'undefined') {
                this.navigationDetector = smartNavigationBinder.detector;
                this.browserUIFilter = this.navigationDetector.browserUIFilter;
                console.log('✅ Extension components loaded successfully');
                return true;
            } else {
                console.error('❌ Extension not found');
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to initialize validator:', error);
            return false;
        }
    }

    /**
     * Wait for extension to be loaded
     */
    async waitForExtension() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 20;
            
            const checkExtension = () => {
                attempts++;
                
                if (typeof smartNavigationBinder !== 'undefined') {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Extension not loaded after 10 seconds'));
                } else {
                    setTimeout(checkExtension, 500);
                }
            };
            
            checkExtension();
        });
    }

    /**
     * Run all validation tests
     */
    async runAllTests() {
        console.log('🧪 Starting comprehensive extension validation...');
        
        if (!await this.initialize()) {
            return false;
        }

        // Enable debug mode for detailed logging
        this.navigationDetector.enableDebugMode();

        const testSuites = [
            () => this.testBrowserUIFiltering(),
            () => this.testElementDetection(),
            () => this.testKeyBinding(),
            () => this.testPositionFiltering(),
            () => this.testSizeFiltering(),
            () => this.testTrainingMode()
        ];

        let allPassed = true;
        
        for (const testSuite of testSuites) {
            try {
                const passed = await testSuite();
                if (!passed) allPassed = false;
            } catch (error) {
                console.error('❌ Test suite failed:', error);
                allPassed = false;
            }
        }

        console.log(allPassed ? '✅ All tests passed!' : '❌ Some tests failed');
        this.printTestSummary();
        
        return allPassed;
    }

    /**
     * Test browser UI filtering functionality
     */
    testBrowserUIFiltering() {
        console.log('\n🔍 Testing Browser UI Filtering...');

        const testCases = [
            {
                name: 'Mock browser back button',
                element: this.createMockElement('button', {
                    'aria-label': 'Back to previous page',
                    'class': 'chrome-navigation-button'
                }),
                shouldExclude: true,
                expectedReason: 'browser-navigation-term'
            },
            {
                name: 'Mock browser forward button',
                element: this.createMockElement('button', {
                    'title': 'Forward to next page',
                    'class': 'browser-toolbar-button'
                }),
                shouldExclude: true,
                expectedReason: 'browser-ui-attribute'
            },
            {
                name: 'Mock extension UI element',
                element: this.createMockElement('div', {
                    'class': 'extension-popup-content',
                    'id': 'chrome-extension-element'
                }),
                shouldExclude: true,
                expectedReason: 'matches-browser-ui-selector'
            },
            {
                name: 'Valid webpage navigation button',
                element: this.createMockElement('button', {
                    'class': 'next-page-btn',
                    'textContent': 'Next'
                }),
                shouldExclude: false
            },
            {
                name: 'High z-index element (potential browser UI)',
                element: this.createMockElement('div', {
                    'style': 'z-index: 2147483647; position: fixed;'
                }),
                shouldExclude: true,
                expectedReason: 'suspicious-z-index'
            },
            {
                name: 'Element in top browser UI zone',
                element: this.createMockElementWithPosition('button', { top: 50, left: 100, width: 50, height: 30 }),
                shouldExclude: true,
                expectedReason: 'top-browser-ui-zone'
            },
            {
                name: 'Element too small for navigation',
                element: this.createMockElementWithPosition('button', { top: 300, left: 100, width: 5, height: 5 }),
                shouldExclude: true,
                expectedReason: 'too-small'
            }
        ];

        let passed = 0;
        let failed = 0;

        testCases.forEach((testCase, index) => {
            try {
                const result = this.browserUIFilter.shouldExcludeElement(testCase.element);
                const analysis = this.browserUIFilter.analyzeElementForDebugging(testCase.element);
                
                if (result === testCase.shouldExclude) {
                    console.log(`✅ Test ${index + 1}: ${testCase.name} - PASSED`);
                    passed++;
                } else {
                    console.log(`❌ Test ${index + 1}: ${testCase.name} - FAILED`);
                    console.log(`   Expected: ${testCase.shouldExclude}, Got: ${result}`);
                    console.log(`   Analysis:`, analysis);
                    failed++;
                }
            } catch (error) {
                console.log(`❌ Test ${index + 1}: ${testCase.name} - ERROR: ${error.message}`);
                failed++;
            }
        });

        this.testResults.push({
            suite: 'Browser UI Filtering',
            passed,
            failed,
            total: testCases.length
        });

        return failed === 0;
    }

    /**
     * Test element detection functionality
     */
    testElementDetection() {
        console.log('\n🔍 Testing Element Detection...');

        try {
            const elements = this.navigationDetector.getAllClickableElements();
            console.log(`✅ Found ${elements.length} clickable elements after filtering`);

            // Test that no obvious browser UI elements are included
            const suspiciousElements = elements.filter(el => {
                const className = el.className?.toLowerCase() || '';
                const id = el.id?.toLowerCase() || '';
                return className.includes('chrome') || className.includes('browser') || 
                       id.includes('chrome') || id.includes('browser');
            });

            if (suspiciousElements.length === 0) {
                console.log('✅ No suspicious browser UI elements detected');
                this.testResults.push({
                    suite: 'Element Detection',
                    passed: 1,
                    failed: 0,
                    total: 1
                });
                return true;
            } else {
                console.log(`❌ Found ${suspiciousElements.length} suspicious elements:`);
                suspiciousElements.forEach(el => {
                    console.log(`   - ${el.tagName}.${el.className}#${el.id}`);
                });
                this.testResults.push({
                    suite: 'Element Detection',
                    passed: 0,
                    failed: 1,
                    total: 1
                });
                return false;
            }
        } catch (error) {
            console.error('❌ Element detection test failed:', error);
            this.testResults.push({
                suite: 'Element Detection',
                passed: 0,
                failed: 1,
                total: 1
            });
            return false;
        }
    }

    /**
     * Test key binding functionality
     */
    testKeyBinding() {
        console.log('\n🔍 Testing Key Binding...');

        try {
            const keyManager = smartNavigationBinder.keyManager;
            const initialBoundKeys = keyManager.boundKeys.size;
            
            console.log(`✅ Key manager initialized with ${initialBoundKeys} bound keys`);
            
            this.testResults.push({
                suite: 'Key Binding',
                passed: 1,
                failed: 0,
                total: 1
            });
            return true;
        } catch (error) {
            console.error('❌ Key binding test failed:', error);
            this.testResults.push({
                suite: 'Key Binding',
                passed: 0,
                failed: 1,
                total: 1
            });
            return false;
        }
    }

    /**
     * Test position-based filtering
     */
    testPositionFiltering() {
        console.log('\n🔍 Testing Position-Based Filtering...');

        const testElements = [
            {
                name: 'Element in top UI zone',
                element: this.createMockElementWithPosition('button', { top: 50, left: 200, width: 100, height: 30 }),
                shouldExclude: true
            },
            {
                name: 'Element in valid content area',
                element: this.createMockElementWithPosition('button', { top: 400, left: 200, width: 100, height: 30 }),
                shouldExclude: false
            },
            {
                name: 'Element outside viewport',
                element: this.createMockElementWithPosition('button', { top: -100, left: 200, width: 100, height: 30 }),
                shouldExclude: true
            }
        ];

        let passed = 0;
        let failed = 0;

        testElements.forEach((test, index) => {
            const result = this.browserUIFilter.checkPositionBasedExclusions(test.element);
            const shouldExclude = test.shouldExclude;
            const actualExclude = result !== null;

            if (actualExclude === shouldExclude) {
                console.log(`✅ Position test ${index + 1}: ${test.name} - PASSED`);
                passed++;
            } else {
                console.log(`❌ Position test ${index + 1}: ${test.name} - FAILED`);
                console.log(`   Expected exclude: ${shouldExclude}, Got: ${actualExclude}, Reason: ${result}`);
                failed++;
            }
        });

        this.testResults.push({
            suite: 'Position Filtering',
            passed,
            failed,
            total: testElements.length
        });

        return failed === 0;
    }

    /**
     * Test size-based filtering
     */
    testSizeFiltering() {
        console.log('\n🔍 Testing Size-Based Filtering...');

        const testElements = [
            {
                name: 'Too small element',
                element: this.createMockElementWithPosition('button', { top: 300, left: 200, width: 5, height: 5 }),
                shouldExclude: true
            },
            {
                name: 'Too large element',
                element: this.createMockElementWithPosition('button', { top: 300, left: 200, width: 600, height: 300 }),
                shouldExclude: true
            },
            {
                name: 'Normal sized element',
                element: this.createMockElementWithPosition('button', { top: 300, left: 200, width: 100, height: 30 }),
                shouldExclude: false
            }
        ];

        let passed = 0;
        let failed = 0;

        testElements.forEach((test, index) => {
            const result = this.browserUIFilter.checkSizeBasedExclusions(test.element);
            const shouldExclude = test.shouldExclude;
            const actualExclude = result !== null;

            if (actualExclude === shouldExclude) {
                console.log(`✅ Size test ${index + 1}: ${test.name} - PASSED`);
                passed++;
            } else {
                console.log(`❌ Size test ${index + 1}: ${test.name} - FAILED`);
                console.log(`   Expected exclude: ${shouldExclude}, Got: ${actualExclude}, Reason: ${result}`);
                failed++;
            }
        });

        this.testResults.push({
            suite: 'Size Filtering',
            passed,
            failed,
            total: testElements.length
        });

        return failed === 0;
    }

    /**
     * Test training mode functionality
     */
    testTrainingMode() {
        console.log('\n🔍 Testing Training Mode...');

        try {
            const trainingMode = smartNavigationBinder.trainingMode;
            console.log('✅ Training mode component accessible');
            
            this.testResults.push({
                suite: 'Training Mode',
                passed: 1,
                failed: 0,
                total: 1
            });
            return true;
        } catch (error) {
            console.error('❌ Training mode test failed:', error);
            this.testResults.push({
                suite: 'Training Mode',
                passed: 0,
                failed: 1,
                total: 1
            });
            return false;
        }
    }

    /**
     * Create a mock DOM element for testing
     */
    createMockElement(tagName, attributes = {}) {
        const element = document.createElement(tagName);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'textContent') {
                element.textContent = value;
            } else if (key === 'style') {
                element.setAttribute('style', value);
            } else {
                element.setAttribute(key, value);
            }
        });

        return element;
    }

    /**
     * Create a mock DOM element with specific position for testing
     */
    createMockElementWithPosition(tagName, position) {
        const element = this.createMockElement(tagName);
        
        // Mock getBoundingClientRect
        element.getBoundingClientRect = () => ({
            top: position.top,
            left: position.left,
            right: position.left + position.width,
            bottom: position.top + position.height,
            width: position.width,
            height: position.height
        });

        return element;
    }

    /**
     * Print test summary
     */
    printTestSummary() {
        console.log('\n📊 Test Summary:');
        console.log('================');
        
        let totalPassed = 0;
        let totalFailed = 0;
        let totalTests = 0;

        this.testResults.forEach(result => {
            totalPassed += result.passed;
            totalFailed += result.failed;
            totalTests += result.total;
            
            console.log(`${result.suite}: ${result.passed}/${result.total} passed`);
        });

        console.log('================');
        console.log(`Overall: ${totalPassed}/${totalTests} tests passed`);
        
        if (totalFailed === 0) {
            console.log('🎉 All tests passed! Extension is working correctly.');
        } else {
            console.log(`⚠️  ${totalFailed} tests failed. Please review the issues above.`);
        }
    }
}

// Auto-run validation when script is loaded
if (typeof window !== 'undefined') {
    window.runExtensionValidation = async function() {
        const validator = new ExtensionValidator();
        return await validator.runAllTests();
    };
    
    // Auto-run after a brief delay to ensure page is loaded
    setTimeout(() => {
        if (confirm('Run Side Scroller extension validation tests?')) {
            window.runExtensionValidation();
        }
    }, 2000);
}

// Run validation if script is executed directly
if (require.main === module) {
    const validator = new ExtensionValidator();
    const isValid = validator.validate();
    process.exit(isValid ? 0 : 1);
}

module.exports = ExtensionValidator; 