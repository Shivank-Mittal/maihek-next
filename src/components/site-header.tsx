"use client";

import { Separator } from "@/components/ui/separator";
import { NavMain } from "@/components/nav-main";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  IconDotsVertical,
  IconUserCircle,
  IconCreditCard,
  IconNotification,
  IconLogout,
} from "@tabler/icons-react";
import { signOut, useSession } from "next-auth/react";

const navMain = [
  { title: "Dishes", url: "/dashboard" },
  { title: "Settings", url: "/dashboard/settings" },
];

export function SiteHeader() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4 lg:px-6">
      <h1 className="text-base font-semibold">Maihak</h1>
      <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
      <NavMain items={navMain} />

      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors">
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="hidden text-left text-sm leading-tight sm:grid">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
              </div>
              <IconDotsVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name}</span>
                  <span className="text-muted-foreground truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
