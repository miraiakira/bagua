"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Button, Card, Input, Space, Table, Tag } from "antd";

type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  assessmentCount: number;
  lastAssessmentAt: string | null;
  latestType64: string | null;
};

type UserListResponse = {
  items: AdminUserListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
    : "-";

export default function AdminUsersPage() {
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<AdminUserListItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (query.trim()) {
          params.set("keyword", query.trim());
        }
        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(response.status === 403 ? "当前账号没有后台访问权限" : "加载用户失败");
        }
        const data = (await response.json()) as UserListResponse;
        setItems(data.items);
        setTotal(data.pagination.total);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : "加载用户失败");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => controller.abort();
  }, [page, pageSize, query]);

  const columns = useMemo(
    () => [
      {
        title: "用户",
        key: "user",
        render: (_: unknown, record: AdminUserListItem) => {
          const avatarText = record.name.slice(0, 1).toUpperCase();
          return (
            <Space size={12}>
              <Avatar src={record.image}>{record.image ? null : avatarText}</Avatar>
              <div>
                <div className="font-medium text-gray-900">{record.name}</div>
                <div className="text-sm text-gray-500">{record.email}</div>
              </div>
            </Space>
          );
        },
      },
      {
        title: "状态",
        key: "status",
        render: (_: unknown, record: AdminUserListItem) =>
          record.emailVerified ? <Tag color="success">已验证</Tag> : <Tag>未验证</Tag>,
      },
      {
        title: "测评次数",
        dataIndex: "assessmentCount",
        key: "assessmentCount",
      },
      {
        title: "最近类型",
        key: "latestType64",
        render: (_: unknown, record: AdminUserListItem) => record.latestType64 || "-",
      },
      {
        title: "最近测评",
        key: "lastAssessmentAt",
        render: (_: unknown, record: AdminUserListItem) => formatDateTime(record.lastAssessmentAt),
      },
      {
        title: "注册时间",
        key: "createdAt",
        render: (_: unknown, record: AdminUserListItem) => formatDateTime(record.createdAt),
      },
    ],
    [],
  );

  const summaryCards = useMemo(() => {
    const verifiedCount = items.filter((item) => item.emailVerified).length;
    const assessedCount = items.filter((item) => item.assessmentCount > 0).length;
    const totalAssessments = items.reduce((sum, item) => sum + item.assessmentCount, 0);

    return [
      {
        title: "当前结果数",
        value: String(total),
        description: "符合筛选条件的用户总数",
      },
      {
        title: "已验证邮箱",
        value: String(verifiedCount),
        description: "当前页已完成邮箱验证",
      },
      {
        title: "已测用户",
        value: String(assessedCount),
        description: "当前页至少有一次测评",
      },
      {
        title: "测评合计",
        value: String(totalAssessments),
        description: "当前页用户累计测评次数",
      },
    ];
  }, [items, total]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">User Directory</div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">用户管理</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              集中查看注册用户的基础信息、验证状态、测评活跃度和最近一次类型结果。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag color="blue">总用户 {total}</Tag>
            {query ? <Tag color="processing">关键词: {query}</Tag> : <Tag>全部用户</Tag>}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm text-slate-500">{card.title}</div>
              <div className="mt-2 text-3xl font-semibold text-slate-950">{card.value}</div>
              <div className="mt-2 text-sm text-slate-500">{card.description}</div>
            </div>
          ))}
        </div>
      </div>

      <Card styles={{ body: { padding: 24 } }}>
        <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">筛选与列表</h3>
            <p className="mt-1 text-sm text-slate-500">支持按昵称或邮箱检索，并快速分页浏览用户状态。</p>
          </div>
          <Space size={8} wrap>
            <Input.Search
              allowClear
              placeholder="搜索昵称或邮箱"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onSearch={(value) => {
                setPage(1);
                setKeyword(value);
                setQuery(value);
              }}
              style={{ width: 280 }}
            />
            <Button
              onClick={() => {
                setKeyword("");
                setQuery("");
                setPage(1);
              }}
            >
              重置
            </Button>
          </Space>
        </div>

        {error ? <Alert type="error" showIcon title={error} className="mb-4" /> : null}

        <Table<AdminUserListItem>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={items}
          scroll={{ x: 980 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
          }}
        />
      </Card>
    </div>
  );
}
