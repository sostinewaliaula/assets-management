# Supabase Scheduled Backup Setup Guide

This guide explains how to set up automatic, server-side backups using Supabase Edge Functions and the built-in scheduler.

---

## 1. Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Supabase project initialized locally
- `.env` file with your Supabase URL and Service Role Key

---

## 2. Initialize Edge Functions (if not already done)
```sh
supabase functions init
```

---

## 3. Create the Scheduled Backup Function
```sh
supabase functions new scheduled-backup
```

---

## 4. Add the Backup Logic
Edit `supabase/functions/scheduled-backup/index.ts` and paste in the provided backup logic (already done in this repo).

---

## 5. Deploy the Function
```sh
supabase functions deploy scheduled-backup
```

---

## 6. Schedule the Function
For example, to run every day at 2:00 AM UTC:
```sh
supabase functions schedule scheduled-backup --cron '0 2 * * *'
```
- [Cron syntax reference](https://crontab.guru/)

---

## 7. Test the Function
You can manually trigger the function for testing:
```sh
supabase functions invoke scheduled-backup
```

---

## 8. Monitor & Troubleshoot
- View logs in the Supabase dashboard under "Edge Functions".
- If you see errors, check your Service Role Key and table names.
- Make sure your backups table schema matches the expected structure.

---

## 9. Security
- The function uses the Service Role Key (never expose this in client code).
- The function runs in Supabase’s secure environment.

---

## 10. Customization
- You can adjust the backup logic to include/exclude tables or change the backup format.
- For retention policies, add logic to delete old backups if needed.

---

## That’s it!
You now have reliable, server-side, automatic backups for your system using Supabase Edge Functions.

