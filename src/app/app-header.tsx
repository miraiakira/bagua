"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Button, Dropdown, Space } from "antd";
import { authClient } from "@/lib/auth-client";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const currentUser = sessionData?.user ?? null;
  const displayName = currentUser?.name?.trim() || currentUser?.email?.split("@")[0] || "用户";
  const avatarContent = displayName.slice(0, 1).toUpperCase();
  const avatarSrc = currentUser?.image || undefined;

  const onSignOut = async () => {
    await authClient.signOut();
    router.push("/signin");
    router.refresh();
  };
  const onUserMenuClick = async (key: string) => {
    if (key === "profile") {
      router.push("/profile");
      return;
    }
    if (key === "logout") {
      await onSignOut();
    }
  };

  const isActive = (href: string) => pathname === href;

  return (
    <header className="border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Space size={16} align="center">
          <Link href="/" className="text-base font-semibold text-gray-900">
            Bagua
          </Link>
          <Space size={12}>
            <Link
              href="/"
              className={isActive("/") ? "text-indigo-600 font-medium" : "text-gray-600"}
            >
              首页
            </Link>
          </Space>
        </Space>

        {!currentUser ? (
          <Space size={8}>
            <Link href="/signin">
              <Button type={isActive("/signin") ? "primary" : "default"} size="small">
                登录
              </Button>
            </Link>
            <Link href="/signup">
              <Button type={isActive("/signup") ? "primary" : "default"} size="small">
                注册
              </Button>
            </Link>
          </Space>
        ) : (
          <Dropdown
            trigger={["click"]}
            styles={{ root: { minWidth: 156 } }}
            menu={{
              items: [
                { key: "profile", label: "个人中心" },
                { type: "divider" },
                { key: "logout", label: "退出登录", danger: true },
              ],
              onClick: async ({ key }) => onUserMenuClick(key),
            }}
          >
            <Button size="small" className="!h-auto !px-2 !py-1" loading={sessionPending}>
              <Space size={8}>
                <Avatar size="small" src={avatarSrc}>{avatarSrc ? null : avatarContent}</Avatar>
                <span>{displayName}</span>
              </Space>
            </Button>
          </Dropdown>
        )}
      </div>
    </header>
  );
}
