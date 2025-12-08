#!/usr/bin/env node
/**
 * Import Allen AI SciQ dataset (science questions)
 *
 * Source: https://allenai.org/data/sciq
 * License: CC BY-SA 4.0
 * 13,679 science exam questions about Physics, Chemistry, Biology
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCIQ_URL = 'https://ai2-public-datasets.s3.amazonaws.com/sciq/SciQ.zip';

// Topic mappings based on question content
function inferTopic(question, support) {
  const text = (question + ' ' + support).toLowerCase();

  // Biology
  if (text.includes('cell') || text.includes('organism') || text.includes('species') ||
      text.includes('dna') || text.includes('gene') || text.includes('protein') ||
      text.includes('bacteria') || text.includes('virus') || text.includes('plant') ||
      text.includes('animal') || text.includes('evolution') || text.includes('ecosystem')) {
    return 'science-biology';
  }

  // Chemistry
  if (text.includes('atom') || text.includes('molecule') || text.includes('chemical') ||
      text.includes('element') || text.includes('compound') || text.includes('reaction') ||
      text.includes('acid') || text.includes('base') || text.includes('ph') ||
      text.includes('bond') || text.includes('electron') || text.includes('ion')) {
    return 'science-chemistry';
  }

  // Physics
  if (text.includes('force') || text.includes('energy') || text.includes('motion') ||
      text.includes('gravity') || text.includes('wave') || text.includes('light') ||
      text.includes('electric') || text.includes('magnetic') || text.includes('velocity') ||
      text.includes('acceleration') || text.includes('mass') || text.includes('momentum')) {
    return 'science-physics';
  }

  // Earth Science
  if (text.includes('earth') || text.includes('rock') || text.includes('mineral') ||
      text.includes('plate') || text.includes('volcano') || text.includes('earthquake') ||
      text.includes('weather') || text.includes('climate') || text.includes('atmosphere') ||
      text.includes('ocean') || text.includes('continent')) {
    return 'science-earth';
  }

  // Environmental
  if (text.includes('environment') || text.includes('pollution') || text.includes('conservation') ||
      text.includes('resource') || text.includes('sustainable') || text.includes('carbon')) {
    return 'science-environmental';
  }

  // Default to biology (most common in science curricula)
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

function convertToMCQMCP(sciqItem, index) {
  const allOptions = [
    { text: sciqItem.correct_answer, isCorrect: true },
    { text: sciqItem.distractor1, isCorrect: false },
    { text: sciqItem.distractor2, isCorrect: false },
    { text: sciqItem.distractor3, isCorrect: false }
  ];

  // Filter out empty options
  const validOptions = allOptions.filter(o => o.text && o.text.trim());
  if (validOptions.length < 4) {
    return null; // Skip items with missing options
  }

  const shuffled = shuffleArray(validOptions);
  const correctIndex = shuffled.findIndex(o => o.isCorrect);
  const correctLetter = ['A', 'B', 'C', 'D'][correctIndex];

  const options = shuffled.map((opt, i) => ({
    id: ['A', 'B', 'C', 'D'][i],
    text: opt.text
  }));

  const topic = inferTopic(sciqItem.question, sciqItem.support || '');
  const paddedIndex = String(index + 1).padStart(4, '0');

  return {
    id: `sciq-${paddedIndex}`,
    topic,
    difficulty: 'medium', // SciQ is roughly high school level
    stem: sciqItem.question,
    options,
    correct: correctLetter,
    feedback: {
      correct: 'Correct!',
      incorrect: 'Review this science concept.',
      explanation: sciqItem.support || 'No additional explanation provided.'
    },
    provenance: {
      source: 'sciq-allenai',
      source_url: 'https://allenai.org/data/sciq',
      license: 'CC-BY-SA-4.0',
      imported_at: new Date().toISOString().split('T')[0],
      original_format: 'sciq'
    },
    tags: ['science', topic.replace('science-', ''), 'imported']
  };
}

async function importSciQ(limit = 300) {
  console.log('Downloading SciQ dataset...');

  // Download and extract
  const tmpDir = '/tmp/sciq_import';
  execSync(`rm -rf ${tmpDir} && mkdir -p ${tmpDir}`, { stdio: 'pipe' });
  execSync(`cd ${tmpDir} && curl -sL "${SCIQ_URL}" -o sciq.zip && unzip -o sciq.zip`, { stdio: 'pipe' });

  // Find the train.json file
  const dataDir = `${tmpDir}/SciQ dataset-2 3`;
  const trainData = JSON.parse(fs.readFileSync(`${dataDir}/train.json`, 'utf8'));

  console.log(`Total items in dataset: ${trainData.length}`);

  const items = [];
  const toProcess = trainData.slice(0, limit);

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
  const existingStems = new Set(bank.items.map(i => i.stem.toLowerCase().trim()));
  const newItems = items.filter(item => !existingStems.has(item.stem.toLowerCase().trim()));

  console.log(`New unique items: ${newItems.length}`);

  // Add new items
  bank.items = [...bank.items, ...newItems];

  // Update metadata
  bank.metadata.sources = bank.metadata.sources || {};
  bank.metadata.sources['sciq-allenai'] = {
    name: 'Allen AI SciQ Dataset',
    license: 'CC-BY-SA-4.0',
    url: 'https://allenai.org/data/sciq',
    imported_at: new Date().toISOString().split('T')[0],
    description: 'Science exam questions covering Physics, Chemistry, Biology'
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

// Run with optional limit argument
const limit = parseInt(process.argv[2]) || 300;
importSciQ(limit).catch(console.error);
