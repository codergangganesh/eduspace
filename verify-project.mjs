#!/usr/bin/env node

/**
 * EduSpace Project Verification Script
 * This script checks for common issues and verifies the project setup
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 EduSpace Project Verification\n');
console.log('=' .repeat(50));

// Check 1: Environment Variables
console.log('\n✓ Checking Environment Variables...');
let envContent = '';
try {
  envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
  const envVars = {
    'VITE_SUPABASE_URL': /VITE_SUPABASE_URL=(.+)/,
    'VITE_SUPABASE_ANON_KEY': /VITE_SUPABASE_ANON_KEY=(.+)/,
    'GMAIL_USER': /GMAIL_USER=(.+)/,
    'GMAIL_APP_PASSWORD': /GMAIL_APP_PASSWORD=(.+)/,
    'PORT': /PORT=(.+)/
  };

  let envErrors = 0;
  for (const [key, regex] of Object.entries(envVars)) {
    const match = envContent.match(regex);
    if (!match || !match[1]) {
      console.log(`  ❌ ${key} is missing or empty`);
      envErrors++;
    } else {
      console.log(`  ✅ ${key} is set`);
    }
  }

  if (envErrors > 0) {
    console.log(`\n⚠️  ${envErrors} environment variable(s) missing!`);
  } else {
    console.log('\n✅ All environment variables are set');
  }
} catch (err) {
  console.log('  ❌ .env file not found');
}

// Check 2: Project Structure
console.log('\n✓ Checking Project Structure...');
const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  '.env',
  'src/App.tsx',
  'src/main.tsx',
  'src/contexts/AuthContext.tsx',
  'src/integrations/supabase/client.ts',
  'supabase/migrations/20251227075557_60d35f04-7716-4b3b-ae23-1952f6bbafd2.sql'
];

let structureErrors = 0;
for (const file of requiredFiles) {
  const filePath = join(__dirname, file);
  if (existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} is missing`);
    structureErrors++;
  }
}

if (structureErrors > 0) {
  console.log(`\n⚠️  ${structureErrors} required file(s) missing!`);
} else {
  console.log('\n✅ All required files present');
}

// Check 3: Package.json dependencies
console.log('\n✓ Checking Dependencies...');
try {
  const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'));
  const requiredDeps = [
    '@supabase/supabase-js',
    'react',
    'react-dom',
    'react-router-dom',
    'vite'
  ];

  let depErrors = 0;
  for (const dep of requiredDeps) {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`  ✅ ${dep}`);
    } else {
      console.log(`  ❌ ${dep} is missing`);
      depErrors++;
    }
  }

  if (depErrors > 0) {
    console.log(`\n⚠️  ${depErrors} required dependency(ies) missing!`);
  } else {
    console.log('\n✅ All required dependencies present');
  }
} catch (err) {
  console.log('  ❌ Error reading package.json');
}

// Check 4: Node modules
console.log('\n✓ Checking Node Modules...');
if (existsSync(join(__dirname, 'node_modules'))) {
  console.log('  ✅ node_modules directory exists');
} else {
  console.log('  ❌ node_modules directory missing - run: npm install');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📊 Verification Summary:');

const allGood = structureErrors === 0 && existsSync(join(__dirname, 'node_modules'));

if (allGood) {
  console.log('\n🎉 All checks passed! Your project is ready to run.');
  console.log('\nNext steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open: http://localhost:8082 (or the port shown)');
  console.log('  3. Test the login/register functionality');
  console.log('\n📖 For detailed information, see: PROJECT_STATUS.md');
} else {
  console.log('\n⚠️  Some issues found. Please fix them before running the app.');
  console.log('\n📖 For troubleshooting, see: PROJECT_STATUS.md');
}

console.log('\n');
