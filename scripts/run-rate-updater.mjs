// Weekly rate-update entry point, run by .github/workflows/rate-update.yml
// on a schedule (and available as a manual "Run workflow" button in the
// Actions tab). Propose-only: this writes rows to Supabase's rate_proposals
// table for a human to review — it never changes what the live app shows.
// See src/lib/updater.js for the actual read/extract/match logic.
import { runUpdater } from "../src/lib/updater.js";

const result = await runUpdater();
console.log(JSON.stringify(result, null, 2));

const failed = result.retailers.filter((r) => !r.ok);
if (failed.length > 0) {
  console.error(
    `${failed.length} retailer(s) failed outright this run:`,
    failed.map((r) => r.retailer).join(", ")
  );
  // Non-zero exit so the Actions run shows red and you notice it happened —
  // rows were still written for every retailer that DID succeed.
  process.exitCode = 1;
}
