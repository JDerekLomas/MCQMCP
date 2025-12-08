#!/usr/bin/env node
/**
 * Add provenance to items that are missing it
 */

const fs = require('fs');
const path = require('path');

const bankPath = path.join(__dirname, '../packages/website/src/lib/mcp/item-bank.json');
const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));

// Add provenance to items without it
bank.items = bank.items.map(item => {
  if (!item.provenance) {
    // Determine source based on item ID prefix
    let source, license;

    if (item.id.startsWith('js-') || item.id.startsWith('html-') || item.id.startsWith('react-')) {
      source = 'mcqmcp-ai-generated';
      license = 'CC-BY-4.0';
    } else if (item.id.startsWith('vibe-')) {
      source = 'mcqmcp-ai-generated';
      license = 'CC-BY-4.0';
    } else if (item.id.startsWith('plasma-')) {
      source = 'mcqmcp-ai-generated';
      license = 'CC-BY-4.0';
    } else {
      source = 'mcqmcp-original';
      license = 'CC-BY-4.0';
    }

    item.provenance = {
      source: source,
      license: license,
      created_at: '2025-12-01',
      original_format: 'mcqmcp-native'
    };

    // Add 'ai-generated' tag if applicable
    if (source === 'mcqmcp-ai-generated') {
      if (!item.tags) {
        item.tags = ['ai-generated'];
      } else if (!item.tags.includes('ai-generated')) {
        item.tags.push('ai-generated');
      }
    }
  }
  return item;
});

// Update metadata sources
bank.metadata.sources['mcqmcp-ai-generated'] = {
  name: 'MCQMCP AI-Generated Items',
  license: 'CC-BY-4.0',
  url: 'https://github.com/JDerekLomas/MCQMCP-monorepo',
  description: 'Items generated with Claude AI assistance',
  created_at: '2025-12-01'
};

bank.metadata.last_updated = new Date().toISOString();

fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2));

// Report
const withProvenance = bank.items.filter(i => i.provenance);
const aiGenerated = bank.items.filter(i => i.provenance && i.provenance.source === 'mcqmcp-ai-generated');

console.log('Items with provenance:', withProvenance.length, '/', bank.items.length);
console.log('AI-generated items:', aiGenerated.length);
console.log('\nSources in metadata:');
Object.entries(bank.metadata.sources).forEach(([key, val]) => {
  console.log(`  ${key}: ${val.license}`);
});
