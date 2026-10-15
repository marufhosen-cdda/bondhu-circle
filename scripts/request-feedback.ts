import "server-only";

import { requestFeedbackForCompleted } from "@/lib/jobs/feedback";

/**
 * Post-meetup feedback requests — `npm run feedback`.
 * Schedule after events typically end, e.g. `30 21 * * *` (21:30 Asia/Dhaka).
 */
async function main() {
  const result = await requestFeedbackForCompleted();
  console.log(`Feedback requests sent: ${result.sent}`);
}

main().catch((err) => {
  console.error("Feedback job failed:", err);
  process.exit(1);
});
