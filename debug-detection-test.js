#!/usr/bin/env node
/**
 * Debug Detection Test - Detailed analysis of why navigation detection is failing
 */

import { JSDOM } from 'jsdom';
import { pathToFileURL } from 'url';
import { resolve } from 'path';

async function debugNavigationDetection() {
    console.log('🔍 DEBUG: Navigation Detection Analysis\n');
    
    // Setup DOM
    const testHTML = `
        <!DOCTYPE html>
        <html>
        <head><title>Debug Test</title></head>
        <body>
            <a href="/page-1" class="prev-link">← Previous Page</a>
            <a href="/page-3" class="next-link">Next Page →</a>
            <button class="prev-chapter">Previous Chapter</button>
            <button class="next-chapter">Next Chapter</button>
        </body>
        </html>
    `;

    const dom = new JSDOM(testHTML, {
        url: 'http://localhost:8001/debug',
        pretendToBeVisual: true,
        resources: 'usable'
    });
    
    global.window = dom.window;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.Element = dom.window.Element;
    global.Node = dom.window.Node;
    global.MutationObserver = dom.window.MutationObserver;
    
    // Mock Chrome APIs
    global.chrome = {
        runtime: { onMessage: { addListener: () => {} } },
        storage: { local: { get: async () => ({}), set: async () => {}, remove: async () => {} } }
    };
    
    try {
        // Import modules
        const patterns = await import(pathToFileURL(resolve('./patterns.js')).href);
        const detector = await import(pathToFileURL(resolve('./navigation-detector.js')).href);
        const browserUI = await import(pathToFileURL(resolve('./browser-ui-filter.js')).href);
        
        console.log('✅ Modules loaded successfully\n');
        
        // Create detector instance and enable debug mode
        const navDetector = new detector.NavigationElementDetector();
        navDetector.enableDebugMode();
        
        console.log('🔧 Environment Debug Info:');
        console.log(`Window dimensions: ${dom.window.innerWidth}x${dom.window.innerHeight}`);
        console.log(`Document URL: ${dom.window.location.href}`);
        console.log('');
        
        console.log('🧪 Testing Browser UI Filter:\n');
        
        // Test each element with browser UI filter
        const testElements = [
            { selector: '.prev-link', expected: 'previous' },
            { selector: '.next-link', expected: 'next' }, 
            { selector: '.prev-chapter', expected: 'previous' },
            { selector: '.next-chapter', expected: 'next' }
        ];
        
        const filter = new browserUI.BrowserUIElementFilter();
        filter.enableDebugMode();
        
        for (const test of testElements) {
            const element = dom.window.document.querySelector(test.selector);
            if (element) {
                console.log(`\n--- BROWSER UI FILTER TEST: ${test.selector} ---`);
                console.log(`Element: <${element.tagName.toLowerCase()} class="${element.className}">${element.textContent}</>`);
                
                const rect = element.getBoundingClientRect();
                console.log(`Element position: ${rect.left},${rect.top} ${rect.width}x${rect.height}`);
                
                const shouldExclude = filter.shouldExcludeElement(element);
                console.log(`Should exclude: ${shouldExclude ? '❌ YES' : '✅ NO'}`);
                
                if (shouldExclude) {
                    const analysis = filter.analyzeElementForDebugging(element);
                    console.log('Exclusion analysis:', analysis);
                }
                
                console.log('---');
            }
        }
        
        console.log('\n🧪 Testing individual elements:\n');
        
        for (const test of testElements) {
            const element = dom.window.document.querySelector(test.selector);
            if (element) {
                console.log(`\n--- TESTING: ${test.selector} ---`);
                console.log(`Element: <${element.tagName.toLowerCase()} class="${element.className}">${element.textContent}</>`);
                
                const text = navDetector.getElementText(element);
                console.log(`Extracted text: "${text}"`);
                
                // Check false positives
                const hasFalsePositive = navDetector.containsFalsePositivePatterns(text.toLowerCase());
                console.log(`False positive check: ${hasFalsePositive ? '❌ BLOCKED' : '✅ PASSED'}`);
                
                // Check navigation direction
                const direction = navDetector.determineNavigationDirection(element, text);
                console.log(`Navigation direction: ${direction || 'NONE'} (expected: ${test.expected})`);
                
                // Check scoring
                if (direction) {
                    const score = navDetector.calculateElementScore(element, text, direction);
                    console.log(`Element score: ${score} (minimum required: ${patterns.SCORING_CONFIG.minimumScore})`);
                    console.log(`Score meets minimum: ${score >= patterns.SCORING_CONFIG.minimumScore ? '✅ YES' : '❌ NO'}`);
                }
                
                console.log('---');
            }
        }
        
        console.log('\n🔍 Running full detection:');
        const result = navDetector.detectNavigationElements();
        
        console.log('\n📊 FINAL RESULTS:');
        console.log('Previous element found:', result.previousPage?.textContent || 'NONE');
        console.log('Next element found:', result.nextPage?.textContent || 'NONE');
        
        // Show detailed scoring breakdown
        console.log('\n📋 SCORING CONFIG:');
        console.log(`Minimum Score: ${patterns.SCORING_CONFIG.minimumScore}`);
        console.log('Browser UI Zones:', patterns.BROWSER_UI_CONFIG.zones);
        
    } catch (error) {
        console.error('❌ Error during debug test:', error);
    }
}

debugNavigationDetection(); 