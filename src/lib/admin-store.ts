import { dbPool } from "@/lib/db";
import type { Hexagram } from "@/lib/mbti-core";

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  assessmentCount: number;
  lastAssessmentAt: string | null;
  latestType64: string | null;
};

export type AdminResultListItem = {
  id: number;
  userId: string | null;
  userName: string;
  userEmail: string;
  mbti: string;
  subtype: string;
  type64: string;
  scores: Record<string, number>;
  advice: {
    product?: string;
    investment?: string;
    relationship?: string;
  };
  hexagram: Hexagram;
  createdAt: string;
};

export type AdminSummary = {
  userCount: number;
  assessedUserCount: number;
  assessmentCount: number;
  latestAssessmentAt: string | null;
};

const normalizeLike = (value: string) => `%${value.trim()}%`;

export const listAdminUsers = async ({
  keyword,
  limit,
  offset,
}: {
  keyword: string;
  limit: number;
  offset: number;
}) => {
  const hasKeyword = keyword.trim().length > 0;
  const params: Array<string | number> = [];
  let whereClause = "";
  if (hasKeyword) {
    params.push(normalizeLike(keyword));
    whereClause = `WHERE u.name ILIKE $1 OR u.email ILIKE $1`;
  }

  const countResult = await dbPool.query<{ total: string }>(
    `SELECT COUNT(*) AS total
     FROM "user" u
     ${whereClause}`,
    params,
  );

  const dataParams = [...params, limit, offset];
  const limitIndex = dataParams.length - 1;
  const offsetIndex = dataParams.length;
  const result = await dbPool.query<{
    id: string;
    name: string | null;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    assessmentCount: string;
    lastAssessmentAt: Date | null;
    latestType64: string | null;
  }>(
    `SELECT
       u.id,
       u.name,
       u.email,
       u."emailVerified" AS "emailVerified",
       u.image,
       u."createdAt" AS "createdAt",
       u."updatedAt" AS "updatedAt",
       COUNT(ar.id)::text AS "assessmentCount",
       MAX(ar.created_at) AS "lastAssessmentAt",
       (
         SELECT ar2.type64
         FROM assessment_result ar2
         WHERE ar2.user_id = u.id
         ORDER BY ar2.created_at DESC, ar2.id DESC
         LIMIT 1
       ) AS "latestType64"
     FROM "user" u
     LEFT JOIN assessment_result ar ON ar.user_id = u.id
     ${whereClause}
     GROUP BY u.id
     ORDER BY u."createdAt" DESC
     LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    dataParams,
  );

  return {
    total: Number(countResult.rows[0]?.total ?? 0),
    items: result.rows.map((row) => ({
      id: row.id,
      name: row.name?.trim() || row.email.split("@")[0] || "未命名用户",
      email: row.email,
      emailVerified: row.emailVerified,
      image: row.image,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
      assessmentCount: Number(row.assessmentCount),
      lastAssessmentAt: row.lastAssessmentAt
        ? new Date(row.lastAssessmentAt).toISOString()
        : null,
      latestType64: row.latestType64,
    })),
  };
};

export const listAdminResults = async ({
  keyword,
  mbti,
  limit,
  offset,
}: {
  keyword: string;
  mbti: string;
  limit: number;
  offset: number;
}) => {
  const whereParts: string[] = [];
  const params: Array<string | number> = [];

  if (keyword.trim()) {
    params.push(normalizeLike(keyword));
    const index = params.length;
    whereParts.push(
      `(u.name ILIKE $${index} OR u.email ILIKE $${index} OR ar.type64 ILIKE $${index})`,
    );
  }
  if (mbti.trim()) {
    params.push(mbti.trim().toUpperCase());
    const index = params.length;
    whereParts.push(`ar.mbti = $${index}`);
  }

  const whereClause =
    whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";
  const countResult = await dbPool.query<{ total: string }>(
    `SELECT COUNT(*) AS total
     FROM assessment_result ar
     LEFT JOIN "user" u ON u.id = ar.user_id
     ${whereClause}`,
    params,
  );

  const dataParams = [...params, limit, offset];
  const limitIndex = dataParams.length - 1;
  const offsetIndex = dataParams.length;
  const result = await dbPool.query<{
    id: string;
    user_id: string | null;
    user_name: string | null;
    user_email: string | null;
    mbti: string;
    subtype: string;
    type64: string;
    scores: Record<string, number>;
    advice: {
      product?: string;
      investment?: string;
      relationship?: string;
    };
    hexagram: Hexagram;
    created_at: Date;
  }>(
    `SELECT
       ar.id::text AS id,
       ar.user_id,
       u.name AS user_name,
       u.email AS user_email,
       ar.mbti,
       ar.subtype,
       ar.type64,
       ar.scores,
       ar.advice,
       ar.hexagram,
       ar.created_at
     FROM assessment_result ar
     LEFT JOIN "user" u ON u.id = ar.user_id
     ${whereClause}
     ORDER BY ar.created_at DESC, ar.id DESC
     LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    dataParams,
  );

  return {
    total: Number(countResult.rows[0]?.total ?? 0),
    items: result.rows.map((row) => ({
      id: Number(row.id),
      userId: row.user_id,
      userName:
        row.user_name?.trim() || row.user_email?.split("@")[0] || "未知用户",
      userEmail: row.user_email || "-",
      mbti: row.mbti,
      subtype: row.subtype,
      type64: row.type64,
      scores: row.scores ?? {},
      advice: row.advice ?? {},
      hexagram: row.hexagram,
      createdAt: new Date(row.created_at).toISOString(),
    })),
  };
};

export const getAdminSummary = async (): Promise<AdminSummary> => {
  const result = await dbPool.query<{
    user_count: string;
    assessed_user_count: string;
    assessment_count: string;
    latest_assessment_at: Date | null;
  }>(`
    SELECT
      (SELECT COUNT(*)::text FROM "user") AS user_count,
      (SELECT COUNT(DISTINCT user_id)::text FROM assessment_result WHERE user_id IS NOT NULL) AS assessed_user_count,
      (SELECT COUNT(*)::text FROM assessment_result) AS assessment_count,
      (SELECT MAX(created_at) FROM assessment_result) AS latest_assessment_at
  `);
  const row = result.rows[0];
  return {
    userCount: Number(row?.user_count ?? 0),
    assessedUserCount: Number(row?.assessed_user_count ?? 0),
    assessmentCount: Number(row?.assessment_count ?? 0),
    latestAssessmentAt: row?.latest_assessment_at
      ? new Date(row.latest_assessment_at).toISOString()
      : null,
  };
};
