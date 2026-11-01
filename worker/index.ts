import { createBoss } from "@/lib/queue/boss";
import { SCRAPE_QUEUE } from "@/lib/queue/enqueue";
import { handleScrapeJob } from "./handlers/scrape";

async function main() {
  const boss = createBoss();
  boss.on("error", (error) => console.error("[pg-boss]", error));

  await boss.start();
  await boss.createQueue(SCRAPE_QUEUE);
  // includeMetadata biar handler bisa baca retryCount dan retryLimit,
  // dipakai buat memutuskan kapan run di-mark failed vs dilempar ulang.
  await boss.work(SCRAPE_QUEUE, { includeMetadata: true }, handleScrapeJob);

  console.log(`[worker] listening on queue ${SCRAPE_QUEUE}`);
}

main().catch((error) => {
  console.error("[worker] fatal:", error);
  process.exit(1);
});
