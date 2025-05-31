# 🏹 Smart Navigation Key Binder

A Chrome extension that intelligently detects page navigation elements and automatically binds arrow keys for enhanced web browsing experience.

## ✨ Features

### 🎯 Core Functionality
- **Automatic Detection**: Scans web pages for navigation elements (Previous/Next buttons, pagination, etc.)
- **Smart Positioning**: Detects elements on far left (Previous) and far right (Next) positioned vertically in the middle
- **Conflict Avoidance**: Only binds keys when they're not already in use by the page
- **Universal Compatibility**: Works on most websites with navigation elements

### 🔍 Detection Capabilities
- **Text-based Navigation**: Detects common keywords like "next", "previous", "back", "forward"
- **Symbol-based Navigation**: Recognizes arrow symbols (←, →, ◀, ▶, etc.)
- **Semantic Attributes**: Understands `rel="next"`, `rel="prev"` attributes
- **CSS Class Recognition**: Identifies navigation through common CSS classes
- **Position-based Detection**: Focuses on elements in optimal navigation positions

### ⚙️ Advanced Features
- **SPA Support**: Automatically reinitializes when detecting URL changes
- **Debug Mode**: Comprehensive logging for troubleshooting
- **Non-destructive**: Never interferes with existing page functionality
- **Intelligent Scoring**: Ranks navigation elements to select the best candidates
- **Visual Status Indicator**: Popup interface shows current binding status

## 🚀 Installation

### Method 1: Load Unpacked Extension (Development)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your browser toolbar

### Method 2: Chrome Web Store (Coming Soon)
*Extension will be published to Chrome Web Store after testing phase*

## 📖 How to Use

### Basic Usage
1. **Install the extension** using one of the methods above
2. **Navigate to any website** with pagination or navigation elements
3. **Look for navigation buttons** positioned on the far left/right sides of the page
4. **Press arrow keys**:
   - `←` (Left Arrow) = Previous page/item
   - `→` (Right Arrow) = Next page/item

### Extension Popup
Click the extension icon to see:
- **Status indicators** for left/right arrow key bindings
- **Refresh button** to re-scan the current page
- **Debug toggle** for detailed console logging
- **Usage information** and current page status

### Testing
Open `test.html` in your browser to:
- Test the extension with various navigation patterns
- See real-time status updates
- Try advanced scenarios like dynamic content and key conflicts

## 🔧 Technical Details

### Architecture

The extension follows a modular, object-oriented design with three main components:

#### 1. NavigationElementDetector
```javascript
class NavigationElementDetector {
    // Handles detection and scoring of navigation elements
    // - Scans DOM for clickable elements
    // - Filters by position and content
    // - Scores candidates for relevance
    // - Selects best navigation elements
}
```

#### 2. KeyBindingManager
```javascript
class KeyBindingManager {
    // Manages arrow key bindings safely
    // - Checks for existing key conflicts
    // - Binds/unbinds keys as needed
    // - Handles event simulation
    // - Prevents interference with form inputs
}
```

#### 3. SmartNavigationKeyBinder
```javascript
class SmartNavigationKeyBinder {
    // Orchestrates the entire process
    // - Initializes detection and binding
    // - Handles page changes and SPA navigation
    // - Manages retry logic and error handling
    // - Provides debug capabilities
}
```

### Detection Algorithm

1. **Viewport Analysis**: Calculates detection zones (far left 15%, far right 15%)
2. **Element Collection**: Gathers all potentially clickable elements
3. **Position Filtering**: Filters elements within middle 60% vertically
4. **Content Analysis**: Examines text, attributes, and CSS classes
5. **Scoring System**: Ranks elements based on multiple factors:
   - Keyword matches (text-based)
   - Semantic attributes (`rel` attributes)
   - CSS class patterns
   - Proximity to ideal position
   - Element size and visibility

### Key Binding Strategy

- **Conflict Detection**: Tests if keys are already handled before binding
- **Event Priority**: Uses capture phase to ensure proper precedence
- **Input Protection**: Automatically disables in form fields and editable content
- **Modifier Key Respect**: Only triggers on plain arrow keys (no Ctrl/Alt/Shift)

### Performance Optimizations

- **Efficient Selectors**: Uses optimized CSS selectors for element collection
- **Caching**: Maintains state to avoid redundant operations
- **Throttled Updates**: Limits reinitializatin frequency for SPA navigation
- **Memory Management**: Proper cleanup of event listeners and state

## 🧪 Testing

### Test Page Features
The included `test.html` provides comprehensive testing scenarios:

#### Primary Tests
- Fixed navigation buttons positioned optimally for detection
- Real-time status monitoring
- Visual feedback for successful key bindings

#### Advanced Tests
- **Dynamic Content**: Add/remove navigation elements
- **Key Conflicts**: Simulate existing key bindings
- **Multiple Candidates**: Test selection logic with competing elements
- **Edge Cases**: Hidden elements, complex HTML structures

#### Debug Information
- Console logging with detailed detection steps
- Performance metrics and timing information
- Element scoring details for fine-tuning

### Manual Testing Checklist
- [ ] Extension detects navigation on popular websites (Reddit, Medium, etc.)
- [ ] Arrow keys work correctly for pagination
- [ ] No interference with existing site functionality
- [ ] Proper behavior on sites without navigation elements
- [ ] SPA navigation detection works correctly
- [ ] Key conflict detection prevents binding issues

## 🛠️ Development

### File Structure
```
Scroller/
├── manifest.json          # Extension configuration
├── content.js            # Main content script
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── test.html            # Comprehensive test page
├── README.md            # This documentation
└── icons/               # Extension icons (optional)
```

### Key Code Patterns

#### Modular Design
- Each class has a single responsibility
- Clean interfaces between components
- Comprehensive error handling and logging

#### Defensive Programming
- Extensive null/undefined checks
- Graceful degradation when features unavailable
- Safe DOM manipulation with existence verification

#### Performance Consciousness
- Minimal DOM queries with efficient selectors
- Event delegation where appropriate
- Proper cleanup to prevent memory leaks

### Extension Debugging

#### Enable Debug Mode
```javascript
// In browser console on any page:
if (window.smartNavigationBinder) {
    window.smartNavigationBinder.enableDebugMode();
}
```

#### Console Commands
```javascript
// Check current status
window.smartNavigationBinder.detector.logDetectionResults();

// Force reinitialize
window.smartNavigationBinder.reinitialize();

// View bound keys
console.log(window.smartNavigationBinder.keyManager.boundKeys);
```

## 🐛 Troubleshooting

### Common Issues

#### Extension Not Working
- **Check Console**: Look for error messages in browser console
- **Verify Installation**: Ensure extension is enabled in `chrome://extensions/`
- **Page Compatibility**: Some sites may not have detectable navigation elements
- **Reload Page**: Try refreshing the page to reinitialize the extension

#### Arrow Keys Not Binding
- **Key Conflicts**: Check if the page already uses arrow keys
- **Navigation Elements**: Verify navigation buttons exist on far left/right
- **Debug Mode**: Enable debug logging to see detection details
- **Manual Refresh**: Use popup refresh button to re-scan the page

#### Popup Not Loading
- **Script Errors**: Check for JavaScript errors in extension console
- **Permission Issues**: Verify extension has access to the current tab
- **Chrome Updates**: Ensure using compatible Chrome version

### Debug Steps
1. **Open test.html** to verify basic functionality
2. **Check browser console** for detailed log messages
3. **Use extension popup** to see current detection status
4. **Enable debug mode** for verbose logging
5. **Try manual refresh** if automatic detection fails

## 🔮 Future Enhancements

### Planned Features
- **Customizable Key Bindings**: Allow users to choose different keys
- **Site-Specific Rules**: Custom detection patterns for specific websites
- **Visual Indicators**: Highlight detected navigation elements
- **Analytics Dashboard**: Usage statistics and detection success rates
- **Keyboard Shortcuts**: Additional navigation shortcuts beyond arrows

### Technical Improvements
- **Machine Learning**: Improve detection accuracy with ML models
- **Performance Monitoring**: Real-time performance metrics
- **Cloud Sync**: Synchronize settings across devices
- **API Integration**: Support for web page APIs that expose navigation

## 📄 License

This project is open source. Feel free to contribute, report issues, or suggest improvements.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with comprehensive tests
4. Submit a pull request with detailed description

### Development Guidelines
- Follow existing code style and patterns
- Include comprehensive JSDoc comments
- Test thoroughly with the included test page
- Ensure no performance regressions
- Update documentation as needed

---

**Made with ❤️ for better web navigation** 