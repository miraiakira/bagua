import process from "node:process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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

const loadLocalEnv = () => {
  const envFiles = [".env.local", ".env"];

  for (const fileName of envFiles) {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    const content = readFileSync(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const normalized = line.startsWith("export ")
        ? line.slice(7).trim()
        : line;
      const separatorIndex = normalized.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const key = normalized.slice(0, separatorIndex).trim();
      if (!key || process.env[key] !== undefined) {
        continue;
      }

      let value = normalized.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
};

const isAdviceEqual = (left: AdviceBundle | null, right: AdviceBundle) =>
  (left?.product || "") === right.product &&
  (left?.investment || "") === right.investment &&
  (left?.relationship || "") === right.relationship;

const main = async () => {
  loadLocalEnv();

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
    loadLocalEnv();
    const { dbPool } = await import("../src/lib/db");
    await dbPool.end();
  } catch {}
  process.exitCode = 1;
});
