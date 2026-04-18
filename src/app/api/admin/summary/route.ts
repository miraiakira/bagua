import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";
import { getAdminSummary } from "@/lib/admin-store";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "无管理权限" }, { status: 403 });
  }

  try {
    const summary = await getAdminSummary();
    return NextResponse.json(summary);
  } catch (error) {
    console.error("failed to load admin summary", error);
    return NextResponse.json({ message: "加载后台概览失败" }, { status: 500 });
  }
}
