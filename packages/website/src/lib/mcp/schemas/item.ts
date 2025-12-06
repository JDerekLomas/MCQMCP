import { z } from 'zod';

/**
 * Difficulty levels for assessment items.
 * - easy: Basic recall or single-concept application
 * - medium: Requires combining 2+ concepts or predicting behavior
 * - hard: Edge cases, subtle bugs, or deep understanding required
 */
export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof DifficultySchema>;

/**
 * Topics covered in the item bank.
 * Each topic focuses on a specific area of frontend engineering knowledge.
 * Note: Generated items may have custom topics not in this list.
 */
export const KnownTopics = [
  'js-this',        // JavaScript `this` binding rules
  'js-closures',    // Closures and lexical scoping
  'js-async',       // Promises, async/await, event loop
  'js-prototypes',  // Prototypal inheritance and __proto__
  'js-timers',      // setTimeout, setInterval, microtasks
  'js-patterns',    // Common JS patterns and idioms
  'html-events',    // Event bubbling, capturing, delegation
  'vibe-prompting', // Effective prompting for AI code generation
  'vibe-review',    // Reviewing and validating AI-generated code
  'vibe-workflow',  // Integrating AI assistants into development workflow
  'react-hooks',    // useState, useEffect, useRef, custom hooks
  'react-state',    // State management, lifting state, context
  'react-rendering',// Re-renders, memoization, keys, reconciliation
  'react-patterns', // Common React patterns and best practices
  'plasma-cells',   // Plasma cell biology, antibody production, differentiation
] as const;
export const TopicSchema = z.string().min(1); // Allow any topic string for flexibility
export type Topic = string;

/**
 * A single answer option for an MCQ item.
 */
export const OptionSchema = z.object({
  id: z.string().regex(/^[A-D]$/, 'Option ID must be A, B, C, or D'),
  text: z.string().min(1, 'Option text cannot be empty'),
});
export type Option = z.infer<typeof OptionSchema>;

/**
 * Feedback provided after answering an item.
 * - correct: Shown when the user answers correctly
 * - incorrect: Shown when the user answers incorrectly
 * - explanation: Detailed explanation of why the correct answer is correct
 */
export const FeedbackSchema = z.object({
  correct: z.string().min(1),
  incorrect: z.string().min(1),
  explanation: z.string().min(1),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

/**
 * A complete MCQ assessment item.
 *
 * Design principles:
 * - Items test understanding, not trivia
 * - Distractors are plausible (common misconceptions)
 * - Code snippets use realistic patterns
 * - Feedback explains the "why", not just the "what"
 */
export const ItemSchema = z.object({
  id: z.string().min(1), // Flexible ID format to support generated items
  topic: TopicSchema,
  difficulty: DifficultySchema,
  skill_path: z.array(z.string()).optional(), // Hierarchical skill location, e.g., ["javascript", "js-async", "js-promises"]
  stem: z.string().min(5, 'Stem must be descriptive'),
  code: z.string().optional(), // Optional code snippet
  options: z.array(OptionSchema).length(4, 'Must have exactly 4 options'),
  correct: z.string().regex(/^[A-D]$/, 'Correct answer must be A, B, C, or D'),
  feedback: FeedbackSchema,
  tags: z.array(z.string()).optional(), // Additional categorization
});
export type Item = z.infer<typeof ItemSchema>;

/**
 * Input schema for the assessment_get_item tool.
 * Uses the known topics enum for validated queries.
 */
export const KnownTopicSchema = z.enum([
  'js-this',
  'js-closures',
  'js-async',
  'js-prototypes',
  'js-timers',
  'js-patterns',
  'html-events',
  'vibe-prompting',
  'vibe-review',
  'vibe-workflow',
  'react-hooks',
  'react-state',
  'react-rendering',
  'react-patterns',
  'plasma-cells',
]);
export const GetItemInputSchema = z.object({
  topic: KnownTopicSchema,
  difficulty: DifficultySchema.optional(),
  exclude_ids: z.array(z.string()).optional(), // IDs to exclude (already seen)
});
export type GetItemInput = z.infer<typeof GetItemInputSchema>;

/**
 * The complete item bank schema.
 */
export const ItemBankSchema = z.object({
  version: z.string(),
  items: z.array(ItemSchema),
});
export type ItemBank = z.infer<typeof ItemBankSchema>;
