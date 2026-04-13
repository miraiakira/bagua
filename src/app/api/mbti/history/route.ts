import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listAssessmentHistory } from "@/lib/mbti-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const items = await listAssessmentHistory(session.user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error("failed to load mbti history", error);
    return NextResponse.json({ message: "无法加载历史记录" }, { status: 500 });
  }
}
