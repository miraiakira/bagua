"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, SubmitEvent } from "react";
import { Alert, Button, Card, Checkbox, Input, Space, Typography } from "antd";
import { z } from "zod";


const passwordSchema = z
  .string()
  .min(8, "新密码至少 8 位")
  .regex(/[a-z]/, "新密码需包含小写字母")
  .regex(/[A-Z]/, "新密码需包含大写字母")
  .regex(/\d/, "新密码需包含数字")
  .regex(/[^A-Za-z0-9]/, "新密码需包含特殊字符");

function ConfirmChangePasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const passwordRuleChecks = useMemo(
    () => [
      { label: "至少 8 位", valid: newPassword.length >= 8 },
      { label: "包含小写字母", valid: /[a-z]/.test(newPassword) },
      { label: "包含大写字母", valid: /[A-Z]/.test(newPassword) },
      { label: "包含数字", valid: /\d/.test(newPassword) },
      { label: "包含特殊字符", valid: /[^A-Za-z0-9]/.test(newPassword) },
    ],
    [newPassword],
  );

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
    return "修改密码失败，请重试";
  };

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!token) {
      setError("缺少 token 参数");
      return;
    }
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("请填写完整信息");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("两次输入的新密码不一致");
      return;
    }
    const validated = passwordSchema.safeParse(newPassword);
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? "新密码格式不正确");
      return;
    }
    if (currentPassword === newPassword) {
      setError("新密码不能与当前密码相同");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/profile/change-password/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          currentPassword,
          newPassword,
          revokeOtherSessions,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data?.message === "string" ? data.message : "修改密码失败，请重试",
        );
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("密码修改成功");
      setTimeout(() => {
        router.push("/profile");
      }, 800);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <Alert type="error" showIcon title="链接无效，缺少 token 参数" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Card title="确认修改密码" className="mx-auto max-w-md">
        <form onSubmit={onSubmit}>
          <Space orientation="vertical" size={12} className="w-full">
            <Typography.Text type="secondary">通过邮件临时密钥验证</Typography.Text>
            <Input.Password
              value={currentPassword}
              placeholder="当前密码"
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <Input.Password
              value={newPassword}
              placeholder="新密码"
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <Input.Password
              value={confirmPassword}
              placeholder="确认新密码"
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <Card size="small">
              <Space orientation="vertical" size={6} className="w-full">
                <Typography.Text strong>新密码规则</Typography.Text>
                {passwordRuleChecks.map((rule) => (
                  <Typography.Text key={rule.label} type={rule.valid ? "success" : "danger"}>
                    {rule.valid ? "✓" : "✕"} {rule.label}
                  </Typography.Text>
                ))}
              </Space>
            </Card>
            <Checkbox
              checked={revokeOtherSessions}
              onChange={(event) => setRevokeOtherSessions(event.target.checked)}
            >
              修改后退出其他设备登录状态
            </Checkbox>
            <Button type="primary" htmlType="submit" loading={loading} block>
              确认修改密码
            </Button>
            <Link href="/profile">
              <Button block>返回个人中心</Button>
            </Link>
            {successMessage && <Alert type="success" showIcon title={successMessage} />}
            {error && <Alert type="error" showIcon title={error} />}
          </Space>
        </form>
      </Card>
    </div>
  );
}

export default function ConfirmChangePasswordPage() {
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
      <ConfirmChangePasswordContent />
    </Suspense>
  );
}
