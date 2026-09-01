import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { assessAnswers } from "@/lib/mbti-core";
import { listQuestions, saveAssessment } from "@/lib/mbti-store";
import { awardAssessmentPoints } from "@/lib/points-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  let payload: { answers?: Record<string, string>; submissionId?: string };
  try {
    payload = (await request.json()) as {
      answers?: Record<string, string>;
      submissionId?: string;
    };
  } catch {
    return NextResponse.json(
      { message: "请求体 JSON 不合法" },
      { status: 400 },
    );
  }
  if (!payload.answers || Object.keys(payload.answers).length === 0) {
    return NextResponse.json(
      { message: "answers are required" },
      { status: 400 },
    );
  }
  if (
    !payload.submissionId
    || !/^[a-zA-Z0-9_-]{8,128}$/.test(payload.submissionId)
  ) {
    return NextResponse.json(
      { message: "submissionId is required" },
      { status: 400 },
    );
  }

  try {
    const questions = await listQuestions();
    const response = assessAnswers(payload.answers, questions);
    const assessmentId = await saveAssessment(
      session.user.id,
      payload.submissionId,
      payload.answers,
      response,
    );
    if (assessmentId) {
      await awardAssessmentPoints(session.user.id, assessmentId);
    }
    return NextResponse.json(response);
  } catch (error) {
    console.error("failed to assess mbti", error);
    return NextResponse.json(
      { message: "测评失败，请稍后重试" },
      { status: 500 },
    );
  }
}
