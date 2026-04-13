"use client";

import { type Icon } from "@tabler/icons-react";
import Link from "next/link";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  return (
    <nav className="flex items-center gap-1">
      {items.map((item) => (
        <Link
          key={item.title}
          href={item.url}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {item.icon && <item.icon className="size-4" />}
          <span>{item.title}</span>
        </Link>
      ))}
    </nav>
  );
}
