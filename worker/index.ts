import { createBoss } from "@/lib/queue/boss";
import { SCRAPE_QUEUE } from "@/lib/queue/enqueue";
import { handleScrapeJob } from "./handlers/scrape";

async function main() {
  const boss = createBoss();
  boss.on("error", (error) => console.error("[pg-boss]", error));

  await boss.start();
  await boss.work(SCRAPE_QUEUE, handleScrapeJob);

  console.log(`[worker] listening on queue ${SCRAPE_QUEUE}`);
}

main().catch((error) => {
  console.error("[worker] fatal:", error);
  process.exit(1);
});
