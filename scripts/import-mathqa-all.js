#!/usr/bin/env node
/**
 * Import MathQA items across all categories
 *
 * Source: https://math-qa.github.io/
 * License: Apache 2.0
 * Categories: general (13K), physics (7K), gain (5K), geometry (2K), other (2K), probability (450)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MATHQA_URL = 'https://raw.githubusercontent.com/math-qa/math-qa.github.io/master/data/MathQA/train.json';

// Map MathQA categories to MCQMCP topics
const CATEGORY_MAPPINGS = {
  'general': { topic: 'math-pre-algebra', name: 'Pre-Algebra', difficulty: 'medium' },
  'gain': { topic: 'math-percentages', name: 'Percentages & Profit/Loss', difficulty: 'medium' },
  'probability': { topic: 'math-probability', name: 'Probability', difficulty: 'medium' },
  'physics': { topic: 'math-applied', name: 'Applied Math (Physics)', difficulty: 'hard' },
  'other': { topic: 'math-word-problems', name: 'Word Problems', difficulty: 'medium' },
  // geometry already imported separately
};

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function parseOptions(optionsStr) {
  const parts = optionsStr.split(/\s*,\s*(?=[a-e]\s*\))/);
  const options = [];

  for (const part of parts) {
    const match = part.match(/^([a-e])\s*\)\s*(.+)$/i);
    if (match) {
      options.push({
        label: match[1].toUpperCase(),
        text: match[2].trim()
      });
    }
  }

  return options;
}

function inferSubtopic(problem, category) {
  const p = problem.toLowerCase();

  if (category === 'general') {
    if (p.includes('ratio') || p.includes('proportion')) return 'ratios';
    if (p.includes('average') || p.includes('mean')) return 'averages';
    if (p.includes('age') || p.includes('years old')) return 'age-problems';
    if (p.includes('work') || p.includes('days to complete')) return 'work-rate';
    if (p.includes('speed') || p.includes('distance') || p.includes('time')) return 'rate-problems';
    if (p.includes('mixture') || p.includes('alloy')) return 'mixtures';
    return 'general';
  }

  if (category === 'gain') {
    if (p.includes('interest')) return 'interest';
    if (p.includes('discount')) return 'discounts';
    if (p.includes('profit') || p.includes('loss')) return 'profit-loss';
    return 'percentages';
  }

  if (category === 'probability') {
    if (p.includes('permutation') || p.includes('arrange')) return 'permutations';
    if (p.includes('combination') || p.includes('choose') || p.includes('select')) return 'combinations';
    return 'basic-probability';
  }

  return 'general';
}

function convertToMCQMCP(item, index, category) {
  const mapping = CATEGORY_MAPPINGS[category];
  if (!mapping) return null;

  const options = parseOptions(item.options);

  // Filter out "none of these" type options
  const validOptions = options.filter(o =>
    !o.text.toLowerCase().includes('none of') &&
    !o.text.toLowerCase().includes('cannot be determined')
  );

  if (validOptions.length < 4) {
    const needed = 4 - validOptions.length;
    const noneOptions = options.filter(o =>
      o.text.toLowerCase().includes('none of') ||
      o.text.toLowerCase().includes('cannot be determined')
    ).slice(0, needed);
    validOptions.push(...noneOptions);
  }

  if (validOptions.length < 4) return null;

  const correctLabel = item.correct.toUpperCase();
  const allOptions = validOptions.slice(0, 4).map(o => ({
    text: o.text,
    isCorrect: o.label === correctLabel
  }));

  if (!allOptions.some(o => o.isCorrect)) {
    const correctOpt = options.find(o => o.label === correctLabel);
    if (correctOpt) {
      allOptions[3] = { text: correctOpt.text, isCorrect: true };
    } else {
      return null;
    }
  }

  const shuffled = shuffleArray(allOptions);
  const correctIndex = shuffled.findIndex(o => o.isCorrect);
  const correctLetter = ['A', 'B', 'C', 'D'][correctIndex];

  const formattedOptions = shuffled.map((opt, i) => ({
    id: ['A', 'B', 'C', 'D'][i],
    text: opt.text
  }));

  const subtopic = inferSubtopic(item.Problem, category);
  const paddedIndex = String(index + 1).padStart(4, '0');
  const catShort = category.substring(0, 4);

  return {
    id: `mathqa-${catShort}-${paddedIndex}`,
    topic: mapping.topic,
    difficulty: mapping.difficulty,
    stem: item.Problem,
    options: formattedOptions,
    correct: correctLetter,
    feedback: {
      correct: 'Correct!',
      incorrect: `Review ${mapping.name.toLowerCase()} concepts.`,
      explanation: item.Rationale.replace(/"/g, '').trim()
    },
    provenance: {
      source: 'mathqa',
      source_url: 'https://math-qa.github.io/',
      license: 'Apache-2.0',
      imported_at: new Date().toISOString().split('T')[0],
      original_format: 'mathqa-json',
      original_category: category
    },
    tags: ['math', mapping.topic.replace('math-', ''), subtopic, 'imported']
  };
}

async function importMathQA(limitPerCategory = 300) {
  console.log('Checking for MathQA dataset...');

  let data;
  const tmpFile = '/tmp/train.json';

  if (fs.existsSync(tmpFile)) {
    console.log('Using cached MathQA data...');
    data = require(tmpFile);
  } else {
    console.log('Downloading MathQA dataset...');
    execSync(`curl -sL "${MATHQA_URL}" -o ${tmpFile}`, { stdio: 'pipe' });
    data = require(tmpFile);
  }

  const allItems = [];
  const categories = Object.keys(CATEGORY_MAPPINGS);

  for (const category of categories) {
    const categoryItems = data.filter(i => i.category === category);
    console.log(`\nProcessing ${category}: ${categoryItems.length} available`);

    let converted = 0;
    for (let i = 0; i < Math.min(categoryItems.length, limitPerCategory); i++) {
      const item = convertToMCQMCP(categoryItems[i], converted, category);
      if (item) {
        allItems.push(item);
        converted++;
      }
    }
    console.log(`  Converted: ${converted}`);
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

  // Filter duplicates
  const existingStems = new Set(bank.items.map(i => i.stem.toLowerCase().trim().substring(0, 80)));
  const newItems = allItems.filter(item => !existingStems.has(item.stem.toLowerCase().trim().substring(0, 80)));

  console.log(`New unique items: ${newItems.length}`);

  // Add new items
  bank.items = [...bank.items, ...newItems];

  // Update metadata
  bank.metadata.sources = bank.metadata.sources || {};
  bank.metadata.sources['mathqa'] = {
    name: 'MathQA Dataset',
    license: 'Apache-2.0',
    url: 'https://math-qa.github.io/',
    imported_at: new Date().toISOString().split('T')[0],
    description: 'Math word problems across multiple categories'
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

const limit = parseInt(process.argv[2]) || 300;
importMathQA(limit).catch(console.error);
