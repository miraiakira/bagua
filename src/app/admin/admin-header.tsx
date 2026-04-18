"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Button, Dropdown, Space } from "antd";
import { authClient } from "@/lib/auth-client";

export function AdminHeader({
  userName,
  userImage,
}: {
  userName: string;
  userImage?: string | null;
}) {
  const router = useRouter();
  const avatarFallback = userName.slice(0, 1).toUpperCase();

  const onSignOut = async () => {
    await authClient.signOut();
    router.push("/signin");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Bagua Admin
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-lg font-semibold text-slate-950">管理后台</h1>
            <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:inline-flex">
              已启用管理权限
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
          >
            返回前台
          </Link>

          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                { key: "profile", label: "个人主页" },
                { type: "divider" },
                { key: "logout", label: "登出", danger: true },
              ],
              onClick: async ({ key }) => {
                if (key === "profile") {
                  router.push("/profile");
                  return;
                }
                if (key === "logout") {
                  await onSignOut();
                }
              },
            }}
          >
            <Button className="!h-auto !rounded-lg !px-2.5 !py-1.5">
              <Space size={8}>
                <Avatar size="small" src={userImage || undefined}>
                  {userImage ? null : avatarFallback}
                </Avatar>
                <span className="max-w-[120px] truncate text-sm font-medium text-slate-800">
                  {userName}
                </span>
              </Space>
            </Button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}
