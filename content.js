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
        
        // Enhanced keyword patterns with word boundaries and context
        this.intelligentNavigationPatterns = {
            next: [
                // Exact word matches with word boundaries
                { pattern: /\bnext\b/i, score: 15, context: 'navigation' },
                { pattern: /\bforward\b/i, score: 12, context: 'navigation' },
                { pattern: /\bcontinue\b/i, score: 10, context: 'navigation' },
                { pattern: /\bnewer\b/i, score: 12, context: 'temporal' },
                { pattern: /\bright\b/i, score: 8, context: 'directional' },
                
                // Navigation-specific phrases
                { pattern: /next\s+page/i, score: 20, context: 'navigation' },
                { pattern: /next\s+chapter/i, score: 18, context: 'navigation' },
                { pattern: /next\s+post/i, score: 16, context: 'navigation' },
                { pattern: /more\s+posts/i, score: 14, context: 'navigation' },
                { pattern: /load\s+more/i, score: 14, context: 'navigation' },
                { pattern: /show\s+more/i, score: 12, context: 'navigation' },
                { pattern: /view\s+more/i, score: 12, context: 'navigation' },
                
                // Webtoon and episode-specific patterns
                { pattern: /next\s+episode/i, score: 22, context: 'webtoon' },
                { pattern: /next\s+recurrence/i, score: 20, context: 'webtoon' },
                { pattern: /\bepisode\s+\d+/i, score: 18, context: 'webtoon' },
                { pattern: /episode\s+(\d+)/i, score: 16, context: 'webtoon' },
                { pattern: /\bep\s+\d+/i, score: 15, context: 'webtoon' },
                { pattern: /continue\s+reading/i, score: 14, context: 'webtoon' },
                
                // Arrow symbols and icons (exact match)
                { pattern: /^→$/, score: 18, context: 'symbol' },
                { pattern: /^▶$/, score: 18, context: 'symbol' },
                { pattern: /^►$/, score: 18, context: 'symbol' },
                { pattern: /^>$/, score: 15, context: 'symbol' },
                
                // Icon class patterns
                { pattern: /right-fill/i, score: 16, context: 'icon' },
                { pattern: /arrow-right/i, score: 16, context: 'icon' },
                { pattern: /chevron-right/i, score: 16, context: 'icon' }
            ],
            
            previous: [
                // Exact word matches with word boundaries
                { pattern: /\bprev\b/i, score: 15, context: 'navigation' },
                { pattern: /\bprevious\b/i, score: 15, context: 'navigation' },
                { pattern: /\bback\b/i, score: 12, context: 'navigation' },
                { pattern: /\bolder\b/i, score: 12, context: 'temporal' },
                { pattern: /\bleft\b/i, score: 8, context: 'directional' },
                
                // Navigation-specific phrases
                { pattern: /previous\s+page/i, score: 20, context: 'navigation' },
                { pattern: /previous\s+chapter/i, score: 18, context: 'navigation' },
                { pattern: /previous\s+post/i, score: 16, context: 'navigation' },
                { pattern: /go\s+back/i, score: 14, context: 'navigation' },
                
                // Webtoon and episode-specific patterns
                { pattern: /previous\s+episode/i, score: 22, context: 'webtoon' },
                { pattern: /prev\s+episode/i, score: 20, context: 'webtoon' },
                { pattern: /previous\s+recurrence/i, score: 20, context: 'webtoon' },
                { pattern: /prev\s+recurrence/i, score: 18, context: 'webtoon' },
                { pattern: /back\s+to\s+previous/i, score: 16, context: 'webtoon' },
                
                // Arrow symbols and icons (exact match)
                { pattern: /^←$/, score: 18, context: 'symbol' },
                { pattern: /^◀$/, score: 18, context: 'symbol' },
                { pattern: /^◄$/, score: 18, context: 'symbol' },
                { pattern: /^<$/, score: 15, context: 'symbol' },
                
                // Icon class patterns
                { pattern: /left-fill/i, score: 16, context: 'icon' },
                { pattern: /arrow-left/i, score: 16, context: 'icon' },
                { pattern: /chevron-left/i, score: 16, context: 'icon' }
            ]
        };
        
        // False positive patterns - content that should NOT be considered navigation
        this.falsePositivePatterns = [
            // Social media and community terms
            /\bcommunity\b/i,
            /\bcomments\b/i,
            /\bdiscussion\b/i,
            /\bupvote\b/i,
            /\bdownvote\b/i,
            /\bshare\b/i,
            /\bsave\b/i,
            /\breport\b/i,
            /\bfollow\b/i,
            /\bunfollow\b/i,
            /\bsubscribe\b/i,
            /\bunsubscribe\b/i,
            
            // Reddit-specific creation and community actions
            /\bcreate\s+a\s+community/i,
            /\bcreate\s+community/i,
            /\bcreate\s+post/i,
            /\bjoin\s+community/i,
            /\bleave\s+community/i,
            /\bstart\s+community/i,
            /\bnew\s+community/i,
            
            // Content-related terms that aren't navigation
            /\bmore\s+info/i,
            /\bmore\s+details/i,
            /\bmore\s+about/i,
            /\bmore\s+options/i,
            /\bmore\s+settings/i,
            /\blearn\s+more/i,
            /\bread\s+more/i,
            /\bfind\s+out\s+more/i,
            
            // UI elements that aren't page navigation
            /\bmenu\b/i,
            /\bdropdown\b/i,
            /\bfilter\b/i,
            /\bsort\b/i,
            /\bsearch\b/i,
            /\bprofile\b/i,
            /\bsettings\b/i,
            /\bnotifications\b/i,
            
            // Reddit-specific false positives
            /\br\/\w+/i,        // Subreddit links like r/community
            /\bu\/\w+/i,        // User links like u/username
            /\bcross-?post/i,
            /\bx-post/i,
            
            // Generic content terms
            /\bcategory\b/i,
            /\btag\b/i,
            /\blabel\b/i,
            /\bbadge\b/i,
            /\bstatus\b/i,
            
            // Action terms that aren't navigation
            /\bcreate\b/i,       // Generic create actions
            /\badd\b/i,          // Add actions
            /\bedit\b/i,         // Edit actions
            /\bdelete\b/i,       // Delete actions
            /\bremove\b/i,       // Remove actions
            
            // Long text content (likely not navigation)
            /.{100,}/  // More than 100 characters is probably not a navigation button
        ];
        
        // Content that should be heavily penalized (not filtered completely but scored low)
        this.contentPenaltyPatterns = [
            { pattern: /\bmore\b/i, penalty: -15 }, // Generic "more" without context
            { pattern: /\bless\b/i, penalty: -10 },
            { pattern: /\bother\b/i, penalty: -8 },
            { pattern: /\brelated\b/i, penalty: -8 },
            { pattern: /\bsimilar\b/i, penalty: -8 },
            { pattern: /\badditional\b/i, penalty: -10 },
            { pattern: /\bextra\b/i, penalty: -8 }
        ];
        
        this.detectedNavigationElements = {
            nextPage: null,
            previousPage: null
        };
        
        this.debugMode = false;
        
        // Initialize browser UI filter lazily to avoid initialization order issues
        this._browserUIFilter = null;
    }
    
    /**
     * Lazy initialization of BrowserUIElementFilter to avoid class ordering issues
     */
    get browserUIFilter() {
        if (!this._browserUIFilter) {
            this._browserUIFilter = new BrowserUIElementFilter();
        }
        return this._browserUIFilter;
    }

    /**
     * Main detection method that finds navigation elements based on content analysis and intelligent scoring
     */
    detectNavigationElements() {
        console.log('[Navigation Detector] Starting content-based navigation element detection...');
        
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const middleY = viewportHeight / 2;
        
        // Define minimal zones for position bonuses only (not filtering)
        const leftZone = { x: 0, width: viewportWidth * 0.15 }; 
        const rightZone = { x: viewportWidth * 0.85, width: viewportWidth * 0.15 };
        const verticalTolerance = viewportHeight * 0.3; // Base tolerance for vertical positioning
        
        this.debugLog(`Content-first detection mode - position used only for scoring bonuses`);
        this.debugLog(`Viewport: ${viewportWidth}x${viewportHeight}, Middle Y: ${middleY}`);
        
        // Get all clickable elements
        const clickableElements = this.getAllClickableElements();
        this.debugLog(`Found ${clickableElements.length} clickable elements to analyze`);
        
        // Filter elements by content first, then apply position scoring
        const candidateElements = this.filterElementsByPositionAndContent(
            clickableElements, 
            leftZone, 
            rightZone, 
            middleY, 
            verticalTolerance
        );
        
        this.debugLog(`Content analysis results: ${candidateElements.previous.length} previous candidates, ${candidateElements.next.length} next candidates`);
        
        // Select best candidates based on intelligent scoring
        this.detectedNavigationElements.previousPage = this.selectBestCandidate(candidateElements.previous, 'previous');
        this.detectedNavigationElements.nextPage = this.selectBestCandidate(candidateElements.next, 'next');
        
        this.logDetectionResults();
        
        return this.detectedNavigationElements;
    }

    /**
     * Retrieves all potentially clickable elements from the DOM, excluding browser UI elements
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
        
        // Remove duplicates first
        const uniqueElements = [...new Set(elements)];
        
        // Filter out hidden elements and browser UI elements
        const filteredElements = uniqueElements.filter(el => {
            // First check basic visibility
            if (!this.isElementVisible(el)) {
                return false;
            }
            
            // Then check if it's a browser UI element that should be excluded
            if (this.browserUIFilter.shouldExcludeElement(el)) {
                this.debugLog(`🚫 Excluded browser UI element: ${this.browserUIFilter.getElementDescription(el)}`);
                return false;
            }
            
            return true;
        });
        
        this.debugLog(`Element filtering results: ${elements.length} total → ${uniqueElements.length} unique → ${filteredElements.length} after browser UI filtering`);
        
        return filteredElements;
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
     * Filters elements by their navigation-related content first, then uses position as tiebreaker
     */
    filterElementsByPositionAndContent(elements, leftZone, rightZone, middleY, verticalTolerance) {
        const candidates = { previous: [], next: [] };
        
        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const elementCenterX = rect.left + rect.width / 2;
            const elementCenterY = rect.top + rect.height / 2;
            
            const elementText = this.getElementText(element);
            const navigationDirection = this.determineNavigationDirection(element, elementText);
            
            // Skip elements that aren't navigation at all
            if (!navigationDirection) {
                return;
            }
            
            // Debug navigation elements found
            this.debugLog(`Found ${navigationDirection} element: "${elementText}"`);
            this.debugLog(`Position: X=${elementCenterX.toFixed(1)}, Y=${elementCenterY.toFixed(1)}`);
            
            // Check if element is roughly in the vertical middle area (very generous)
            const expandedVerticalTolerance = verticalTolerance * 2; // Double tolerance - be very generous
            if (Math.abs(elementCenterY - middleY) > expandedVerticalTolerance) {
                this.debugLog(`❌ ${navigationDirection} element filtered out: too far from middle vertically`);
                return;
            }
            
            // Check if this is a special element type (lightbox, webtoon) - these get priority regardless of position
            const isLightboxElement = this.isLightboxElement(element, elementText);
            const isWebtoonElement = this.isWebtoonNavigationElement(element, elementText);
            
            if (isLightboxElement || isWebtoonElement) {
                this.debugLog(`🎯 ${isLightboxElement ? 'Lightbox' : 'Webtoon'} element detected: "${elementText}" - high priority`);
                
                if (navigationDirection === 'previous') {
                    this.debugLog(`✅ Previous ${isLightboxElement ? 'lightbox' : 'webtoon'} element added: "${elementText}"`);
                    candidates.previous.push({
                        element,
                        text: elementText,
                        score: this.calculateElementScore(element, elementText, 'previous') + (isWebtoonElement ? 25 : 20), // Higher bonus
                        rect,
                        centerY: elementCenterY,
                        isSpecialType: true
                    });
                } else if (navigationDirection === 'next') {
                    this.debugLog(`✅ Next ${isLightboxElement ? 'lightbox' : 'webtoon'} element added: "${elementText}"`);
                    candidates.next.push({
                        element,
                        text: elementText,
                        score: this.calculateElementScore(element, elementText, 'next') + (isWebtoonElement ? 25 : 20), // Higher bonus
                        rect,
                        centerY: elementCenterY,
                        isSpecialType: true
                    });
                }
                return;
            }
            
            // For regular navigation elements, add them regardless of position
            // The scoring system will handle quality assessment
            this.debugLog(`✅ ${navigationDirection} element added (content-based): "${elementText}"`);
            
            let positionBonus = 0;
            
            // Give small bonus for traditional positioning, but don't require it
            if (navigationDirection === 'previous' && elementCenterX < window.innerWidth * 0.4) {
                positionBonus = 5; // Small bonus for left-side positioning
                this.debugLog(`  📍 Small left-position bonus: +${positionBonus}`);
            } else if (navigationDirection === 'next' && elementCenterX > window.innerWidth * 0.6) {
                positionBonus = 5; // Small bonus for right-side positioning  
                this.debugLog(`  📍 Small right-position bonus: +${positionBonus}`);
            }
            
            candidates[navigationDirection].push({
                element,
                text: elementText,
                score: this.calculateElementScore(element, elementText, navigationDirection) + positionBonus,
                rect,
                centerY: elementCenterY,
                isSpecialType: false
            });
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
     * Enhanced navigation direction detection with intelligent content analysis
     */
    determineNavigationDirection(element, text) {
        // Check for explicit navigation attributes (highest priority)
        const rel = element.getAttribute('rel');
        if (rel === 'next') return 'next';
        if (rel === 'prev' || rel === 'previous') return 'previous';
        
        // Check for CSS classes that indicate navigation
        const className = element.className.toLowerCase();
        if (className.includes('pagination') || className.includes('pager')) {
            if (className.includes('next') || className.includes('forward')) return 'next';
            if (className.includes('prev') || className.includes('back')) return 'previous';
        }
        
        // More specific class checks
        if (className.includes('next-page') || className.includes('next-btn')) return 'next';
        if (className.includes('prev-page') || className.includes('prev-btn')) return 'previous';
        
        // Enhanced content analysis with false positive detection
        return this.analyzeNavigationContent(element, text);
    }

    /**
     * Intelligent content analysis for navigation detection
     */
    analyzeNavigationContent(element, text) {
        this.debugLog(`🔍 Analyzing navigation content: "${text}"`);
        
        // First check for false positives - immediately exclude if found
        if (this.containsFalsePositivePatterns(text)) {
            this.debugLog(`❌ False positive detected in text: "${text}"`);
            return null;
        }
        
        // Check element attributes for additional context
        const ariaLabel = element.getAttribute('aria-label') || '';
        const title = element.getAttribute('title') || '';
        const fullText = `${text} ${ariaLabel} ${title}`.toLowerCase().trim();
        
        this.debugLog(`🔍 Full analysis text: "${fullText}"`);
        this.debugLog(`🔍 Checking false positives against: "${fullText}"`);
        
        // Debug each false positive pattern
        let falsePositiveFound = false;
        this.falsePositivePatterns.forEach((pattern, index) => {
            if (pattern.test(fullText)) {
                this.debugLog(`🚫 FALSE POSITIVE MATCH #${index + 1}: Pattern ${pattern} matched "${fullText}"`);
                falsePositiveFound = true;
            }
        });
        
        // Check combined text for false positives
        if (this.containsFalsePositivePatterns(fullText)) {
            this.debugLog(`❌ False positive detected in full text: "${fullText}"`);
            return null;
        }
        
        if (falsePositiveFound) {
            this.debugLog(`❌ FALSE POSITIVE DETECTED - Should have been excluded: "${fullText}"`);
            return null;
        }
        
        // Analyze navigation patterns with scoring
        const nextScore = this.calculatePatternScore(fullText, this.intelligentNavigationPatterns.next);
        const prevScore = this.calculatePatternScore(fullText, this.intelligentNavigationPatterns.previous);
        
        // Apply content penalties
        const nextPenalty = this.calculateContentPenalty(fullText);
        const prevPenalty = this.calculateContentPenalty(fullText);
        
        const finalNextScore = nextScore + nextPenalty;
        const finalPrevScore = prevScore + prevPenalty;
        
        this.debugLog(`📊 Navigation analysis for "${text}": next=${finalNextScore}, prev=${finalPrevScore}`);
        this.debugLog(`📊 Score breakdown: nextPatterns=${nextScore}, prevPatterns=${prevScore}, penalties=${nextPenalty}/${prevPenalty}`);
        
        // Require minimum score to be considered navigation
        const minimumScore = 8;
        
        if (finalNextScore >= minimumScore && finalNextScore > finalPrevScore) {
            this.debugLog(`✅ Classified as NEXT navigation (score: ${finalNextScore})`);
            return 'next';
        } else if (finalPrevScore >= minimumScore && finalPrevScore > finalNextScore) {
            this.debugLog(`✅ Classified as PREVIOUS navigation (score: ${finalPrevScore})`);
            return 'previous';
        }
        
        this.debugLog(`❌ Scores too low or ambiguous - NOT navigation (next: ${finalNextScore}, prev: ${finalPrevScore}, min: ${minimumScore})`);
        
        // If scores are too low or too close, it's probably not navigation
        return null;
    }

    /**
     * Check if text contains false positive patterns
     */
    containsFalsePositivePatterns(text) {
        return this.falsePositivePatterns.some(pattern => pattern.test(text));
    }

    /**
     * Calculate pattern-based score for navigation content
     */
    calculatePatternScore(text, patterns) {
        let totalScore = 0;
        let matchCount = 0;
        
        patterns.forEach(({ pattern, score, context }) => {
            if (pattern.test(text)) {
                totalScore += score;
                matchCount++;
                this.debugLog(`✅ Pattern match: "${pattern}" (score: +${score}, context: ${context})`);
            }
        });
        
        // Bonus for multiple pattern matches (indicates strong navigation intent)
        if (matchCount > 1) {
            totalScore += matchCount * 2;
        }
        
        return totalScore;
    }

    /**
     * Calculate content penalty score
     */
    calculateContentPenalty(text) {
        let totalPenalty = 0;
        
        this.contentPenaltyPatterns.forEach(({ pattern, penalty }) => {
            if (pattern.test(text)) {
                totalPenalty += penalty;
                this.debugLog(`⚠️ Content penalty: "${pattern}" (score: ${penalty})`);
            }
        });
        
        return totalPenalty;
    }

    /**
     * Legacy method for backward compatibility - now defers to intelligent analysis
     */
    containsKeywords(text, keywords) {
        // This method is kept for backward compatibility but now defers to intelligent analysis
        // Convert legacy keywords to simple pattern matching for scoring purposes
        return keywords.some(keyword => {
            if (keyword.length === 1) {
                // Single character/symbol - exact match
                return text === keyword;
            } else {
                // Word - use word boundary
                const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
                return pattern.test(text);
            }
        });
    }

    /**
     * Enhanced element scoring using intelligent content analysis
     */
    calculateElementScore(element, text, direction) {
        let score = 0;
        
        // Get element attributes for comprehensive analysis
        const ariaLabel = element.getAttribute('aria-label') || '';
        const title = element.getAttribute('title') || '';
        const fullText = `${text} ${ariaLabel} ${title}`.toLowerCase().trim();
        
        // First, check for false positives - heavily penalize
        if (this.containsFalsePositivePatterns(fullText)) {
            this.debugLog(`🚫 False positive penalty applied to: "${text}"`);
            return -50; // Heavy penalty to exclude false positives
        }
        
        // Apply intelligent pattern scoring
        const patterns = direction === 'next' ? this.intelligentNavigationPatterns.next : this.intelligentNavigationPatterns.previous;
        const patternScore = this.calculatePatternScore(fullText, patterns);
        score += patternScore;
        
        // Apply content penalties
        const contentPenalty = this.calculateContentPenalty(fullText);
        score += contentPenalty;
        
        // Bonus for explicit navigation attributes (highest reliability)
        const rel = element.getAttribute('rel');
        if (rel === direction || (rel === 'prev' && direction === 'previous')) {
            score += 25;
            this.debugLog(`✅ Navigation attribute bonus: rel="${rel}" (+25)`);
        }
        
        // Bonus for navigation-specific classes
        const className = element.className.toLowerCase();
        if (className.includes('pagination') || className.includes('pager')) {
            score += 20;
            this.debugLog(`✅ Pagination class bonus (+20)`);
        }
        if (className.includes(direction) || className.includes('nav')) {
            score += 15;
            this.debugLog(`✅ Navigation class bonus (+15)`);
        }
        
        // Position relevance scoring
        const viewportHeight = window.innerHeight;
        const middleY = viewportHeight / 2;
        const rect = element.getBoundingClientRect();
        const elementCenterY = rect.top + rect.height / 2;
        const distanceFromMiddle = Math.abs(elementCenterY - middleY);
        const maxDistance = viewportHeight * 0.3;
        const proximityScore = Math.max(0, 12 * (1 - distanceFromMiddle / maxDistance));
        score += proximityScore;
        
        // Size and visibility considerations
        const elementArea = rect.width * rect.height;
        if (elementArea < 16) {
            score -= 5; // Too small, might be decorative
            this.debugLog(`⚠️ Small element penalty (-5)`);
        } else if (elementArea > 10000) {
            score -= 8; // Too large, probably not a simple navigation button
            this.debugLog(`⚠️ Large element penalty (-8)`);
        }
        
        // Text length considerations for refined scoring
        if (text.length === 0) {
            score -= 5; // No text content
            this.debugLog(`⚠️ No text content penalty (-5)`);
        } else if (text.length === 1) {
            // Single character - likely a symbol, good for navigation
            score += 5;
            this.debugLog(`✅ Single character bonus (+5)`);
        } else if (text.length > 75) {
            score -= 15; // Too verbose for navigation
            this.debugLog(`⚠️ Verbose text penalty (-15)`);
        }
        
        // Element type bonuses
        const tagName = element.tagName.toLowerCase();
        if (tagName === 'a') {
            score += 5; // Links are natural navigation elements
        } else if (tagName === 'button') {
            score += 3; // Buttons are also good navigation elements
        }
        
        this.debugLog(`📊 Element score for "${text}": ${score} (patterns: ${patternScore}, penalty: ${contentPenalty}, proximity: ${proximityScore.toFixed(1)})`);
        
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
     * Logs detected navigation elements and their details
     */
    logDetectionResults() {
        console.log('[Navigation Detector] Detection Results:');
        console.log('Previous page element:', this.detectedNavigationElements.previousPage);
        console.log('Next page element:', this.detectedNavigationElements.nextPage);
        
        if (this.detectedNavigationElements.previousPage) {
            console.log('Previous element details:', {
                tag: this.detectedNavigationElements.previousPage.tagName,
                text: this.getElementText(this.detectedNavigationElements.previousPage),
                className: this.detectedNavigationElements.previousPage.className
            });
        }
        
        if (this.detectedNavigationElements.nextPage) {
            console.log('Next element details:', {
                tag: this.detectedNavigationElements.nextPage.tagName,
                text: this.getElementText(this.detectedNavigationElements.nextPage),
                className: this.detectedNavigationElements.nextPage.className
            });
        }
    }

    /**
     * Enables debug mode for detailed logging including browser UI filtering
     */
    enableDebugMode() {
        this.debugMode = true;
        this.browserUIFilter.enableDebugMode();
        this.debugLog('Debug mode enabled for NavigationElementDetector and BrowserUIElementFilter');
    }

    /**
     * Disables debug mode
     */
    disableDebugMode() {
        this.debugMode = false;
        this.browserUIFilter.disableDebugMode();
        this.debugLog('Debug mode disabled');
    }

    /**
     * Debug logging with browser UI filter information
     */
    debugLog(message) {
        if (this.debugMode) {
            console.log(`[Navigation Detector] ${message}`);
        }
    }

    /**
     * Analyzes an element for debugging purposes, including browser UI filter analysis
     */
    analyzeElementForDebugging(element) {
        const navigationDirection = this.determineNavigationDirection(element, this.getElementText(element));
        const browserUIAnalysis = this.browserUIFilter.analyzeElementForDebugging(element);
        
        return {
            element: element,
            elementText: this.getElementText(element),
            navigationDirection: navigationDirection,
            isVisible: this.isElementVisible(element),
            browserUIAnalysis: browserUIAnalysis,
            elementScore: navigationDirection ? this.calculateElementScore(element, this.getElementText(element), navigationDirection) : 0
        };
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
            const result = this.determineNavigationDirection(mockElement, text);
            
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
                console.log(`      • False positive check: ${this.containsFalsePositivePatterns(fullText)}`);
                
                const nextScore = this.calculatePatternScore(fullText, this.intelligentNavigationPatterns.next);
                const prevScore = this.calculatePatternScore(fullText, this.intelligentNavigationPatterns.previous);
                const penalty = this.calculateContentPenalty(fullText);
                
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

    /**
     * Determines if an element is a webtoon/episode navigation element
     */
    isWebtoonNavigationElement(element, elementText) {
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

    /**
     * Enables debug mode for verbose logging across all components
     */
    enableDebugMode() {
        this.debugMode = true;
        this.detector.enableDebugMode();
        this.keyManager.debugMode = true;
        this.trainingMode.debugMode = true;
        console.log('[Side Scroller] Debug mode enabled for all components');
    }

    /**
     * Disables debug mode across all components
     */
    disableDebugMode() {
        this.debugMode = false;
        this.detector.disableDebugMode();
        this.keyManager.debugMode = false;
        this.trainingMode.debugMode = false;
        console.log('[Side Scroller] Debug mode disabled for all components');
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
            smartNavigationBinder.disableDebugMode();
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
        return await smartNavigationBinder.trainingMode.clearTrainingData();
    }
    return null;
}

/**
 * Test navigation detection with intelligent content analysis
 * Call this from console: testNavigationDetection()
 */
function testNavigationDetection(customTestCases = []) {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        return smartNavigationBinder.detector.testNavigationDetection(customTestCases);
    } else {
        console.log('❌ Side Scroller extension not initialized');
        return null;
    }
}

/**
 * Analyze a specific element on the page for navigation detection
 * Usage: analyzeElement(document.querySelector('a[href*="community"]'))
 */
function analyzeElement(element) {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        if (!element) {
            console.log('❌ No element provided');
            return null;
        }
        
        const detector = smartNavigationBinder.detector;
        const elementText = detector.getElementText(element);
        const direction = detector.determineNavigationDirection(element, elementText);
        const score = direction ? detector.calculateElementScore(element, elementText, direction) : 0;
        const browserUIAnalysis = detector.browserUIFilter.shouldExcludeElement(element);
        
        console.log('\n🔍 Element Analysis:');
        console.log('Element:', element);
        console.log('Text:', elementText);
        console.log('Navigation Direction:', direction || 'none');
        console.log('Score:', score);
        console.log('Browser UI Excluded:', browserUIAnalysis);
        console.log('False Positive Check:', detector.containsFalsePositivePatterns(elementText.toLowerCase()));
        
        return {
            element,
            text: elementText,
            direction,
            score,
            browserUIExcluded: browserUIAnalysis,
            isFalsePositive: detector.containsFalsePositivePatterns(elementText.toLowerCase())
        };
    } else {
        console.log('❌ Side Scroller extension not initialized');
        return null;
    }
}

/**
 * Quick test of false positive detection
 * Call this from console: testFalsePositives()
 */
function testFalsePositives() {
    if (typeof smartNavigationBinder !== 'undefined' && smartNavigationBinder) {
        const detector = smartNavigationBinder.detector;
        
        console.log('\n🧪 Testing False Positive Detection:');
        
        const testTexts = [
            'community',
            'create a community', 
            'r/community',
            'join community',
            'comments',
            'share',
            'upvote',
            'next',
            'previous',
            'next page'
        ];
        
        testTexts.forEach(text => {
            const isFalsePositive = detector.containsFalsePositivePatterns(text.toLowerCase());
            const result = isFalsePositive ? '❌ BLOCKED' : '✅ ALLOWED';
            console.log(`${result} "${text}"`);
        });
        
        return true;
    } else {
        console.log('❌ Side Scroller extension not initialized');
        return null;
    }
}

console.log('[Side Scroller] Content script loaded successfully');
console.log('[Side Scroller] 🧠 Intelligent Content Analysis enabled - filters false positives like "community" on Reddit');
console.log('[Side Scroller] 🧪 Test detection: Type "testNavigationDetection()" in console');
console.log('[Side Scroller] 🔍 Analyze elements: Type "analyzeElement(element)" in console');
console.log('[Side Scroller] 🚫 Test false positives: Type "testFalsePositives()" in console');

/**
 * Browser UI Element Filter
 * Filters out browser UI elements, extension elements, and other non-page navigation elements
 * to prevent conflicts with browser controls
 */
class BrowserUIElementFilter {
    constructor() {
        this.debugMode = false;
        
        // Browser UI zone definitions (top browser bar, sides, etc.)
        this.browserUIZones = {
            topBarHeight: 100, // Top browser bar and tabs area
            bottomBarHeight: 50, // Bottom browser bar (if any)
            sideMargin: 5, // Far left/right edges where browser controls might appear
            minDistanceFromTopForWebContent: 120 // Minimum distance from top for valid web content
        };
        
        // Known browser UI selectors and patterns
        this.browserUISelectors = [
            // Chrome/Chromium browser UI
            '[class*="chrome-"]',
            '[id*="chrome-"]',
            '[class*="browser-"]',
            '[id*="browser-"]',
            
            // Extension UI elements
            '[class*="extension-"]',
            '[id*="extension-"]',
            '[class*="crx-"]',
            '[id*="crx-"]',
            
            // Browser navigation specific
            '[class*="navigation-bar"]',
            '[class*="nav-bar"]',
            '[class*="toolbar"]',
            '[id*="toolbar"]',
            
            // Browser back/forward specific
            '[aria-label*="Back"]',
            '[aria-label*="Forward"]',
            '[title*="Back"]',
            '[title*="Forward"]',
            '[alt*="Back"]',
            '[alt*="Forward"]',
            
            // PDF viewer controls
            '[class*="pdf-viewer"]',
            '[id*="pdf-viewer"]',
            '#viewerContainer',
            '.toolbar'
        ];
        
        // Known browser internal URLs and contexts
        this.browserInternalURLPatterns = [
            'chrome://',
            'chrome-extension://',
            'moz-extension://',
            'safari-extension://',
            'edge://',
            'about:',
            'view-source:',
            'data:',
            'javascript:',
            'blob:'
        ];
        
        // Size constraints for valid navigation elements
        this.validElementSizeConstraints = {
            minWidth: 8,
            minHeight: 8,
            maxWidth: 500, // Unusually large elements are often not navigation
            maxHeight: 200,
            minClickableArea: 64 // Minimum area for a reasonable click target
        };
        
        // Z-index thresholds (browser UI often has very high z-index)
        this.suspiciousZIndexThreshold = 2147483647; // Max z-index often used by browser UI
        this.highZIndexThreshold = 999999; // Very high z-index threshold
    }

    /**
     * Main filter method to determine if an element should be excluded as browser UI
     */
    shouldExcludeElement(element) {
        const exclusionReasons = [];
        
        // Check browser internal URL context
        if (this.isInBrowserInternalContext()) {
            exclusionReasons.push('browser-internal-context');
        }
        
        // Check position-based exclusions
        const positionExclusion = this.checkPositionBasedExclusions(element);
        if (positionExclusion) {
            exclusionReasons.push(positionExclusion);
        }
        
        // Check selector-based exclusions
        const selectorExclusion = this.checkSelectorBasedExclusions(element);
        if (selectorExclusion) {
            exclusionReasons.push(selectorExclusion);
        }
        
        // Check container-based exclusions
        const containerExclusion = this.checkContainerBasedExclusions(element);
        if (containerExclusion) {
            exclusionReasons.push(containerExclusion);
        }
        
        // Check size-based exclusions
        const sizeExclusion = this.checkSizeBasedExclusions(element);
        if (sizeExclusion) {
            exclusionReasons.push(sizeExclusion);
        }
        
        // Check z-index exclusions
        const zIndexExclusion = this.checkZIndexExclusions(element);
        if (zIndexExclusion) {
            exclusionReasons.push(zIndexExclusion);
        }
        
        // Check browser navigation specific exclusions
        const browserNavExclusion = this.checkBrowserNavigationExclusions(element);
        if (browserNavExclusion) {
            exclusionReasons.push(browserNavExclusion);
        }
        
        if (exclusionReasons.length > 0) {
            this.debugLog(`🚫 Excluding element - Reasons: ${exclusionReasons.join(', ')} - Element: ${this.getElementDescription(element)}`);
            return true;
        }
        
        return false;
    }

    /**
     * Check if current page is in a browser internal context
     */
    isInBrowserInternalContext() {
        const currentURL = window.location.href;
        return this.browserInternalURLPatterns.some(pattern => 
            currentURL.startsWith(pattern)
        );
    }

    /**
     * Check position-based exclusions (top browser bar area, extreme edges)
     */
    checkPositionBasedExclusions(element) {
        const rect = element.getBoundingClientRect();
        const elementCenterY = rect.top + rect.height / 2;
        const elementCenterX = rect.left + rect.width / 2;
        
        // Check if element is in top browser UI zone
        if (elementCenterY < this.browserUIZones.minDistanceFromTopForWebContent) {
            return 'top-browser-ui-zone';
        }
        
        // Check if element is in extreme left/right edges (potential browser UI)
        if (elementCenterX < this.browserUIZones.sideMargin || 
            elementCenterX > window.innerWidth - this.browserUIZones.sideMargin) {
            return 'extreme-edge-position';
        }
        
        // Check if element is positioned outside viewport (could be browser UI)
        if (rect.top < 0 || rect.left < -50 || 
            rect.right > window.innerWidth + 50 || 
            rect.bottom > window.innerHeight + 50) {
            return 'outside-viewport-bounds';
        }
        
        return null;
    }

    /**
     * Check selector-based exclusions (known browser UI patterns)
     */
    checkSelectorBasedExclusions(element) {
        // Check direct selector matches
        for (const selector of this.browserUISelectors) {
            try {
                if (element.matches(selector)) {
                    return `matches-browser-ui-selector: ${selector}`;
                }
            } catch (e) {
                // Invalid selector, skip
                continue;
            }
        }
        
        // Check element attributes for browser UI patterns
        const attributesToCheck = ['class', 'id', 'data-testid', 'data-component'];
        for (const attr of attributesToCheck) {
            const value = element.getAttribute(attr);
            if (value) {
                const lowerValue = value.toLowerCase();
                if (lowerValue.includes('browser') || 
                    lowerValue.includes('chrome') || 
                    lowerValue.includes('toolbar') ||
                    lowerValue.includes('extension')) {
                    return `browser-ui-attribute: ${attr}="${value}"`;
                }
            }
        }
        
        return null;
    }

    /**
     * Check container-based exclusions (elements inside browser UI containers)
     */
    checkContainerBasedExclusions(element) {
        let currentElement = element.parentElement;
        let depth = 0;
        const maxDepth = 10; // Prevent infinite loops
        
        while (currentElement && depth < maxDepth) {
            // Check if parent matches browser UI selectors
            for (const selector of this.browserUISelectors) {
                try {
                    if (currentElement.matches(selector)) {
                        return `inside-browser-ui-container: ${selector}`;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            // Check parent attributes
            const parentClass = currentElement.className;
            const parentId = currentElement.id;
            
            if (typeof parentClass === 'string') {
                const lowerClass = parentClass.toLowerCase();
                if (lowerClass.includes('browser') || 
                    lowerClass.includes('chrome') || 
                    lowerClass.includes('toolbar') ||
                    lowerClass.includes('extension')) {
                    return `inside-browser-ui-parent: class="${parentClass}"`;
                }
            }
            
            if (typeof parentId === 'string') {
                const lowerId = parentId.toLowerCase();
                if (lowerId.includes('browser') || 
                    lowerId.includes('chrome') || 
                    lowerId.includes('toolbar') ||
                    lowerId.includes('extension')) {
                    return `inside-browser-ui-parent: id="${parentId}"`;
                }
            }
            
            currentElement = currentElement.parentElement;
            depth++;
        }
        
        return null;
    }

    /**
     * Check size-based exclusions (unusually sized elements)
     */
    checkSizeBasedExclusions(element) {
        const rect = element.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const area = width * height;
        
        // Check minimum size constraints
        if (width < this.validElementSizeConstraints.minWidth || 
            height < this.validElementSizeConstraints.minHeight) {
            return `too-small: ${width}x${height}`;
        }
        
        // Check maximum size constraints
        if (width > this.validElementSizeConstraints.maxWidth || 
            height > this.validElementSizeConstraints.maxHeight) {
            return `too-large: ${width}x${height}`;
        }
        
        // Check minimum clickable area
        if (area < this.validElementSizeConstraints.minClickableArea) {
            return `insufficient-click-area: ${area}px²`;
        }
        
        return null;
    }

    /**
     * Check z-index exclusions (browser UI often has very high z-index)
     */
    checkZIndexExclusions(element) {
        const style = window.getComputedStyle(element);
        const zIndex = parseInt(style.zIndex);
        
        if (!isNaN(zIndex)) {
            if (zIndex >= this.suspiciousZIndexThreshold) {
                return `suspicious-z-index: ${zIndex}`;
            }
            
            if (zIndex >= this.highZIndexThreshold) {
                return `high-z-index: ${zIndex}`;
            }
        }
        
        return null;
    }

    /**
     * Check browser navigation specific exclusions (back/forward buttons)
     */
    checkBrowserNavigationExclusions(element) {
        const textContent = element.textContent?.toLowerCase() || '';
        const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
        const title = element.getAttribute('title')?.toLowerCase() || '';
        const alt = element.getAttribute('alt')?.toLowerCase() || '';
        
        const allText = `${textContent} ${ariaLabel} ${title} ${alt}`;
        
        // Check for specific browser navigation terms
        const browserNavTerms = [
            'back to previous page',
            'forward to next page',
            'browser back',
            'browser forward',
            'go back',
            'go forward',
            'navigate back',
            'navigate forward'
        ];
        
        for (const term of browserNavTerms) {
            if (allText.includes(term)) {
                return `browser-navigation-term: ${term}`;
            }
        }
        
        // Check for browser-specific keyboard shortcuts in titles/labels
        if (allText.includes('ctrl+') || allText.includes('cmd+') || 
            allText.includes('alt+') || allText.includes('⌘+')) {
            return 'browser-keyboard-shortcut';
        }
        
        return null;
    }

    /**
     * Get a descriptive string for an element (for debugging)
     */
    getElementDescription(element) {
        const tag = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const className = element.className ? `.${element.className.replace(/\s+/g, '.')}` : '';
        const text = element.textContent?.trim().substring(0, 50) || '';
        
        return `${tag}${id}${className} "${text}"`;
    }

    /**
     * Enable debug mode for detailed logging
     */
    enableDebugMode() {
        this.debugMode = true;
    }

    /**
     * Disable debug mode
     */
    disableDebugMode() {
        this.debugMode = false;
    }

    /**
     * Debug logging method
     */
    debugLog(message) {
        if (this.debugMode) {
            console.log(`[BrowserUIFilter] ${message}`);
        }
    }

    /**
     * Test all filter methods on an element and return detailed results
     */
    analyzeElementForDebugging(element) {
        return {
            shouldExclude: this.shouldExcludeElement(element),
            positionCheck: this.checkPositionBasedExclusions(element),
            selectorCheck: this.checkSelectorBasedExclusions(element),
            containerCheck: this.checkContainerBasedExclusions(element),
            sizeCheck: this.checkSizeBasedExclusions(element),
            zIndexCheck: this.checkZIndexExclusions(element),
            browserNavCheck: this.checkBrowserNavigationExclusions(element),
            elementDescription: this.getElementDescription(element)
        };
    }
} 