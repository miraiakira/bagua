"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Input, Space, Typography } from "antd";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

const passwordSchema = z
  .string()
  .min(8, "密码至少 8 位")
  .regex(/[a-z]/, "密码需包含小写字母")
  .regex(/[A-Z]/, "密码需包含大写字母")
  .regex(/\d/, "密码需包含数字")
  .regex(/[^A-Za-z0-9]/, "密码需包含特殊字符");

export default function SignUpPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const currentUser = sessionData?.user ?? null;
  const passwordRuleChecks = useMemo(
    () => [
      { label: "至少 8 位", valid: password.length >= 8 },
      { label: "包含小写字母", valid: /[a-z]/.test(password) },
      { label: "包含大写字母", valid: /[A-Z]/.test(password) },
      { label: "包含数字", valid: /\d/.test(password) },
      { label: "包含特殊字符", valid: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );
  const passwordValidation = useMemo(
    () => passwordSchema.safeParse(password),
    [password],
  );

  useEffect(() => {
    if (currentUser) {
      router.replace("/");
    }
  }, [currentUser, router]);

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
    return "注册失败，请重试";
  };

  const onSignUp = async (event: FormEvent) => {
    event.preventDefault();
    if (!name || !email || !password) {
      setError("请填写完整信息");
      return;
    }
    if (!passwordValidation.success) {
      setError(passwordValidation.error.issues[0]?.message ?? "密码格式不正确");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/",
      });
      router.replace("/");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Card title="邮箱注册" className="mx-auto max-w-md">
        <form onSubmit={onSignUp}>
          <Space orientation="vertical" size={12} className="w-full">
            <Input
              value={name}
              placeholder="昵称"
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              type="email"
              value={email}
              placeholder="邮箱"
              onChange={(event) => setEmail(event.target.value)}
            />
            <Input.Password
              value={password}
              placeholder="密码（需满足下方规则）"
              onChange={(event) => setPassword(event.target.value)}
            />
            <Card size="small">
              <Space orientation="vertical" size={6} className="w-full">
                <Typography.Text strong>密码规则</Typography.Text>
                {passwordRuleChecks.map((rule) => (
                  <Typography.Text key={rule.label} type={rule.valid ? "success" : "danger"}>
                    {rule.valid ? "✓" : "✕"} {rule.label}
                  </Typography.Text>
                ))}
              </Space>
            </Card>
            <Button type="primary" htmlType="submit" loading={loading || sessionPending} block>
              注册并登录
            </Button>
            <Typography.Text type="secondary">
              已有账号？<Link href="/signin">去登录</Link>
            </Typography.Text>
            {error && <Alert type="error" showIcon title={error} />}
          </Space>
        </form>
      </Card>
    </div>
  );
}
