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
            <button class="logic-coach-btn logic-coach-btn-primary" onclick="showFirstStepHint()">
              💡 What should I do first?
            </button>
            <button class="logic-coach-btn logic-coach-btn-secondary" onclick="showCodeTemplate()">
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
              <span>1. Input/Output Format</span>
              <span class="logic-coach-chevron">▼</span>
            </button>
            <div class="logic-coach-section-content">
              <ul>
                <li><strong>Input:</strong> Based on the problem description, identify the exact data format</li>
                <li><strong>Output:</strong> Determine what type of result is expected</li>
                <li><strong>Example:</strong> Look for sample inputs and outputs in the problem statement</li>
                <li><strong>Data Types:</strong> Consider if we're working with integers, strings, arrays, etc.</li>
              </ul>
            </div>
          </div>

          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn">
              <span>2. Constraints & Edge Cases</span>
              <span class="logic-coach-chevron">▶</span>
            </button>
            <div class="logic-coach-section-content" style="display: none;">
              <ul>
                <li><strong>Empty input:</strong> What happens with null, empty array, or empty string?</li>
                <li><strong>Single element:</strong> How does your solution handle minimal valid input?</li>
                <li><strong>Boundary values:</strong> Consider minimum and maximum constraint limits</li>
                <li><strong>Duplicate elements:</strong> Are duplicates allowed? How should they be handled?</li>
                <li><strong>Large input size:</strong> Will your solution scale with the given constraints?</li>
              </ul>
            </div>
          </div>

          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn">
              <span>3. Step-by-Step Logical Plan</span>
              <span class="logic-coach-chevron">▶</span>
            </button>
            <div class="logic-coach-section-content" style="display: none;">
              <ol>
                <li><strong>Input Validation:</strong> Check for edge cases and invalid inputs first</li>
                <li><strong>Initialize Variables:</strong> Set up any counters, result variables, or data structures needed</li>
                <li><strong>Main Logic:</strong> 
                  <ul>
                    <li>Process the input data systematically</li>
                    <li>Apply the required operations or transformations</li>
                    <li>Update result variables as you progress</li>
                  </ul>
                </li>
                <li><strong>Return Result:</strong> Format and return the final answer</li>
              </ol>
              <div style="margin-top: 15px; padding: 15px; background: #0d1f1b; border-radius: 8px; border-left: 4px solid #00ff88;">
                <strong style="color: #00ff88;">💡 Approach Strategy:</strong>
                <br><span style="color: #a8e6a3;">• Start with a simple brute force solution to understand the problem</span>
                <br><span style="color: #a8e6a3;">• Then optimize using better algorithms or data structures</span>
                <br><span style="color: #a8e6a3;">• Consider: Hash maps, two pointers, sliding window, dynamic programming</span>
              </div>
            </div>
          </div>

          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn">
              <span>4. Common Mistakes to Avoid</span>
              <span class="logic-coach-chevron">▶</span>
            </button>
            <div class="logic-coach-section-content" style="display: none;">
              <div class="mistake-item">
                <strong>🚨 Off-by-one errors:</strong> Check array indices carefully (0 to n-1, not 1 to n)
              </div>
              <div class="mistake-item">
                <strong>🚨 Not handling empty arrays:</strong> Always validate inputs before accessing properties
              </div>
              <div class="mistake-item">
                <strong>🚨 Integer overflow:</strong> Use appropriate data types for calculations with large numbers
              </div>
              <div class="mistake-item">
                <strong>🚨 Forgetting negative numbers:</strong> Consider negative values if applicable to your problem
              </div>
            </div>
          </div>

          <div class="logic-coach-actions">
            <button class="logic-coach-btn logic-coach-btn-primary" onclick="showFirstStepHint()">
              💡 What should I do first?
            </button>
            <button class="logic-coach-btn logic-coach-btn-secondary" onclick="showCodeTemplate()">
              📝 Show Code Example
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize the problem detector
let detector;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    detector = new ProblemDetector();
  });
} else {
  detector = new ProblemDetector();
}

// Add collapsible functionality
document.addEventListener('click', (e) => {
  if (e.target.matches('.logic-coach-section-btn') || e.target.matches('.logic-coach-section-btn *')) {
    const btn = e.target.closest('.logic-coach-section-btn');
    const content = btn.nextElementSibling;
    const chevron = btn.querySelector('.logic-coach-chevron');
    
    if (content.style.display === 'none' || !content.style.display) {
      content.style.display = 'block';
      chevron.textContent = '▼';
      btn.classList.add('active');
    } else {
      content.style.display = 'none';
      chevron.textContent = '▶';
      btn.classList.remove('active');
    }
  }
});

// Global functions for modal buttons
window.showFirstStepHint = function() {
  const hints = [
    "💡 First, read the problem statement carefully and identify what you're being asked to do.",
    "🔍 Look at the examples provided - they often reveal the pattern or approach needed.",
    "📋 Write down the input format and expected output format clearly.",
    "⚡ Think about the simplest brute force approach first - optimization comes later!",
    "🗂️ Consider what data structures might help: arrays, hash maps, stacks, queues?",
    "🧪 Come up with 2-3 test cases yourself, including edge cases like empty inputs."
  ];
  
  const randomHint = hints[Math.floor(Math.random() * hints.length)];
  
  // Create hint modal
  const hintModal = document.createElement('div');
  hintModal.style.cssText = `
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
  
  hintModal.innerHTML = `
    <div style="background: linear-gradient(135deg, #0d1f1b 0%, #1a2f2a 100%); 
                color: #00ff88; 
                padding: 30px; 
                border-radius: 15px; 
                max-width: 500px; 
                margin: 20px;
                border: 2px solid #00ff88;
                box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);">
      <h3 style="margin-top: 0; color: #00ff88; text-align: center;">💡 Next Step Hint</h3>
      <p style="font-size: 16px; line-height: 1.6; margin: 20px 0; color: #a8e6a3;">${randomHint}</p>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: #00ff88; color: #0d1f1b; border: none; padding: 10px 20px; 
                     border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%;
                     font-size: 14px;">
        Got it! 👍
      </button>
    </div>
  `;
  
  document.body.appendChild(hintModal);
  
  hintModal.addEventListener('click', (e) => {
    if (e.target === hintModal) hintModal.remove();
  });
};

window.showCodeTemplate = function() {
  // Get the current problem data
  const problemTitle = detector?.problemData?.title || 'Unknown Problem';
  const problemSite = detector?.problemData?.site || 'Unknown';
  
  const templates = {
    python: `# ${problemTitle} - ${problemSite}
def solution(nums):
    """
    Your solution logic goes here
    
    Args:
        nums: Input parameter (adjust based on problem)
        
    Returns:
        Result based on problem requirements
    """
    
    # Handle edge cases
    if not nums:
        return None  # or appropriate default
    
    # Initialize variables
    result = None
    
    # Main logic goes here
    # TODO: Implement your solution step by step
    # 1. Process input
    # 2. Apply algorithm
    # 3. Return result
    
    return result

# Test your solution
# Example usage:
# print(solution([1, 2, 3]))`,

    javascript: `// ${problemTitle} - ${problemSite}
function solution(nums) {
    /**
     * Your solution logic goes here
     * 
     * @param {number[]} nums - Input parameter (adjust based on problem)
     * @returns {number} Result based on problem requirements
     */
    
    // Handle edge cases
    if (!nums || nums.length === 0) {
        return null; // or appropriate default
    }
    
    // Initialize variables
    let result = null;
    
    // Main logic goes here
    // TODO: Implement your solution step by step
    // 1. Process input
    // 2. Apply algorithm  
    // 3. Return result
    
    return result;
}

// Test your solution
// Example usage:
// console.log(solution([1, 2, 3]));`,

    java: `// ${problemTitle} - ${problemSite}
public class Solution {
    public int solution(int[] nums) {
        /*
         * Your solution logic goes here
         * 
         * @param nums Input parameter (adjust based on problem)
         * @return Result based on problem requirements
         */
        
        // Handle edge cases
        if (nums == null || nums.length == 0) {
            return -1; // or appropriate default
        }
        
        // Initialize variables
        int result = 0;
        
        // Main logic goes here
        // TODO: Implement your solution step by step
        // 1. Process input
        // 2. Apply algorithm
        // 3. Return result
        
        return result;
    }
}`
  };

  // Create template modal
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
    <div style="background: #0d1f1b; 
                color: #00ff88; 
                padding: 30px; 
                border-radius: 15px; 
                max-width: 800px; 
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                border: 2px solid #00ff88;
                box-shadow: 0 0 30px rgba(0, 255, 136, 0.3);">
      <h3 style="margin-top: 0; color: #00ff88; text-align: center;">📝 Code Templates</h3>
      
      <div style="margin-bottom: 20px;">
        <button class="lang-btn active" data-lang="python" style="background: #00ff88; color: #0d1f1b; border: none; padding: 8px 16px; margin-right: 10px; border-radius: 5px; cursor: pointer; font-weight: bold;">Python</button>
        <button class="lang-btn" data-lang="javascript" style="background: #1a2f2a; color: #00ff88; border: 1px solid #00ff88; padding: 8px 16px; margin-right: 10px; border-radius: 5px; cursor: pointer;">JavaScript</button>
        <button class="lang-btn" data-lang="java" style="background: #1a2f2a; color: #00ff88; border: 1px solid #00ff88; padding: 8px 16px; border-radius: 5px; cursor: pointer;">Java</button>
      </div>
      
      <div id="template-content" style="background: #000; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #333;">
        <pre id="code-template" style="margin: 0; color: #a8e6a3; font-family: 'Courier New', monospace; font-size: 14px; white-space: pre-wrap; overflow-x: auto;">${templates.python}</pre>
      </div>
      
      <div style="text-align: center;">
        <button onclick="copyTemplate()" style="background: #00ff88; color: #0d1f1b; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-right: 10px;">
          📋 Copy Code
        </button>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #1a2f2a; color: #00ff88; border: 1px solid #00ff88; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
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
  window.copyTemplate = function() {
    const codeTemplate = templateModal.querySelector('#code-template');
    navigator.clipboard.writeText(codeTemplate.textContent).then(() => {
      const copyBtn = templateModal.querySelector('button');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅ Copied!';
      copyBtn.style.background = '#28a745';
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '#00ff88';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('Failed to copy code. Please select and copy manually.');
    });
  };
};