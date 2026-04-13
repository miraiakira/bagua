import { NextResponse } from "next/server";
import {
  consumeChangePasswordToken,
  verifyChangePasswordToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token?: string;
    currentPassword?: string;
    newPassword?: string;
    revokeOtherSessions?: boolean;
  };
  const token = body.token?.trim();
  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";
  const revokeOtherSessions = body.revokeOtherSessions ?? true;

  if (!token || !currentPassword || !newPassword) {
    return NextResponse.json({ message: "参数不完整" }, { status: 400 });
  }

  const verified = verifyChangePasswordToken(token);
  if (!verified.valid) {
    return NextResponse.json({ message: "链接无效或已过期" }, { status: 400 });
  }
  if (!verified.email) {
    return NextResponse.json(
      { message: "链接版本过旧，请重新发送修改密码邮件" },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const signInResponse = await fetch(`${origin}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin,
    },
    body: JSON.stringify({
      email: verified.email,
      password: currentPassword,
      rememberMe: false,
    }),
    cache: "no-store",
  });

  const signInData = await signInResponse.json().catch(() => ({}));
  const setCookieHeaders = (
    "getSetCookie" in signInResponse.headers &&
    typeof signInResponse.headers.getSetCookie === "function"
      ? signInResponse.headers.getSetCookie()
      : []
  ) as string[];
  const cookieHeader = setCookieHeaders
    .map((cookie) => cookie.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
  if (
    !signInResponse.ok ||
    typeof signInData?.token !== "string" ||
    !signInData.token ||
    !cookieHeader
  ) {
    return NextResponse.json(
      { message: "旧密码错误或账号不可用" },
      { status: 400 },
    );
  }

  const response = await fetch(`${origin}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${signInData.token}`,
      cookie: cookieHeader,
      origin,
    },
    body: JSON.stringify({
      currentPassword,
      newPassword,
      revokeOtherSessions,
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({
    message: "修改密码失败",
  }));
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status });
  }
  if (!consumeChangePasswordToken(token, verified.expiresAt)) {
    return NextResponse.json(
      { message: "该链接已被使用，请重新发送修改密码邮件" },
      { status: 400 },
    );
  }
  return NextResponse.json(data, { status: response.status });
}
