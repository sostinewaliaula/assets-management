import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need to add this to your .env

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.log('You can find this in your Supabase dashboard under Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test users to create
const testUsers = [
  {
    email: 'admin@turnkey.com',
    password: 'password123',
    name: 'Admin User',
    role: 'admin',
    department_id: null,
    phone: '+1234567890',
    position: 'System Administrator',
    is_active: true
  },
  {
    email: 'officer@turnkey.com',
    password: 'password123',
    name: 'Department Officer',
    role: 'department_officer',
    department_id: null, // Will be set after department creation
    phone: '+1234567891',
    position: 'Department Manager',
    is_active: true
  },
  {
    email: 'user@turnkey.com',
    password: 'password123',
    name: 'Regular User',
    role: 'user',
    department_id: null, // Will be set after department creation
    phone: '+1234567892',
    position: 'Employee',
    is_active: true
  }
];

async function createTestUsers() {
  console.log('🚀 Setting up test users...\n');

  try {
    // First, let's create a test department
    console.log('📋 Creating test department...');
    const { data: department, error: deptError } = await supabase
      .from('departments')
      .insert([
        {
          name: 'IT Department',
          description: 'Information Technology Department',
          location: 'Main Building, Floor 2',
          manager: 'Department Officer',
          manager_id: null // Will be updated after user creation
        }
      ])
      .select()
      .single();

    if (deptError) {
      console.error('❌ Error creating department:', deptError);
      return;
    }

    console.log('✅ Department created:', department.name);

    // Create users
    for (const userData of testUsers) {
      console.log(`\n👤 Creating user: ${userData.email}`);
      
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        console.error(`❌ Error creating auth user for ${userData.email}:`, authError.message);
        continue;
      }

      console.log(`✅ Auth user created for ${userData.email}`);

      // Create user profile in our users table
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            department_id: userData.role === 'admin' ? null : department.id,
            phone: userData.phone,
            position: userData.position,
            is_active: userData.is_active
          }
        ])
        .select()
        .single();

      if (profileError) {
        console.error(`❌ Error creating profile for ${userData.email}:`, profileError);
        continue;
      }

      console.log(`✅ Profile created for ${userData.email} (${userData.role})`);
    }

    // Update department manager
    const { data: officerUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'officer@turnkey.com')
      .single();

    if (officerUser) {
      await supabase
        .from('departments')
        .update({ manager_id: officerUser.id })
        .eq('id', department.id);
      
      console.log('✅ Department manager updated');
    }

    console.log('\n🎉 Test users setup complete!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin: admin@turnkey.com / password123');
    console.log('Officer: officer@turnkey.com / password123');
    console.log('User: user@turnkey.com / password123');
    console.log('\n⚠️  Remember to change these passwords in production!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
createTestUsers();
