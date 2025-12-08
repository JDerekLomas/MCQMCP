#!/usr/bin/env node
/**
 * Import Google DeepMind AQuA dataset (algebraic word problems)
 *
 * Source: https://github.com/google-deepmind/AQuA
 * License: Apache 2.0
 * ~100,000 algebraic word problems with 5 options and rationales
 */

const fs = require('fs');
const path = require('path');

const AQUA_URL = 'https://raw.githubusercontent.com/google-deepmind/AQuA/master/train.json';

// Topic mappings based on question content
function inferTopic(question) {
  const q = question.toLowerCase();

  if (q.includes('probability') || q.includes('dice') || q.includes('cards') || q.includes('random')) {
    return 'probability';
  }
  if (q.includes('percent') || q.includes('%') || q.includes('ratio') || q.includes('proportion')) {
    return 'ratios';
  }
  if (q.includes('interest') || q.includes('compound') || q.includes('principal')) {
    return 'exponentials';
  }
  if (q.includes('speed') || q.includes('distance') || q.includes('time') || q.includes('rate')) {
    return 'linear-equations';
  }
  if (q.includes('area') || q.includes('perimeter') || q.includes('circle') || q.includes('rectangle') || q.includes('triangle')) {
    return 'triangles';
  }
  if (q.includes('average') || q.includes('mean') || q.includes('median')) {
    return 'probability';
  }
  if (q.includes('permutation') || q.includes('combination') || q.includes('arrange') || q.includes('select')) {
    return 'probability';
  }
  if (q.includes('x^2') || q.includes('quadratic') || q.includes('equation')) {
    return 'quadratics';
  }
  if (q.includes('sequence') || q.includes('series') || q.includes('term')) {
    return 'sequences-series';
  }

  // Default to algebra
  return 'linear-equations';
}

function inferDifficulty(rationale) {
  // Estimate difficulty based on rationale complexity
  const steps = (rationale.match(/=/g) || []).length;
  const hasFormula = /[a-z]\^[0-9]|sqrt|log/i.test(rationale);

  if (steps > 5 || hasFormula) return 'hard';
  if (steps > 2) return 'medium';
  return 'easy';
}

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function convertToMCQMCP(aquaItem, index) {
  // Parse options from format like ["A)21", "B)21.5", "C)22", "D)22.5", "E)23"]
  const optionLetters = ['A', 'B', 'C', 'D', 'E'];
  const parsedOptions = aquaItem.options.map((opt, i) => {
    // Remove letter prefix like "A)"
    const text = opt.replace(/^[A-E]\)/, '').trim();
    return {
      text,
      originalLetter: optionLetters[i],
      isCorrect: optionLetters[i] === aquaItem.correct
    };
  });

  // For MCQMCP we need 4 options, so we'll take the correct one plus 3 distractors
  const correctOption = parsedOptions.find(o => o.isCorrect);
  const distractors = parsedOptions.filter(o => !o.isCorrect).slice(0, 3);

  if (!correctOption || distractors.length < 3) {
    return null; // Skip malformed items
  }

  const allOptions = [correctOption, ...distractors];
  const shuffled = shuffleArray(allOptions);

  const correctIndex = shuffled.findIndex(o => o.isCorrect);
  const correctLetter = ['A', 'B', 'C', 'D'][correctIndex];

  const options = shuffled.map((opt, i) => ({
    id: ['A', 'B', 'C', 'D'][i],
    text: opt.text
  }));

  const subtopic = inferTopic(aquaItem.question);
  const topic = `math-algebra-2`; // Most AQuA questions are algebra level

  const paddedIndex = String(index + 1).padStart(4, '0');

  return {
    id: `aqua-${paddedIndex}`,
    topic,
    difficulty: inferDifficulty(aquaItem.rationale),
    stem: aquaItem.question,
    options,
    correct: correctLetter,
    feedback: {
      correct: 'Correct!',
      incorrect: 'Review the solution steps.',
      explanation: aquaItem.rationale
    },
    provenance: {
      source: 'aqua-deepmind',
      source_url: 'https://github.com/google-deepmind/AQuA',
      license: 'Apache-2.0',
      imported_at: new Date().toISOString().split('T')[0],
      original_format: 'aqua'
    },
    tags: ['math', 'algebra', 'word-problem', subtopic, 'imported']
  };
}

async function importAQuA(limit = 200) {
  console.log('Fetching AQuA dataset...');

  const response = await fetch(AQUA_URL);
  const text = await response.text();

  // Parse JSONL format (one JSON object per line)
  const lines = text.trim().split('\n');
  console.log(`Total items in dataset: ${lines.length}`);

  const items = [];
  const toProcess = lines.slice(0, limit); // Limit to avoid overwhelming the bank

  for (let i = 0; i < toProcess.length; i++) {
    try {
      const aquaItem = JSON.parse(toProcess[i]);
      const converted = convertToMCQMCP(aquaItem, i);
      if (converted) {
        items.push(converted);
      }
    } catch (e) {
      console.error(`Error parsing item ${i}: ${e.message}`);
    }
  }

  console.log(`Converted ${items.length} items`);

  // Load existing item bank
  const bankPath = path.join(__dirname, '../packages/website/src/lib/mcp/item-bank.json');
  let bank;

  try {
    bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  } catch {
    bank = { version: '2.0.0', items: [], metadata: {} };
  }

  // Filter duplicates
  const existingStems = new Set(bank.items.map(i => i.stem.toLowerCase().trim().substring(0, 100)));
  const newItems = items.filter(item => !existingStems.has(item.stem.toLowerCase().trim().substring(0, 100)));

  console.log(`New unique items: ${newItems.length}`);

  // Add new items
  bank.items = [...bank.items, ...newItems];

  // Update metadata
  bank.metadata.sources = bank.metadata.sources || {};
  bank.metadata.sources['aqua-deepmind'] = {
    name: 'Google DeepMind AQuA Dataset',
    license: 'Apache-2.0',
    url: 'https://github.com/google-deepmind/AQuA',
    imported_at: new Date().toISOString().split('T')[0],
    description: 'Algebraic word problems with rationales'
  };
  bank.metadata.last_updated = new Date().toISOString();

  // Write updated bank
  fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2));

  console.log(`\nItem bank updated: ${bank.items.length} total items`);

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

// Run with optional limit argument
const limit = parseInt(process.argv[2]) || 200;
importAQuA(limit).catch(console.error);
