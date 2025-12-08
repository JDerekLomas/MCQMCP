/**
 * Topic aliases for matching user objectives to existing topics
 *
 * Maps common variations, abbreviations, and synonyms to canonical topic IDs.
 * Used by the topic matcher as the first step before fuzzy matching.
 */

export const TOPIC_ALIASES: Record<string, string> = {
  // ============================================
  // React
  // ============================================
  "useeffect": "react-hooks",
  "use effect": "react-hooks",
  "usestate": "react-state",
  "use state": "react-state",
  "usecontext": "react-hooks",
  "usememo": "react-hooks",
  "usecallback": "react-hooks",
  "usereducer": "react-state",
  "useref": "react-hooks",
  "react hooks": "react-hooks",
  "hooks": "react-hooks",
  "react state": "react-state",
  "state management": "react-state",
  "react rendering": "react-rendering",
  "virtual dom": "react-rendering",
  "reconciliation": "react-rendering",
  "react patterns": "react-patterns",
  "higher order components": "react-patterns",
  "hoc": "react-patterns",
  "render props": "react-patterns",
  "compound components": "react-patterns",

  // ============================================
  // JavaScript Core
  // ============================================
  "closures": "js-closures",
  "closure": "js-closures",
  "lexical scope": "js-closures",
  "lexical scoping": "js-closures",
  "async/await": "js-async",
  "async await": "js-async",
  "promises": "js-async",
  "promise": "js-async",
  "asynchronous": "js-async",
  "callbacks": "js-async",
  "this keyword": "js-this",
  "this binding": "js-this",
  "call apply bind": "js-this",
  "arrow functions": "js-this",
  "prototypes": "js-prototypes",
  "prototype chain": "js-prototypes",
  "inheritance": "js-prototypes",
  "prototypal inheritance": "js-prototypes",
  "event loop": "js-async",
  "microtasks": "js-timers",
  "settimeout": "js-timers",
  "setinterval": "js-timers",
  "timers": "js-timers",
  "design patterns": "js-patterns",
  "module pattern": "js-patterns",
  "singleton": "js-patterns",
  "factory": "js-patterns",
  "javascript fundamentals": "js-fundamentals",
  "js basics": "js-fundamentals",
  "variables": "js-fundamentals",
  "hoisting": "js-fundamentals",
  "scope": "js-fundamentals",

  // ============================================
  // HTML/CSS
  // ============================================
  "dom events": "html-events",
  "event handling": "html-events",
  "event bubbling": "html-events",
  "event delegation": "html-events",
  "tailwind": "css-tailwind",
  "tailwind css": "css-tailwind",
  "css": "css-tailwind",

  // ============================================
  // Git
  // ============================================
  "git": "git-basics",
  "version control": "git-basics",
  "git commands": "git-basics",
  "branching": "git-basics",
  "merge": "git-basics",
  "rebase": "git-basics",

  // ============================================
  // Mathematics
  // ============================================
  "algebra": "math-algebra-1",
  "algebra 1": "math-algebra-1",
  "algebra 2": "math-algebra-2",
  "linear equations": "math-algebra-1",
  "quadratic equations": "math-algebra-2",
  "geometry": "math-geometry",
  "triangles": "math-geometry",
  "circles": "math-geometry",
  "area": "math-geometry",
  "perimeter": "math-geometry",
  "calculus": "math-calculus",
  "derivatives": "math-calculus",
  "integrals": "math-calculus",
  "limits": "math-calculus",
  "statistics": "math-statistics",
  "probability": "math-probability",
  "permutations": "math-probability",
  "combinations": "math-probability",
  "arithmetic": "math-arithmetic",
  "fractions": "math-arithmetic",
  "decimals": "math-arithmetic",
  "percentages": "math-percentages",
  "percent": "math-percentages",
  "profit loss": "math-percentages",
  "interest": "math-percentages",
  "pre-algebra": "math-pre-algebra",
  "prealgebra": "math-pre-algebra",
  "ratios": "math-pre-algebra",
  "word problems": "math-word-problems",

  // ============================================
  // Science
  // ============================================
  "biology": "science-biology",
  "cells": "science-biology",
  "genetics": "science-biology",
  "evolution": "science-biology",
  "ecology": "science-biology",
  "chemistry": "science-chemistry",
  "atoms": "science-chemistry",
  "molecules": "science-chemistry",
  "chemical reactions": "science-chemistry",
  "periodic table": "science-chemistry",
  "physics": "science-physics",
  "forces": "science-physics",
  "motion": "science-physics",
  "energy": "science-physics",
  "electricity": "science-physics",
  "magnetism": "science-physics",
  "earth science": "science-earth",
  "geology": "science-earth",
  "weather": "science-earth",
  "climate": "science-earth",
  "environmental science": "science-environmental",

  // ============================================
  // Social Studies
  // ============================================
  "us history": "history-us",
  "american history": "history-us",
  "world history": "history-world",
  "geography": "geography",
  "economics": "economics",
  "microeconomics": "economics",
  "macroeconomics": "economics",
  "civics": "civics",
  "government": "civics",
  "politics": "civics",

  // ============================================
  // Language Arts
  // ============================================
  "reading comprehension": "language-arts-reading",
  "reading": "language-arts-reading",

  // ============================================
  // Vibe Coding / AI
  // ============================================
  "prompting": "vibe-prompting",
  "prompt engineering": "vibe-prompting",
  "vibe coding": "vibe-prompting",
  "ai prompts": "vibe-prompting",
  "code review": "vibe-review",
  "ai workflow": "vibe-workflow",
};

/**
 * Normalize a string for alias lookup
 */
export function normalizeForAlias(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s/-]/g, '') // Remove special chars except - and /
    .replace(/\s+/g, ' ');      // Normalize whitespace
}

/**
 * Look up a topic by alias
 * @returns The canonical topic ID or null if no alias found
 */
export function lookupAlias(objective: string): string | null {
  const normalized = normalizeForAlias(objective);
  return TOPIC_ALIASES[normalized] || null;
}
