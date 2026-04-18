import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin";
import { AdminHeader } from "./admin-header";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminHeader
        userName={session.user.name?.trim() || session.user.email}
        userImage={session.user.image}
      />

      <div className="grid min-h-[calc(100vh-65px)] w-full lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-full min-h-full bg-white">
          <div className="h-full border px-4 py-5 lg:sticky lg:top-16 lg:min-h-[calc(100vh-65px)] lg:p-6">
            <div className="h-full py-5">
              <AdminNav />
            </div>
          </div>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </section>
      </div>
    </div>
  );
}
