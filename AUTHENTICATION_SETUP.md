# Supabase Authentication Setup Guide

This guide will help you set up authentication with your Supabase backend for the Assets Management application, specifically for linking your existing users to Supabase authentication.

## Prerequisites

1. A Supabase project with the database schema already set up
2. Your Supabase URL and API keys
3. Node.js installed on your system
4. Existing users in your `users` table (from your schema)

## Step 1: Environment Variables

1. Copy your `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Supabase Service Role Key to the `.env` file:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   **Important**: You can find your Service Role Key in your Supabase dashboard under:
   - Settings → API → Project API keys → `service_role` key

## Step 2: Database Migration

Run the migration script to add the `auth_id` column and update RLS policies:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `add-auth-id-migration.sql`
4. Execute the script

This will:
- Add `auth_id` column to link users with Supabase auth
- Update RLS policies for proper authentication
- Create necessary indexes for performance

## Step 3: Link Existing Users

Run the linking script to connect your existing users with Supabase authentication:

```bash
node link-existing-users.js
```

This script will:
- Fetch all existing users from your database
- Create corresponding auth users in Supabase
- Link them using the `auth_id` column
- Set a default password for all users

**Default Password**: `Turnkey2024!`

## Step 4: Test Authentication

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page and try logging in with existing user credentials

3. Test the following features:
   - Login with valid credentials
   - Login with invalid credentials (should show error)
   - Forgot password flow
   - Logout functionality
   - Session persistence (refresh the page)

## Step 5: Email Configuration (Optional)

For password reset emails to work properly:

1. Go to your Supabase dashboard
2. Navigate to Authentication → Settings
3. Configure your email provider (SMTP or use Supabase's built-in email service)
4. Set up email templates for password reset

## Features Implemented

### ✅ Authentication Context
- Real-time session management
- Automatic user profile fetching from existing users table
- Role-based access control (admin, manager, user)
- Session persistence

### ✅ Login/Logout
- Email/password authentication
- Error handling with toast notifications
- Loading states
- Redirect to intended page after login

### ✅ Password Reset
- Forgot password email sending
- Password reset with validation
- Secure password requirements

### ✅ User Management
- Links existing user profiles with Supabase auth
- Role assignment (admin, manager, user)
- Department association
- Active/inactive status

## Your Existing Users

Based on your schema, you have the following users:

### Admin Users
- `admin@turnkeyafrica.com` - System Administrator

### Manager Users
- `john.odhiambo@turnkeyafrica.com` - IT Manager
- `jane.wanjiku@turnkeyafrica.com` - HR Manager
- `mike.kamau@turnkeyafrica.com` - Finance Manager
- `sarah.akinyi@turnkeyafrica.com` - Operations Manager
- `david.mutua@turnkeyafrica.com` - Marketing Manager
- `lisa.nyambura@turnkeyafrica.com` - Sales Manager
- `robert.kiprop@turnkeyafrica.com` - R&D Manager
- `emily.chebet@turnkeyafrica.com` - Support Manager

### Regular Users
- `alex.kipchirchir@turnkeyafrica.com` - Software Developer
- `maria.wanjiru@turnkeyafrica.com` - HR Specialist
- `james.kimani@turnkeyafrica.com` - Accountant
- `sophia.muthoni@turnkeyafrica.com` - Operations Analyst

## Security Considerations

1. **Service Role Key**: Never expose your service role key in client-side code
2. **Password Requirements**: Enforce strong passwords (minimum 8 characters)
3. **Email Verification**: Consider enabling email verification for new users
4. **Session Management**: Sessions are automatically managed by Supabase
5. **Row Level Security**: RLS policies ensure users only see relevant data
6. **Default Passwords**: Users should change their default password on first login

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check that your `.env` file exists and has the correct variables
   - Ensure the variable names match exactly

2. **"User profile not found in database"**
   - Make sure the migration script was run successfully
   - Check that the `auth_id` column exists in your users table
   - Verify that the linking script was executed

3. **"Invalid login credentials"**
   - Verify the user exists in your Supabase auth.users table
   - Check that the default password is correct: `Turnkey2024!`
   - Ensure the user was linked properly

4. **"Permission denied" errors**
   - Check that RLS policies were updated correctly
   - Verify user roles are set properly in the database

5. **Password reset emails not sending**
   - Configure email settings in Supabase dashboard
   - Check spam folder for reset emails

### Debug Mode

To enable debug logging, add this to your `.env`:
```
VITE_DEBUG=true
```

## Next Steps

1. **Change Default Passwords**: Encourage users to change their default passwords
2. **Email Templates**: Customize email templates for password reset
3. **Multi-factor Authentication**: Enable MFA for additional security
4. **Social Login**: Add Google, GitHub, or other OAuth providers
5. **User Registration**: Implement user registration if needed

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are correctly set
4. Check the Supabase logs in your dashboard
5. Verify that the migration and linking scripts ran successfully
