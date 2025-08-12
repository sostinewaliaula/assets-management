import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.log('You can find this in your Supabase dashboard under Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Default password for all users (they should change this on first login)
const DEFAULT_PASSWORD = 'Turnkey2024!';

async function linkExistingUsers() {
  console.log('🔗 Linking existing users to Supabase authentication...\n');

  try {
    // First, get all existing users from the database
    console.log('📋 Fetching existing users from database...');
    const { data: existingUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');

    if (fetchError) {
      console.error('❌ Error fetching existing users:', fetchError);
      return;
    }

    console.log(`✅ Found ${existingUsers.length} existing users`);

    // Get current auth users once to avoid repeated calls
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('❌ Error listing auth users:', listError);
      return;
    }
    const authUsers = listData?.users ?? [];

    // Process each user
    for (const user of existingUsers) {
      console.log(`\n👤 Processing user: ${user.email} (${user.name})`);

      try {
        // Check if auth user already exists
        const existingAuth = authUsers.find((u) => u.email === user.email);

        if (existingAuth) {
          console.log(`⚠️  Auth user already exists for ${user.email}, linking auth_id...`);

          // Link auth_id if missing or different
          const needsUpdate = !user.auth_id || user.auth_id !== existingAuth.id;
          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('users')
              .update({ auth_id: existingAuth.id, updated_at: new Date().toISOString() })
              .eq('id', user.id);

            if (updateError) {
              console.error(`❌ Error updating user record for ${user.email}:`, updateError);
            } else {
              console.log(`✅ Linked auth_id for ${user.email}`);
            }
          } else {
            console.log(`✅ auth_id already linked for ${user.email}`);
          }

          continue;
        }

        // Create auth user if it does not exist
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: user.role,
          },
        });

        if (authError) {
          console.error(`❌ Error creating auth user for ${user.email}:`, authError.message);
          continue;
        }

        console.log(`✅ Auth user created for ${user.email}`);

        // Update the user record to link it with the auth user ID
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_id: authUser.user.id, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (updateError) {
          console.error(`❌ Error updating user record for ${user.email}:`, updateError);
          continue;
        }

        console.log(`✅ User record updated for ${user.email}`);
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
      }
    }

    console.log('\n🎉 User linking process complete!');
    console.log('\n📝 Default login credentials for users created in auth during this run:');
    console.log(`Password: ${DEFAULT_PASSWORD}`);
  } catch (error) {
    console.error('❌ Linking process failed:', error);
  }
}

// Run the linking process
linkExistingUsers();
