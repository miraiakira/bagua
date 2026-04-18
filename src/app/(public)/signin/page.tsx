"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SubmitEvent, Suspense, useEffect, useState } from "react";
import { Alert, Button, Card, Input, Space, Typography } from "antd";
import { authClient } from "@/lib/auth-client";

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: sessionData } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const currentUser = sessionData?.user ?? null;
  const callbackURL = searchParams.get("callbackURL") || "/";

  useEffect(() => {
    if (currentUser) {
      router.replace(callbackURL);
    }
  }, [callbackURL, currentUser, router]);

  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error && err.message) {
      return err.message;
    }
    if (typeof err === "object" && err !== null) {
      const maybeMessage = (err as { message?: unknown }).message;
      if (typeof maybeMessage === "string" && maybeMessage.trim()) {
        return maybeMessage;
      }
    }
    return "登录失败，请重试";
  };

  const onSignIn = async (event: SubmitEvent) => {
    event.preventDefault();
    if (googleLoading) {
      return;
    }
    if (!email || !password) {
      setError("请填写完整信息");
      return;
    }
    setEmailLoading(true);
    setError("");
    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL,
      });
      router.replace(callbackURL);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEmailLoading(false);
    }
  };

  const onGoogleSignIn = async () => {
    if (emailLoading) {
      return;
    }
    setGoogleLoading(true);
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Card title="邮箱登录" className="mx-auto max-w-md">
        <form onSubmit={onSignIn}>
          <Space orientation="vertical" size={12} className="w-full">
            <Input
              type="email"
              value={email}
              placeholder="邮箱"
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input.Password
              value={password}
              placeholder="密码"
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button type="primary" htmlType="submit" loading={emailLoading} block>
              登录
            </Button>
            <Button onClick={onGoogleSignIn} loading={googleLoading} block>
              Google 登录
            </Button>
            <Typography.Text type="secondary">
              还没有账号？<Link href="/signup">去注册</Link>
            </Typography.Text>
            {error && <Alert type="error" showIcon title={error} />}
          </Space>
        </form>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={(
        <div className="mx-auto w-full max-w-5xl px-4 py-8">
          <Card className="mx-auto max-w-md">
            <Typography.Text type="secondary">页面加载中...</Typography.Text>
          </Card>
        </div>
      )}
    >
      <SignInContent />
    </Suspense>
  );
}
