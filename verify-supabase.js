// Test script to verify Supabase database setup
import { supabase } from './src/integrations/supabase/client.js';

async function verifyDatabase() {
  console.log('🔍 Verifying Supabase Database Setup...\n');

  try {
    // Test 1: Check if profiles table exists
    console.log('1️⃣ Checking profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message);
      console.log('   → You need to apply the database migration!');
    } else {
      console.log('✅ Profiles table exists');
      console.log(`   → Found ${profilesData?.length || 0} profile(s)`);
    }

    // Test 2: Check if user_roles table exists
    console.log('\n2️⃣ Checking user_roles table...');
    const { data: rolesData, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);

    if (rolesError) {
      console.error('❌ User_roles table error:', rolesError.message);
      console.log('   → You need to apply the database migration!');
    } else {
      console.log('✅ User_roles table exists');
      console.log(`   → Found ${rolesData?.length || 0} role(s)`);
    }

    // Test 3: Check Supabase connection
    console.log('\n3️⃣ Checking Supabase connection...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ User is authenticated');
      console.log(`   → User ID: ${session.user.id}`);
      console.log(`   → Email: ${session.user.email}`);
    } else {
      console.log('ℹ️  No active session (user not logged in)');
    }

    // Test 4: Check Google OAuth provider
    console.log('\n4️⃣ Checking Google OAuth configuration...');
    console.log('ℹ️  To test Google OAuth:');
    console.log('   1. Open http://localhost:5173 in your browser');
    console.log('   2. Click "Continue with Google"');
    console.log('   3. Select a role (Student/Lecturer/Admin)');
    console.log('   4. Complete the Google sign-in flow');

    console.log('\n' + '='.repeat(50));
    
    if (profilesError || rolesError) {
      console.log('\n⚠️  DATABASE MIGRATION REQUIRED!');
      console.log('\nTo apply the migration:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Select your project: cxszwmogxarovfuiofqu');
      console.log('3. Navigate to SQL Editor → New Query');
      console.log('4. Copy contents from: supabase/migrations/20251227075557_60d35f04-7716-4b3b-ae23-1952f6bbafd2.sql');
      console.log('5. Paste and run the query');
    } else {
      console.log('\n✅ Database setup looks good!');
      console.log('   Ready to test authentication flow.');
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }

  process.exit(0);
}

verifyDatabase();
