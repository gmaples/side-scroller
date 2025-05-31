# 🎮 Side Scroller

> Navigate web pages effortlessly using arrow keys with intelligent detection of next/previous page elements

**Side Scroller** is a Chrome extension that automatically detects navigation elements positioned on the far left and right sides of web pages and binds your arrow keys to them for seamless browsing. No more hunting for tiny "Next" and "Previous" buttons!

## ✨ Features

- **🎯 Smart Detection**: Automatically finds navigation elements on the far left (previous) and far right (next) sides of pages
- **⌨️ Safe Key Binding**: Only binds arrow keys when it won't interfere with existing functionality
- **🔄 SPA Support**: Works with single-page applications and dynamically loaded content
- **🛡️ Non-Destructive**: Never interferes with form inputs, text areas, or existing key handlers
- **🎨 Visual Feedback**: Beautiful popup interface with real-time status indicators
- **🔧 Debug Mode**: Comprehensive logging for developers and troubleshooting

## 🚀 Quick Start

### Installation

1. **Download** the extension files
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top-right corner)
4. **Click "Load unpacked"** and select the extension folder
5. **Done!** The extension is now active

### Usage

1. **Visit any webpage** with navigation elements
2. **Watch the extension icon** - it will show binding status
3. **Use arrow keys**:
   - `←` Left Arrow: Go to previous page
   - `→` Right Arrow: Go to next page
4. **Click the extension icon** to see detailed status and controls

## 🧠 How It Works

### Detection Algorithm

Side Scroller uses a sophisticated multi-layered detection system:

**1. Position-Based Detection**
- Scans elements in the far left 15% and far right 15% of the viewport
- Focuses on the middle vertical area (±30% from center)
- Prioritizes elements in optimal navigation zones

**2. Content Analysis**
- **Text Keywords**: "next", "previous", "back", "forward", etc.
- **Arrow Symbols**: →, ←, ▶, ◀, and Unicode variants
- **Semantic Attributes**: `rel="next"`, `rel="prev"`, `aria-label`
- **CSS Classes**: Common navigation class patterns

**3. Intelligent Scoring**
- Combines position, content, and markup quality
- Weights elements based on relevance and accessibility
- Selects the highest-scoring candidates for binding

### Safety Features

- **Conflict Detection**: Checks for existing arrow key handlers
- **Input Protection**: Never binds when focus is in form fields
- **Smart Targeting**: Only activates on likely navigation elements
- **Graceful Fallback**: Falls back to scroll behavior if navigation fails

## 🔧 Advanced Configuration

### Debug Mode

Enable debug mode to see detailed detection information:

1. Open the popup interface
2. Click "Enable Debug Mode"
3. Check the browser console for detailed logs
4. Use "Refresh Detection" to re-scan the page

### Detection Customization

The extension automatically adapts to different page layouts, but you can influence detection by using semantic markup:

```html
<!-- Optimal markup for detection -->
<a href="/prev" rel="prev" aria-label="Previous page">← Previous</a>
<a href="/next" rel="next" aria-label="Next page">Next →</a>
```

## 🎨 Technical Architecture

### Core Classes

- **`NavigationElementDetector`**: Finds and scores navigation elements
- **`KeyBindingManager`**: Safely manages arrow key bindings
- **`SmartNavigationKeyBinder`**: Orchestrates the entire system

### Key Technologies

- **Manifest V3**: Modern Chrome extension architecture
- **Mutation Observers**: Detects dynamic content changes
- **Intersection Observer**: Optimizes element visibility detection
- **Chrome Storage API**: Persists user preferences

## 🧪 Testing

The extension includes a comprehensive test page (`test.html`) that simulates various scenarios:

- Fixed navigation buttons in optimal positions
- Dynamic content loading
- Key conflict simulation
- Real-time status monitoring

## 🐛 Troubleshooting

### Extension Not Working?

1. **Check the popup** - Click the extension icon to see status
2. **Verify page compatibility** - Some sites may not have detectable navigation
3. **Enable debug mode** - Check console for detailed information
4. **Refresh the page** - Try reloading to re-trigger detection

### Arrow Keys Not Responding?

1. **Check for conflicts** - Another script might be handling arrow keys
2. **Click outside form fields** - Extension protects input areas
3. **Verify navigation elements** - Page must have detectable navigation
4. **Try manual refresh** - Use the "Refresh Detection" button

### Common Issues

- **Social Media Sites**: May use complex navigation that's harder to detect
- **Single Page Apps**: Should work, but may need page refresh after navigation
- **Complex Layouts**: Debug mode helps identify detection issues

## 🔒 Privacy & Security

- **No Data Collection**: Extension doesn't collect or transmit any personal data
- **Local Storage Only**: All preferences stored locally in your browser
- **Minimal Permissions**: Only requests necessary permissions for functionality
- **Open Source**: Full source code available for review

## 🛠️ Development

### Project Structure
```
side-scroller/
├── manifest.json          # Extension configuration
├── content.js             # Main detection and binding logic
├── popup.html/js          # User interface
├── test.html              # Development testing page
├── icons/                 # Extension icons
└── docs/                  # Documentation
```

### Building from Source

1. **Clone** the repository
2. **Load** as unpacked extension in Chrome
3. **Test** using the included test page
4. **Debug** with browser developer tools

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to:

- Report bugs and request features
- Submit pull requests
- Improve documentation
- Share feedback and suggestions

## 📞 Support

Having issues? Here's how to get help:

1. **Check the troubleshooting section** above
2. **Enable debug mode** and check console logs
3. **Open an issue** on GitHub with details
4. **Include the test page results** when reporting bugs

---

**Happy browsing with Side Scroller!** 🎮✨ 