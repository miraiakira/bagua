import {
  AssessmentHistoryItem,
  AssessResponse,
  MbtiQuestion,
  defaultQuestions,
} from "@/lib/mbti-core";
import { dbPool } from "@/lib/db";

let schemaReadyPromise: Promise<void> | null = null;

const ensureSchema = async () => {
  await dbPool.query(`
CREATE TABLE IF NOT EXISTS question_bank (
  id TEXT PRIMARY KEY,
  sort_order INT NOT NULL,
  dimension TEXT NOT NULL,
  prompt TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessment_result (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  mbti TEXT NOT NULL,
  subtype TEXT NOT NULL,
  type64 TEXT NOT NULL,
  answers JSONB NOT NULL,
  scores JSONB NOT NULL,
  advice JSONB NOT NULL,
  hexagram JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
  `);
};

const seedQuestions = async (source: MbtiQuestion[]) => {
  for (const [index, q] of source.entries()) {
    await dbPool.query(
      `INSERT INTO question_bank (id, sort_order, dimension, prompt, option_a, option_b)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         sort_order = EXCLUDED.sort_order,
         dimension = EXCLUDED.dimension,
         prompt = EXCLUDED.prompt,
         option_a = EXCLUDED.option_a,
         option_b = EXCLUDED.option_b,
         updated_at = NOW()`,
      [q.id, index + 1, q.dimension, q.prompt, q.optionA, q.optionB],
    );
  }
};

const ensureReady = async () => {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await ensureSchema();
      await seedQuestions(defaultQuestions);
    })();
  }
  await schemaReadyPromise;
};

export const listQuestions = async (): Promise<MbtiQuestion[]> => {
  await ensureReady();
  await seedQuestions(defaultQuestions);
  const result = await dbPool.query<{
    id: string;
    dimension: string;
    prompt: string;
    option_a: string;
    option_b: string;
  }>(
    `SELECT id, dimension, prompt, option_a, option_b
     FROM question_bank
     ORDER BY sort_order ASC`,
  );
  if (result.rowCount === 0) {
    return defaultQuestions;
  }
  return result.rows.map((row) => ({
    id: row.id,
    dimension: row.dimension,
    prompt: row.prompt,
    optionA: row.option_a,
    optionB: row.option_b,
  }));
};

export const saveAssessment = async (
  userId: string,
  answers: Record<string, string>,
  assessment: AssessResponse,
) => {
  await ensureReady();
  await dbPool.query(
    `INSERT INTO assessment_result (user_id, mbti, subtype, type64, answers, scores, advice, hexagram)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb)`,
    [
      userId || null,
      assessment.mbti,
      assessment.subtype,
      assessment.type64,
      JSON.stringify(answers),
      JSON.stringify(assessment.scores),
      JSON.stringify(assessment.advice),
      JSON.stringify(assessment.hexagram),
    ],
  );
};

export const listAssessmentHistory = async (
  userId: string,
): Promise<AssessmentHistoryItem[]> => {
  await ensureReady();
  const result = await dbPool.query<{
    id: string;
    mbti: string;
    subtype: string;
    type64: string;
    scores: Record<string, number>;
    advice: AssessmentHistoryItem["advice"];
    hexagram: AssessmentHistoryItem["hexagram"];
    created_at: Date;
  }>(
    `SELECT id, mbti, subtype, type64, scores, advice, hexagram, created_at
     FROM assessment_result
     WHERE user_id = $1
     ORDER BY created_at DESC, id DESC
     LIMIT 50`,
    [userId],
  );

  return result.rows.map((row) => ({
    id: Number(row.id),
    mbti: row.mbti,
    subtype: row.subtype,
    type64: row.type64,
    scores: row.scores,
    advice: row.advice,
    hexagram: row.hexagram,
    createdAt: new Date(row.created_at).toISOString(),
  }));
};
