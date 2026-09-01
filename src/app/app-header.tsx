"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar, Button, Dropdown, Space } from "antd";
import { authClient } from "@/lib/auth-client";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: sessionData, isPending: sessionPending } = authClient.useSession();
  const currentUser = sessionData?.user ?? null;
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionHydrated, setSessionHydrated] = useState(false);
  const authResolved = sessionHydrated && !sessionPending;
  const displayName = currentUser?.name?.trim() || currentUser?.email?.split("@")[0] || "用户";
  const avatarContent = displayName.slice(0, 1).toUpperCase();
  const avatarSrc = currentUser?.image || undefined;

  useEffect(() => {
    setSessionHydrated(true);
  }, []);

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
    if (key === "admin") {
      router.push("/admin");
      return;
    }
    if (key === "logout") {
      await onSignOut();
    }
  };

  const isActive = (href: string) => pathname === href;
  const isSectionActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const menuItems = useMemo(
    () => [
      { key: "profile", label: "个人中心" },
      ...(isAdmin ? [{ key: "admin", label: "进入管理后台" }] : []),
      { type: "divider" as const },
      { key: "logout", label: "退出登录", danger: true },
    ],
    [isAdmin],
  );

  useEffect(() => {
    if (!currentUser) {
      setIsAdmin(false);
      return;
    }

    let cancelled = false;
    const loadAdminAccess = async () => {
      try {
        const res = await fetch("/api/admin/access", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("failed to load admin access");
        }
        const data = (await res.json()) as { isAdmin?: boolean };
        if (!cancelled) {
          setIsAdmin(Boolean(data.isAdmin));
        }
      } catch {
        if (!cancelled) {
          setIsAdmin(false);
        }
      }
    };

    void loadAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-gray-900">
            <Image
              src="/bagua.png"
              alt="Bagua"
              width={32}
              height={32}
              priority
              className="h-8 w-8 object-contain"
            />
            <span className="flex flex-col leading-tight">
              <span className="font-semibold">Bagua</span>
              <span className="hidden text-[10px] text-gray-500 sm:inline">人格决策测评</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm sm:flex" aria-label="主导航">
            <Link
              href="/"
              className={isActive("/") ? "text-indigo-600 font-medium" : "text-gray-600"}
            >
              测评
            </Link>
            {currentUser && (
              <Link
                href="/profile"
                className={isSectionActive("/profile")
                  ? "text-indigo-600 font-medium"
                  : "text-gray-600"}
              >
                我的结果
              </Link>
            )}
          </nav>
        </div>

        {!authResolved ? (
          <Button size="small" loading>
            加载中
          </Button>
        ) : !currentUser ? (
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
              items: menuItems,
              onClick: async ({ key }) => onUserMenuClick(key),
            }}
          >
            <Button size="small" className="!h-auto !px-2 !py-1" loading={sessionPending}>
              <Space size={8}>
                <Avatar size="small" src={avatarSrc}>{avatarSrc ? null : avatarContent}</Avatar>
                <span className="hidden sm:inline">{displayName}</span>
              </Space>
            </Button>
          </Dropdown>
        )}
      </div>
    </header>
  );
}
