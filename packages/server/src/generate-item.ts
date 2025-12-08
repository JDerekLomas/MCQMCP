/**
 * AI-powered MCQ generation using Claude Sonnet
 *
 * Generates high-quality multiple choice questions for objectives
 * not covered by the curated item bank.
 */

import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client (uses ANTHROPIC_API_KEY env var)
const anthropic = new Anthropic();

export interface GeneratedItem {
  id: string;
  objective: string;
  objective_normalized: string;
  topic: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  stem: string;
  code: string | null;
  options: Array<{ id: string; text: string }>;
  correct: string;
  feedback: {
    correct: string;
    incorrect: string;
    explanation: string;
  };
  source: 'ai-generated';
  model: string;
  quality: 'unreviewed';
}

const GENERATION_PROMPT = `You are an expert educational content creator. Generate a high-quality multiple choice question (MCQ) about the given topic.

Topic/Objective: {objective}
Difficulty Level: {difficulty}

Requirements:
1. Create a clear, unambiguous question stem
2. Provide exactly 4 options (A, B, C, D)
3. One option must be clearly correct
4. Distractors should be plausible but definitively incorrect
5. Include a brief explanation of why the correct answer is right
6. If the topic involves code, include a relevant code snippet

Difficulty guidelines:
- easy: Basic recall or simple application
- medium: Requires understanding and some analysis
- hard: Requires synthesis, evaluation, or complex problem-solving

{code_instruction}

Return ONLY valid JSON in this exact format (no markdown, no explanations outside JSON):
{
  "stem": "The question text here",
  "code": null,
  "options": [
    {"id": "A", "text": "First option"},
    {"id": "B", "text": "Second option"},
    {"id": "C", "text": "Third option"},
    {"id": "D", "text": "Fourth option"}
  ],
  "correct": "B",
  "feedback": {
    "correct": "Great job! Brief positive feedback.",
    "incorrect": "Not quite. Brief hint without giving away the answer.",
    "explanation": "Detailed explanation of the correct answer and why other options are wrong."
  }
}`;

const CODE_TOPICS = [
  'javascript', 'js', 'react', 'typescript', 'ts', 'python', 'java', 'css',
  'html', 'node', 'sql', 'git', 'code', 'programming', 'function', 'class',
  'variable', 'loop', 'array', 'object', 'api', 'async', 'promise'
];

function shouldIncludeCode(objective: string): boolean {
  const lower = objective.toLowerCase();
  return CODE_TOPICS.some(topic => lower.includes(topic));
}

function normalizeObjective(objective: string): string {
  return objective.toLowerCase().trim().replace(/\s+/g, ' ');
}

function generateId(): string {
  return 'gen-' + Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a new MCQ item using Claude Sonnet
 *
 * @param objective - The learning objective or topic to generate a question about
 * @param difficulty - Difficulty level (easy, medium, hard)
 * @param inferredTopic - Optional topic ID if we could infer one from matching
 * @returns Generated item ready for storage
 */
export async function generateItem(
  objective: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  inferredTopic: string | null = null
): Promise<GeneratedItem> {
  const includeCode = shouldIncludeCode(objective);
  const codeInstruction = includeCode
    ? 'This topic involves programming. Include a relevant code snippet in the "code" field (use proper escaping for JSON strings).'
    : 'This is not a programming topic. Set "code" to null.';

  const prompt = GENERATION_PROMPT
    .replace('{objective}', objective)
    .replace('{difficulty}', difficulty)
    .replace('{code_instruction}', codeInstruction);

  const model = 'claude-sonnet-4-20250514';

  const response = await anthropic.messages.create({
    model,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  // Extract text content from response
  const textContent = response.content.find(block => block.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON response
  let parsed;
  try {
    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonText = textContent.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Failed to parse Claude response as JSON: ${textContent.text.substring(0, 200)}`);
  }

  // Validate structure
  if (!parsed.stem || !parsed.options || !parsed.correct || !parsed.feedback) {
    throw new Error('Invalid response structure from Claude');
  }

  if (parsed.options.length !== 4) {
    throw new Error(`Expected 4 options, got ${parsed.options.length}`);
  }

  if (!['A', 'B', 'C', 'D'].includes(parsed.correct)) {
    throw new Error(`Invalid correct answer: ${parsed.correct}`);
  }

  return {
    id: generateId(),
    objective,
    objective_normalized: normalizeObjective(objective),
    topic: inferredTopic,
    difficulty,
    stem: parsed.stem,
    code: parsed.code || null,
    options: parsed.options.map((opt: { id: string; text: string }) => ({
      id: opt.id,
      text: opt.text
    })),
    correct: parsed.correct,
    feedback: {
      correct: parsed.feedback.correct || 'Correct!',
      incorrect: parsed.feedback.incorrect || 'Not quite. Try again!',
      explanation: parsed.feedback.explanation || 'No explanation provided.'
    },
    source: 'ai-generated',
    model,
    quality: 'unreviewed'
  };
}

/**
 * Check if we have the Anthropic API key configured
 */
export function isGenerationEnabled(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
