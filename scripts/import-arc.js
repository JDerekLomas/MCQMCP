#!/usr/bin/env node
/**
 * Import AI2 ARC (Reasoning Challenge) dataset
 *
 * Source: https://allenai.org/data/arc
 * License: CC BY-SA 4.0
 * 7,787 grade-school science questions (grades 3-9)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ARC_URL = 'https://s3-us-west-2.amazonaws.com/ai2-website/data/ARC-V1-Feb2018.zip';

// Topic inference based on question content
function inferTopic(stem) {
  const s = stem.toLowerCase();

  // Biology indicators
  if (s.includes('cell') || s.includes('organism') || s.includes('species') ||
      s.includes('plant') || s.includes('animal') || s.includes('bacteria') ||
      s.includes('virus') || s.includes('gene') || s.includes('inherit') ||
      s.includes('ecosystem') || s.includes('food chain') || s.includes('habitat') ||
      s.includes('reproduce') || s.includes('photosynthesis') || s.includes('respir')) {
    return 'science-biology';
  }

  // Chemistry indicators
  if (s.includes('atom') || s.includes('molecule') || s.includes('chemical') ||
      s.includes('element') || s.includes('compound') || s.includes('reaction') ||
      s.includes('acid') || s.includes('base') || s.includes('metal') ||
      s.includes('gas') || s.includes('liquid') || s.includes('solid') ||
      s.includes('dissolve') || s.includes('mixture') || s.includes('solution')) {
    return 'science-chemistry';
  }

  // Physics indicators
  if (s.includes('force') || s.includes('motion') || s.includes('energy') ||
      s.includes('gravity') || s.includes('speed') || s.includes('velocity') ||
      s.includes('magnet') || s.includes('electric') || s.includes('circuit') ||
      s.includes('light') || s.includes('wave') || s.includes('sound') ||
      s.includes('heat') || s.includes('temperature') || s.includes('friction')) {
    return 'science-physics';
  }

  // Earth Science indicators
  if (s.includes('rock') || s.includes('mineral') || s.includes('earth') ||
      s.includes('volcano') || s.includes('earthquake') || s.includes('plate') ||
      s.includes('weather') || s.includes('climate') || s.includes('cloud') ||
      s.includes('rain') || s.includes('season') || s.includes('moon') ||
      s.includes('sun') || s.includes('planet') || s.includes('star') ||
      s.includes('ocean') || s.includes('erosion') || s.includes('fossil')) {
    return 'science-earth';
  }

  // Environmental
  if (s.includes('environment') || s.includes('pollution') || s.includes('recycle') ||
      s.includes('conserv') || s.includes('resource') || s.includes('extinct')) {
    return 'science-environmental';
  }

  // Default to general science (biology is most common)
  return 'science-biology';
}

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function convertToMCQMCP(arcItem, index, difficulty) {
  const question = arcItem.question;
  const choices = question.choices;

  // ARC has 3-5 options, we need exactly 4
  if (choices.length < 4) {
    return null; // Skip questions with fewer than 4 options
  }

  // Find correct answer
  const correctLabel = arcItem.answerKey;

  // Map choices to our format
  const allOptions = choices.slice(0, 4).map(c => ({
    text: c.text,
    label: c.label,
    isCorrect: c.label === correctLabel || c.label === String(correctLabel)
  }));

  // Check we have a correct answer
  if (!allOptions.some(o => o.isCorrect)) {
    return null;
  }

  // Shuffle options
  const shuffled = shuffleArray(allOptions);
  const correctIndex = shuffled.findIndex(o => o.isCorrect);
  const correctLetter = ['A', 'B', 'C', 'D'][correctIndex];

  const options = shuffled.map((opt, i) => ({
    id: ['A', 'B', 'C', 'D'][i],
    text: opt.text
  }));

  const topic = inferTopic(question.stem);
  const paddedIndex = String(index + 1).padStart(4, '0');

  return {
    id: `arc-${difficulty}-${paddedIndex}`,
    topic,
    difficulty: difficulty === 'easy' ? 'easy' : 'medium',
    stem: question.stem,
    options,
    correct: correctLetter,
    feedback: {
      correct: 'Correct!',
      incorrect: 'Review this science concept.',
      explanation: 'This question tests understanding of grade-school science concepts.'
    },
    provenance: {
      source: 'arc-allenai',
      source_id: arcItem.id,
      source_url: 'https://allenai.org/data/arc',
      license: 'CC-BY-SA-4.0',
      imported_at: new Date().toISOString().split('T')[0],
      original_format: 'arc-jsonl'
    },
    tags: ['science', 'elementary', 'middle-school', `arc-${difficulty}`, 'imported']
  };
}

async function importARC(limit = 500) {
  console.log('Downloading ARC dataset...');

  const tmpDir = '/tmp/arc_import';
  execSync(`rm -rf ${tmpDir} && mkdir -p ${tmpDir}`, { stdio: 'pipe' });

  // Check if already downloaded
  const arcDir = '/tmp/ARC-V1-Feb2018-2';
  if (!fs.existsSync(arcDir)) {
    execSync(`cd /tmp && curl -sL "${ARC_URL}" -o arc.zip && unzip -o arc.zip`, { stdio: 'pipe' });
  }

  const allItems = [];
  let itemIndex = 0;

  // Process Easy set
  const easyFile = `${arcDir}/ARC-Easy/ARC-Easy-Train.jsonl`;
  if (fs.existsSync(easyFile)) {
    const lines = fs.readFileSync(easyFile, 'utf8').trim().split('\n');
    console.log(`Processing ARC-Easy: ${lines.length} items`);

    for (const line of lines.slice(0, Math.floor(limit / 2))) {
      try {
        const item = JSON.parse(line);
        const converted = convertToMCQMCP(item, itemIndex++, 'easy');
        if (converted) allItems.push(converted);
      } catch (e) { /* skip malformed */ }
    }
  }

  // Process Challenge set
  const challengeFile = `${arcDir}/ARC-Challenge/ARC-Challenge-Train.jsonl`;
  if (fs.existsSync(challengeFile)) {
    const lines = fs.readFileSync(challengeFile, 'utf8').trim().split('\n');
    console.log(`Processing ARC-Challenge: ${lines.length} items`);

    for (const line of lines.slice(0, Math.floor(limit / 2))) {
      try {
        const item = JSON.parse(line);
        const converted = convertToMCQMCP(item, itemIndex++, 'challenge');
        if (converted) allItems.push(converted);
      } catch (e) { /* skip malformed */ }
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

  // Filter duplicates
  const existingStems = new Set(bank.items.map(i => i.stem.toLowerCase().trim().substring(0, 80)));
  const newItems = allItems.filter(item => !existingStems.has(item.stem.toLowerCase().trim().substring(0, 80)));

  console.log(`New unique items: ${newItems.length}`);

  // Add new items
  bank.items = [...bank.items, ...newItems];

  // Update metadata
  bank.metadata.sources = bank.metadata.sources || {};
  bank.metadata.sources['arc-allenai'] = {
    name: 'AI2 ARC (Reasoning Challenge)',
    license: 'CC-BY-SA-4.0',
    url: 'https://allenai.org/data/arc',
    imported_at: new Date().toISOString().split('T')[0],
    description: 'Grade-school science questions (grades 3-9)'
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
importARC(limit).catch(console.error);
