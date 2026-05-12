"use client";

import { SiteHeader } from "@/components/site-header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session?.user?.role !== "admin") {
      router.replace("/login");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session || session?.user?.role !== "admin") {
    return null;
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
