import Link from "next/link";
import { getAdminSummary } from "@/lib/admin-store";

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("zh-CN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
    : "暂无";

export default async function AdminHomePage() {
  const summary = await getAdminSummary();
  const activationRate = summary.userCount > 0
    ? Math.round((summary.assessedUserCount / summary.userCount) * 100)
    : 0;
  const unassessedUserCount = Math.max(summary.userCount - summary.assessedUserCount, 0);
  const assessedPerUser = summary.userCount > 0
    ? (summary.assessmentCount / summary.userCount).toFixed(1)
    : "0.0";
  const activityLabel = summary.latestAssessmentAt
    ? `最近一次测评发生在 ${formatDateTime(summary.latestAssessmentAt)}`
    : "暂无测评数据";

  const cards = [
    {
      title: "用户总数",
      value: String(summary.userCount),
      description: "系统内累计注册账号",
    },
    {
      title: "已测用户",
      value: String(summary.assessedUserCount),
      description: `渗透率 ${activationRate}%`,
    },
    {
      title: "测评总数",
      value: String(summary.assessmentCount),
      description: "累计完成测评次数",
    },
    {
      title: "最近测评",
      value: formatDateTime(summary.latestAssessmentAt),
      description: "最后一次结果入库时间",
    },
  ];
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
              Admin Overview
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              管理后台概览
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              这里展示当前用户和测评的核心数据，适合作为后台入口页快速查看整体状态。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              用户管理
            </Link>
            <Link
              href="/admin/results"
              className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              测评结果
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-3xl border border-slate-200 bg-white p-5"
          >
            <div className="text-sm text-slate-500">{card.title}</div>
            <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{card.value}</div>
            <div className="mt-2 text-sm text-slate-500">{card.description}</div>
          </div>
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">运行状态</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">用户转化</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{activationRate}%</div>
              <div className="mt-2 text-sm text-slate-500">完成至少一次测评的用户占比</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">待激活用户</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{unassessedUserCount}</div>
              <div className="mt-2 text-sm text-slate-500">注册后尚未产生测评记录</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm text-slate-500">全体人均测评</div>
              <div className="mt-2 text-2xl font-semibold text-slate-950">{assessedPerUser} 次</div>
              <div className="mt-2 text-sm text-slate-500">按全部注册用户口径统计</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">快速说明</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <p>{activityLabel}</p>
            <p>用户页适合看注册和活跃情况，结果页适合排查具体测评内容。</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">使用建议</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">先看概览，再进入用户页或结果页处理具体问题。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/users"
              className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              前往用户管理
            </Link>
            <Link
              href="/admin/results"
              className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              前往测评结果
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
