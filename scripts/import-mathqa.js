#!/usr/bin/env node
/**
 * Import MathQA geometry items
 *
 * Source: https://math-qa.github.io/
 * License: Apache 2.0
 * 2,117 geometry MCQs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MATHQA_URL = 'https://raw.githubusercontent.com/math-qa/math-qa.github.io/master/data/MathQA/train.json';

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function parseOptions(optionsStr) {
  // Format: "a ) rs . 400 , b ) rs . 300 , c ) rs . 500 , d ) rs . 350 , e ) none of these"
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

function inferSubtopic(problem) {
  const p = problem.toLowerCase();

  if (p.includes('circle') || p.includes('radius') || p.includes('diameter') || p.includes('circumference')) {
    return 'circles';
  }
  if (p.includes('triangle') || p.includes('hypotenuse') || p.includes('pythagorean')) {
    return 'triangles';
  }
  if (p.includes('rectangle') || p.includes('square') || p.includes('parallelogram') || p.includes('quadrilateral')) {
    return 'quadrilaterals';
  }
  if (p.includes('volume') || p.includes('cube') || p.includes('sphere') || p.includes('cylinder') || p.includes('cone')) {
    return 'volume';
  }
  if (p.includes('area') || p.includes('perimeter')) {
    return 'area-perimeter';
  }
  if (p.includes('angle') || p.includes('degree') || p.includes('perpendicular') || p.includes('parallel')) {
    return 'angles';
  }

  return 'general';
}

function convertToMCQMCP(item, index) {
  const options = parseOptions(item.options);

  // Filter out "none of these" type options and ensure we have 4
  const validOptions = options.filter(o =>
    !o.text.toLowerCase().includes('none of') &&
    !o.text.toLowerCase().includes('cannot be determined')
  );

  if (validOptions.length < 4) {
    // Take first 4 if we have enough, otherwise use what we have plus "none" options
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

  // Check we have a correct answer
  if (!allOptions.some(o => o.isCorrect)) {
    // Correct answer might be in the cut options, try to include it
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

  const subtopic = inferSubtopic(item.Problem);
  const paddedIndex = String(index + 1).padStart(4, '0');

  return {
    id: `mathqa-geo-${paddedIndex}`,
    topic: 'math-geometry',
    difficulty: 'medium',
    stem: item.Problem,
    options: formattedOptions,
    correct: correctLetter,
    feedback: {
      correct: 'Correct!',
      incorrect: 'Review the geometry concepts involved.',
      explanation: item.Rationale.replace(/"/g, '').trim()
    },
    provenance: {
      source: 'mathqa',
      source_url: 'https://math-qa.github.io/',
      license: 'Apache-2.0',
      imported_at: new Date().toISOString().split('T')[0],
      original_format: 'mathqa-json'
    },
    tags: ['math', 'geometry', subtopic, 'imported']
  };
}

async function importMathQA(limit = 500) {
  console.log('Checking for MathQA dataset...');

  // Check if already downloaded
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

  // Filter geometry items
  const geometryItems = data.filter(i => i.category === 'geometry');
  console.log(`Found ${geometryItems.length} geometry items`);

  const items = [];
  const toProcess = geometryItems.slice(0, limit);

  for (let i = 0; i < toProcess.length; i++) {
    const converted = convertToMCQMCP(toProcess[i], i);
    if (converted) {
      items.push(converted);
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
  const existingStems = new Set(bank.items.map(i => i.stem.toLowerCase().trim().substring(0, 80)));
  const newItems = items.filter(item => !existingStems.has(item.stem.toLowerCase().trim().substring(0, 80)));

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
    description: 'Math word problems including geometry'
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

const limit = parseInt(process.argv[2]) || 500;
importMathQA(limit).catch(console.error);
