import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkInToday } from "@/lib/points-store";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const result = await checkInToday(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    console.error("failed to check in", error);
    return NextResponse.json({ message: "签到失败，请稍后重试" }, { status: 500 });
  }
}
