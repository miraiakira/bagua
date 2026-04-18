import process from "node:process";
import { loadEnvConfig } from "@next/env";
import type { AdviceBundle, Hexagram } from "../src/lib/mbti-core";

type AssessmentAdviceRow = {
  id: string;
  mbti: string;
  subtype: string;
  scores: Record<string, number> | null;
  hexagram: Hexagram | null;
  advice: AdviceBundle | null;
};

type PendingUpdate = {
  id: number;
  previousAdvice: AdviceBundle | null;
  nextAdvice: AdviceBundle;
};

const shouldApply = process.argv.includes("--apply");

const isAdviceEqual = (left: AdviceBundle | null, right: AdviceBundle) =>
  (left?.product || "") === right.product &&
  (left?.investment || "") === right.investment &&
  (left?.relationship || "") === right.relationship;

const main = async () => {
  loadEnvConfig(process.cwd());

  const [{ dbPool }, { buildAdvice }] = await Promise.all([
    import("../src/lib/db"),
    import("../src/lib/mbti-core"),
  ]);

  const result = await dbPool.query<AssessmentAdviceRow>(
    `SELECT id, mbti, subtype, scores, hexagram, advice
     FROM assessment_result
     ORDER BY id ASC`,
  );

  const pendingUpdates: PendingUpdate[] = [];
  let skippedCount = 0;

  for (const row of result.rows) {
    if (!row.hexagram || !row.scores) {
      skippedCount += 1;
      continue;
    }

    const nextAdvice = buildAdvice(
      row.mbti,
      row.subtype,
      row.hexagram,
      row.scores,
    );
    if (isAdviceEqual(row.advice, nextAdvice)) {
      continue;
    }

    pendingUpdates.push({
      id: Number(row.id),
      previousAdvice: row.advice,
      nextAdvice,
    });
  }

  console.log(
    `[assessment_result.advice] scanned=${result.rowCount ?? 0} changed=${pendingUpdates.length} skipped=${skippedCount} mode=${shouldApply ? "apply" : "dry-run"}`,
  );

  if (pendingUpdates.length > 0) {
    console.log("[preview] first changed rows:");
    for (const item of pendingUpdates.slice(0, 5)) {
      console.log(
        JSON.stringify(
          {
            id: item.id,
            previousAdvice: item.previousAdvice,
            nextAdvice: item.nextAdvice,
          },
          null,
          2,
        ),
      );
    }
  }

  if (!shouldApply || pendingUpdates.length === 0) {
    await dbPool.end();
    return;
  }

  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    for (const item of pendingUpdates) {
      await client.query(
        `UPDATE assessment_result
         SET advice = $2::jsonb
         WHERE id = $1`,
        [item.id, JSON.stringify(item.nextAdvice)],
      );
    }
    await client.query("COMMIT");
    console.log(`[assessment_result.advice] updated=${pendingUpdates.length}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await dbPool.end();
  }
};

void main().catch(async (error) => {
  console.error("[assessment_result.advice] backfill failed");
  console.error(error);
  try {
    loadEnvConfig(process.cwd());
    const { dbPool } = await import("../src/lib/db");
    await dbPool.end();
  } catch {}
  process.exitCode = 1;
});
