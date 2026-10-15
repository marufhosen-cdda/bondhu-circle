import "server-only";

import { runMatching } from "@/lib/matching";

/**
 * Weekly matching job — `npm run matching`.
 * Schedule it externally (cron, Vercel Cron, GitHub Actions), e.g. Mondays 09:00 Asia/Dhaka.
 */
async function main() {
  const started = Date.now();
  console.log("Running matching…");

  const result = await runMatching();

  console.log(
    `Pool: ${result.poolSize} · circles created: ${result.groupsCreated} · members invited: ${result.membersInvited}`,
  );
  for (const group of result.groups) {
    console.log(
      `  • ${group.zone}${group.womenOnly ? " (women-only)" : ""} — ${group.memberIds.length} members, avg score ${group.averageScore}`,
    );
  }
  console.log(`Done in ${Date.now() - started}ms`);
}

main().catch((err) => {
  console.error("Matching failed:", err);
  process.exit(1);
});
