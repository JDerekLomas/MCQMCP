#!/usr/bin/env node
/**
 * Import RACE dataset (Reading Comprehension)
 *
 * Source: https://www.cs.cmu.edu/~glai1/data/race/
 * License: Research use
 * 97,867 reading comprehension MCQs for middle and high school
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RACE_URL = 'http://www.cs.cmu.edu/~glai1/data/race/RACE.tar.gz';

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function convertToMCQMCP(raceItem, questionIndex, level, fileIndex) {
  const question = raceItem.questions[questionIndex];
  const options = raceItem.options[questionIndex];
  const correctLetter = raceItem.answers[questionIndex];

  if (!question || !options || options.length !== 4) {
    return null;
  }

  const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
  if (correctIndex === -1) return null;

  const allOptions = options.map((text, i) => ({
    text,
    isCorrect: i === correctIndex
  }));

  const shuffled = shuffleArray(allOptions);
  const newCorrectIndex = shuffled.findIndex(o => o.isCorrect);
  const newCorrectLetter = ['A', 'B', 'C', 'D'][newCorrectIndex];

  const formattedOptions = shuffled.map((opt, i) => ({
    id: ['A', 'B', 'C', 'D'][i],
    text: opt.text
  }));

  const paddedFileIndex = String(fileIndex + 1).padStart(4, '0');
  const paddedQIndex = String(questionIndex + 1).padStart(2, '0');

  // Truncate article for explanation (keep it reasonable)
  const articlePreview = raceItem.article.length > 500
    ? raceItem.article.substring(0, 500) + '...'
    : raceItem.article;

  return {
    id: `race-${level}-${paddedFileIndex}-q${paddedQIndex}`,
    topic: 'language-arts-reading',
    difficulty: level === 'middle' ? 'easy' : 'medium',
    stem: question,
    options: formattedOptions,
    correct: newCorrectLetter,
    context: raceItem.article, // Include full passage as context
    feedback: {
      correct: 'Correct!',
      incorrect: 'Re-read the passage carefully.',
      explanation: `This question tests reading comprehension. The answer can be found in the passage.`
    },
    provenance: {
      source: 'race-cmu',
      source_id: raceItem.id,
      source_url: 'https://www.cs.cmu.edu/~glai1/data/race/',
      license: 'Research-use',
      imported_at: new Date().toISOString().split('T')[0],
      original_format: 'race-json'
    },
    tags: ['language-arts', 'reading-comprehension', level, 'imported']
  };
}

async function importRACE(limit = 300) {
  console.log('Checking for RACE dataset...');

  const raceDir = '/tmp/RACE';

  if (!fs.existsSync(raceDir)) {
    console.log('Downloading RACE dataset...');
    execSync(`cd /tmp && curl -sL "${RACE_URL}" -o race.tar.gz && tar -xzf race.tar.gz`, { stdio: 'pipe' });
  }

  const items = [];
  let fileIndex = 0;

  // Process both middle and high school
  for (const level of ['middle', 'high']) {
    const levelDir = `${raceDir}/train/${level}`;

    if (!fs.existsSync(levelDir)) {
      console.log(`Skipping ${level} - directory not found`);
      continue;
    }

    const files = fs.readdirSync(levelDir).filter(f => f.endsWith('.txt'));
    console.log(`Processing ${level}: ${files.length} files`);

    const levelLimit = Math.floor(limit / 2);
    let levelCount = 0;

    for (const file of files) {
      if (levelCount >= levelLimit) break;

      try {
        const content = fs.readFileSync(`${levelDir}/${file}`, 'utf8');
        const raceItem = JSON.parse(content);

        // Each file can have multiple questions
        for (let q = 0; q < raceItem.questions.length; q++) {
          if (levelCount >= levelLimit) break;

          const converted = convertToMCQMCP(raceItem, q, level, fileIndex);
          if (converted) {
            items.push(converted);
            levelCount++;
          }
        }

        fileIndex++;
      } catch (e) {
        // Skip malformed files
      }
    }

    console.log(`  Converted ${levelCount} items from ${level}`);
  }

  console.log(`\nTotal converted: ${items.length} items`);

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
  bank.metadata.sources['race-cmu'] = {
    name: 'RACE Reading Comprehension Dataset',
    license: 'Research-use',
    url: 'https://www.cs.cmu.edu/~glai1/data/race/',
    imported_at: new Date().toISOString().split('T')[0],
    description: 'Reading comprehension MCQs for middle and high school'
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
importRACE(limit).catch(console.error);
