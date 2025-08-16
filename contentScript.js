// Content Script for Logic Builder Coach
// Enhanced platform detection and floating button functionality

class ProblemDetector {
  constructor() {
    this.site = this.detectSite();
    this.problemData = null;
    this.floatingButton = null;
    this.observer = null;
    this.init();
  }

  detectSite() {
    const hostname = window.location.hostname;
    const url = window.location.href;
    
    console.log('Logic Builder Coach: Detecting site...', hostname);
    
    if (hostname.includes('leetcode.com') || hostname.includes('leetcode.cn')) {
      console.log('Logic Builder Coach: LeetCode detected');
      return 'leetcode';
    }
    if (hostname.includes('geeksforgeeks.org')) {
      console.log('Logic Builder Coach: GeeksforGeeks detected');
      return 'geeksforgeeks';
    }
    if (hostname.includes('hackerrank.com')) {
      console.log('Logic Builder Coach: HackerRank detected');
      return 'hackerrank';
    }
    if (hostname.includes('codeforces.com')) {
      console.log('Logic Builder Coach: Codeforces detected');
      return 'codeforces';
    }
    if (hostname.includes('codechef.com')) {
      console.log('Logic Builder Coach: CodeChef detected');
      return 'codechef';
    }
    
    console.log('Logic Builder Coach: Unknown site');
    return 'unknown';
  }

  init() {
    if (this.site === 'unknown') {
      console.log('Logic Builder Coach: Site not supported');
      return;
    }
    
    console.log('Logic Builder Coach: Initializing for', this.site);
    
    // Wait for page to load completely
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.detectProblem();
        this.startObserver();
      });
    } else {
      setTimeout(() => {
        this.detectProblem();
        this.startObserver();
      }, 2000); // Give time for dynamic content to load
    }

    // Also try again after a delay for SPA navigation
    setTimeout(() => {
      if (!this.problemData) {
        this.detectProblem();
      }
    }, 5000);
  }

  startObserver() {
    // Listen for dynamic content changes (SPA navigation)
    this.observer = new MutationObserver(() => {
      if (!this.problemData) {
        setTimeout(() => this.detectProblem(), 1000);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  detectProblem() {
    console.log('Logic Builder Coach: Attempting problem detection for', this.site);
    let problem = null;

    switch (this.site) {
      case 'leetcode':
        problem = this.extractLeetCodeProblem();
        break;
      case 'geeksforgeeks':
        problem = this.extractGeeksForGeeksProblem();
        break;
      case 'hackerrank':
        problem = this.extractHackerRankProblem();
        break;
      case 'codeforces':
        problem = this.extractCodeforceProblem();
        break;
      case 'codechef':
        problem = this.extractCodeChefProblem();
        break;
    }

    if (problem && !this.problemData) {
      console.log('Logic Builder Coach: Problem detected!', problem.title);
      this.problemData = problem;
      this.notifyProblemDetected(problem);
      this.createFloatingButton();
    } else if (!problem) {
      console.log('Logic Builder Coach: No problem found');
    }
  }

  extractLeetCodeProblem() {
    // Multiple selectors for different LeetCode layouts
    const titleSelectors = [
      '[data-cy="question-title"]',
      'h1[class*="title"]',
      '.css-v3d350',
      '.question-title h3',
      '.question-title',
      'h1',
      '[class*="question-title"]'
    ];
    
    const descriptionSelectors = [
      '[data-key="description-content"]',
      '.content__u3I1 .question-content',
      '.elfjS',
      '.question-content',
      '[class*="question-content"]',
      '.description__24sA',
      '.question-detail-main-tabs'
    ];

    let titleElement = null;
    let descriptionElement = null;

    // Try different selectors until we find one that works
    for (const selector of titleSelectors) {
      titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) break;
    }

    for (const selector of descriptionSelectors) {
      descriptionElement = document.querySelector(selector);
      if (descriptionElement && descriptionElement.textContent.trim()) break;
    }

    if (!titleElement || !titleElement.textContent.trim()) {
      console.log('Logic Builder Coach: LeetCode title not found');
      return null;
    }

    const title = titleElement.textContent.trim();
    const description = descriptionElement ? 
      this.cleanDescription(descriptionElement.textContent) : 
      'Problem description not found';

    // Try to find difficulty
    const difficultySelectors = [
      '[diff]',
      '.css-10o4wqw',
      '[class*="difficulty"]',
      '.question-info .difficulty'
    ];
    
    let difficultyElement = null;
    for (const selector of difficultySelectors) {
      difficultyElement = document.querySelector(selector);
      if (difficultyElement) break;
    }
    
    const difficulty = difficultyElement ? difficultyElement.textContent.trim() : 'Unknown';

    console.log('Logic Builder Coach: LeetCode problem extracted:', title);
    return {
      title,
      description: description.substring(0, 1000) + (description.length > 1000 ? '...' : ''),
      difficulty,
      site: 'LeetCode',
      url: window.location.href
    };
  }

  extractGeeksForGeeksProblem() {
    const titleSelectors = [
      '.problems_problem_content__title__L2lLn',
      '.problem-title',
      'h1[class*="title"]',
      'h1',
      '.header h1',
      '[class*="problem"] h1'
    ];
    
    const descriptionSelectors = [
      '.problems_problem_content__taskDescription__9yaM1',
      '.problem-statement',
      '.MuiTypography-root',
      '.problem-text',
      '[class*="description"]',
      '.content'
    ];

    let titleElement = null;
    let descriptionElement = null;

    for (const selector of titleSelectors) {
      titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) break;
    }

    for (const selector of descriptionSelectors) {
      descriptionElement = document.querySelector(selector);
      if (descriptionElement && descriptionElement.textContent.trim()) break;
    }

    if (!titleElement || !titleElement.textContent.trim()) {
      console.log('Logic Builder Coach: GeeksforGeeks title not found');
      return null;
    }

    console.log('Logic Builder Coach: GeeksforGeeks problem extracted:', titleElement.textContent.trim());
    return {
      title: titleElement.textContent.trim(),
      description: descriptionElement ? 
        this.cleanDescription(descriptionElement.textContent).substring(0, 1000) : 
        'Problem description not found',
      difficulty: 'Unknown',
      site: 'GeeksforGeeks',
      url: window.location.href
    };
  }

  extractHackerRankProblem() {
    const titleSelectors = [
      '.ui-icon-label',
      '.challenge-title',
      'h1',
      '.hr-monaco-title',
      '.challenge-name'
    ];
    
    const descriptionSelectors = [
      '.challenge-body-html',
      '.problem-statement',
      '.challenge-text',
      '.challenge-body'
    ];

    let titleElement = null;
    let descriptionElement = null;

    for (const selector of titleSelectors) {
      titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) break;
    }

    for (const selector of descriptionSelectors) {
      descriptionElement = document.querySelector(selector);
      if (descriptionElement && descriptionElement.textContent.trim()) break;
    }

    if (!titleElement || !titleElement.textContent.trim()) {
      console.log('Logic Builder Coach: HackerRank title not found');
      return null;
    }

    console.log('Logic Builder Coach: HackerRank problem extracted:', titleElement.textContent.trim());
    return {
      title: titleElement.textContent.trim(),
      description: descriptionElement ? 
        this.cleanDescription(descriptionElement.textContent).substring(0, 1000) : 
        'Problem description not found',
      difficulty: 'Unknown',
      site: 'HackerRank',
      url: window.location.href
    };
  }

  extractCodeforceProblem() {
    const titleElement = document.querySelector('.title') ||
                        document.querySelector('.header .title');
    
    const descriptionElement = document.querySelector('.problem-statement') ||
                             document.querySelector('.ttypography');

    if (!titleElement) return null;

    return {
      title: titleElement.textContent.trim(),
      description: descriptionElement ? 
        this.cleanDescription(descriptionElement.textContent).substring(0, 1000) : 
        'Problem description not found',
      difficulty: 'Unknown',
      site: 'Codeforces',
      url: window.location.href
    };
  }

  extractCodeChefProblem() {
    const titleElement = document.querySelector('h1') ||
                        document.querySelector('.problem-title');
    
    const descriptionElement = document.querySelector('.problem-statement') ||
                             document.querySelector('.content');

    if (!titleElement) return null;

    return {
      title: titleElement.textContent.trim(),
      description: descriptionElement ? 
        this.cleanDescription(descriptionElement.textContent).substring(0, 1000) : 
        'Problem description not found',
      difficulty: 'Unknown',
      site: 'CodeChef',
      url: window.location.href
    };
  }

  cleanDescription(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\x20-\x7E]/g, '')
      .trim();
  }

  notifyProblemDetected(problem) {
    console.log('Logic Builder Coach: Notifying problem detected');
    chrome.runtime.sendMessage({
      action: 'problemDetected',
      problem: problem
    });
  }

  createFloatingButton() {
    if (this.floatingButton) return;

    console.log('Logic Builder Coach: Creating floating button');
    this.floatingButton = document.createElement('div');
    this.floatingButton.id = 'logic-coach-btn';
    this.floatingButton.className = 'logic-coach-floating-btn';
    this.floatingButton.innerHTML = `
      <div class="logic-coach-btn-content">
        🧠
        <span class="logic-coach-tooltip">Logic Builder Coach</span>
      </div>
    `;

    this.floatingButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Logic Builder Coach: Opening assistant');
      this.openLogicAssistant();
    });

    document.body.appendChild(this.floatingButton);

    // Add entrance animation
    setTimeout(() => {
      this.floatingButton.classList.add('logic-coach-visible');
    }, 100);
  }

  openLogicAssistant() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'logic-coach-overlay';
    overlay.className = 'logic-coach-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'logic-coach-modal';
    modal.innerHTML = `
      <div class="logic-coach-header">
        <h3>🧠 Logic Builder Coach</h3>
        <button id="logic-coach-close" class="logic-coach-close-btn">&times;</button>
      </div>
      <div class="logic-coach-content">
        <div class="logic-coach-loading">
          <div class="logic-coach-spinner"></div>
          <p>Analyzing problem logic...</p>
        </div>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Close handlers
    const closeBtn = modal.querySelector('#logic-coach-close');
    closeBtn.addEventListener('click', () => this.closeModal(overlay));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeModal(overlay);
    });

    // Generate logic breakdown
    this.generateLogicBreakdown(modal);
  }

  closeModal(overlay) {
    overlay.classList.add('logic-coach-fadeout');
    setTimeout(() => {
      overlay.remove();
    }, 300);
  }

  async generateLogicBreakdown(modal) {
    try {
      // Get API key from storage
      const result = await chrome.storage.sync.get(['apiKey']);
      const apiKey = result.apiKey;
      
      let breakdown;
      if (apiKey && window.LogicAssistant) {
        // Use AI assistant if available
        const assistant = new window.LogicAssistant(apiKey);
        const analysis = await assistant.analyzeLogic(this.problemData);
        breakdown = this.formatAIAnalysis(analysis);
      } else {
        // Use mock analysis
        breakdown = await this.getMockLogicBreakdown();
      }
      
      const content = modal.querySelector('.logic-coach-content');
      content.innerHTML = breakdown;
      
      // Add event listeners for the buttons
      this.attachButtonListeners(content);
      
    } catch (error) {
      console.error('Logic Builder Coach: Analysis error', error);
      const content = modal.querySelector('.logic-coach-content');
      content.innerHTML = `
        <div class="logic-coach-error">
          <h4>Error generating logic breakdown</h4>
          <p>Please check your API configuration and try again.</p>
          <button onclick="this.parentElement.parentElement.parentElement.parentElement.remove()" 
                  class="logic-coach-btn">Close</button>
        </div>
      `;
    }
  }

  formatAIAnalysis(analysis) {
    // Format AI analysis into HTML
    return `
      <div class="logic-coach-breakdown">
        <div class="logic-coach-section">
          <h4>📝 Problem Analysis: ${this.problemData.title}</h4>
          
          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn active">
              <span>1. Input/Output Format</span>
              <span class="logic-coach-chevron">▼</span>
            </button>
            <div class="logic-coach-section-content">
              ${analysis.analysis.inputOutput || 'Analyzing input/output format...'}
            </div>
          </div>

          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn">
              <span>2. Constraints & Edge Cases</span>
              <span class="logic-coach-chevron">▶</span>
            </button>
            <div class="logic-coach-section-content" style="display: none;">
              ${analysis.analysis.edgeCases || 'Analyzing constraints and edge cases...'}
            </div>
          </div>

          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn">
              <span>3. Step-by-Step Logical Plan</span>
              <span class="logic-coach-chevron">▶</span>
            </button>
            <div class="logic-coach-section-content" style="display: none;">
              ${analysis.analysis.stepPlan || 'Creating step-by-step plan...'}
            </div>
          </div>

          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn">
              <span>4. Common Mistakes to Avoid</span>
              <span class="logic-coach-chevron">▶</span>
            </button>
            <div class="logic-coach-section-content" style="display: none;">
              ${analysis.analysis.commonMistakes || 'Identifying common mistakes...'}
            </div>
          </div>

          <div class="logic-coach-actions">
            <button class="logic-coach-btn logic-coach-btn-primary" data-action="showFirstStepHint">
              💡 What should I do first?
            </button>
            <button class="logic-coach-btn logic-coach-btn-secondary" data-action="showCodeTemplate">
              📝 Show Code Example
            </button>
          </div>
        </div>
      </div>
    `;
  }

  async getMockLogicBreakdown() {
    // Mock implementation with better formatting
    return `
      <div class="logic-coach-breakdown">
        <div class="logic-coach-section">
          <h4>📝 Problem Breakdown: ${this.problemData.title}</h4>
          
          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn active">
              <span>1. Input/Output Format Analysis</span>
              <span class="logic-coach-chevron">▼</span>
            </button>
            <div class="logic-coach-section-content">
              <ul>
                <li><strong>Input Structure:</strong> Identify the exact data format (array, string, matrix, etc.)</li>
                <li><strong>Input Constraints:</strong> Note size limits, value ranges, and special conditions</li>
                <li><strong>Output Requirements:</strong> Determine return type and format expected</li>
                <li><strong>Example Analysis:</strong> Work through provided examples to understand patterns</li>
                <li><strong>Data Types:</strong> Consider integers, strings, booleans, or custom objects</li>
              </ul>
              <div style="margin-top: 15px; padding: 12px; background: #0f2419; border-left: 3px solid #00ff88; border-radius: 5px;">
                <strong style="color: #00ff88;">💡 Key Question:</strong>
                <span style="color: #a8e6a3;"> What exactly am I receiving as input, and what exactly should I return?</span>
              </div>
            </div>
          </div>

          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn">
              <span>2. Constraints & Edge Cases</span>
              <span class="logic-coach-chevron">▶</span>
            </button>
            <div class="logic-coach-section-content" style="display: none;">
              <h5 style="color: #00ff88; margin-bottom: 15px;">Critical Edge Cases:</h5>
              <ul>
                <li><strong>Empty Input:</strong> null, empty array [], empty string ""</li>
                <li><strong>Single Element:</strong> Arrays with length 1, single character strings</li>
                <li><strong>Minimum/Maximum Values:</strong> Test boundary conditions from constraints</li>
                <li><strong>Duplicate Elements:</strong> How should repeated values be handled?</li>
                <li><strong>Negative Numbers:</strong> If applicable, consider negative inputs</li>
                <li><strong>Large Input Size:</strong> Will your solution handle maximum constraints?</li>
              </ul>
              <h5 style="color: #00ff88; margin: 20px 0 15px;">Invalid Input Handling:</h5>
              <ul>
                <li>What to return for impossible/invalid cases?</li>
                <li>Should you validate inputs or assume they're always valid?</li>
                <li>Are there any special error conditions mentioned?</li>
              </ul>
            </div>
          </div>

          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn">
              <span>3. Step-by-Step Logical Approach</span>
              <span class="logic-coach-chevron">▶</span>
            </button>
            <div class="logic-coach-section-content" style="display: none;">
              <h5 style="color: #00ff88; margin-bottom: 15px;">Implementation Strategy:</h5>
              <ol>
                <li><strong>Input Validation & Edge Case Handling:</strong>
                  <ul>
                    <li>Check for null, empty, or invalid inputs first</li>
                    <li>Return appropriate values for edge cases</li>
                    <li>Handle minimum valid inputs (single element, etc.)</li>
                  </ul>
                </li>
                <li><strong>Variable Initialization:</strong>
                  <ul>
                    <li>Set up result variables (counters, accumulators, flags)</li>
                    <li>Initialize any data structures needed (arrays, maps, sets)</li>
                    <li>Prepare loop variables and boundaries</li>
                  </ul>
                </li>
                <li><strong>Core Algorithm Implementation:</strong>
                  <ul>
                    <li>Process input data systematically (iterate, traverse, search)</li>
                    <li>Apply required operations or transformations</li>
                    <li>Update result variables as you progress</li>
                    <li>Handle any intermediate calculations</li>
                  </ul>
                </li>
                <li><strong>Result Preparation & Return:</strong>
                  <ul>
                    <li>Format the result according to requirements</li>
                    <li>Perform any final transformations needed</li>
                    <li>Return in the expected data type and format</li>
                  </ul>
                </li>
              </ol>
              <div style="margin-top: 20px; padding: 15px; background: #0d1f1b; border-radius: 8px; border-left: 4px solid #00ff88;">
                <strong style="color: #00ff88;">💡 Approach Strategy:</strong>
                <ul style="margin: 10px 0 0 0; color: #a8e6a3;">
                  <li><strong>Start Simple:</strong> Implement brute force solution first</li>
                  <li><strong>Then Optimize:</strong> Consider better algorithms and data structures</li>
                  <li><strong>Common Patterns:</strong> Two pointers, sliding window, hash maps, BFS/DFS, DP</li>
                  <li><strong>Time Complexity:</strong> Ensure your solution meets performance requirements</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn">
              <span>4. Common Pitfalls & Mistakes</span>
              <span class="logic-coach-chevron">▶</span>
            </button>
            <div class="logic-coach-section-content" style="display: none;">
              <div class="mistake-item">
                <strong>🚨 Off-by-One Errors:</strong> 
                <p>Arrays are 0-indexed. Last element is at index <code>n-1</code>, not <code>n</code>. Double-check loop boundaries!</p>
                <small style="color: #ffccaa;">Example: <code>for i in range(len(arr))</code> not <code>range(len(arr)+1)</code></small>
              </div>
              <div class="mistake-item">
                <strong>🚨 Null Pointer/Reference Errors:</strong>
                <p>Always validate inputs before accessing properties or methods. Check for null, undefined, or empty values.</p>
                <small style="color: #ffccaa;">Example: Check <code>if arr is None</code> or <code>if (!arr)</code> before using <code>arr.length</code></small>
              </div>
              <div class="mistake-item">
                <strong>🚨 Integer Overflow:</strong>
                <p>For large numbers, consider if your data type can handle the result. Use appropriate data types.</p>
                <small style="color: #ffccaa;">Consider: long, BigInteger, or modular arithmetic when needed</small>
              </div>
              <div class="mistake-item">
                <strong>🚨 Modifying While Iterating:</strong>
                <p>Be careful when adding/removing elements from collections while looping through them.</p>
                <small style="color: #ffccaa;">Use separate loops or create copies when modification is needed</small>
              </div>
              <div class="mistake-item">
                <strong>🚨 Wrong Time/Space Complexity:</strong>
                <p>Ensure your solution meets constraints. O(n²) might be too slow for large inputs (n > 10⁴).</p>
                <small style="color: #ffccaa;">Always check if your algorithm complexity aligns with problem constraints</small>
              </div>
              <div class="mistake-item">
                <strong>🚨 Misunderstanding the Problem:</strong>
                <p>Read the problem statement multiple times. Pay attention to exactly what's being asked.</p>
                <small style="color: #ffccaa;">Work through examples manually to confirm your understanding</small>
              </div>
            </div>
          </div>

          <div class="logic-coach-actions">
            <button class="logic-coach-btn logic-coach-btn-primary" data-action="showFirstStepHint">
              💡 What should I do first?
            </button>
            <button class="logic-coach-btn logic-coach-btn-secondary" data-action="showCodeTemplate">
              📝 Show Code Example
            </button>
            <button class="logic-coach-btn logic-coach-btn-secondary" data-action="showDebuggingTips">
              🐛 Debugging Tips
            </button>
            <button class="logic-coach-btn logic-coach-btn-secondary" data-action="showTestCases">
              🧪 Generate Test Cases
            </button>
          </div>
        </div>
      </div>
    `;
  }

  attachButtonListeners(content) {
    // Add collapsible functionality
    const sectionButtons = content.querySelectorAll('.logic-coach-section-btn');
    sectionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sectionContent = btn.nextElementSibling;
        const chevron = btn.querySelector('.logic-coach-chevron');
        
        // Close other sections first
        sectionButtons.forEach(otherBtn => {
          if (otherBtn !== btn) {
            const otherContent = otherBtn.nextElementSibling;
            const otherChevron = otherBtn.querySelector('.logic-coach-chevron');
            otherContent.style.display = 'none';
            otherChevron.textContent = '▶';
            otherBtn.classList.remove('active');
          }
        });
        
        // Toggle current section
        if (sectionContent.style.display === 'none' || !sectionContent.style.display) {
          sectionContent.style.display = 'block';
          chevron.textContent = '▼';
          btn.classList.add('active');
        } else {
          sectionContent.style.display = 'none';
          chevron.textContent = '▶';
          btn.classList.remove('active');
        }
      });
    });

    // Add action button listeners
    const actionButtons = content.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.getAttribute('data-action');
        switch(action) {
          case 'showFirstStepHint':
            this.showFirstStepHint();
            break;
          case 'showCodeTemplate':
            this.showCodeTemplate();
            break;
          case 'showDebuggingTips':
            this.showDebuggingTips();
            break;
          case 'showTestCases':
            this.showTestCases();
            break;
        }
      });
    });
  }

  showFirstStepHint() {
    const firstStepGuides = [
      {
        title: "📖 Read & Understand",
        content: "Read the problem statement 2-3 times carefully. Don't rush to code immediately. Understanding the problem fully is 50% of solving it."
      },
      {
        title: "📝 Identify Input/Output",
        content: "Clearly write down: What am I receiving as input? What exactly should I return? What's the data type and format?"
      },
      {
        title: "🧪 Work Through Examples",
        content: "Manually work through the provided examples step by step. This often reveals the pattern or approach you need to use."
      },
      {
        title: "🤔 Think Simple First",
        content: "What's the simplest brute force approach? Even if it's not optimal, start there. You can always optimize later."
      },
      {
        title: "📋 Plan Your Approach",
        content: "Write down your solution approach in plain English before coding. List the steps: 1. Check edge cases, 2. Initialize variables, 3. Main logic, 4. Return result."
      },
      {
        title: "⚡ Consider Data Structures",
        content: "What data structures might help? Arrays for sequences, Hash Maps for lookups, Stacks for LIFO, Queues for FIFO, Sets for uniqueness."
      }
    ];
    
    const randomGuide = firstStepGuides[Math.floor(Math.random() * firstStepGuides.length)];
    this.showModalMessage(randomGuide.title, randomGuide.content);
  }

  showCodeTemplate() {
    const problemTitle = this.problemData?.title || 'Unknown Problem';
    const problemSite = this.problemData?.site || 'Unknown';
    
    const templates = {
      python: `# ${problemTitle} - ${problemSite}

def solution(nums):
    """
    Solve the problem step by step
    
    Args:
        nums: Input parameter (adjust based on problem)
        
    Returns:
        Result based on problem requirements
    """
    
    # Step 1: Handle edge cases
    if not nums:
        return None  # or appropriate default value
    
    if len(nums) == 1:
        # Handle single element case
        return nums[0]  # adjust based on problem
    
    # Step 2: Initialize variables
    result = None
    # Add other variables as needed:
    # count = 0
    # max_value = float('-inf')
    # visited = set()
    
    # Step 3: Main algorithm logic
    for i in range(len(nums)):
        # TODO: Implement your solution here
        # Process each element
        # Update result variables
        pass
    
    # Step 4: Return the result
    return result

# Test cases
if __name__ == "__main__":
    # Test with provided examples
    test_input = [1, 2, 3]  # Replace with actual test case
    print(f"Input: {test_input}")
    print(f"Output: {solution(test_input)}")`,

      javascript: `// ${problemTitle} - ${problemSite}

function solution(nums) {
    /**
     * Solve the problem step by step
     * 
     * @param {number[]} nums - Input parameter (adjust based on problem)
     * @returns {number} Result based on problem requirements
     */
    
    // Step 1: Handle edge cases
    if (!nums || nums.length === 0) {
        return null; // or appropriate default value
    }
    
    if (nums.length === 1) {
        // Handle single element case
        return nums[0]; // adjust based on problem
    }
    
    // Step 2: Initialize variables
    let result = null;
    // Add other variables as needed:
    // let count = 0;
    // let maxValue = Number.NEGATIVE_INFINITY;
    // let visited = new Set();
    
    // Step 3: Main algorithm logic
    for (let i = 0; i < nums.length; i++) {
        // TODO: Implement your solution here
        // Process each element
        // Update result variables
    }
    
    // Step 4: Return the result
    return result;
}

// Test cases
const testInput = [1, 2, 3]; // Replace with actual test case
console.log("Input:", testInput);
console.log("Output:", solution(testInput));`,

      java: `// ${problemTitle} - ${problemSite}

public class Solution {
    public int solution(int[] nums) {
        /*
         * Solve the problem step by step
         * 
         * @param nums Input parameter (adjust based on problem)
         * @return Result based on problem requirements
         */
        
        // Step 1: Handle edge cases
        if (nums == null || nums.length == 0) {
            return -1; // or appropriate default value
        }
        
        if (nums.length == 1) {
            // Handle single element case
            return nums[0]; // adjust based on problem
        }
        
        // Step 2: Initialize variables
        int result = 0;
        // Add other variables as needed:
        // int count = 0;
        // int maxValue = Integer.MIN_VALUE;
        // Set<Integer> visited = new HashSet<>();
        
        // Step 3: Main algorithm logic
        for (int i = 0; i < nums.length; i++) {
            // TODO: Implement your solution here
            // Process each element
            // Update result variables
        }
        
        // Step 4: Return the result
        return result;
    }
    
    // Test method
    public static void main(String[] args) {
        Solution sol = new Solution();
        int[] testInput = {1, 2, 3}; // Replace with actual test case
        System.out.println("Input: " + Arrays.toString(testInput));
        System.out.println("Output: " + sol.solution(testInput));
    }
}`,

      cpp: `// ${problemTitle} - ${problemSite}

#include <vector>
#include <iostream>
#include <climits>
#include <unordered_set>
using namespace std;

class Solution {
public:
    int solution(vector<int>& nums) {
        /*
         * Solve the problem step by step
         * 
         * @param nums Input parameter (adjust based on problem)
         * @return Result based on problem requirements
         */
        
        // Step 1: Handle edge cases
        if (nums.empty()) {
            return -1; // or appropriate default value
        }
        
        if (nums.size() == 1) {
            // Handle single element case
            return nums[0]; // adjust based on problem
        }
        
        // Step 2: Initialize variables
        int result = 0;
        // Add other variables as needed:
        // int count = 0;
        // int maxValue = INT_MIN;
        // unordered_set<int> visited;
        
        // Step 3: Main algorithm logic
        for (int i = 0; i < nums.size(); i++) {
            // TODO: Implement your solution here
            // Process each element
            // Update result variables
        }
        
        // Step 4: Return the result
        return result;
    }
};

// Test function
int main() {
    Solution sol;
    vector<int> testInput = {1, 2, 3}; // Replace with actual test case
    cout << "Input: ";
    for (int num : testInput) cout << num << " ";
    cout << endl << "Output: " << sol.solution(testInput) << endl;
    return 0;
}`
    };

    this.showCodeTemplateModal(templates);
  }

  showDebuggingTips() {
    const debuggingTips = `
      <h4 style="color: #00ff88; margin-bottom: 20px;">🐛 Debugging Strategies</h4>
      
      <div style="margin-bottom: 20px;">
        <h5 style="color: #00ff88;">1. Print Statement Debugging</h5>
        <ul style="color: #a8e6a3; line-height: 1.6;">
          <li>Add print statements at key points in your code</li>
          <li>Print variable values before and after operations</li>
          <li>Print loop indices and conditions</li>
          <li>Use descriptive print messages: <code>print(f"After processing element {i}: result = {result}")</code></li>
        </ul>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h5 style="color: #00ff88;">2. Test with Small Examples</h5>
        <ul style="color: #a8e6a3; line-height: 1.6;">
          <li>Start with the smallest possible valid input</li>
          <li>Test edge cases: empty input, single element, two elements</li>
          <li>Create your own simple test cases where you know the expected output</li>
          <li>Gradually increase complexity</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h5 style="color: #00ff88;">3. Step Through Manually</h5>
        <ul style="color: #a8e6a3; line-height: 1.6;">
          <li>Take a pencil and paper, trace through your algorithm step by step</li>
          <li>Keep track of all variable values at each iteration</li>
          <li>Check if the logic matches your intended algorithm</li>
          <li>Look for places where your code differs from your mental model</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h5 style="color: #00ff88;">4. Common Bug Patterns</h5>
        <div style="background: #0f2419; padding: 15px; border-radius: 8px; border-left: 3px solid #ff6b35;">
          <strong style="color: #ff8855;">Index Errors:</strong> Check array bounds, especially in loops<br>
          <strong style="color: #ff8855;">Logic Errors:</strong> Verify if-else conditions and loop termination<br>
          <strong style="color: #ff8855;">Variable Mix-ups:</strong> Ensure you're using the right variables<br>
          <strong style="color: #ff8855;">Type Issues:</strong> Check data type conversions and comparisons
        </div>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h5 style="color: #00ff88;">5. Rubber Duck Debugging</h5>
        <p style="color: #a8e6a3; line-height: 1.6;">
          Explain your code line by line to an imaginary listener (or actual rubber duck). 
          Often, verbalizing your logic helps you spot the error.
        </p>
      </div>
    `;
    
    this.showModalMessage('🐛 Debugging Tips', debuggingTips);
  }

  showTestCases() {
    const testCaseGuide = `
      <h4 style="color: #00ff88; margin-bottom: 20px;">🧪 Test Case Generation Guide</h4>
      
      <div style="margin-bottom: 20px;">
        <h5 style="color: #00ff88;">1. Edge Cases (Most Important!)</h5>
        <ul style="color: #a8e6a3; line-height: 1.6;">
          <li><strong>Empty Input:</strong> [], "", null</li>
          <li><strong>Single Element:</strong> [5], "a", one node</li>
          <li><strong>Two Elements:</strong> [1, 2], "ab"</li>
          <li><strong>All Same Elements:</strong> [3, 3, 3, 3]</li>
          <li><strong>Already Sorted:</strong> [1, 2, 3, 4] or [4, 3, 2, 1]</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h5 style="color: #00ff88;">2. Boundary Values</h5>
        <ul style="color: #a8e6a3; line-height: 1.6;">
          <li><strong>Minimum Constraints:</strong> Smallest allowed size/values</li>
          <li><strong>Maximum Constraints:</strong> Largest allowed size/values</li>
          <li><strong>Zero/Negative:</strong> If applicable: [0], [-1, -2], ""</li>
          <li><strong>Just Below/Above Limits:</strong> n-1, n+1 where n is a constraint</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 20px;">
        <h5 style="color: #00ff88;">3. Normal Cases</h5>
        <ul style="color: #a8e6a3; line-height: 1.6;">
          <li><strong>Typical Input:</strong> Average-sized input with mixed values</li>
          <li><strong>Random Order:</strong> [3, 1, 4, 2], "hello"</li>
          <li><strong>With Duplicates:</strong> [1, 2, 2, 3, 1]</li>
          <li><strong>Medium Size:</strong> 10-100 elements to test performance</li>
        </ul>
      </div>
      
      <div style="background: #0f2419; padding: 15px; border-radius: 8px; border-left: 3px solid #00ff88;">
        <h5 style="color: #00ff88; margin-top: 0;">💡 Pro Testing Tips:</h5>
        <ul style="color: #a8e6a3; margin-bottom: 0;">
          <li>Always test the provided examples first</li>
          <li>Create at least 3-5 different test cases</li>
          <li>Test edge cases BEFORE submitting</li>
          <li>If your solution fails, check edge cases first</li>
          <li>Use online judges' custom input feature to test</li>
        </ul>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: #0d1f1b; border-radius: 8px;">
        <h6 style="color: #00ff88;">Example Test Case Template:</h6>
        <pre style="color: #a8e6a3; font-family: monospace; font-size: 13px;">
# Test Case 1: Edge case - Empty input
input: []
expected: [] (or appropriate default)

# Test Case 2: Edge case - Single element  
input: [5]
expected: [5] (or based on problem logic)

# Test Case 3: Normal case
input: [3, 1, 4, 1, 5]
expected: [1, 1, 3, 4, 5] (example for sorting)

# Test Case 4: All same elements
input: [2, 2, 2]
expected: [2, 2, 2]

# Test Case 5: Already optimal
input: [1, 2, 3, 4]
expected: [1, 2, 3, 4]</pre>
      </div>
    `;
    
    this.showModalMessage('🧪 Test Case Generation', testCaseGuide);
  }

  showModalMessage(title, content) {
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
      padding: 20px;
      box-sizing: border-box;
    `;
    
    messageModal.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #0d1f1b 0%, #1a2f2a 100%); 
        color: #00ff88; 
        padding: 30px; 
        border-radius: 15px; 
        max-width: 700px; 
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        border: 2px solid #00ff88;
        box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
        font-family: 'Courier New', monospace;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #00ff88;">${title}</h3>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                  style="
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid #00ff88;
                    color: #00ff88;
                    font-size: 20px;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">&times;</button>
        </div>
        <div style="color: #a8e6a3; line-height: 1.6;">${content}</div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="
                  background: #00ff88; 
                  color: #0d1f1b; 
                  border: none; 
                  padding: 12px 24px; 
                  border-radius: 25px; 
                  cursor: pointer; 
                  font-weight: bold; 
                  width: 100%;
                  font-size: 14px;
                  margin-top: 25px;
                  font-family: 'Courier New', monospace;
                  text-transform: uppercase;
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

  showCodeTemplateModal(templates) {
    const templateModal = document.createElement('div');
    templateModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 10001;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    templateModal.innerHTML = `
      <div style="
        background: #0d1f1b; 
        color: #00ff88; 
        padding: 30px; 
        border-radius: 15px; 
        max-width: 900px; 
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        border: 2px solid #00ff88;
        box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);
        font-family: 'Courier New', monospace;
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <h3 style="margin: 0; color: #00ff88;">📝 Code Templates</h3>
          <button onclick="this.parentElement.parentElement.remove()" 
                  style="
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid #00ff88;
                    color: #00ff88;
                    font-size: 20px;
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">&times;</button>
        </div>
        
        <div style="margin-bottom: 25px;">
          <button class="lang-btn active" data-lang="python" 
                  style="
                    background: #00ff88; 
                    color: #0d1f1b; 
                    border: none; 
                    padding: 10px 18px; 
                    margin-right: 12px; 
                    margin-bottom: 8px;
                    border-radius: 20px; 
                    cursor: pointer; 
                    font-weight: bold;
                    font-family: 'Courier New', monospace;
                  ">Python</button>
          <button class="lang-btn" data-lang="javascript" 
                  style="
                    background: #1a2f2a; 
                    color: #00ff88; 
                    border: 1px solid #00ff88; 
                    padding: 10px 18px; 
                    margin-right: 12px; 
                    margin-bottom: 8px;
                    border-radius: 20px; 
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                  ">JavaScript</button>
          <button class="lang-btn" data-lang="java" 
                  style="
                    background: #1a2f2a; 
                    color: #00ff88; 
                    border: 1px solid #00ff88; 
                    padding: 10px 18px; 
                    margin-right: 12px; 
                    margin-bottom: 8px;
                    border-radius: 20px; 
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                  ">Java</button>
          <button class="lang-btn" data-lang="cpp" 
                  style="
                    background: #1a2f2a; 
                    color: #00ff88; 
                    border: 1px solid #00ff88; 
                    padding: 10px 18px; 
                    margin-bottom: 8px;
                    border-radius: 20px; 
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                  ">C++</button>
        </div>
        
        <div id="template-content" style="
          background: #000; 
          padding: 20px; 
          border-radius: 10px; 
          margin-bottom: 25px; 
          border: 1px solid #333;
          overflow-x: auto;
        ">
          <pre id="code-template" style="
            margin: 0; 
            color: #a8e6a3; 
            font-family: 'Courier New', monospace; 
            font-size: 13px; 
            white-space: pre-wrap; 
            line-height: 1.4;
          ">${templates.python}</pre>
        </div>
        
        <div style="text-align: center;">
          <button id="copy-template-btn" 
                  style="
                    background: #00ff88; 
                    color: #0d1f1b; 
                    border: none; 
                    padding: 12px 24px; 
                    border-radius: 25px; 
                    cursor: pointer; 
                    font-weight: bold; 
                    margin-right: 15px;
                    font-family: 'Courier New', monospace;
                    text-transform: uppercase;
                  ">
            📋 Copy Code
          </button>
          <button onclick="this.parentElement.parentElement.remove()" 
                  style="
                    background: #1a2f2a; 
                    color: #00ff88; 
                    border: 1px solid #00ff88; 
                    padding: 12px 24px; 
                    border-radius: 25px; 
                    cursor: pointer;
                    font-family: 'Courier New', monospace;
                    text-transform: uppercase;
                  ">
            Close
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(templateModal);
    
    // Add language switching functionality
    templateModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('lang-btn')) {
        // Update active button
        templateModal.querySelectorAll('.lang-btn').forEach(btn => {
          btn.style.background = '#1a2f2a';
          btn.style.color = '#00ff88';
          btn.style.border = '1px solid #00ff88';
          btn.classList.remove('active');
        });
        
        e.target.style.background = '#00ff88';
        e.target.style.color = '#0d1f1b';
        e.target.style.border = 'none';
        e.target.classList.add('active');
        
        // Update template content
        const lang = e.target.dataset.lang;
        const codeTemplate = templateModal.querySelector('#code-template');
        codeTemplate.textContent = templates[lang];
      }
      
      if (e.target === templateModal) templateModal.remove();
    });
    
    // Add copy functionality
    const copyBtn = templateModal.querySelector('#copy-template-btn');
    copyBtn.addEventListener('click', () => {
      const codeTemplate = templateModal.querySelector('#code-template');
      navigator.clipboard.writeText(codeTemplate.textContent).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.background = '#28a745';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.background = '#00ff88';
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy: ', err);
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = codeTemplate.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          copyBtn.textContent = '✅ Copied!';
          copyBtn.style.background = '#28a745';
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '#00ff88';
          }, 2000);
        } catch (err) {
          alert('Failed to copy code. Please select and copy manually.');
        }
        document.body.removeChild(textArea);
      });
    });
  }
}

// Initialize the problem detector
let detector;

// Ensure we don't create multiple instances
if (!window.logicCoachDetector) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      detector = new ProblemDetector();
      window.logicCoachDetector = detector;
    });
  } else {
    detector = new ProblemDetector();
    window.logicCoachDetector = detector;
  }
}

// Handle page navigation in SPAs (Single Page Applications)
let currentUrl = location.href;
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    console.log('Logic Builder Coach: URL changed, reinitializing...');
    
    // Clean up existing detector
    if (window.logicCoachDetector) {
      if (window.logicCoachDetector.floatingButton) {
        window.logicCoachDetector.floatingButton.remove();
      }
      if (window.logicCoachDetector.observer) {
        window.logicCoachDetector.observer.disconnect();
      }
    }
    
    // Create new detector after a delay to allow page to load
    setTimeout(() => {
      detector = new ProblemDetector();
      window.logicCoachDetector = detector;
    }, 1000);
  }
}).observe(document, { subtree: true, childList: true });

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.logicCoachDetector && window.logicCoachDetector.observer) {
    window.logicCoachDetector.observer.disconnect();
  }
});