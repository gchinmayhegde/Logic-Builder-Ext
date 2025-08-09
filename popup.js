// Popup.js - Logic Builder Coach Extension Popup

class PopupManager {
  constructor() {
    this.currentProblem = null;
    this.settings = {};
    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.checkCurrentProblem();
    this.bindEvents();
    this.updateUI();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        theme: 'light',
        autoDetect: true,
        showHints: true,
        apiKey: '',
        visitedProblems: []
      }, (data) => {
        this.settings = data;
        this.applySettings();
        resolve();
      });
    });
  }

  applySettings() {
    document.getElementById('autoDetect').checked = this.settings.autoDetect;
    document.getElementById('showHints').checked = this.settings.showHints;
    document.getElementById('apiKey').value = this.settings.apiKey;
  }

  async checkCurrentProblem() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['currentProblem', 'selectedText'], (data) => {
        if (data.currentProblem) {
          this.currentProblem = data.currentProblem;
        } else if (data.selectedText) {
          this.currentProblem = {
            title: 'Selected Text Analysis',
            description: data.selectedText.substring(0, 200) + '...',
            site: 'Manual Selection',
            url: 'N/A'
          };
        }
        resolve();
      });
    });
  }

  bindEvents() {
    // Main analyze button
    document.getElementById('analyzeBtn').addEventListener('click', () => {
      this.analyzeCurrentProblem();
    });

    // Quick hint button
    document.getElementById('hintBtn').addEventListener('click', () => {
      this.showQuickHint();
    });

    // History button
    document.getElementById('historyBtn').addEventListener('click', () => {
      this.showHistory();
    });

    // Settings buttons
    document.getElementById('saveSettings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('resetSettings').addEventListener('click', () => {
      this.resetSettings();
    });

    // Real-time settings updates
    document.getElementById('autoDetect').addEventListener('change', (e) => {
      this.settings.autoDetect = e.target.checked;
    });

    document.getElementById('showHints').addEventListener('change', (e) => {
      this.settings.showHints = e.target.checked;
    });

    document.getElementById('apiKey').addEventListener('input', (e) => {
      this.settings.apiKey = e.target.value;
    });
  }

  updateUI() {
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const statusSubtext = document.getElementById('statusSubtext');
    const problemInfo = document.getElementById('problemInfo');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const hintBtn = document.getElementById('hintBtn');

    if (this.currentProblem) {
      // Problem detected
      statusIcon.className = 'status-icon status-active';
      statusIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
      statusText.textContent = 'Problem Detected!';
      statusSubtext.textContent = `Ready to analyze on ${this.currentProblem.site}`;

      // Show problem info
      document.getElementById('problemSite').textContent = this.currentProblem.site;
      document.getElementById('problemTitle').textContent = this.currentProblem.title;
      document.getElementById('problemDescription').textContent = 
        this.currentProblem.description.substring(0, 100) + '...';
      
      problemInfo.style.display = 'block';
      problemInfo.classList.add('fade-in');

      // Enable buttons
      analyzeBtn.disabled = false;
      analyzeBtn.classList.remove('pulse');
      hintBtn.disabled = false;

    } else {
      // No problem detected
      statusIcon.className = 'status-icon status-inactive';
      statusIcon.innerHTML = '<i class="fas fa-search"></i>';
      statusText.textContent = 'Looking for problems...';
      statusSubtext.textContent = 'Navigate to a supported coding site';

      problemInfo.style.display = 'none';
      analyzeBtn.disabled = true;
      hintBtn.disabled = true;
    }
  }

  async analyzeCurrentProblem() {
    if (!this.currentProblem) return;

    const analyzeBtn = document.getElementById('analyzeBtn');
    const originalText = analyzeBtn.innerHTML;
    
    // Show loading state
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    analyzeBtn.disabled = true;

    try {
      // Inject the analysis directly into the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.showAnalysisModal,
        args: [this.currentProblem]
      });

      // Add to history
      await this.addToHistory(this.currentProblem);

      // Close popup after analysis
      window.close();

    } catch (error) {
      console.error('Analysis error:', error);
      analyzeBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
      setTimeout(() => {
        analyzeBtn.innerHTML = originalText;
        analyzeBtn.disabled = false;
      }, 2000);
    }
  }

  // This function will be injected into the page
  showAnalysisModal(problem) {
    // Remove existing modal if any
    const existingModal = document.getElementById('logic-coach-analysis-modal');
    if (existingModal) existingModal.remove();

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.id = 'logic-coach-analysis-modal';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(5px);
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 15px;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
    `;

    modal.innerHTML = `
      <style>
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .analysis-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 15px 15px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .analysis-content {
          padding: 30px;
          line-height: 1.6;
        }
        .analysis-section {
          margin-bottom: 25px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }
        .section-header {
          background: #f8f9fa;
          padding: 15px 20px;
          border-bottom: 1px solid #e0e0e0;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 600;
          color: #333;
        }
        .section-content {
          padding: 20px;
          background: white;
        }
        .section-content ul, .section-content ol {
          margin: 0;
          padding-left: 20px;
        }
        .section-content li {
          margin-bottom: 8px;
        }
        .mistake-item {
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 10px 15px;
          margin: 10px 0;
          border-radius: 0 5px 5px 0;
        }
        .action-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 10px 20px;
          border-radius: 25px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-primary {
          background: linear-gradient(45deg, #4ECDC4, #44A08D);
          color: white;
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .close-btn {
          background: none;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: background 0.3s ease;
        }
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      </style>
      
      <div class="analysis-header">
        <div>
          <h2 style="margin: 0; font-size: 1.5rem;">🧠 Logic Analysis: ${problem.title}</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 0.9rem;">${problem.site}</p>
        </div>
        <button class="close-btn" onclick="this.closest('#logic-coach-analysis-modal').remove()">&times;</button>
      </div>
      
      <div class="analysis-content">
        <div class="analysis-section">
          <div class="section-header" onclick="toggleSection(this)">
            <span>📝 1. Input/Output Format</span>
            <span class="chevron">▼</span>
          </div>
          <div class="section-content">
            <ul>
              <li><strong>Input:</strong> Based on the problem description, identify the data structure and format</li>
              <li><strong>Output:</strong> Determine what type of result is expected</li>
              <li><strong>Example:</strong> Look for sample inputs and expected outputs</li>
              <li><strong>Data Types:</strong> Integer, string, array, matrix, tree, etc.</li>
            </ul>
          </div>
        </div>

        <div class="analysis-section">
          <div class="section-header" onclick="toggleSection(this)">
            <span>⚠️ 2. Constraints & Edge Cases</span>
            <span class="chevron">▶</span>
          </div>
          <div class="section-content" style="display: none;">
            <ul>
              <li><strong>Empty input:</strong> What happens with null, empty array, or empty string?</li>
              <li><strong>Single element:</strong> How does your solution handle minimal input?</li>
              <li><strong>Boundary values:</strong> Minimum and maximum constraints</li>
              <li><strong>Duplicate elements:</strong> Are duplicates allowed? How to handle?</li>
              <li><strong>Negative numbers:</strong> If applicable, consider negative values</li>
              <li><strong>Integer overflow:</strong> For large numbers, consider data type limits</li>
            </ul>
          </div>
        </div>

        <div class="analysis-section">
          <div class="section-header" onclick="toggleSection(this)">
            <span>📋 3. Step-by-Step Logical Plan</span>
            <span class="chevron">▶</span>
          </div>
          <div class="section-content" style="display: none;">
            <ol>
              <li><strong>Input Validation:</strong> Check for edge cases first</li>
              <li><strong>Initialize Variables:</strong> Set up result variables, counters, or data structures</li>
              <li><strong>Main Algorithm:</strong> 
                <ul>
                  <li>Iterate through the input data</li>
                  <li>Apply the required logic/computation</li>
                  <li>Update result variables</li>
                </ul>
              </li>
              <li><strong>Return Result:</strong> Format and return the final answer</li>
            </ol>
            <div style="margin-top: 15px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
              <strong>💡 Approach Strategy:</strong>
              <br>• Start with brute force (O(n²) or O(n³)) for understanding
              <br>• Then optimize using better data structures or algorithms
              <br>• Consider: Hash maps, two pointers, sliding window, dynamic programming
            </div>
          </div>
        </div>

        <div class="analysis-section">
          <div class="section-header" onclick="toggleSection(this)">
            <span>🚨 4. Common Mistakes to Avoid</span>
            <span class="chevron">▶</span>
          </div>
          <div class="section-content" style="display: none;">
            <div class="mistake-item">
              <strong>Off-by-one errors:</strong> Check array indices (0 to n-1, not 1 to n)
            </div>
            <div class="mistake-item">
              <strong>Null pointer exceptions:</strong> Always validate inputs before use
            </div>
            <div class="mistake-item">
              <strong>Integer overflow:</strong> Use appropriate data types for large calculations
            </div>
            <div class="mistake-item">
              <strong>Infinite loops:</strong> Ensure loop conditions will eventually become false
            </div>
            <div class="mistake-item">
              <strong>Modifying while iterating:</strong> Be careful when changing collections during iteration
            </div>
            <div class="mistake-item">
              <strong>Forgotten edge cases:</strong> Test with empty inputs, single elements, and boundary values
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn btn-primary" onclick="showFirstStep()">
            💡 What should I do first?
          </button>
          <button class="btn btn-primary" onclick="showCodeTemplate()">
            📝 Show Code Template
          </button>
          <button class="btn btn-secondary" onclick="showSimilarProblems()">
            🔗 Similar Problems
          </button>
          <button class="btn btn-secondary" onclick="exportAnalysis()">
            📄 Export Analysis
          </button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add global functions for the modal
    window.toggleSection = function(header) {
      const content = header.nextElementSibling;
      const chevron = header.querySelector('.chevron');
      
      if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        chevron.textContent = '▼';
      } else {
        content.style.display = 'none';
        chevron.textContent = '▶';
      }
    };

    window.showFirstStep = function() {
      alert('💡 First Step: Read the problem carefully and identify the input/output format. Then think about the simplest approach that could work, even if it\'s not optimal.');
    };

    window.showCodeTemplate = function() {
      alert('📝 Code Template feature coming soon! This will show language-specific templates based on the problem type.');
    };

    window.showSimilarProblems = function() {
      alert('🔗 Similar Problems feature coming soon! This will suggest related problems for practice.');
    };

    window.exportAnalysis = function() {
      alert('📄 Export feature coming soon! This will let you save the analysis as a PDF or text file.');
    };

    // Close modal when clicking outside
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  async showQuickHint() {
    if (!this.currentProblem) return;

    const hints = [
      "💡 Start by understanding what the problem is asking - read it twice!",
      "🔍 Look for keywords that hint at the approach: 'sorted' → binary search, 'subarray' → sliding window",
      "📝 Write down the input format and expected output format first",
      "🧪 Think of 2-3 test cases, including edge cases",
      "⚡ Can you solve it with brute force first? Optimization comes later!",
      "🗂️ What data structure would make this easier? Array, hash map, stack, queue?",
      "🔄 Is there a pattern you can exploit? Repetitive calculations you can avoid?"
    ];

    const randomHint = hints[Math.floor(Math.random() * hints.length)];
    
    // Show hint in a temporary notification
    this.showNotification(randomHint, 'info');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'info' ? '#4ECDC4' : '#FF6B6B'};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;

    // Add slide in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 4000);
  }

  showHistory() {
    const historyModal = document.createElement('div');
    historyModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.8);
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 15px;
      width: 80%;
      max-width: 600px;
      max-height: 80vh;
      overflow-y: auto;
    `;

    modal.innerHTML = `
      <h3>📚 Problem History</h3>
      <p>Recent problems you've analyzed:</p>
      <div id="historyList">
        <p style="color: #666; font-style: italic;">No problems analyzed yet. Start by analyzing a problem!</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 20px; cursor: pointer;">
        Close
      </button>
    `;

    historyModal.appendChild(modal);
    document.body.appendChild(historyModal);

    historyModal.addEventListener('click', (e) => {
      if (e.target === historyModal) historyModal.remove();
    });
  }

  async addToHistory(problem) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['visitedProblems'], (data) => {
        const problems = data.visitedProblems || [];
        const newProblem = {
          ...problem,
          timestamp: Date.now(),
          analyzed: true
        };

        // Add to beginning and limit to 20 items
        problems.unshift(newProblem);
        if (problems.length > 20) problems.pop();

        chrome.storage.sync.set({ visitedProblems: problems }, resolve);
      });
    });
  }

  saveSettings() {
    chrome.storage.sync.set(this.settings, () => {
      this.showNotification('Settings saved successfully!', 'info');
    });
  }

  resetSettings() {
    const defaultSettings = {
      theme: 'light',
      autoDetect: true,
      showHints: true,
      apiKey: '',
      visitedProblems: []
    };

    chrome.storage.sync.set(defaultSettings, () => {
      this.settings = defaultSettings;
      this.applySettings();
      this.showNotification('Settings reset to defaults!', 'info');
    });
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});