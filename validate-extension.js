#!/usr/bin/env node

/**
 * Chrome Extension Validation Script
 * Validates the structure and content of the Smart Navigation Key Binder extension
 */

const fs = require('fs');
const path = require('path');

class ExtensionValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.requiredFiles = [
            'manifest.json',
            'content.js',
            'popup.html',
            'popup.js',
            'README.md',
            'test.html'
        ];
    }

    /**
     * Main validation method
     */
    validate() {
        console.log('🔍 Validating Chrome Extension Structure...\n');
        
        this.checkRequiredFiles();
        this.validateManifest();
        this.validateContentScript();
        this.validatePopup();
        this.validateTestPage();
        
        this.printResults();
        
        return this.errors.length === 0;
    }

    /**
     * Check if all required files exist
     */
    checkRequiredFiles() {
        console.log('📁 Checking required files...');
        
        this.requiredFiles.forEach(file => {
            if (fs.existsSync(file)) {
                console.log(`   ✅ ${file} exists`);
            } else {
                this.errors.push(`Missing required file: ${file}`);
                console.log(`   ❌ ${file} missing`);
            }
        });
        
        console.log();
    }

    /**
     * Validate manifest.json
     */
    validateManifest() {
        console.log('📋 Validating manifest.json...');
        
        if (!fs.existsSync('manifest.json')) {
            this.errors.push('manifest.json is missing');
            return;
        }
        
        try {
            const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
            
            // Check required fields
            const requiredFields = ['manifest_version', 'name', 'version', 'content_scripts'];
            requiredFields.forEach(field => {
                if (!manifest[field]) {
                    this.errors.push(`Missing required field in manifest: ${field}`);
                } else {
                    console.log(`   ✅ ${field} present`);
                }
            });
            
            // Check manifest version
            if (manifest.manifest_version !== 3) {
                this.warnings.push('Consider using Manifest V3 for better compatibility');
            }
            
            // Check content script configuration
            if (manifest.content_scripts && manifest.content_scripts.length > 0) {
                const contentScript = manifest.content_scripts[0];
                if (!contentScript.js || !contentScript.js.includes('content.js')) {
                    this.errors.push('content.js not properly configured in manifest');
                } else {
                    console.log('   ✅ content.js properly configured');
                }
            }
            
        } catch (error) {
            this.errors.push(`Invalid JSON in manifest.json: ${error.message}`);
        }
        
        console.log();
    }

    /**
     * Validate content script
     */
    validateContentScript() {
        console.log('🔧 Validating content.js...');
        
        if (!fs.existsSync('content.js')) return;
        
        const content = fs.readFileSync('content.js', 'utf8');
        
        // Check for required classes
        const requiredClasses = [
            'NavigationElementDetector',
            'KeyBindingManager',
            'SmartNavigationKeyBinder'
        ];
        
        requiredClasses.forEach(className => {
            if (content.includes(`class ${className}`)) {
                console.log(`   ✅ ${className} class found`);
            } else {
                this.errors.push(`Missing required class: ${className}`);
            }
        });
        
        // Check for message handling
        if (content.includes('chrome.runtime.onMessage.addListener')) {
            console.log('   ✅ Message handling implemented');
        } else {
            this.warnings.push('Message handling might be missing in content script');
        }
        
        // Check for proper initialization
        if (content.includes('initializeSmartNavigation')) {
            console.log('   ✅ Initialization function found');
        } else {
            this.errors.push('Missing initialization function');
        }
        
        console.log();
    }

    /**
     * Validate popup files
     */
    validatePopup() {
        console.log('🎨 Validating popup files...');
        
        // Check popup.html
        if (fs.existsSync('popup.html')) {
            const html = fs.readFileSync('popup.html', 'utf8');
            
            if (html.includes('<!DOCTYPE html>')) {
                console.log('   ✅ popup.html has proper DOCTYPE');
            } else {
                this.warnings.push('popup.html missing DOCTYPE declaration');
            }
            
            if (html.includes('popup.js')) {
                console.log('   ✅ popup.html references popup.js');
            } else {
                this.errors.push('popup.html does not reference popup.js');
            }
        }
        
        // Check popup.js
        if (fs.existsSync('popup.js')) {
            const js = fs.readFileSync('popup.js', 'utf8');
            
            if (js.includes('PopupController')) {
                console.log('   ✅ PopupController class found');
            } else {
                this.errors.push('Missing PopupController class in popup.js');
            }
            
            if (js.includes('chrome.tabs.sendMessage')) {
                console.log('   ✅ Message communication implemented');
            } else {
                this.warnings.push('Message communication might be missing');
            }
        }
        
        console.log();
    }

    /**
     * Validate test page
     */
    validateTestPage() {
        console.log('🧪 Validating test.html...');
        
        if (!fs.existsSync('test.html')) return;
        
        const html = fs.readFileSync('test.html', 'utf8');
        
        // Check for test navigation elements
        if (html.includes('nav-previous') && html.includes('nav-next')) {
            console.log('   ✅ Test navigation elements present');
        } else {
            this.warnings.push('Test navigation elements might be missing');
        }
        
        // Check for test functions
        const testFunctions = ['simulateNavigation', 'addDynamicNavigation', 'testKeyConflict'];
        testFunctions.forEach(func => {
            if (html.includes(func)) {
                console.log(`   ✅ ${func} test function found`);
            } else {
                this.warnings.push(`Test function ${func} might be missing`);
            }
        });
        
        console.log();
    }

    /**
     * Print validation results
     */
    printResults() {
        console.log('📊 Validation Results:');
        console.log('='.repeat(50));
        
        if (this.errors.length === 0) {
            console.log('✅ All critical validations passed!');
        } else {
            console.log(`❌ Found ${this.errors.length} error(s):`);
            this.errors.forEach(error => console.log(`   • ${error}`));
        }
        
        if (this.warnings.length > 0) {
            console.log(`\n⚠️  Found ${this.warnings.length} warning(s):`);
            this.warnings.forEach(warning => console.log(`   • ${warning}`));
        }
        
        console.log('\n' + '='.repeat(50));
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('🎉 Extension is ready for installation and testing!');
        } else if (this.errors.length === 0) {
            console.log('✅ Extension should work, but check warnings for improvements');
        } else {
            console.log('❌ Extension has critical issues that need to be fixed');
        }
    }
}

// Run validation if script is executed directly
if (require.main === module) {
    const validator = new ExtensionValidator();
    const isValid = validator.validate();
    process.exit(isValid ? 0 : 1);
}

module.exports = ExtensionValidator; 