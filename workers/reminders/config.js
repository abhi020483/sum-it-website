/* ============================================================
   Sum-IT reminder mails — ALL settings in one place.
   Change a number here, run the tests, deploy again. That's it.
   ============================================================ */
export const CONFIG = {
  // How many reminder mails after the first info/welcome mail.
  REMINDER_COUNT: 2,
  // Days between mails: reminder 1 = 30 days after the welcome mail,
  // reminder 2 = 30 days after reminder 1.
  REMINDER_INTERVAL_DAYS: 30,
  // Max. reminder mails per daily run (keeps Brevo/Laposta usage small).
  BATCH_LIMIT: 50,
  // The "create your account" button in the mail (same as APP_REGISTER_URL in config.js).
  APP_REGISTER_URL: 'https://sum-it.eu/#pricing',
  // Replies go straight to Ian.
  REPLY_TO: 'ian.bouman@sum-it.eu',
  REPLY_TO_NAME: 'Ian van Sum-IT',
  // Fallbacks when the env vars MAIL_FROM / API_BASE are not set.
  MAIL_FROM: 'Ian van Sum-IT <ian.bouman@sum-it.eu>',
  API_BASE: 'https://sum-it-app.pages.dev'
};
