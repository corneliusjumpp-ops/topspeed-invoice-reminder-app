TOPSPEED INVOICE + REMINDER APP
===============================

Built for TopSpeed Piano Moving LLC.

FEATURES
--------
- Create invoices
- Default piano-storage invoice: $100
- Customer phone + email
- Due dates
- Paid / unpaid / overdue dashboard
- Send invoice by EMAIL and TEXT
- Send reminder by EMAIL and TEXT
- Mark invoices paid
- Automatic overdue reminder endpoint
- Reminder event history in database

SERVICES USED
-------------
- Supabase: invoice database
- Resend: email sending
- Twilio: SMS/text sending
- Next.js: web app

IMPORTANT
---------
The code is complete, but real email/text delivery requires your own Resend, Twilio, and Supabase account credentials.

SETUP
-----
1. Create a Supabase project and run supabase-schema.sql.
2. Copy .env.example to .env.local.
3. Add your Supabase, Resend and Twilio credentials.
4. npm install
5. npm run dev
6. Deploy to a Next.js host (for example Vercel).
7. Schedule /api/cron-reminders once per day using your host's cron scheduler.
   Send Authorization: Bearer <CRON_SECRET>

AUTOMATIC REMINDERS
-------------------
The cron endpoint finds unpaid invoices due today or earlier.
It avoids sending more than one automatic reminder per 24 hours.
It sends email if reminder_email is enabled.
It sends SMS if reminder_sms is enabled.

RECOMMENDED NEXT UPGRADES
-------------------------
- Staff login
- Customer payment link (Stripe/Square)
- PDF invoice attachment
- Monthly recurring invoice generation
- Customer receipt after payment
- Logo upload
- Storage agreement e-signature
