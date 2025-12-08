/**
 * Topic matching utilities for mapping user objectives to existing topics
 *
 * Uses a multi-stage approach:
 * 1. Exact match against known topics
 * 2. Alias lookup
 * 3. Fuzzy matching using Levenshtein distance
 * 4. Keyword extraction and matching
 */

import { TOPIC_ALIASES, normalizeForAlias, lookupAlias } from './topic-aliases';

export interface MatchResult {
  topic: string | null;
  confidence: number;
  matchType: 'exact' | 'alias' | 'fuzzy' | 'keyword' | 'none';
  alternatives?: Array<{ topic: string; confidence: number }>;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0-1) based on Levenshtein distance
 */
function calculateSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - distance / maxLength;
}

/**
 * Extract keywords from an objective string
 */
function extractKeywords(objective: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'about', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'under', 'again',
    'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
    'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'can', 'will', 'just', 'should', 'now', 'what', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do',
    'does', 'did', 'doing', 'would', 'could', 'might', 'must', 'shall',
    'learn', 'understand', 'know', 'study', 'practice', 'quiz', 'test', 'me'
  ]);

  return objective
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Check if a topic contains any of the given keywords
 */
function topicContainsKeywords(topic: string, keywords: string[]): number {
  const topicParts = topic.toLowerCase().split('-');
  let matches = 0;

  for (const keyword of keywords) {
    for (const part of topicParts) {
      if (part.includes(keyword) || keyword.includes(part)) {
        matches++;
        break;
      }
    }
  }

  return keywords.length > 0 ? matches / keywords.length : 0;
}

/**
 * Match an objective to the best available topic
 *
 * @param objective - The user's learning objective or topic request
 * @param availableTopics - List of known topic IDs in the item bank
 * @returns Match result with topic, confidence, and match type
 */
export function matchTopic(objective: string, availableTopics: string[]): MatchResult {
  if (!objective || objective.trim().length === 0) {
    return { topic: null, confidence: 0, matchType: 'none' };
  }

  const normalized = normalizeForAlias(objective);
  const topicsSet = new Set(availableTopics.map(t => t.toLowerCase()));

  // Step 1: Exact match
  const exactMatch = availableTopics.find(t => t.toLowerCase() === normalized);
  if (exactMatch) {
    return { topic: exactMatch, confidence: 1.0, matchType: 'exact' };
  }

  // Also check with hyphenation
  const hyphenated = normalized.replace(/\s+/g, '-');
  const hyphenMatch = availableTopics.find(t => t.toLowerCase() === hyphenated);
  if (hyphenMatch) {
    return { topic: hyphenMatch, confidence: 1.0, matchType: 'exact' };
  }

  // Step 2: Alias lookup
  const aliasMatch = lookupAlias(objective);
  if (aliasMatch && topicsSet.has(aliasMatch.toLowerCase())) {
    const actualTopic = availableTopics.find(t => t.toLowerCase() === aliasMatch.toLowerCase());
    return { topic: actualTopic || aliasMatch, confidence: 0.95, matchType: 'alias' };
  }

  // Step 3: Fuzzy matching using Levenshtein distance
  const fuzzyMatches: Array<{ topic: string; score: number }> = [];

  for (const topic of availableTopics) {
    // Compare against full topic
    const fullScore = calculateSimilarity(normalized, topic);

    // Compare against topic without prefix (js-, react-, math-, etc.)
    const topicWithoutPrefix = topic.replace(/^(js|react|math|science|html|css|git|vibe|reading)-/, '');
    const prefixlessScore = calculateSimilarity(normalized, topicWithoutPrefix);

    // Compare objective without common prefixes
    const objectiveClean = normalized.replace(/^(javascript|react|math|science)\s*/i, '');
    const cleanScore = calculateSimilarity(objectiveClean, topicWithoutPrefix);

    const bestScore = Math.max(fullScore, prefixlessScore, cleanScore);
    fuzzyMatches.push({ topic, score: bestScore });
  }

  fuzzyMatches.sort((a, b) => b.score - a.score);

  if (fuzzyMatches.length > 0 && fuzzyMatches[0].score >= 0.7) {
    return {
      topic: fuzzyMatches[0].topic,
      confidence: fuzzyMatches[0].score,
      matchType: 'fuzzy',
      alternatives: fuzzyMatches.slice(1, 4).filter(m => m.score >= 0.5).map(m => ({
        topic: m.topic,
        confidence: m.score
      }))
    };
  }

  // Step 4: Keyword extraction and matching
  const keywords = extractKeywords(objective);
  if (keywords.length > 0) {
    const keywordMatches: Array<{ topic: string; score: number }> = [];

    for (const topic of availableTopics) {
      const score = topicContainsKeywords(topic, keywords);
      if (score > 0) {
        keywordMatches.push({ topic, score });
      }
    }

    keywordMatches.sort((a, b) => b.score - a.score);

    if (keywordMatches.length > 0 && keywordMatches[0].score >= 0.5) {
      return {
        topic: keywordMatches[0].topic,
        confidence: keywordMatches[0].score * 0.8, // Discount keyword matches slightly
        matchType: 'keyword',
        alternatives: keywordMatches.slice(1, 4).map(m => ({
          topic: m.topic,
          confidence: m.score * 0.8
        }))
      };
    }
  }

  // No good match found - return best fuzzy match if any, with low confidence
  if (fuzzyMatches.length > 0 && fuzzyMatches[0].score >= 0.4) {
    return {
      topic: fuzzyMatches[0].topic,
      confidence: fuzzyMatches[0].score * 0.7, // Low confidence
      matchType: 'fuzzy',
      alternatives: fuzzyMatches.slice(1, 4).map(m => ({
        topic: m.topic,
        confidence: m.score * 0.7
      }))
    };
  }

  return { topic: null, confidence: 0, matchType: 'none' };
}

/**
 * Get the confidence threshold for using item bank vs generating
 */
export const MATCH_THRESHOLD = 0.6;

/**
 * Check if a match is good enough to use item bank
 */
export function shouldUseItemBank(match: MatchResult): boolean {
  return match.topic !== null && match.confidence >= MATCH_THRESHOLD;
}
