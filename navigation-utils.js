/**
 * Side Scroller Extension - Navigation Utilities
 * Helper functions and utilities for navigation detection
 */

import {
    INTELLIGENT_NAVIGATION_PATTERNS,
    FALSE_POSITIVE_PATTERNS,
    CONTENT_PENALTY_PATTERNS,
    SCORING_CONFIG
} from './patterns.js';

/**
 * Navigation Testing and Analysis Utilities
 */
export class NavigationTestingUtils {
    constructor(detector) {
        this.detector = detector;
    }

    /**
     * Test the intelligent navigation detection with specific text samples
     * This method helps debug false positives like "community" on Reddit
     */
    testNavigationDetection(testCases = []) {
        console.log('\n🧪 [Navigation Detector] Testing intelligent navigation detection...\n');
        
        // Default test cases including known Reddit false positives
        const defaultTestCases = [
            // False positives that should be rejected
            { text: 'community', expected: null, context: 'Reddit subreddit link' },
            { text: 'r/community', expected: null, context: 'Reddit subreddit link' },
            { text: 'Join community', expected: null, context: 'Reddit join button' },
            { text: 'more info', expected: null, context: 'Generic info link' },
            { text: 'learn more', expected: null, context: 'Generic learn link' },
            { text: 'read more', expected: null, context: 'Generic read link' },
            { text: 'comments', expected: null, context: 'Reddit comments link' },
            { text: 'share', expected: null, context: 'Social sharing' },
            { text: 'save', expected: null, context: 'Save button' },
            { text: 'upvote', expected: null, context: 'Reddit voting' },
            { text: 'menu', expected: null, context: 'Menu button' },
            { text: 'settings', expected: null, context: 'Settings link' },
            
            // True positives that should be detected
            { text: 'next', expected: 'next', context: 'Simple next button' },
            { text: 'Next Page', expected: 'next', context: 'Explicit next page' },
            { text: 'previous', expected: 'previous', context: 'Simple previous button' },
            { text: 'Previous Page', expected: 'previous', context: 'Explicit previous page' },
            { text: '→', expected: 'next', context: 'Right arrow symbol' },
            { text: '←', expected: 'previous', context: 'Left arrow symbol' },
            { text: 'load more posts', expected: 'next', context: 'Load more content' },
            { text: 'show more posts', expected: 'next', context: 'Show more content' },
            { text: 'newer posts', expected: 'previous', context: 'Temporal navigation' },
            { text: 'older posts', expected: 'next', context: 'Temporal navigation' },
            
            // Webtoon-specific true positives
            { text: 'Next Episode', expected: 'next', context: 'Webtoon next episode navigation' },
            { text: 'Previous Episode', expected: 'previous', context: 'Webtoon previous episode navigation' },
            { text: 'Next Recurrence', expected: 'next', context: 'Webtoon next recurrence navigation' },
            { text: 'Previous Recurrence', expected: 'previous', context: 'Webtoon previous recurrence navigation' },
            { text: 'Episode 3', expected: 'next', context: 'Webtoon episode number' },
            { text: 'Continue Reading', expected: 'next', context: 'Webtoon continue reading' },
            { text: 'Prev Episode', expected: 'previous', context: 'Webtoon abbreviated previous episode' },
            { text: 'Ep 5', expected: 'next', context: 'Webtoon abbreviated episode' },
            
            // Edge cases
            { text: 'more', expected: null, context: 'Generic "more" without context' },
            { text: 'back', expected: 'previous', context: 'Simple back' },
            { text: 'forward', expected: 'next', context: 'Simple forward' },
            { text: '', expected: null, context: 'Empty text' },
            { text: 'This is a very long text that should not be considered navigation because it is too verbose and contains too much information for a simple navigation button', expected: null, context: 'Very long text' }
        ];
        
        const allTestCases = [...defaultTestCases, ...testCases];
        
        let passed = 0;
        let failed = 0;
        
        allTestCases.forEach((testCase, index) => {
            const { text, expected, context } = testCase;
            
            // Create a mock element for testing
            const mockElement = document.createElement('a');
            mockElement.textContent = text;
            
            // Test the detection
            const result = this.detector.determineNavigationDirection(mockElement, text);
            
            const success = result === expected;
            if (success) {
                passed++;
                console.log(`✅ Test ${index + 1}: "${text}" → ${result || 'null'} (${context})`);
            } else {
                failed++;
                console.log(`❌ Test ${index + 1}: "${text}" → Expected: ${expected || 'null'}, Got: ${result || 'null'} (${context})`);
                
                // Additional debugging for failed tests
                const ariaLabel = mockElement.getAttribute('aria-label') || '';
                const title = mockElement.getAttribute('title') || '';
                const fullText = `${text} ${ariaLabel} ${title}`.toLowerCase().trim();
                
                console.log(`   📋 Debug info:`);
                console.log(`      • False positive check: ${this.detector.containsFalsePositivePatterns(fullText)}`);
                
                const nextScore = this.detector.calculatePatternScore(fullText, this.detector.intelligentNavigationPatterns.next);
                const prevScore = this.detector.calculatePatternScore(fullText, this.detector.intelligentNavigationPatterns.previous);
                const penalty = this.detector.calculateContentPenalty(fullText);
                
                console.log(`      • Next score: ${nextScore}, Prev score: ${prevScore}, Penalty: ${penalty}`);
                console.log(`      • Final scores: Next=${nextScore + penalty}, Prev=${prevScore + penalty}`);
            }
        });
        
        console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed out of ${allTestCases.length} tests`);
        console.log(`Success Rate: ${((passed / allTestCases.length) * 100).toFixed(1)}%\n`);
        
        if (failed > 0) {
            console.log('🔧 Consider adjusting the false positive patterns or scoring thresholds based on failed tests.');
        }
        
        return { passed, failed, total: allTestCases.length };
    }

    /**
     * Analyzes an element for debugging purposes, including browser UI filter analysis
     */
    analyzeElementForDebugging(element) {
        const navigationDirection = this.detector.determineNavigationDirection(element, this.detector.getElementText(element));
        const browserUIAnalysis = this.detector.browserUIFilter ? this.detector.browserUIFilter.analyzeElementForDebugging(element) : null;
        
        return {
            element: element,
            elementText: this.detector.getElementText(element),
            navigationDirection: navigationDirection,
            isVisible: this.detector.isElementVisible(element),
            browserUIAnalysis: browserUIAnalysis,
            elementScore: navigationDirection ? this.detector.calculateElementScore(element, this.detector.getElementText(element), navigationDirection) : 0
        };
    }
}

/**
 * Navigation Type Detection Utilities
 */
export class NavigationTypeDetector {
    /**
     * Determines if an element is a lightbox navigation element
     */
    static isLightboxElement(element, elementText) {
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

    /**
     * Determines if an element is a webtoon/episode navigation element
     */
    static isWebtoonNavigationElement(element, elementText) {
        // Check for webtoon-specific indicators
        const webtoonIndicators = [
            // Aria labels
            elementText.includes('episode'),
            elementText.includes('next episode'),
            elementText.includes('previous episode'),
            elementText.includes('recurrence'),
            
            // SVG icons
            elementText.includes('next-arrow'),
            elementText.includes('prev-arrow'),
            elementText.includes('chevron-right'),
            elementText.includes('chevron-left'),
            
            // Element context
            element.closest('[class*="webtoon"]') !== null,
            element.closest('[class*="episode"]') !== null,
            element.closest('[class*="recurrence"]') !== null
        ];
        
        return webtoonIndicators.some(indicator => indicator);
    }
}

/**
 * Text Extraction and Processing Utilities
 */
export class TextExtractionUtils {
    /**
     * Extracts text content and icon information from an element
     */
    static getElementText(element, debugLog = () => {}) {
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
                debugLog(`Found SVG icon: ${iconName}`);
            }
        });
        
        // Also check if the element itself is an SVG
        if (element.tagName === 'SVG' && element.getAttribute('icon-name')) {
            const iconName = element.getAttribute('icon-name');
            textSources.push(iconName);
            debugLog(`Found direct SVG icon: ${iconName}`);
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
        debugLog(`Element text extracted: "${text}" from element: ${element.tagName}.${element.className}`);
        return text;
    }
}

/**
 * Pattern Analysis Utilities
 */
export class PatternAnalysisUtils {
    /**
     * Calculate pattern-based score for navigation content
     */
    static calculatePatternScore(text, patterns, debugLog = () => {}) {
        let totalScore = 0;
        let matchCount = 0;
        
        patterns.forEach(({ pattern, score, context }) => {
            if (pattern.test(text)) {
                totalScore += score;
                matchCount++;
                debugLog(`✅ Pattern match: "${pattern}" (score: +${score}, context: ${context})`);
            }
        });
        
        // Bonus for multiple pattern matches (indicates strong navigation intent)
        if (matchCount > 1) {
            const bonus = matchCount * SCORING_CONFIG.bonuses.multiplePatterns;
            totalScore += bonus;
        }
        
        return totalScore;
    }

    /**
     * Calculate content penalty score
     */
    static calculateContentPenalty(text, contentPenaltyPatterns, debugLog = () => {}) {
        let totalPenalty = 0;
        
        contentPenaltyPatterns.forEach(({ pattern, penalty }) => {
            if (pattern.test(text)) {
                totalPenalty += penalty;
                debugLog(`⚠️ Content penalty: "${pattern}" (score: ${penalty})`);
            }
        });
        
        return totalPenalty;
    }

    /**
     * Check if text contains false positive patterns
     */
    static containsFalsePositivePatterns(text, falsePositivePatterns) {
        return falsePositivePatterns.some(pattern => pattern.test(text));
    }
} 