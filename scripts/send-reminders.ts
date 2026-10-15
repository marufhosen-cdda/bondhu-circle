import "server-only";

import { sendUpcomingReminders } from "@/lib/jobs/reminders";

/**
 * 24-hour activity reminders — `npm run reminders`.
 * Schedule daily, e.g. every hour: `0 * * * * cd app && npm run reminders`.
 */
async function main() {
  const result = await sendUpcomingReminders();
  console.log(`Reminders sent: ${result.sent}`);
}

main().catch((err) => {
  console.error("Reminder job failed:", err);
  process.exit(1);
});
