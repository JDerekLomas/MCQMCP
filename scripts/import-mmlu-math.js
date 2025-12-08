#!/usr/bin/env node
/**
 * Import MMLU (Massive Multitask Language Understanding) Math datasets
 *
 * Source: https://github.com/hendrycks/test
 * License: MIT
 * Includes: elementary_mathematics, high_school_mathematics, high_school_statistics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MMLU_URL = 'https://people.eecs.berkeley.edu/~hendrycks/data.tar';

// Topic mappings for MMLU subjects
const SUBJECT_MAPPINGS = {
  'elementary_mathematics': { topic: 'math-arithmetic', grade: 'elementary', name: 'Elementary Math' },
  'high_school_mathematics': { topic: 'math-algebra-1', grade: 'high-school', name: 'HS Math' },
  'high_school_statistics': { topic: 'math-statistics', grade: 'high-school', name: 'HS Statistics' },
  'college_mathematics': { topic: 'math-calculus', grade: 'college', name: 'College Math' }
};

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function parseCSVLine(line) {
  // Handle CSV with potential commas in quoted fields
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function convertToMCQMCP(csvRow, subject, index) {
  // CSV format: question,A,B,C,D,answer
  const [question, optA, optB, optC, optD, correctLetter] = csvRow;

  if (!question || !optA || !correctLetter) {
    return null;
  }

  const mapping = SUBJECT_MAPPINGS[subject];
  if (!mapping) return null;

  // Create options with original positions
  const originalOptions = [
    { id: 'A', text: optA, isCorrect: correctLetter === 'A' },
    { id: 'B', text: optB, isCorrect: correctLetter === 'B' },
    { id: 'C', text: optC, isCorrect: correctLetter === 'C' },
    { id: 'D', text: optD, isCorrect: correctLetter === 'D' }
  ];

  // Shuffle options
  const shuffled = shuffleArray(originalOptions);
  const newCorrectIndex = shuffled.findIndex(o => o.isCorrect);
  const newCorrectLetter = ['A', 'B', 'C', 'D'][newCorrectIndex];

  const options = shuffled.map((opt, i) => ({
    id: ['A', 'B', 'C', 'D'][i],
    text: opt.text
  }));

  const paddedIndex = String(index + 1).padStart(4, '0');
  const subjectShort = subject.replace('_test', '').replace(/_/g, '-');

  return {
    id: `mmlu-${subjectShort}-${paddedIndex}`,
    topic: mapping.topic,
    difficulty: mapping.grade === 'elementary' ? 'easy' : (mapping.grade === 'high-school' ? 'medium' : 'hard'),
    stem: question,
    options,
    correct: newCorrectLetter,
    feedback: {
      correct: 'Correct!',
      incorrect: 'Review this math concept.',
      explanation: `The correct answer demonstrates understanding of ${mapping.name.toLowerCase()} concepts.`
    },
    provenance: {
      source: 'mmlu-hendrycks',
      source_url: 'https://github.com/hendrycks/test',
      license: 'MIT',
      imported_at: new Date().toISOString().split('T')[0],
      original_format: 'mmlu-csv'
    },
    tags: ['math', mapping.grade, subject.replace(/_/g, '-'), 'imported']
  };
}

async function importMMLU() {
  console.log('Downloading MMLU dataset...');

  const tmpDir = '/tmp/mmlu_import';
  execSync(`rm -rf ${tmpDir} && mkdir -p ${tmpDir}`, { stdio: 'pipe' });

  // Download and extract
  execSync(`cd ${tmpDir} && curl -sL "${MMLU_URL}" -o data.tar && tar -xf data.tar`, { stdio: 'pipe' });

  const subjects = Object.keys(SUBJECT_MAPPINGS);
  const allItems = [];

  for (const subject of subjects) {
    const testFile = `${tmpDir}/data/test/${subject}_test.csv`;

    if (!fs.existsSync(testFile)) {
      console.log(`Skipping ${subject} - file not found`);
      continue;
    }

    const content = fs.readFileSync(testFile, 'utf8');
    const lines = content.trim().split('\n');

    console.log(`Processing ${subject}: ${lines.length} items`);

    lines.forEach((line, index) => {
      const row = parseCSVLine(line);
      const item = convertToMCQMCP(row, subject, index);
      if (item) {
        allItems.push(item);
      }
    });
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
  bank.metadata.sources['mmlu-hendrycks'] = {
    name: 'MMLU (Massive Multitask Language Understanding)',
    license: 'MIT',
    url: 'https://github.com/hendrycks/test',
    imported_at: new Date().toISOString().split('T')[0],
    description: 'K-12 and college mathematics MCQs'
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

  // Cleanup
  execSync(`rm -rf ${tmpDir}`, { stdio: 'pipe' });
}

importMMLU().catch(console.error);
