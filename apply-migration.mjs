#!/usr/bin/env node

/**
 * Apply Missing Migration - user_roles table
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Applying Missing Migration: user_roles table\n');

// Load environment variables
const envContent = readFileSync(join(__dirname, '.env'), 'utf-8');
const SUPABASE_URL = envContent.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SUPABASE_ANON_KEY = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('❌ Error: Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SQL to create user_roles table
const sql = `
-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Create RLS policy
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);
`;

console.log('📝 SQL to execute:');
console.log(sql);
console.log('\n⚠️  NOTE: This script cannot execute SQL directly.');
console.log('Please run this SQL in Supabase Dashboard → SQL Editor\n');

console.log('📋 Steps:');
console.log('1. Go to: https://supabase.com/dashboard');
console.log('2. Select project: vbzqgdoztsnkjnutioqd');
console.log('3. Click: SQL Editor → + New Query');
console.log('4. Copy the SQL from: supabase/migrations/20251229_create_user_roles.sql');
console.log('5. Paste and click: Run\n');

console.log('✅ After running the SQL, restart the dev server with: npm run dev\n');
