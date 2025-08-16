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
      background: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(5px);
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #0a1a0f 0%, #0d1f1b 50%, #0f2419 100%);
      border: 2px solid #00ff88;
      border-radius: 20px;
      width: 90%;
      max-width: 900px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 0 50px rgba(0, 255, 136, 0.4);
      animation: slideIn 0.3s ease-out;
      font-family: 'Courier New', monospace;
      color: #a8e6a3;
    `;

    modal.innerHTML = `
      <style>
        @keyframes slideIn {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .analysis-header {
          background: linear-gradient(135deg, #1a2f2a 0%, #2a4a3a 100%);
          color: #00ff88;
          padding: 25px 30px;
          border-radius: 18px 18px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }
        .analysis-content {
          padding: 35px;
          line-height: 1.7;
        }
        .logic-step {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #2a4a3a;
          border-radius: 12px;
          margin-bottom: 20px;
          overflow: hidden;
        }
        .step-header {
          background: linear-gradient(135deg, #1a2f2a 0%, #0d1f1b 100%);
          padding: 18px 25px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          color: #a8e6a3;
          transition: all 0.3s ease;
        }
        .step-header:hover {
          background: linear-gradient(135deg, #2a4a3a 0%, #1a2f2a 100%);
          color: #ccffcc;
        }
        .step-header.active {
          background: linear-gradient(135deg, #00ff88 0%, #33cc77 100%);
          color: #0d1f1b;
        }
        .step-content {
          padding: 25px;
          background: linear-gradient(135deg, #0f2419 0%, #0d1f1b 100%);
          border-top: 1px solid #2a4a3a;
        }
        .step-content ul, .step-content ol {
          margin: 0;
          padding-left: 25px;
        }
        .step-content li {
          margin-bottom: 12px;
          color: #a8e6a3;
          line-height: 1.6;
        }
        .step-content li strong {
          color: #00ff88;
          text-shadow: 0 0 5px rgba(0, 255, 136, 0.3);
        }
        .mistake-item {
          background: linear-gradient(135deg, #2d1810 0%, #3d2415 100%);
          border-left: 4px solid #ff6b35;
          padding: 15px 20px;
          margin: 12px 0;
          border-radius: 0 8px 8px 0;
          color: #ffccaa;
        }
        .hint-box {
          background: linear-gradient(135deg, #0d1f1b 0%, #1a2f2a 100%);
          border: 2px solid #00ff88;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 0 15px rgba(0, 255, 136, 0.2);
        }
        .action-buttons {
          display: flex;
          gap: 15px;
          margin-top: 30px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 12px 24px;
          border-radius: 25px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.3s ease;
          font-family: 'Courier New', monospace;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .btn-primary {
          background: linear-gradient(135deg, #00ff88 0%, #33cc77 100%);
          color: #0d1f1b;
          box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }
        .btn-secondary {
          background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
          color: #a8e6a3;
          border: 1px solid #00ff88;
        }
        .btn-secondary:hover {
          background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
          color: #00ff88;
          transform: translateY(-2px);
        }
        .close-btn {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #00ff88;
          color: #00ff88;
          font-size: 24px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        .close-btn:hover {
          background: rgba(255, 0, 0, 0.2);
          border-color: #ff4444;
          color: #ff4444;
          transform: rotate(90deg);
        }
        .code-template-box {
          background: #000;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 20px;
          margin: 15px 0;
          overflow-x: auto;
        }
        .code-template-box pre {
          margin: 0;
          color: #a8e6a3;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          white-space: pre-wrap;
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
        <!-- Step 1: Input/Output Format -->
        <div class="logic-step">
          <div class="step-header active" onclick="toggleLogicStep(this)">
            <span>📝 Step 1: Input/Output Format Analysis</span>
            <span class="chevron">▼</span>
          </div>
          <div class="step-content">
            <ul>
              <li><strong>Input Analysis:</strong> 
                <ul>
                  <li>Identify data structure (array, string, matrix, tree, etc.)</li>
                  <li>Note constraints (size limits, value ranges)</li>
                  <li>Check for special conditions or formats</li>
                </ul>
              </li>
              <li><strong>Output Requirements:</strong> 
                <ul>
                  <li>Determine return type (number, boolean, array, etc.)</li>
                  <li>Understand what exactly needs to be calculated/found</li>
                  <li>Check for specific formatting requirements</li>
                </ul>
              </li>
              <li><strong>Example Analysis:</strong> 
                <ul>
                  <li>Work through provided examples step by step</li>
                  <li>Identify patterns in input-output relationships</li>
                  <li>Note any edge cases shown in examples</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        <!-- Step 2: Edge Cases -->
        <div class="logic-step">
          <div class="step-header" onclick="toggleLogicStep(this)">
            <span>⚠️ Step 2: Edge Cases & Constraints</span>
            <span class="chevron">▶</span>
          </div>
          <div class="step-content" style="display: none;">
            <ul>
              <li><strong>Common Edge Cases:</strong>
                <ul>
                  <li>Empty input (null, empty array/string)</li>
                  <li>Single element input</li>
                  <li>All elements the same</li>
                  <li>Already sorted/optimal input</li>
                </ul>
              </li>
              <li><strong>Boundary Conditions:</strong>
                <ul>
                  <li>Minimum and maximum constraint values</li>
                  <li>Negative numbers (if applicable)</li>
                  <li>Very large numbers (integer overflow)</li>
                  <li>Duplicates and how to handle them</li>
                </ul>
              </li>
              <li><strong>Invalid Input Handling:</strong>
                <ul>
                  <li>What to return for impossible cases</li>
                  <li>Input validation requirements</li>
                  <li>Error handling strategy</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        <!-- Step 3: Logical Approach -->
        <div class="logic-step">
          <div class="step-header" onclick="toggleLogicStep(this)">
            <span>🧩 Step 3: Logical Approach & Algorithm</span>
            <span class="chevron">▶</span>
          </div>
          <div class="step-content" style="display: none;">
            <ol>
              <li><strong>Problem Understanding:</strong>
                <ul>
                  <li>Break down the problem into smaller sub-problems</li>
                  <li>Identify the core operation needed</li>
                  <li>Determine if it's a known problem pattern</li>
                </ul>
              </li>
              <li><strong>Algorithm Selection:</strong>
                <ul>
                  <li>Consider brute force approach first</li>
                  <li>Think about optimizations (sorting, hashing, two pointers)</li>
                  <li>Choose appropriate data structures</li>
                </ul>
              </li>
              <li><strong>Implementation Strategy:</strong>
                <ul>
                  <li>Plan the step-by-step execution</li>
                  <li>Initialize necessary variables</li>
                  <li>Handle the main logic loop</li>
                  <li>Return the result in correct format</li>
                </ul>
              </li>
            </ol>
            
            <div class="hint-box">
              <strong>💡 Pro Tip:</strong> Start with the simplest solution that works, then optimize. 
              Common patterns: Two Pointers, Sliding Window, Hash Maps, BFS/DFS, Dynamic Programming.
            </div>
          </div>
        </div>

        <!-- Step 4: Common Mistakes -->
        <div class="logic-step">
          <div class="step-header" onclick="toggleLogicStep(this)">
            <span>🚨 Step 4: Common Pitfalls to Avoid</span>
            <span class="chevron">▶</span>
          </div>
          <div class="step-content" style="display: none;">
            <div class="mistake-item">
              <strong>Off-by-One Errors:</strong> Always double-check loop boundaries. 
              Arrays are 0-indexed, so last element is at index n-1, not n.
            </div>
            <div class="mistake-item">
              <strong>Null/Undefined Access:</strong> Always validate inputs before using them. 
              Check for null, undefined, or empty values.
            </div>
            <div class="mistake-item">
              <strong>Integer Overflow:</strong> For large numbers, consider if your data type can handle the result. 
              Use long or BigInteger when necessary.
            </div>
            <div class="mistake-item">
              <strong>Modifying While Iterating:</strong> Be careful when adding/removing elements from collections 
              while looping through them.
            </div>
            <div class="mistake-item">
              <strong>Wrong Time Complexity:</strong> Make sure your solution meets the time constraints. 
              O(n²) might be too slow for large inputs.
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="btn btn-primary" onclick="showFirstStepGuide()">
            💡 What Should I Do First?
          </button>
          <button class="btn btn-primary" onclick="showCodeTemplate()">
            📝 Show Code Template
          </button>
          <button class="btn btn-secondary" onclick="showHintBox()">
            🔍 Get Another Hint
          </button>
          <button class="btn btn-secondary" onclick="copyAnalysis()">
            📋 Copy Analysis
          </button>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add global functions for the modal
    window.toggleLogicStep = function(header) {
      const content = header.nextElementSibling;
      const chevron = header.querySelector('.chevron');
      
      // Close other open steps
      document.querySelectorAll('.step-header.active').forEach(h => {
        if (h !== header) {
          h.classList.remove('active');
          h.nextElementSibling.style.display = 'none';
          h.querySelector('.chevron').textContent = '▶';
        }
      });
      
      if (content.style.display === 'none' || !content.style.display) {
        content.style.display = 'block';
        chevron.textContent = '▼';
        header.classList.add('active');
      } else {
        content.style.display = 'none';
        chevron.textContent = '▶';
        header.classList.remove('active');
      }
    };

    window.showFirstStepGuide = function() {
      const steps = [
        "📖 Read the problem statement carefully 2-3 times to fully understand what's being asked",
        "📝 Identify the input format and expected output format clearly",
        "🧪 Work through the given examples manually to understand the pattern",
        "🤔 Think about the simplest brute force approach first - don't worry about optimization yet",
        "📋 Write down your approach in plain English before coding",
        "⚡ Start coding with proper variable names and comments"
      ];
      
      showModalMessage("💡 First Steps Guide", steps.map((step, i) => `${i + 1}. ${step}`).join('<br><br>'));
    };

    window.showCodeTemplate = function() {
      const template = `
<div class="code-template-box">
<pre>// ${problem.title} - ${problem.site}

function solution(input) {
    // Step 1: Input validation and edge cases
    if (!input || input.length === 0) {
        return null; // or appropriate default
    }
    
    // Step 2: Initialize variables
    let result = null;
    
    // Step 3: Main algorithm logic
    // TODO: Implement your solution here
    // - Process the input data
    // - Apply your algorithm
    // - Update result variables
    
    // Step 4: Return the result
    return result;
}

// Test cases
// console.log(solution(testInput));
</pre>
</div>
<p style="color: #a8e6a3; font-size: 14px; margin-top: 15px;">
💡 This is a basic template. Adjust parameter names and types based on your specific problem.
Replace the TODO comment with your actual logic.
</p>`;
      
      showModalMessage("📝 Code Template", template);
    };

    window.showHintBox = function() {
      const hints = [
        "🔍 Look for keywords in the problem: 'sorted' suggests binary search, 'subarray' suggests sliding window",
        "📊 Try to visualize the problem with a small example - draw it out if needed",
        "🧩 Can you break this into smaller, simpler sub-problems?",
        "💾 Would a hash map help you store and look up information quickly?",
        "🔄 Is there a pattern or repetition you can exploit?",
        "📐 Consider the constraints - do they hint at the expected time complexity?"
      ];
      
      const randomHint = hints[Math.floor(Math.random() * hints.length)];
      showModalMessage("💡 Helpful Hint", randomHint);
    };

    window.copyAnalysis = function() {
      const analysisText = `
Logic Analysis: ${problem.title} (${problem.site})

1. INPUT/OUTPUT ANALYSIS:
- Understand the data structure and format
- Identify constraints and value ranges  
- Analyze provided examples

2. EDGE CASES & CONSTRAINTS:
- Empty/null inputs
- Single element cases
- Boundary values
- Duplicate handling

3. LOGICAL APPROACH:
- Break down the problem
- Choose appropriate algorithm
- Plan step-by-step implementation

4. COMMON PITFALLS:
- Off-by-one errors
- Null pointer exceptions
- Integer overflow
- Wrong time complexity

Generated by Logic Builder Coach Extension
      `;
      
      navigator.clipboard.writeText(analysisText).then(() => {
        showModalMessage("📋 Copied!", "Analysis has been copied to your clipboard!");
      }).catch(() => {
        showModalMessage("❌ Copy Failed", "Please select and copy the text manually.");
      });
    };

    function showModalMessage(title, content) {
      const messageModal = document.createElement('div');
      messageModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
      `;
      
      messageModal.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #0d1f1b 0%, #1a2f2a 100%);
          color: #00ff88;
          padding: 30px;
          border-radius: 15px;
          max-width: 600px;
          margin: 20px;
          border: 2px solid #00ff88;
          box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
          font-family: 'Courier New', monospace;
        ">
          <h3 style="margin-top: 0; color: #00ff88; text-align: center;">${title}</h3>
          <div style="color: #a8e6a3; line-height: 1.6; margin: 20px 0;">${content}</div>
          <button onclick="this.parentElement.parentElement.remove()" 
                  style="
                    background: #00ff88;
                    color: #0d1f1b;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                    width: 100%;
                    font-size: 14px;
                    font-family: 'Courier New', monospace;
                  ">
            Got it! 👍
          </button>
        </div>
      `;
      
      document.body.appendChild(messageModal);
      
      messageModal.addEventListener('click', (e) => {
        if (e.target === messageModal) messageModal.remove();
      });
    }

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
    chrome.storage.sync.get(['visitedProblems'], (data) => {
      const problems = data.visitedProblems || [];
      
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
        background: linear-gradient(135deg, #0d1f1b 0%, #1a2f2a 100%);
        color: #a8e6a3;
        padding: 30px;
        border-radius: 15px;
        width: 80%;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        border: 2px solid #00ff88;
        box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
        font-family: 'Courier New', monospace;
      `;

      let historyContent = '';
      if (problems.length === 0) {
        historyContent = '<p style="color: #a8e6a3; font-style: italic; text-align: center;">No problems analyzed yet. Start by analyzing a problem!</p>';
      } else {
        historyContent = problems.slice(0, 10).map((problem, index) => `
          <div style="
            background: rgba(0, 0, 0, 0.3);
            border-left: 4px solid #00ff88;
            padding: 15px;
            margin: 10px 0;
            border-radius: 0 8px 8px 0;
          ">
            <div style="color: #00ff88; font-weight: bold; margin-bottom: 5px;">
              ${problem.title}
            </div>
            <div style="color: #a8e6a3; font-size: 12px;">
              ${problem.site} • ${new Date(problem.timestamp).toLocaleDateString()}
            </div>
          </div>
        `).join('');
      }

      modal.innerHTML = `
        <h3 style="color: #00ff88; margin-top: 0;">📚 Problem History</h3>
        <p style="color: #a8e6a3;">Recent problems you've analyzed:</p>
        <div id="historyList">${historyContent}</div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="
                  background: #00ff88;
                  color: #0d1f1b;
                  border: none;
                  padding: 12px 24px;
                  border-radius: 25px;
                  margin-top: 20px;
                  cursor: pointer;
                  font-weight: bold;
                  width: 100%;
                  font-family: 'Courier New', monospace;
                ">
          Close
        </button>
      `;

      historyModal.appendChild(modal);
      document.body.appendChild(historyModal);

      historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) historyModal.remove();
      });
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

        // Add to beginning and limit to 50 items
        problems.unshift(newProblem);
        if (problems.length > 50) problems.pop();

        chrome.storage.sync.set({ visitedProblems: problems }, resolve);
      });
    });
  }

  saveSettings() {
    chrome.storage.sync.set(this.settings, () => {
      this.showNotification('✅ Settings saved successfully!', 'info');
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
      this.showNotification('🔄 Settings reset to defaults!', 'info');
    });
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});