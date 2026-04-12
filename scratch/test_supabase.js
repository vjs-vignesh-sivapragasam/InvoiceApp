const { createClient } = require('@supabase/supabase-js');
const appSettings = require('../appSettings.json');

const supabaseUrl = appSettings.Supabase.ProjectUrl;
const supabaseAnonKey = appSettings.Supabase.ApiKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing connection to:', supabaseUrl);
  console.log('Using Key (first 10 chars):', supabaseAnonKey.substring(0, 10));
  try {
    const { data, error } = await supabase.from('userroles').select('*').limit(1);
    if (error) {
      console.error('Connection failed with Supabase error:', error);
    } else {
      console.log('Connection successful! Row count:', data.length);
    }
  } catch (err) {
    console.error('Runtime error during fetch:', err);
  }
}

test();
