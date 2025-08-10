# Supabase Setup Guide

This guide will help you connect your assets management application to Supabase.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "assets-management")
5. Enter a database password (save this securely)
6. Choose a region close to your users
7. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon (public) key

## Step 3: Set Up Environment Variables

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add the following variables:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Replace the placeholder values with your actual Supabase credentials

## Step 4: Set Up the Database

1. In your Supabase dashboard, go to SQL Editor
2. Copy the contents of `supabase-schema.sql`
3. Paste it into the SQL editor and click "Run"
4. This will create all the necessary tables and sample data

## Step 5: Test the Connection

1. Start your development server: `npm run dev`
2. Navigate to the Department Management page
3. You should see the sample departments loaded from the database
4. Try adding, editing, or deleting a department

## Database Schema

The application uses the following tables:

- **departments**: Company departments with managers and locations
- **users**: System users with roles and department assignments
- **assets**: Company assets with types, values, and assignments
- **issues**: Support tickets and maintenance requests

## Row Level Security (RLS)

The database includes Row Level Security policies:
- All users can view data
- Only admin users can modify data
- Policies are based on the user's role in the JWT token

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables" error**
   - Ensure your `.env` file exists and contains the correct credentials
   - Restart your development server after adding environment variables

2. **Database connection errors**
   - Verify your Supabase project is active
   - Check that your database password is correct
   - Ensure your IP is not blocked by Supabase

3. **Permission denied errors**
   - Check that the RLS policies are properly set up
   - Verify the user has the correct role

### Getting Help

- Check the [Supabase documentation](https://supabase.com/docs)
- Review the browser console for error messages
- Check the Supabase dashboard logs

## Next Steps

After setting up the database:

1. Implement user authentication using Supabase Auth
2. Add more sophisticated RLS policies
3. Set up real-time subscriptions for live updates
4. Add database backups and monitoring
5. Implement user roles and permissions

## Security Notes

- Never commit your `.env` file to version control
- Use environment variables for all sensitive configuration
- Regularly rotate your database passwords
- Monitor your Supabase usage and costs
