import { PoolClient } from "pg";
import { dbPool } from "@/lib/db";

export const SIGNUP_POINTS = 20;
export const ASSESSMENT_POINTS = 10;
export const DAILY_CHECKIN_POINTS = 5;

export type PointLedgerItem = {
  id: number;
  delta: number;
  reason: string;
  source: string;
  referenceId: string;
  createdAt: string;
};

export type PointSummary = {
  balance: number;
  todayCheckedIn: boolean;
  dailyCheckinPoints: number;
  recent: PointLedgerItem[];
};

let pointSchemaReadyPromise: Promise<void> | null = null;

const getTokyoDateKey = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const ensurePointsSchema = async () => {
  await dbPool.query(`
CREATE TABLE IF NOT EXISTS point_account (
  user_id TEXT PRIMARY KEY,
  balance INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS point_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_point_ledger_user_created
  ON point_ledger (user_id, created_at DESC, id DESC);
  `);
};

export const ensurePointSchemaReady = async () => {
  if (!pointSchemaReadyPromise) {
    pointSchemaReadyPromise = ensurePointsSchema();
  }
  await pointSchemaReadyPromise;
};

const normalizeLedgerItem = (row: {
  id: string;
  delta: number;
  reason: string;
  source: string;
  reference_id: string;
  created_at: Date;
}): PointLedgerItem => ({
  id: Number(row.id),
  delta: row.delta,
  reason: row.reason,
  source: row.source,
  referenceId: row.reference_id,
  createdAt: new Date(row.created_at).toISOString(),
});

const insertPointLedger = async ({
  client,
  userId,
  delta,
  reason,
  source,
  referenceId,
}: {
  client: PoolClient;
  userId: string;
  delta: number;
  reason: string;
  source: string;
  referenceId: string;
}) => {
  const ledgerResult = await client.query<{ id: string }>(
    `INSERT INTO point_ledger (user_id, delta, reason, source, reference_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, source, reference_id) DO NOTHING
     RETURNING id`,
    [userId, delta, reason, source, referenceId],
  );

  if (ledgerResult.rowCount === 0) {
    return false;
  }

  await client.query(
    `INSERT INTO point_account (user_id, balance)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET
       balance = point_account.balance + EXCLUDED.balance,
       updated_at = NOW()`,
    [userId, delta],
  );

  return true;
};

export const awardPoints = async ({
  userId,
  delta,
  reason,
  source,
  referenceId,
}: {
  userId: string;
  delta: number;
  reason: string;
  source: string;
  referenceId: string;
}) => {
  await ensurePointSchemaReady();
  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    const awarded = await insertPointLedger({
      client,
      userId,
      delta,
      reason,
      source,
      referenceId,
    });
    await client.query("COMMIT");
    return awarded;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const ensureUserPointAccount = async (userId: string) => {
  await ensurePointSchemaReady();
  const client = await dbPool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO point_account (user_id, balance)
       VALUES ($1, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId],
    );
    await insertPointLedger({
      client,
      userId,
      delta: SIGNUP_POINTS,
      reason: "注册奖励",
      source: "signup",
      referenceId: userId,
    });
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const awardAssessmentPoints = async (
  userId: string,
  assessmentId: number,
) =>
  awardPoints({
    userId,
    delta: ASSESSMENT_POINTS,
    reason: "完成测评",
    source: "assessment",
    referenceId: String(assessmentId),
  });

export const checkInToday = async (userId: string) => {
  await ensureUserPointAccount(userId);
  const dateKey = getTokyoDateKey();
  const awarded = await awardPoints({
    userId,
    delta: DAILY_CHECKIN_POINTS,
    reason: "每日签到",
    source: "daily-checkin",
    referenceId: dateKey,
  });
  const summary = await getPointSummary(userId);
  return {
    awarded,
    points: awarded ? DAILY_CHECKIN_POINTS : 0,
    dateKey,
    summary,
  };
};

export const getPointSummary = async (
  userId: string,
): Promise<PointSummary> => {
  await ensureUserPointAccount(userId);
  const dateKey = getTokyoDateKey();
  const [accountResult, checkinResult, ledgerResult] = await Promise.all([
    dbPool.query<{ balance: number }>(
      `SELECT balance FROM point_account WHERE user_id = $1`,
      [userId],
    ),
    dbPool.query<{ id: string }>(
      `SELECT id
       FROM point_ledger
       WHERE user_id = $1 AND source = 'daily-checkin' AND reference_id = $2
       LIMIT 1`,
      [userId, dateKey],
    ),
    dbPool.query<{
      id: string;
      delta: number;
      reason: string;
      source: string;
      reference_id: string;
      created_at: Date;
    }>(
      `SELECT id::text AS id, delta, reason, source, reference_id, created_at
       FROM point_ledger
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT 20`,
      [userId],
    ),
  ]);

  return {
    balance: Number(accountResult.rows[0]?.balance ?? 0),
    todayCheckedIn: (checkinResult.rowCount ?? 0) > 0,
    dailyCheckinPoints: DAILY_CHECKIN_POINTS,
    recent: ledgerResult.rows.map(normalizeLedgerItem),
  };
};
