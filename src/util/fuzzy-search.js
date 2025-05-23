/**
 * Fuzzy Search Utilities
 * 
 * Provides fuzzy string matching capabilities for search functionality
 */

/**
 * Calculate simple edit distance (Levenshtein distance) between two strings
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
export function editDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  
  return dp[len1][len2];
}

/**
 * Fuzzy match with tolerance for typos
 * @param {string} searchWord - Word to search for
 * @param {string} targetWord - Word to match against
 * @param {number} tolerance - Maximum edit distance allowed (default: 2)
 * @returns {boolean} Whether words match within tolerance
 */
export function fuzzyMatch(searchWord, targetWord, tolerance = 2) {
  if (searchWord === targetWord) return true;
  if (targetWord.includes(searchWord)) return true;
  
  // Allow for small typos
  if (Math.abs(searchWord.length - targetWord.length) <= tolerance) {
    const distance = editDistance(searchWord, targetWord);
    return distance <= tolerance;
  }
  
  return false;
}

/**
 * Calculate proximity of search words in text
 * @param {string} text - Text to check
 * @param {string[]} searchWords - Array of search words
 * @returns {number} Proximity score (0-1, higher is better)
 */
function calculateProximity(text, searchWords) {
  if (searchWords.length < 2) return 1;
  
  const lowerText = text.toLowerCase();
  const positions = {};
  
  // Find all positions of each search word
  for (const word of searchWords) {
    positions[word] = [];
    let pos = lowerText.indexOf(word);
    while (pos !== -1) {
      positions[word].push(pos);
      pos = lowerText.indexOf(word, pos + 1);
    }
  }
  
  // If any word is missing, no proximity
  for (const word of searchWords) {
    if (positions[word].length === 0) return 0;
  }
  
  // Calculate minimum distance between all words
  let minDistance = Infinity;
  
  // For each occurrence of the first word
  for (const pos1 of positions[searchWords[0]]) {
    let maxDist = 0;
    
    // Find closest occurrence of each other word
    for (let i = 1; i < searchWords.length; i++) {
      let closestDist = Infinity;
      for (const pos2 of positions[searchWords[i]]) {
        const dist = Math.abs(pos2 - pos1);
        if (dist < closestDist) closestDist = dist;
      }
      if (closestDist > maxDist) maxDist = closestDist;
    }
    
    if (maxDist < minDistance) minDistance = maxDist;
  }
  
  // Convert distance to proximity score (closer = higher score)
  // Words within 50 characters get high scores
  if (minDistance === Infinity) return 0;
  if (minDistance <= 10) return 1;
  if (minDistance <= 30) return 0.8;
  if (minDistance <= 50) return 0.6;
  if (minDistance <= 100) return 0.4;
  return 0.2;
}

/**
 * Score text based on fuzzy matching with search words
 * @param {string} text - Text to score
 * @param {string[]} searchWords - Array of search words
 * @param {number} baseWeight - Base weight for this text field
 * @returns {number} Score
 */
export function scoreText(text, searchWords, baseWeight = 1) {
  if (!text) return 0;
  
  let score = 0;
  const lowerText = text.toLowerCase();
  const textWords = lowerText.split(/\s+/);
  
  // Check for exact phrase match first
  const exactPhrase = searchWords.join(' ');
  if (lowerText.includes(exactPhrase)) {
    score += baseWeight * 10; // Very high bonus for exact phrase
    return score; // Return early with high score
  }
  
  // Count how many search words are present
  let wordsFound = 0;
  let wordScores = 0;
  
  for (const searchWord of searchWords) {
    let wordFound = false;
    
    // Check individual words
    for (const textWord of textWords) {
      if (fuzzyMatch(searchWord, textWord)) {
        wordFound = true;
        wordScores += baseWeight;
        // Exact match gets bonus
        if (searchWord === textWord) {
          wordScores += baseWeight;
        }
      }
    }
    
    if (wordFound) wordsFound++;
  }
  
  // Require at least half of the search words to be present
  const requiredWords = Math.ceil(searchWords.length / 2);
  if (wordsFound < requiredWords) {
    return 0; // Not enough matching words
  }
  
  // Apply word scores
  score += wordScores;
  
  // Apply proximity bonus if multiple words
  if (searchWords.length > 1) {
    const proximity = calculateProximity(text, searchWords);
    score *= (1 + proximity); // Boost score based on word proximity
  }
  
  // Penalty for partial matches (not all words found)
  if (wordsFound < searchWords.length) {
    score *= (wordsFound / searchWords.length);
  }
  
  return score;
}

/**
 * Perform fuzzy search on an array of items
 * @param {Array} items - Items to search
 * @param {string} keyword - Search keyword
 * @param {Function} scoringFunction - Function to score each item
 * @param {number} minScore - Minimum score threshold (default: 1)
 * @returns {Array} Filtered and sorted items
 */
export function fuzzySearch(items, keyword, scoringFunction, minScore = 1) {
  const lowerKeyword = keyword.toLowerCase();
  const searchWords = lowerKeyword.split(/\s+/).filter(w => w.length > 0);
  
  // Score and filter items
  const scoredItems = items
    .map(item => ({
      item,
      score: scoringFunction(item, searchWords)
    }))
    .filter(result => result.score >= minScore)
    .sort((a, b) => b.score - a.score);
  
  // Return items sorted by relevance
  return scoredItems.map(result => result.item);
}

/**
 * Create a line-based fuzzy search for text content
 * @param {string} content - Text content to search
 * @param {string} keyword - Search keyword
 * @param {number} contextLines - Number of context lines to include (default: 2)
 * @returns {Array} Array of matching sections with context
 */
export function fuzzySearchLines(content, keyword, contextLines = 2) {
  const lines = content.split('\n');
  const lowerKeyword = keyword.toLowerCase();
  const searchWords = lowerKeyword.split(/\s+/).filter(w => w.length > 0);
  const matches = [];
  
  let currentSection = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    // Track section headers
    if (line.startsWith('#')) {
      currentSection = line;
    }
    
    // Calculate line score using the improved scoring function
    const lineScore = scoreText(line, searchWords, 1);
    
    // For line-based search, we want to be more permissive
    // but still filter out completely irrelevant lines
    
    // If line matches, add it with context
    if (lineScore > 0) {
      const startIdx = Math.max(0, i - contextLines);
      const endIdx = Math.min(lines.length - 1, i + contextLines);
      const contextSnippet = lines.slice(startIdx, endIdx + 1).join('\n');
      
      matches.push({
        section: currentSection,
        line: line,
        lineNumber: i + 1,
        score: lineScore,
        context: contextSnippet
      });
    }
  }
  
  // Sort by score and return
  return matches.sort((a, b) => b.score - a.score);
}