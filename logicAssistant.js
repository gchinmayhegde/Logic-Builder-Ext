// logicAssistant.js - AI Logic Analysis using OpenRouter API

class LogicAssistant {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://openrouter.ai/api/v1/chat/completions';
    this.defaultModel = 'anthropic/claude-3-haiku';
  }

  async analyzeLogic(problemData) {
    if (!this.apiKey) {
      console.warn('No API key provided, using mock analysis');
      return this.getMockAnalysis(problemData);
    }

    const prompt = this.buildLogicPrompt(problemData);

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': chrome.runtime.getURL('/'),
          'X-Title': 'Logic Builder Coach'
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt()
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.3,
          top_p: 0.9
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const analysis = data.choices[0].message.content;
      
      return this.parseAnalysis(analysis, problemData);

    } catch (error) {
      console.error('AI Analysis error:', error);
      return this.getMockAnalysis(problemData);
    }
  }

  getSystemPrompt() {
    return `You are a coding logic coach for beginner programmers. Your role is to help them understand how to approach coding problems step by step, focusing on logical thinking rather than just providing code.

When analyzing a coding problem, provide a structured breakdown that includes:

1. INPUT/OUTPUT FORMAT: Clearly identify what comes in and what should come out
2. CONSTRAINTS & EDGE CASES: Important limitations and special cases to consider  
3. STEP-BY-STEP LOGICAL PLAN: A clear roadmap of how to solve the problem
4. COMMON MISTAKES: Specific pitfalls beginners should watch out for

Format your response in clear sections with headers. Be encouraging and educational. Focus on building understanding, not just giving answers. Use simple language and explain your reasoning.`;
  }

  buildLogicPrompt(problemData) {
    return `Please analyze this coding problem for a beginner programmer:

**Problem Title:** ${problemData.title}
**Platform:** ${problemData.site}
**Problem Description:** ${problemData.description}
**Difficulty:** ${problemData.difficulty || 'Unknown'}

Provide a beginner-friendly logical breakdown following the format:

## Problem Breakdown: [Title]

**1. Input/Output Format:**
- Input: [describe the input format]
- Output: [describe expected output]
- Example: [if available]

**2. Constraints & Edge Cases:**
- [list important constraints]
- [identify edge cases to consider]

**3. Step-by-Step Logical Plan:**
1. [first step]
2. [second step]  
3. [continue with clear steps]

**4. Common Mistakes to Avoid:**
- [specific mistake 1]
- [specific mistake 2]
- [etc.]

Focus on helping them think through the problem logically before jumping to code. Be specific to this problem, not generic.`;
  }

  parseAnalysis(aiResponse, problemData) {
    // Parse the AI response into structured sections
    const sections = {
      inputOutput: '',
      edgeCases: '',
      stepPlan: '',
      commonMistakes: '',
      fullAnalysis: aiResponse
    };

    try {
      // Extract sections using regex patterns
      const inputOutputMatch = aiResponse.match(/\*\*1\. Input\/Output Format:\*\*(.*?)(?=\*\*2\.|$)/s);
      if (inputOutputMatch) sections.inputOutput = inputOutputMatch[1].trim();

      const edgeCasesMatch = aiResponse.match(/\*\*2\. Constraints & Edge Cases:\*\*(.*?)(?=\*\*3\.|$)/s);
      if (edgeCasesMatch) sections.edgeCases = edgeCasesMatch[1].trim();

      const stepPlanMatch = aiResponse.match(/\*\*3\. Step-by-Step Logical Plan:\*\*(.*?)(?=\*\*4\.|$)/s);
      if (stepPlanMatch) sections.stepPlan = stepPlanMatch[1].trim();

      const mistakesMatch = aiResponse.match(/\*\*4\. Common Mistakes to Avoid:\*\*(.*?)$/s);
      if (mistakesMatch) sections.commonMistakes = mistakesMatch[1].trim();

    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    return {
      problem: problemData,
      analysis: sections,
      timestamp: Date.now(),
      source: 'ai'
    };
  }

  getMockAnalysis(problemData) {
    // Fallback mock analysis when AI is not available
    const mockSections = {
      inputOutput: `
- Input: Based on the problem description, we need to identify the exact data format
- Output: Determine what type of result is expected  
- Example: Look for sample inputs and outputs in the problem statement
- Data Types: Consider if we're working with integers, strings, arrays, etc.`,

      edgeCases: `
- Empty input: What happens with null, empty array, or empty string?
- Single element: How does your solution handle minimal valid input?
- Boundary values: Consider minimum and maximum constraint limits
- Duplicate elements: Are duplicates allowed? How should they be handled?
- Large input size: Will your solution scale with the given constraints?`,

      stepPlan: `
1. **Input Validation**: Check for edge cases and invalid inputs first
2. **Initialize Variables**: Set up any counters, result variables, or data structures needed
3. **Main Logic**: 
   - Process the input data systematically
   - Apply the required operations or transformations  
   - Update result variables as you progress
4. **Return Result**: Format and return the final answer

**Approach Strategy**: Start with a simple brute force solution to understand the problem, then optimize if needed using better algorithms or data structures.`,

      commonMistakes: `
- **Off-by-one errors**: Check array indices carefully (0 to n-1, not 1 to n)
- **Null pointer exceptions**: Always validate inputs before accessing properties
- **Integer overflow**: Use appropriate data types for calculations with large numbers
- **Infinite loops**: Ensure loop conditions will eventually become false
- **Modifying during iteration**: Be careful when changing collections while looping through them
- **Forgotten edge cases**: Always test with empty inputs, single elements, and boundary values`,

      fullAnalysis: `## Problem Breakdown: ${problemData.title}

This is a mock analysis generated because no AI API key was configured. The actual analysis would provide more specific insights based on the problem content.

**Problem:** ${problemData.title}  
**Platform:** ${problemData.site}
**Description:** ${problemData.description.substring(0, 200)}...`
    };

    return {
      problem: problemData,
      analysis: mockSections,
      timestamp: Date.now(),
      source: 'mock'
    };
  }

  async generateHint(problemData, context = 'general') {
    if (!this.apiKey) {
      return this.getMockHint(context);
    }

    const hintPrompt = `Give a short, encouraging hint for this coding problem. Focus on the next logical step or thinking approach, not the solution:

Problem: ${problemData.title}
Context: ${context}

Provide just 1-2 sentences that guide thinking without giving away the answer.`;

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': chrome.runtime.getURL('/'),
          'X-Title': 'Logic Builder Coach'
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful coding tutor. Give brief, encouraging hints that guide thinking without revealing solutions.'
            },
            {
              role: 'user',
              content: hintPrompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Hint generation failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('Hint generation error:', error);
      return this.getMockHint(context);
    }
  }

  getMockHint(context) {
    const hints = {
      general: [
        "💡 Start by clearly understanding what the problem is asking - read it twice if needed!",
        "🔍 Look for keywords that hint at the approach: 'sorted' → binary search, 'subarray' → sliding window",
        "📝 Write down the input format and expected output format first",
        "🧪 Think of 2-3 test cases, including edge cases"
      ],
      start: [
        "⚡ Can you solve it with brute force first? Optimization comes later!",
        "🗂️ What data structure would make this easier? Array, hash map, stack, queue?",
        "🔄 Is there a pattern you can exploit? Are there repetitive calculations you can avoid?"
      ],
      stuck: [
        "🤔 Try working through a small example step by step",
        "📊 Draw out the problem or visualize the data flow",
        "🔍 Break the problem into smaller sub-problems"
      ]
    };

    const categoryHints = hints[context] || hints.general;
    return categoryHints[Math.floor(Math.random() * categoryHints.length)];
  }

  async generateCodeTemplate(problemData, language = 'python') {
    if (!this.apiKey) {
      return this.getMockCodeTemplate(language);
    }

    const templatePrompt = `Generate a basic code template for this problem in ${language}. Include:
- Function signature with appropriate parameter names
- Basic structure with comments indicating where logic goes  
- Handle edge cases
- Return statement
- Do NOT include the actual solution logic

Problem: ${problemData.title}
Description: ${problemData.description.substring(0, 300)}`;

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': chrome.runtime.getURL('/'),
          'X-Title': 'Logic Builder Coach'
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages: [
            {
              role: 'system',
              content: 'Generate code templates for coding problems. Include structure and comments but not the solution logic.'
            },
            {
              role: 'user',
              content: templatePrompt
            }
          ],
          max_tokens: 400,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Template generation failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();

    } catch (error) {
      console.error('Template generation error:', error);
      return this.getMockCodeTemplate(language);
    }
  }

  getMockCodeTemplate(language) {
    const templates = {
      python: `def solution(nums):
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
    # TODO: Implement your solution
    
    return result

# Test your solution
# print(solution([1, 2, 3]))`,

      javascript: `function solution(nums) {
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
    // TODO: Implement your solution
    
    return result;
}

// Test your solution
// console.log(solution([1, 2, 3]));`,

      java: `public class Solution {
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
        // TODO: Implement your solution
        
        return result;
    }
    
    // Test your solution
    // public static void main(String[] args) {
    //     Solution sol = new Solution();
    //     System.out.println(sol.solution(new int[]{1, 2, 3}));
    // }
}`,

      cpp: `#include <vector>
#include <iostream>
using namespace std;

class Solution {
public:
    int solution(vector<int>& nums) {
        /*
         * Your solution logic goes here
         * 
         * @param nums Input parameter (adjust based on problem)
         * @return Result based on problem requirements
         */
        
        // Handle edge cases
        if (nums.empty()) {
            return -1; // or appropriate default
        }
        
        // Initialize variables
        int result = 0;
        
        // Main logic goes here
        // TODO: Implement your solution
        
        return result;
    }
};

// Test your solution
// int main() {
//     Solution sol;
//     vector<int> nums = {1, 2, 3};
//     cout << sol.solution(nums) << endl;
//     return 0;
// }`
    };

    return templates[language] || templates.python;
  }

  async findSimilarProblems(problemData) {
    if (!this.apiKey) {
      return this.getMockSimilarProblems();
    }

    // This would require a database of problems or another API
    // For now, return mock data
    return this.getMockSimilarProblems();
  }

  getMockSimilarProblems() {
    return [
      {
        title: "Two Sum",
        platform: "LeetCode",
        difficulty: "Easy",
        reason: "Similar array traversal pattern"
      },
      {
        title: "Contains Duplicate",
        platform: "LeetCode", 
        difficulty: "Easy",
        reason: "Uses hash set for efficient lookups"
      },
      {
        title: "Valid Anagram",
        platform: "LeetCode",
        difficulty: "Easy", 
        reason: "Character frequency counting approach"
      }
    ];
  }

  // Utility method to estimate problem complexity
  estimateComplexity(problemData) {
    const description = problemData.description.toLowerCase();
    const title = problemData.title.toLowerCase();
    
    const patterns = {
      'O(n)': ['iterate', 'traverse', 'linear', 'single pass'],
      'O(n log n)': ['sort', 'divide', 'merge', 'binary search'],
      'O(n²)': ['nested', 'pairs', 'subarray', 'matrix'],
      'O(2^n)': ['subset', 'combination', 'recursive', 'backtrack'],
      'O(1)': ['constant', 'direct', 'formula', 'math']
    };

    for (const [complexity, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => 
        description.includes(keyword) || title.includes(keyword)
      )) {
        return complexity;
      }
    }

    return 'Unknown';
  }

  // Method to suggest appropriate data structures
  suggestDataStructures(problemData) {
    const description = problemData.description.toLowerCase();
    const suggestions = [];

    const structures = {
      'Array': ['index', 'element', 'iterate', 'linear'],
      'Hash Map': ['frequency', 'count', 'lookup', 'unique', 'duplicate'],
      'Stack': ['last', 'recent', 'parentheses', 'valid', 'balance'],
      'Queue': ['first', 'order', 'level', 'breadth'],
      'Heap': ['maximum', 'minimum', 'priority', 'top k', 'largest', 'smallest'],
      'Tree': ['binary', 'node', 'parent', 'child', 'depth'],
      'Graph': ['connection', 'path', 'distance', 'neighbor', 'edge']
    };

    for (const [structure, keywords] of Object.entries(structures)) {
      if (keywords.some(keyword => description.includes(keyword))) {
        suggestions.push(structure);
      }
    }

    return suggestions.length ? suggestions : ['Array'];
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LogicAssistant;
} else {
  window.LogicAssistant = LogicAssistant;
}