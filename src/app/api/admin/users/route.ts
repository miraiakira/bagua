import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, parsePagination } from "@/lib/admin";
import { listAdminUsers } from "@/lib/admin-store";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "无管理权限" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const keyword = searchParams.get("keyword") ?? "";
  const { page, pageSize, offset } = parsePagination(searchParams);

  try {
    const result = await listAdminUsers({
      keyword,
      limit: pageSize,
      offset,
    });
    return NextResponse.json({
      items: result.items,
      pagination: {
        page,
        pageSize,
        total: result.total,
      },
    });
  } catch (error) {
    console.error("failed to load admin users", error);
    return NextResponse.json({ message: "加载用户列表失败" }, { status: 500 });
  }
}
