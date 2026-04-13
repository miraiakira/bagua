import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  appDisplayName,
  auth,
  createChangePasswordToken,
  sendSystemEmail,
} from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ message: "未登录" }, { status: 401 });
  }

  const token = createChangePasswordToken(session.user.id, session.user.email);
  const url = new URL("/profile/change-password/confirm", request.url);
  url.searchParams.set("token", token);

  await sendSystemEmail({
    to: session.user.email,
    subject: `${appDisplayName} 修改密码确认`,
    intro:
      "你正在申请修改密码，请点击按钮进入修改页面。链接将在 15 分钟后失效。",
    actionLabel: "前往修改密码",
    actionUrl: url.toString(),
  });

  return NextResponse.json({
    status: true,
    message: "修改密码链接已发送，请前往邮箱查看",
  });
}
