// Content Script for Logic Builder Coach
// Detects coding problems on supported websites

class ProblemDetector {
  constructor() {
    this.site = this.detectSite();
    this.problemData = null;
    this.floatingButton = null;
    this.init();
  }

  detectSite() {
    const hostname = window.location.hostname;
    if (hostname.includes('leetcode.com')) return 'leetcode';
    if (hostname.includes('geeksforgeeks.org')) return 'geeksforgeeks';
    if (hostname.includes('hackerrank.com')) return 'hackerrank';
    if (hostname.includes('codeforces.com')) return 'codeforces';
    if (hostname.includes('codechef.com')) return 'codechef';
    return 'unknown';
  }

  init() {
    if (this.site === 'unknown') return;
    
    // Wait for page to load completely
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.detectProblem());
    } else {
      this.detectProblem();
    }

    // Listen for dynamic content changes
    const observer = new MutationObserver(() => {
      if (!this.problemData) {
        this.detectProblem();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  detectProblem() {
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
      this.problemData = problem;
      this.notifyProblemDetected(problem);
      this.createFloatingButton();
    }
  }

  extractLeetCodeProblem() {
    const titleElement = document.querySelector('[data-cy="question-title"]') || 
    document.querySelector('.css-v3d350') ||
    document.querySelector('h1');
    
    const descriptionElement = document.querySelector('[data-key="description-content"]') ||
    document.querySelector('.content__u3I1 .question-content') ||
    document.querySelector('.elfjS');

    if (!titleElement) return null;

    const title = titleElement.textContent.trim();
    const description = descriptionElement ? 
      this.cleanDescription(descriptionElement.textContent) : 
      'Problem description not found';

    const difficultyElement = document.querySelector('[diff]') ||
    document.querySelector('.css-10o4wqw');
    const difficulty = difficultyElement ? difficultyElement.textContent.trim() : 'Unknown';

    return {
      title,
      description: description.substring(0, 1000) + (description.length > 1000 ? '...' : ''),
      difficulty,
      site: 'LeetCode',
      url: window.location.href
    };
  }

  extractGeeksForGeeksProblem() {
    const titleElement = document.querySelector('.problems_problem_content__title__L2lLn') ||
  document.querySelector('h1') ||
  document.querySelector('.problem-title');
    
    const descriptionElement = document.querySelector('.problems_problem_content__taskDescription__9yaM1') ||
    document.querySelector('.problem-statement') ||
    document.querySelector('.MuiTypography-root');

    if (!titleElement) return null;

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
    const titleElement = document.querySelector('.ui-icon-label') ||
                        document.querySelector('h1') ||
                        document.querySelector('.challenge-title');
    
    const descriptionElement = document.querySelector('.challenge-body-html') ||
                             document.querySelector('.problem-statement') ||
                             document.querySelector('.challenge-text');

    if (!titleElement) return null;

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
    chrome.runtime.sendMessage({
      action: 'problemDetected',
      problem: problem
    });
  }

  createFloatingButton() {
    if (this.floatingButton) return;

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
      // This would integrate with your AI service
      // For now, showing a sample breakdown
      const breakdown = await this.getMockLogicBreakdown();
      
      const content = modal.querySelector('.logic-coach-content');
      content.innerHTML = breakdown;
      
    } catch (error) {
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

  async getMockLogicBreakdown() {
    // Mock implementation - replace with actual AI API call
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
                <li><strong>Input:</strong> Array of integers</li>
                <li><strong>Output:</strong> Integer representing the result</li>
                <li><strong>Example:</strong> [1,2,3] → 6</li>
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
                <li>Empty array: What should we return?</li>
                <li>Single element array</li>
                <li>All negative numbers</li>
                <li>Very large numbers (integer overflow?)</li>
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
                <li>Check if array is empty → return 0 or appropriate value</li>
                <li>Initialize result variable</li>
                <li>Iterate through each element</li>
                <li>Apply the required operation</li>
                <li>Return the final result</li>
              </ol>
            </div>
          </div>

          <div class="logic-coach-collapsible">
            <button class="logic-coach-section-btn">
              <span>4. Common Mistakes to Avoid</span>
              <span class="logic-coach-chevron">▶</span>
            </button>
            <div class="logic-coach-section-content" style="display: none;">
              <ul>
                <li>🚨 Off-by-one errors in array indexing</li>
                <li>🚨 Not handling empty arrays</li>
                <li>🚨 Integer overflow for large numbers</li>
                <li>🚨 Forgetting to handle negative numbers</li>
              </ul>
            </div>
          </div>

          <div class="logic-coach-actions">
            <button class="logic-coach-btn logic-coach-btn-primary" onclick="alert('Feature coming soon!')">
              💡 What should I do first?
            </button>
            <button class="logic-coach-btn logic-coach-btn-secondary" onclick="alert('Code examples coming soon!')">
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