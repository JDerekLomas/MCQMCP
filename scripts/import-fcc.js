#!/usr/bin/env node
/**
 * Import FreeCodeCamp Developer Quiz items into MCQMCP format
 *
 * This script fetches quiz data from FCC GitHub and converts to MCQMCP schema v2.0
 */

const fs = require('fs');
const path = require('path');

// Topic mappings from FCC quiz names to MCQMCP taxonomy
const TOPIC_MAPPINGS = {
  'javascript': 'js-fundamentals',
  'css': 'css-tailwind',
  'git': 'git-basics',
  'general-cs': 'cs-fundamentals',
  'react': 'react-fundamentals',
  'html': 'web-fundamentals',
  'python': 'python-fundamentals',
  'accessibility': 'accessibility'
};

// FCC quiz URLs
const FCC_QUIZZES = [
  { name: 'javascript', url: 'https://raw.githubusercontent.com/freeCodeCamp/Developer_Quiz_Site/main/src/data/javascript-quiz.ts' },
  { name: 'css', url: 'https://raw.githubusercontent.com/freeCodeCamp/Developer_Quiz_Site/main/src/data/css-quiz.ts' },
  { name: 'git', url: 'https://raw.githubusercontent.com/freeCodeCamp/Developer_Quiz_Site/main/src/data/git-quiz.ts' },
];

/**
 * Shuffle array in place using Fisher-Yates
 */
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Parse TypeScript quiz file to extract question objects
 */
function parseQuizTS(content) {
  // Extract the array of objects
  const items = [];

  // Match each question object in the file
  const questionRegex = /\{\s*Question:\s*["'`]([\s\S]*?)["'`],\s*Answer:\s*["'`]([\s\S]*?)["'`],\s*Distractor1:\s*["'`]([\s\S]*?)["'`],\s*Distractor2:\s*["'`]([\s\S]*?)["'`],\s*Distractor3:\s*["'`]([\s\S]*?)["'`],\s*Explanation:\s*["'`]([\s\S]*?)["'`](?:,\s*Link:\s*["'`]([\s\S]*?)["'`])?\s*\}/g;

  let match;
  while ((match = questionRegex.exec(content)) !== null) {
    items.push({
      Question: match[1].trim(),
      Answer: match[2].trim(),
      Distractor1: match[3].trim(),
      Distractor2: match[4].trim(),
      Distractor3: match[5].trim(),
      Explanation: match[6].trim(),
      Link: match[7] ? match[7].trim() : null
    });
  }

  return items;
}

/**
 * Convert FCC item to MCQMCP v2.0 format
 */
function convertToMCQMCP(fccItem, quizName, index) {
  const topic = TOPIC_MAPPINGS[quizName] || quizName;

  // Create options array with correct answer and distractors
  const allOptions = [
    { text: fccItem.Answer, isCorrect: true },
    { text: fccItem.Distractor1, isCorrect: false },
    { text: fccItem.Distractor2, isCorrect: false },
    { text: fccItem.Distractor3, isCorrect: false }
  ];

  // Shuffle options so correct answer isn't always A
  const shuffled = shuffleArray(allOptions);

  // Find correct answer position
  const correctIndex = shuffled.findIndex(o => o.isCorrect);
  const correctLetter = ['A', 'B', 'C', 'D'][correctIndex];

  // Build options with IDs
  const options = shuffled.map((opt, i) => ({
    id: ['A', 'B', 'C', 'D'][i],
    text: opt.text
  }));

  // Generate unique ID
  const paddedIndex = String(index + 1).padStart(3, '0');
  const id = `fcc-${quizName}-${paddedIndex}`;

  return {
    id,
    topic,
    difficulty: 'medium', // Default, can be refined later
    stem: fccItem.Question,
    options,
    correct: correctLetter,
    feedback: {
      correct: 'Correct!',
      incorrect: 'Review this concept.',
      explanation: fccItem.Explanation
    },
    provenance: {
      source: 'freecodecamp',
      source_url: fccItem.Link || 'https://github.com/freeCodeCamp/Developer_Quiz_Site',
      license: 'BSD-3-Clause',
      imported_at: new Date().toISOString().split('T')[0],
      original_format: 'fcc-quiz'
    },
    tags: [quizName, 'imported']
  };
}

/**
 * Main import function
 */
async function importFCC() {
  console.log('Starting FreeCodeCamp import...\n');

  const allItems = [];

  for (const quiz of FCC_QUIZZES) {
    console.log(`Fetching ${quiz.name} quiz...`);

    try {
      const response = await fetch(quiz.url);
      if (!response.ok) {
        console.error(`Failed to fetch ${quiz.name}: ${response.status}`);
        continue;
      }

      const content = await response.text();
      const items = parseQuizTS(content);

      console.log(`  Found ${items.length} items`);

      // Convert each item
      items.forEach((item, index) => {
        const converted = convertToMCQMCP(item, quiz.name, index);
        allItems.push(converted);
      });

    } catch (err) {
      console.error(`Error processing ${quiz.name}: ${err.message}`);
    }
  }

  console.log(`\nTotal items converted: ${allItems.length}`);

  // Load existing item bank
  const bankPath = path.join(__dirname, '../packages/website/src/lib/mcp/item-bank.json');
  let bank;

  try {
    bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  } catch {
    bank = { version: '2.0.0', items: [], metadata: {} };
  }

  // Filter out duplicates based on stem text
  const existingStems = new Set(bank.items.map(i => i.stem.toLowerCase().trim()));
  const newItems = allItems.filter(item => !existingStems.has(item.stem.toLowerCase().trim()));

  console.log(`New unique items: ${newItems.length}`);

  // Add new items
  bank.items = [...bank.items, ...newItems];

  // Update metadata
  bank.version = '2.0.0';
  bank.metadata = {
    schema_version: '2.0.0',
    default_license: 'CC-BY-4.0',
    last_updated: new Date().toISOString(),
    sources: {
      'mcqmcp-original': {
        name: 'MCQMCP Original Items',
        license: 'CC-BY-4.0',
        url: 'https://github.com/JDerekLomas/MCQMCP-monorepo'
      },
      'freecodecamp': {
        name: 'FreeCodeCamp Developer Quiz',
        license: 'BSD-3-Clause',
        url: 'https://github.com/freeCodeCamp/Developer_Quiz_Site',
        imported_at: new Date().toISOString().split('T')[0]
      }
    }
  };

  // Write updated bank
  fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2));

  console.log(`\nItem bank updated: ${bank.items.length} total items`);
  console.log(`Saved to: ${bankPath}`);

  // Summary by topic
  const byTopic = {};
  bank.items.forEach(item => {
    byTopic[item.topic] = (byTopic[item.topic] || 0) + 1;
  });

  console.log('\nItems by topic:');
  Object.entries(byTopic)
    .sort((a, b) => b[1] - a[1])
    .forEach(([topic, count]) => {
      console.log(`  ${topic}: ${count}`);
    });
}

// Run
importFCC().catch(console.error);
