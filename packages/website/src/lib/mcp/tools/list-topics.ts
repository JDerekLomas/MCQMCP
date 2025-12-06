import { KnownTopics } from '../schemas/item';
import itemBankData from '../item-bank.json';

export interface TopicInfo {
  topic: string;
  description: string;
  itemCount: number;
  difficulties: {
    easy: number;
    medium: number;
    hard: number;
  };
}

const TOPIC_DESCRIPTIONS: Record<string, string> = {
  'js-this': 'JavaScript `this` binding rules and context',
  'js-closures': 'Closures, lexical scoping, and function scope',
  'js-async': 'Promises, async/await, and the event loop',
  'js-prototypes': 'Prototypal inheritance and the prototype chain',
  'js-timers': 'setTimeout, setInterval, and microtask/macrotask ordering',
  'js-patterns': 'Common JavaScript patterns: destructuring, spread, getters',
  'html-events': 'DOM events: bubbling, capturing, and delegation',
  'vibe-prompting': 'Effective prompting techniques for AI code generation',
  'vibe-review': 'Reviewing, validating, and debugging AI-generated code',
  'vibe-workflow': 'Integrating AI coding assistants into development workflows',
  'react-hooks': 'React hooks: useState, useEffect, useRef, useMemo, custom hooks',
  'react-state': 'State management: lifting state, Context API, state updates',
  'react-rendering': 'Re-renders, memoization, keys, and reconciliation',
  'react-patterns': 'Common React patterns: composition, render props, HOCs',
  'plasma-cells': 'Plasma cell biology: differentiation, antibody production, and immune function',
};

/**
 * Lists all available assessment topics with item counts.
 *
 * @returns Array of topic information objects
 */
export function listTopics(): TopicInfo[] {
  const topics = KnownTopics;

  return topics.map(topic => {
    const topicItems = itemBankData.items.filter(item => item.topic === topic);

    const difficulties = {
      easy: topicItems.filter(item => item.difficulty === 'easy').length,
      medium: topicItems.filter(item => item.difficulty === 'medium').length,
      hard: topicItems.filter(item => item.difficulty === 'hard').length,
    };

    return {
      topic,
      description: TOPIC_DESCRIPTIONS[topic] || 'No description available',
      itemCount: topicItems.length,
      difficulties,
    };
  });
}

/**
 * Tool definition for Claude's tool use.
 */
export const listTopicsToolDefinition = {
  name: 'assessment_list_topics',
  description: 'Lists all available assessment topics with descriptions and item counts. Use this to help users choose what to study or to understand the breadth of available content.',
  input_schema: {
    type: 'object',
    properties: {},
    required: [],
  },
} as const;
