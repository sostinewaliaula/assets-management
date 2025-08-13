# Supabase Setup Guide

## Environment Variables

Create a `.env` file in your project root with the following variables:

```bash
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## How to Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and sign in
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key

## Example .env File

```bash
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Common Connection Issues & Solutions

### 1. Missing Environment Variables
- Ensure your `.env` file exists and has the correct values
- Restart your development server after adding environment variables

### 2. Network/Firewall Issues
- Check if your network allows connections to Supabase
- Verify your Supabase project is not paused

### 3. Rate Limiting
- Supabase has rate limits on the free tier
- Consider upgrading if you're hitting limits

### 4. Authentication Issues
- Ensure your RLS (Row Level Security) policies are correct
- Check if your user has proper permissions

## Testing Your Connection

After setting up, you can test your connection by:

1. Opening the browser console
2. Looking for connection status messages
3. Checking if the connection indicator shows "Connected"

## Troubleshooting

If you still have connection issues:

1. **Clear browser cache and cookies**
2. **Restart your development server**
3. **Check Supabase project status** (not paused)
4. **Verify environment variables** are loaded correctly
5. **Check browser console** for error messages
