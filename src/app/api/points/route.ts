import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPointSummary } from "@/lib/points-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  try {
    const summary = await getPointSummary(session.user.id);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("failed to load points", error);
    return NextResponse.json({ message: "无法加载卦子" }, { status: 500 });
  }
}
