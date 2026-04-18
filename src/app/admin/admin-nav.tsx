"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu } from "antd";

const items = [
  {
    label: "概览",
    value: "/admin",
  },
  {
    label: "用户",
    value: "/admin/users",
  },
  {
    label: "测评结果",
    value: "/admin/results",
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav aria-label="管理后台菜单" className="h-full">
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        items={items.map((item) => ({
          key: item.value,
          label: item.label,
        }))}
        onClick={({ key }) => router.push(String(key))}
        className="h-full border-0 bg-transparent"
        style={{ borderInlineEnd: "none" }}
      />
    </nav>
  );
}
