# 🧠 Logic Builder Coach - Chrome Extension

A powerful Chrome extension that helps beginner coders develop logical thinking skills when solving coding problems on platforms like LeetCode, GeeksforGeeks, and HackerRank.

## ✨ Features

- **🔍 Automatic Problem Detection**: Detects coding problems on supported platforms
- **🧠 AI-Powered Logic Analysis**: Breaks down problems into digestible logical steps
- **📝 Step-by-Step Guidance**: Provides structured approach to problem-solving
- **⚠️ Common Mistakes Warnings**: Highlights typical beginner pitfalls
- **💡 Quick Hints**: Offers contextual hints without spoiling solutions
- **📚 Problem History**: Tracks analyzed problems for review
- **🎨 Beautiful UI**: Modern, responsive interface with smooth animations
- **🌙 Dark Mode Support**: Adapts to system preferences

## 🌐 Supported Platforms

- LeetCode (leetcode.com)
- GeeksforGeeks (geeksforgeeks.org) 
- HackerRank (hackerrank.com)
- Codeforces (codeforces.com)
- CodeChef (codechef.com)

## 🚀 Installation

### Method 1: Load Unpacked Extension (Development)

1. **Clone or Download** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top right
4. **Click "Load unpacked"** and select the folder containing the extension files
5. **Pin the extension** by clicking the puzzle piece icon and pinning Logic Builder Coach

### Method 2: Chrome Web Store (Coming Soon)
The extension will be available on the Chrome Web Store once approved.

## ⚙️ Setup

### Basic Usage (No API Key Required)
The extension works out of the box with built-in logic templates and analysis patterns. Simply:
1. Navigate to any supported coding platform
2. Open a problem page
3. Look for the floating 🧠 button or click the extension icon
4. Click "Analyze Problem Logic"

### Enhanced Features (API Key Required)
For AI-powered personalized analysis:

1. **Get an OpenRouter API Key**:
   - Visit [OpenRouter.ai](https://openrouter.ai)
   - Sign up for an account
   - Generate an API key

2. **Configure the Extension**:
   - Click the Logic Builder Coach extension icon
   - Scroll to Settings section
   - Enter your OpenRouter API key
   - Click "Save"

## 🎯 How It Works

### 1. Problem Detection
The extension automatically detects coding problems using various selectors for each platform:
- **LeetCode**: Detects problem title and description
- **GeeksforGeeks**: Extracts problem content from their layout
- **HackerRank**: Identifies challenge pages
- And more...

### 2. Logic Analysis
When you click "Analyze Problem Logic", the extension:
- Extracts the problem details
- Generates a structured breakdown including:
  - **Input/Output Format Analysis**
  - **Edge Cases & Constraints**  
  - **Step-by-Step Logical Plan**
  - **Common Mistakes to Avoid**

### 3. Interactive Learning
- **Collapsible sections** for focused learning
- **Quick hints** for when you're stuck
- **Code templates** in multiple languages
- **Similar problems** suggestions

## 📁 File Structure

```
logic-builder-coach/
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── contentScript.js       # Problem detection logic
├── popup.html            # Extension popup interface  
├── popup.js              # Popup functionality
├── logicAssistant.js     # AI API integration
├── styles.css            # Extension styling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## 🛠️ Development

### Prerequisites
- Chrome browser (version 88+)
- Basic knowledge of HTML/CSS/JavaScript
- OpenRouter API key (optional, for AI features)

### Local Development
1. Make changes to any files
2. Go to `chrome://extensions/`
3. Click the refresh button on the Logic Builder Coach extension
4. Test your changes

### Adding New Platforms
To add support for a new coding platform:

1. **Update manifest.json**:
   ```json
   "host_permissions": [
     "https://newplatform.com/*"
   ],
   "content_scripts": [{
     "matches": ["https://newplatform.com/problems/*"]
   }]
   ```

2. **Add detection logic in contentScript.js**:
   ```javascript
   extractNewPlatformProblem() {
     const titleElement = document.querySelector('.problem-title');
     const descriptionElement = document.querySelector('.problem-description');
     // ... extraction logic
   }
   ```

3. **Update the detectSite() method** to recognize the new platform

### Customizing Analysis
You can customize the AI analysis by modifying the prompts in `logicAssistant.js`:

```javascript
getSystemPrompt() {
  return `Your custom system prompt here...`;
}
```

## 🎨 Customization

### Themes
The extension supports both light and dark themes, automatically adapting to your system preferences.

### Settings
Available settings in the popup:
- **Auto-detect problems**: Automatically detect problems on page load
- **Show beginner hints**: Display helpful tips for beginners
- **API Key**: Your OpenRouter API key for enhanced features

## 🐛 Troubleshooting

### Common Issues

**Extension not detecting problems:**
- Ensure you're on a supported platform
- Check that the URL matches the expected pattern
- Try refreshing the page

**AI analysis not working:**
- Verify your OpenRouter API key is correct
- Check your internet connection
- Look at browser console for error messages

**Floating button not appearing:**
- Make sure the page has finished loading
- Check if the extension is enabled
- Try disabling ad blockers temporarily

### Debug Mode
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for messages starting with "Logic Builder Coach"

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues
1. Go to the [Issues](https://github.com/your-repo/logic-builder-coach/issues) page
2. Click "New Issue"
3. Provide detailed information about the problem
4. Include screenshots if applicable

### Code Contributions
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Adding Problem Patterns
Help improve the logic analysis by contributing common problem patterns:

```javascript
// In logicAssistant.js
const problemPatterns = {
  'array-traversal': {
    keywords: ['iterate', 'traverse', 'element'],
    suggestions: ['Use for loop', 'Consider two pointers'],
    complexity: 'O(n)'
  }
  // Add more patterns...
};
```

## 📊 Analytics & Privacy

### Data Collection
The extension collects minimal data:
- **Problem URLs** (stored locally only)
- **Analysis history** (stored locally only)
- **Settings preferences** (stored locally only)

### Privacy Policy
- **No personal data** is sent to external servers
- **API calls** only include problem text (when using AI features)
- **No tracking** or analytics
- **Local storage** only - your data stays on your device

## 🔧 API Reference

### OpenRouter Integration
The extension uses OpenRouter API for enhanced AI features:

```javascript
// Example API call structure
{
  "model": "anthropic/claude-3-haiku",
  "messages": [
    {
      "role": "system", 
      "content": "You are a coding logic coach..."
    },
    {
      "role": "user",
      "content": "Analyze this problem: ..."
    }
  ],
  "max_tokens": 1500,
  "temperature": 0.3
}
```

### Extension APIs Used
- `chrome.storage` - For settings and history
- `chrome.tabs` - For detecting current tab
- `chrome.runtime` - For message passing
- `chrome.scripting` - For injecting analysis modal

## 🎓 Learning Resources

### For Beginners
- [Big O Notation Guide](https://www.bigocheatsheet.com/)
- [Data Structures Visualization](https://visualgo.net/)
- [Algorithm Patterns](https://hackernoon.com/14-patterns-to-ace-any-coding-interview-question-c5bb3357f6ed)

### Practice Platforms
- [LeetCode](https://leetcode.com) - Most popular platform
- [HackerRank](https://hackerrank.com) - Good for beginners
- [GeeksforGeeks](https://geeksforgeeks.org) - Comprehensive tutorials

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** for providing AI model access
- **Chrome Extension Community** for development resources
- **Coding Platforms** for inspiring this tool
- **Open Source Contributors** who make projects like this possible

### Get Help
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-repo/logic-builder-coach/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/your-repo/logic-builder-coach/discussions)

### Stay Updated
- ⭐ **Star** this repository to stay updated
- 👁️ **Watch** for new releases
- 🍴 **Fork** to contribute

**Made with ❤️ for the coding community**

*Happy Coding! 🚀*