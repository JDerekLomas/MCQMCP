import { z } from 'zod';

/**
 * MCQMCP Item Schema v2.0
 *
 * Hybrid schema design:
 * - Core fields: Required for all items (id, stem, options, correct)
 * - Extended fields: Optional structured metadata (psychometrics, pedagogy, etc.)
 * - _raw field: Captures unmapped data from imports
 *
 * This allows importing from diverse sources while maintaining queryability.
 */

// ============================================================================
// ENUMS & BASIC TYPES
// ============================================================================

/**
 * Difficulty levels for assessment items.
 * - easy: Basic recall or single-concept application
 * - medium: Requires combining 2+ concepts or predicting behavior
 * - hard: Edge cases, subtle bugs, or deep understanding required
 */
export const DifficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof DifficultySchema>;

/**
 * Bloom's Taxonomy cognitive levels
 */
export const BloomLevelSchema = z.enum([
  'remember',    // Recall facts and basic concepts
  'understand',  // Explain ideas or concepts
  'apply',       // Use information in new situations
  'analyze',     // Draw connections among ideas
  'evaluate',    // Justify a decision or course of action
  'create',      // Produce new or original work
]);
export type BloomLevel = z.infer<typeof BloomLevelSchema>;

/**
 * Depth of Knowledge (Webb's DOK) levels
 */
export const DokLevelSchema = z.enum(['1', '2', '3', '4']);
export type DokLevel = z.infer<typeof DokLevelSchema>;

/**
 * Item quality/review status
 */
export const ItemStatusSchema = z.enum([
  'draft',      // Initial creation, not reviewed
  'imported',   // Imported from external source, needs review
  'reviewed',   // Reviewed by human, approved for use
  'validated',  // Psychometrically validated with data
  'deprecated', // No longer in active use
]);
export type ItemStatus = z.infer<typeof ItemStatusSchema>;

/**
 * Topics covered in the item bank.
 * Each topic focuses on a specific area of knowledge.
 * Note: Generated items may have custom topics not in this list.
 */
export const KnownTopics = [
  // JavaScript
  'js-this',        // JavaScript `this` binding rules
  'js-closures',    // Closures and lexical scoping
  'js-async',       // Promises, async/await, event loop
  'js-prototypes',  // Prototypal inheritance and __proto__
  'js-timers',      // setTimeout, setInterval, microtasks
  'js-patterns',    // Common JS patterns and idioms
  'js-fundamentals',// General JavaScript concepts
  // TypeScript
  'ts-basics',      // TypeScript basics
  'ts-generics',    // TypeScript generics
  'ts-advanced',    // Advanced TypeScript
  // React
  'react-hooks',    // useState, useEffect, useRef, custom hooks
  'react-state',    // State management, lifting state, context
  'react-rendering',// Re-renders, memoization, keys, reconciliation
  'react-patterns', // Common React patterns and best practices
  // Web
  'html-events',    // Event bubbling, capturing, delegation
  'css-tailwind',   // Tailwind CSS
  'css-layout',     // CSS layout (flexbox, grid)
  'accessibility',  // Web accessibility
  // Node.js
  'node-api',       // Node.js APIs
  'node-async',     // Node.js async patterns
  'node-express',   // Express.js
  'rest-api',       // REST API design
  // Git
  'git-basics',     // Git fundamentals
  'git-branching',  // Git branching strategies
  'git-collaboration', // Git collaboration workflows
  // Testing
  'testing-basics', // Testing fundamentals
  'testing-react',  // React testing
  'testing-integration', // Integration testing
  'tdd',            // Test-driven development
  // AI/LLM
  'vibe-prompting', // Effective prompting for AI code generation
  'vibe-review',    // Reviewing and validating AI-generated code
  'vibe-workflow',  // Integrating AI assistants into development workflow
  'llm-prompting',  // LLM prompting techniques
  'llm-tools',      // LLM tool use
  // CS Fundamentals
  'algorithms',     // Algorithm design
  'data-structures',// Data structures
  'complexity',     // Big-O complexity
  'recursion',      // Recursive thinking
  // Science
  'plasma-cells',   // Plasma cell biology, antibody production, differentiation
] as const;
export const TopicSchema = z.string().min(1); // Allow any topic string for flexibility
export type Topic = string;

// ============================================================================
// CORE ITEM COMPONENTS
// ============================================================================

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
 */
export const FeedbackSchema = z.object({
  correct: z.string().min(1),
  incorrect: z.string().min(1),
  explanation: z.string().min(1),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

// ============================================================================
// EXTENDED METADATA SCHEMAS (all optional)
// ============================================================================

/**
 * Psychometric data from item analysis.
 * Populated after sufficient response data is collected.
 */
export const PsychometricsSchema = z.object({
  // Classical Test Theory (CTT)
  difficulty_index: z.number().min(0).max(1).optional(),  // P-value (proportion correct)
  discrimination: z.number().min(-1).max(1).optional(),   // Discrimination index
  point_biserial: z.number().min(-1).max(1).optional(),   // Point-biserial correlation

  // Item Response Theory (IRT) - 3PL model parameters
  irt: z.object({
    a: z.number().optional(),  // Discrimination parameter
    b: z.number().optional(),  // Difficulty parameter (theta)
    c: z.number().optional(),  // Guessing parameter
  }).optional(),

  // Distractor analysis
  distractor_analysis: z.record(z.string(), z.object({
    selection_rate: z.number().optional(),
    correlation: z.number().optional(),
  })).optional(),

  // Sample size for validation
  n_responses: z.number().int().optional(),
  last_analyzed: z.string().optional(),  // ISO date
}).optional();
export type Psychometrics = z.infer<typeof PsychometricsSchema>;

/**
 * Pedagogical metadata for learning design.
 */
export const PedagogySchema = z.object({
  bloom_level: BloomLevelSchema.optional(),
  dok_level: DokLevelSchema.optional(),
  learning_objectives: z.array(z.string()).optional(),  // e.g., ["LO-JS-3.2"]
  prerequisites: z.array(z.string()).optional(),        // Topic IDs
  misconceptions: z.array(z.string()).optional(),       // What distractors target
  distractor_rationales: z.record(z.string(), z.string()).optional(), // {"B": "Confuses var with let"}
}).optional();
export type Pedagogy = z.infer<typeof PedagogySchema>;

/**
 * Source/provenance tracking for imports.
 */
export const ProvenanceSchema = z.object({
  source: z.string(),                    // Source ID (e.g., "freecodecamp", "openstax")
  source_id: z.string().optional(),      // Original ID in source system
  source_url: z.string().url().optional(),
  license: z.string().optional(),        // e.g., "CC-BY-4.0", "BSD-3-Clause"
  author: z.string().optional(),
  imported_at: z.string().optional(),    // ISO date
  original_format: z.string().optional(), // e.g., "qti", "fcc-json"
  attribution: z.string().optional(),    // Full attribution text
}).optional();
export type Provenance = z.infer<typeof ProvenanceSchema>;

/**
 * Quality control and review status.
 */
export const QualitySchema = z.object({
  status: ItemStatusSchema.optional(),
  review_date: z.string().optional(),    // ISO date
  reviewer: z.string().optional(),
  version: z.number().int().optional(),  // Item revision number
  flags: z.array(z.string()).optional(), // e.g., ["needs-review", "low-discrimination"]
  notes: z.string().optional(),
}).optional();
export type Quality = z.infer<typeof QualitySchema>;

/**
 * Standards alignment (educational standards mapping).
 */
export const StandardsSchema = z.object({
  ccss: z.array(z.string()).optional(),    // Common Core State Standards
  ngss: z.array(z.string()).optional(),    // Next Generation Science Standards
  ap: z.array(z.string()).optional(),      // AP course standards
  iste: z.array(z.string()).optional(),    // ISTE standards
  csta: z.array(z.string()).optional(),    // CS Teachers Association standards
  custom: z.array(z.string()).optional(),  // Custom/proprietary standards
}).optional();
export type Standards = z.infer<typeof StandardsSchema>;

// ============================================================================
// COMPLETE ITEM SCHEMA
// ============================================================================

/**
 * A complete MCQ assessment item with hybrid schema.
 *
 * Design principles:
 * - Core fields required for all items
 * - Extended metadata optional but structured
 * - _raw captures anything that doesn't fit
 * - Backwards compatible with v1.x items
 */
export const ItemSchema = z.object({
  // === CORE (required) ===
  id: z.string().min(1),
  topic: TopicSchema,
  difficulty: DifficultySchema,
  stem: z.string().min(5, 'Stem must be descriptive'),
  options: z.array(OptionSchema).length(4, 'Must have exactly 4 options'),
  correct: z.string().regex(/^[A-D]$/, 'Correct answer must be A, B, C, or D'),
  feedback: FeedbackSchema,

  // === CORE (optional) ===
  code: z.string().optional(),
  tags: z.array(z.string()).optional(),
  skill_path: z.array(z.string()).optional(), // e.g., ["javascript", "async", "promises"]

  // === EXTENDED METADATA (optional objects) ===
  psychometrics: PsychometricsSchema,
  pedagogy: PedagogySchema,
  provenance: ProvenanceSchema,
  quality: QualitySchema,
  standards: StandardsSchema,

  // === OVERFLOW (for imports) ===
  _raw: z.record(z.unknown()).optional(), // Unmapped fields from source
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
