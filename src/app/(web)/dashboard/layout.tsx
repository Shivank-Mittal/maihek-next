"use client";

import { SiteHeader } from "@/components/site-header";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session || session?.user?.role !== "admin") {
    redirect("/login");
  }

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <SiteHeader />
      <main className="flex-1 p-4 lg:p-6">{children}</main>
    </div>
  );
}
