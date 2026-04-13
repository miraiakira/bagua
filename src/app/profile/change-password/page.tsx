"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Button, Card, Space, Typography } from "antd";
import { authClient } from "@/lib/auth-client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const currentUser = sessionData?.user ?? null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (sessionPending) {
      return;
    }
    if (!currentUser) {
      router.replace("/signin");
    }
  }, [currentUser, router, sessionPending]);

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

  const onSendLink = async () => {
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const response = await fetch("/api/profile/change-password/send-link", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data?.message === "string" ? data.message : "发送邮件失败，请重试",
        );
      }
      setSuccessMessage("修改密码链接已发送，请前往邮箱打开链接继续操作");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <Card title="修改密码" className="mx-auto max-w-md">
        <Space orientation="vertical" size={12} className="w-full">
          <Typography.Paragraph className="!mb-0">
            系统会向你的注册邮箱发送一封修改密码邮件。点击邮件中的链接后，再输入旧密码和新密码完成修改。
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            当前邮箱：{currentUser?.email ?? "-"}
          </Typography.Text>
          <Button type="primary" onClick={onSendLink} loading={loading || sessionPending} block>
            发送修改密码邮件
          </Button>
          <Link href="/profile">
            <Button block>返回个人中心</Button>
          </Link>
          {successMessage && <Alert type="success" showIcon title={successMessage} />}
          {error && <Alert type="error" showIcon title={error} />}
        </Space>
      </Card>
    </div>
  );
}
