# Email Notifications Setup Guide

This guide explains how to set up and configure email notifications for the Assets Management System using Supabase and custom SMTP.

## Overview

The email notification system automatically sends emails to users when notifications are created in the system. It integrates with the existing notification system and provides:

- **Automatic email sending** when notifications are created
- **User preference management** for email notifications
- **Customizable email templates** with branding
- **Bulk notification support** for multiple users
- **Configurable notification types** and frequencies

## System Architecture

```
User Action → Notification Created → Email Service → SMTP → User Email
     ↓              ↓                    ↓         ↓        ↓
  Asset Assignment → Database → Email Template → Edge Function → Gmail/SMTP
```

## Setup Steps

### 1. Database Setup

Run the SQL setup file in your Supabase SQL Editor:

```sql
-- Run this in Supabase SQL Editor
-- File: email-notifications-setup.sql
```

This creates:
- `user_notification_preferences` table
- Enhanced notification functions
- User preference management functions
- Performance indexes

### 2. Environment Variables

Add these variables to your `.env` file:

```env
# SMTP Configuration
VITE_SMTP_HOST=smtp.gmail.com
VITE_SMTP_PORT=587
VITE_SMTP_USERNAME=your-email@gmail.com
VITE_SMTP_PASSWORD=your-app-password

# Sender Configuration
VITE_SENDER_NAME=Caava Group
VITE_SENDER_EMAIL=your-email@gmail.com

# Optional: Company Branding
VITE_COMPANY_LOGO=https://your-domain.com/logo.png
```

### 3. Supabase Edge Function

Deploy the email sending Edge Function:

```bash
# Navigate to your project directory
cd supabase/functions

# Deploy the function
supabase functions deploy send-email-notification
```

### 4. Edge Function Environment Variables

Set these in your Supabase dashboard under Settings > Edge Functions:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=your-email@gmail.com
SENDER_NAME=Caava Group
```

## Configuration Options

### Email Templates

The system automatically creates professional email templates with:

- **Company branding** (Caava Group)
- **Responsive design** for mobile and desktop
- **Notification type indicators** (success, error, warning, info)
- **Action buttons** linking back to the application
- **Plain text fallback** for email clients that don't support HTML

### User Preferences

Users can configure:

- **Email notifications on/off**
- **Notification types** (success, error, warning, info)
- **Email frequency** (immediate, daily digest, weekly digest)

### Notification Types

The system supports these notification types:

- **Success**: Asset assignments, completed tasks
- **Error**: System errors, failed operations
- **Warning**: Maintenance reminders, expiring warranties
- **Info**: General updates, comments, status changes

## Usage Examples

### Creating Notifications with Emails

```typescript
import { notificationService } from '../services/database';

// Single user notification with email
await notificationService.notifyUser(
  userId,
  'Asset Assigned',
  'You have been assigned a new laptop',
  'info'
);

// Bulk notifications with emails
await notificationService.notifyMultipleUsers(
  [user1Id, user2Id, user3Id],
  'System Maintenance',
  'System will be down for maintenance tonight',
  'warning'
);

// Direct notification creation with email
await notificationService.create({
  user_id: userId,
  title: 'New Comment',
  message: 'Someone commented on your issue',
  type: 'info',
  read: false
});
```

### Managing User Preferences

```typescript
import { supabase } from '../lib/supabase';

// Get user preferences
const { data: prefs } = await supabase.rpc('get_user_notification_preferences', {
  target_user: userId
});

// Update user preferences
const { data: updatedPrefs } = await supabase.rpc('update_user_notification_preferences', {
  target_user: userId,
  email_notifications: true,
  notification_types: ['warning', 'error'],
  email_frequency: 'daily'
});
```

## Email Templates

### HTML Template Features

- **Responsive design** with mobile-first approach
- **Brand colors** (primary: #667eea, secondary: #764ba2)
- **Professional styling** with rounded corners and shadows
- **Type-specific indicators** for different notification types
- **Call-to-action buttons** linking back to the application

### Template Customization

You can customize the email templates by modifying:

```typescript
// src/services/emailNotificationService.ts
private createEmailTemplate(data: EmailNotificationData): EmailTemplate {
  // Customize colors, layout, and content here
}
```

## Testing

### 1. Test Email Configuration

```typescript
import { emailNotificationService } from '../services/emailNotificationService';

// Test if email is enabled
const isEnabled = await emailNotificationService.isEmailEnabled();
console.log('Email enabled:', isEnabled);

// Test email sending
const result = await emailNotificationService.sendNotificationEmail({
  userId: 'test-user-id',
  userEmail: 'test@example.com',
  userName: 'Test User',
  title: 'Test Notification',
  message: 'This is a test email notification',
  type: 'info',
  notificationId: 'test-notification-id'
});
```

### 2. Test Database Functions

```sql
-- Test notification creation with email
SELECT public.create_notification_with_email(
  'your-user-id',
  'Test Notification',
  'This is a test notification with email',
  'info',
  true
);

-- Test bulk notifications
SELECT public.create_bulk_notifications_with_emails(
  ARRAY['user1-id', 'user2-id'],
  'Bulk Test',
  'This is a bulk test notification',
  'warning',
  true
);
```

## Troubleshooting

### Common Issues

1. **Emails not being sent**
   - Check SMTP configuration in environment variables
   - Verify Edge Function is deployed and accessible
   - Check browser console for errors
   - Verify user email preferences are enabled

2. **SMTP connection errors**
   - Verify Gmail App Password is correct
   - Check if 2FA is enabled on Gmail account
   - Ensure port 587 is not blocked by firewall
   - Try alternative ports (465 for SSL, 25 for non-SSL)

3. **Edge Function errors**
   - Check Supabase Edge Function logs
   - Verify environment variables are set correctly
   - Check function permissions and CORS settings

### Debug Steps

1. **Check browser console** for JavaScript errors
2. **Verify Supabase connection** and authentication
3. **Test Edge Function** directly with test data
4. **Check email delivery** in Gmail sent folder
5. **Verify user preferences** in database

## Performance Considerations

### Email Sending

- **Rate limiting**: Gmail allows 500 emails/day for regular accounts
- **Bulk sending**: Use `notifyMultipleUsers` for multiple recipients
- **Async processing**: Email sending is non-blocking
- **Error handling**: Failed emails don't break the notification system

### Database Performance

- **Indexes**: Automatic creation for optimal query performance
- **Batch operations**: Bulk notification functions for efficiency
- **Caching**: User preferences are cached to reduce database calls

## Security Features

### Data Protection

- **Row Level Security (RLS)** on user preferences
- **User isolation**: Users can only access their own preferences
- **Secure SMTP**: TLS encryption for email transmission
- **Input validation**: All notification data is validated

### Access Control

- **Function permissions**: SECURITY DEFINER functions bypass RLS when needed
- **User authentication**: All operations require valid user session
- **Audit logging**: Email sending is logged for monitoring

## Future Enhancements

### Planned Features

1. **Email scheduling**: Delayed email sending
2. **Template customization**: User-configurable email templates
3. **Advanced preferences**: Time-based notification rules
4. **Analytics**: Email open rates and click tracking
5. **A/B testing**: Different email formats and content

### Integration Options

1. **External email services**: SendGrid, Mailgun, AWS SES
2. **Marketing tools**: Mailchimp, ConvertKit integration
3. **Slack/Discord**: Webhook notifications
4. **SMS**: Text message notifications
5. **Push notifications**: Mobile app notifications

## Support

### Getting Help

1. **Check this documentation** for common solutions
2. **Review Supabase logs** for detailed error information
3. **Test with simple examples** to isolate issues
4. **Verify configuration** step by step
5. **Check browser console** for client-side errors

### Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Gmail SMTP Setup](https://support.google.com/mail/answer/7126229)
- [Email Template Best Practices](https://www.emailonacid.com/blog/article/email-development/email-coding-best-practices/)
- [SMTP Configuration Guide](https://www.gmass.co/blog/gmail-smtp/)

## Conclusion

The email notification system provides a robust, scalable solution for keeping users informed about important events in the Assets Management System. With proper configuration and testing, it will significantly improve user engagement and system usability.

Remember to:
- Test thoroughly in development before deploying to production
- Monitor email delivery rates and user engagement
- Regularly review and update email templates
- Gather user feedback to improve notification relevance
- Keep SMTP credentials secure and up-to-date
