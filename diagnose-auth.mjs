#!/usr/bin/env node

/**
 * Supabase Authentication Diagnostic Tool
 * This script helps diagnose authentication issues
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 Supabase Authentication Diagnostics\n');
console.log('=' .repeat(50));

// Load environment variables
const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

console.log('\n✓ Checking Supabase Configuration...');
console.log(`  URL: ${SUPABASE_URL}`);
console.log(`  Key: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'NOT SET'}`);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('\n❌ Error: Supabase credentials not found in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('\n✓ Testing Supabase Connection...');

try {
  // Test 1: Check if we can connect to Supabase
  const { data: healthCheck, error: healthError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);

  if (healthError) {
    console.log(`  ❌ Connection Error: ${healthError.message}`);
  } else {
    console.log('  ✅ Connection successful');
  }

  // Test 2: Check auth settings
  console.log('\n✓ Checking Authentication Settings...');
  console.log('  ℹ️  Please verify in Supabase Dashboard:');
  console.log('     1. Go to Authentication → Settings');
  console.log('     2. Check "Enable Email Confirmations"');
  console.log('     3. Check "Enable Email Signup"');
  console.log('     4. Verify Site URL and Redirect URLs');

  // Test 3: Check if tables exist
  console.log('\n✓ Checking Database Tables...');
  
  const tables = ['profiles', 'user_roles'];
  for (const table of tables) {
    const { error: tableError } = await supabase
      .from(table)
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log(`  ❌ Table '${table}': ${tableError.message}`);
    } else {
      console.log(`  ✅ Table '${table}' exists`);
    }
  }

  // Test 4: List existing users (count only)
  console.log('\n✓ Checking User Accounts...');
  const { count, error: countError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log(`  ⚠️  Cannot count users: ${countError.message}`);
  } else {
    console.log(`  ℹ️  Total profiles in database: ${count || 0}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📋 Common 401 Unauthorized Causes:\n');
  console.log('1. **Wrong Email/Password**');
  console.log('   → Double-check your credentials\n');
  
  console.log('2. **User Not Registered**');
  console.log('   → Try registering first before logging in\n');
  
  console.log('3. **Email Confirmation Required**');
  console.log('   → Check your email for confirmation link');
  console.log('   → Or disable email confirmation in Supabase Dashboard:\n');
  console.log('     • Go to: Authentication → Settings');
  console.log('     • Find: "Enable Email Confirmations"');
  console.log('     • Toggle: OFF (for development)\n');
  
  console.log('4. **Invalid Supabase Credentials**');
  console.log('   → Verify ANON_KEY in .env file');
  console.log('   → Check project is active in Supabase Dashboard\n');

  console.log('📖 Next Steps:\n');
  console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Select your project: cxszwmogxarovfuiofqu');
  console.log('3. Navigate to: Authentication → Users');
  console.log('4. Check if your test user exists');
  console.log('5. If not, try registering a new account\n');

  console.log('💡 Quick Fix for Development:\n');
  console.log('   Disable email confirmation:');
  console.log('   Dashboard → Authentication → Settings');
  console.log('   → Disable "Enable Email Confirmations"\n');

} catch (err) {
  console.log(`\n❌ Error: ${err.message}`);
}

console.log('');
