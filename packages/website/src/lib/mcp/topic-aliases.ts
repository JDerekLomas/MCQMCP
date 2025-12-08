/**
 * Topic alias mapping for common variations
 *
 * Maps common names, abbreviations, and synonyms to canonical topic IDs.
 */

export const TOPIC_ALIASES: Record<string, string> = {
  // React
  "useeffect": "react-hooks",
  "usestate": "react-state",
  "usecontext": "react-hooks",
  "usememo": "react-hooks",
  "usecallback": "react-hooks",
  "react hooks": "react-hooks",
  "hooks": "react-hooks",

  // JavaScript Core
  "closures": "js-closures",
  "closure": "js-closures",
  "javascript closures": "js-closures",
  "async/await": "js-async",
  "async await": "js-async",
  "promises": "js-async",
  "promise": "js-async",
  "asynchronous": "js-async",
  "this keyword": "js-this",
  "this": "js-this",
  "arrow functions": "js-this",
  "prototypes": "js-prototypes",
  "prototype": "js-prototypes",
  "inheritance": "js-prototypes",
  "event loop": "js-async",
  "timers": "js-timers",
  "settimeout": "js-timers",
  "setinterval": "js-timers",

  // Math
  "algebra": "math-algebra-1",
  "algebra 1": "math-algebra-1",
  "algebra 2": "math-algebra-2",
  "geometry": "math-geometry",
  "calculus": "math-calculus",
  "statistics": "math-statistics",
  "probability": "math-probability",
  "pre-algebra": "math-pre-algebra",
  "prealgebra": "math-pre-algebra",
  "arithmetic": "math-pre-algebra",
  "percentages": "math-percentages",
  "word problems": "math-word-problems",

  // Science
  "biology": "science-biology",
  "chemistry": "science-chemistry",
  "physics": "science-physics",

  // Reading
  "reading comprehension": "reading-comprehension",
  "reading": "reading-comprehension",
  "comprehension": "reading-comprehension",
};

/**
 * Normalize a string for alias lookup
 */
export function normalizeForAlias(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Look up a canonical topic from an alias
 */
export function lookupAlias(objective: string): string | null {
  const normalized = normalizeForAlias(objective);
  return TOPIC_ALIASES[normalized] || null;
}
