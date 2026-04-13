import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listQuestions } from "@/lib/mbti-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const questions = await listQuestions();
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("failed to load mbti questions", error);
    return NextResponse.json({ message: "无法加载题目" }, { status: 500 });
  }
}
