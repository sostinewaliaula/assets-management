# Forgot Password Functionality Setup

This document explains how the forgot password functionality works in the Assets Management System and how to set it up.

## Overview

The forgot password functionality allows users to reset their passwords through email verification. It uses Supabase's built-in password recovery system.

## How It Works

### 1. User Requests Password Reset
- User navigates to `/forgot-password`
- Enters their email address
- System validates the email format
- System sends password reset email via Supabase

### 2. Password Reset Email
- Supabase sends an email with a recovery link
- The link contains authentication tokens
- User clicks the link to access `/reset-password`

### 3. Password Reset Process
- User is redirected to `/reset-password`
- System validates the recovery tokens
- User enters new password and confirms it
- System updates the password in Supabase
- User is redirected to login page

## Components

### ForgotPassword.tsx
- Handles email input and validation
- Calls Supabase `resetPasswordForEmail` function
- Shows success/error messages
- Provides UI for different states (form vs success)

### ResetPassword.tsx
- Validates recovery tokens from URL
- Handles password reset form
- Updates password via Supabase
- Provides proper error handling and user feedback

### AuthContext.tsx
- Provides `forgotPassword` and `resetPassword` functions
- Manages authentication state
- Handles Supabase auth operations

## Supabase Configuration

### Required Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Email Templates
Supabase automatically sends password reset emails. You can customize these in your Supabase dashboard:

1. Go to Authentication > Email Templates
2. Customize the "Password Reset" template
3. Ensure the redirect URL is set to: `{your_domain}/reset-password`

### Auth Settings
The system is configured with:
- `detectSessionInUrl: true` - Automatically detects auth tokens in URL
- `flowType: 'pkce'` - Uses PKCE flow for better security
- `autoRefreshToken: true` - Automatically refreshes expired tokens

## Security Features

1. **Email Validation**: Basic email format validation
2. **Token Validation**: Recovery tokens are validated before allowing password reset
3. **Session Management**: Proper session handling and cleanup
4. **Error Handling**: Comprehensive error messages for different failure scenarios
5. **Rate Limiting**: Supabase handles rate limiting for password reset requests

## User Experience

### Forgot Password Flow
1. User enters email → Loading state → Success message
2. Clear instructions about checking email
3. Option to send to different email
4. Easy navigation back to login

### Reset Password Flow
1. Automatic token validation
2. Clear password requirements (8+ characters)
3. Password confirmation
4. Success feedback and automatic redirect

## Testing

To test the functionality:

1. **Start the development server**: `npm run dev`
2. **Navigate to**: `/forgot-password`
3. **Enter a valid email**: Use an email that exists in your Supabase users table
4. **Check email**: Look for the password reset email
5. **Click the link**: Should redirect to `/reset-password`
6. **Set new password**: Enter and confirm new password
7. **Verify**: Should redirect to login with success message

## Troubleshooting

### Common Issues

1. **Email not received**
   - Check spam folder
   - Verify email exists in Supabase users table
   - Check Supabase email settings

2. **Invalid recovery link**
   - Links expire after a certain time
   - Request a new password reset
   - Check if tokens are properly passed in URL

3. **Password reset fails**
   - Ensure password meets requirements (8+ characters)
   - Check browser console for errors
   - Verify Supabase connection

### Debug Steps

1. Check browser console for errors
2. Verify Supabase environment variables
3. Check Supabase dashboard for auth logs
4. Ensure email templates are configured
5. Verify redirect URLs are correct

## Future Enhancements

1. **Password Strength Indicator**: Visual feedback on password strength
2. **Two-Factor Authentication**: Additional security layer
3. **Account Lockout**: Prevent brute force attacks
4. **Audit Logging**: Track password reset attempts
5. **Custom Email Templates**: Branded email communications

## Support

If you encounter issues:
1. Check this documentation
2. Review Supabase documentation
3. Check browser console for errors
4. Verify environment configuration
5. Test with a known working email address
