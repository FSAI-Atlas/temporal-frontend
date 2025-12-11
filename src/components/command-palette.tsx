"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  GitBranch,
  UserCheck,
  Settings,
  LogOut,
  UserPlus,
} from "lucide-react";
import { useAuthStore } from "@/store/auth";

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Workflows", href: "/workflows", icon: GitBranch },
  { name: "Approvals", href: "/hitl", icon: UserCheck },
  { name: "Invite teammates", href: "/invite", icon: UserPlus },
];

const actionItems = [
  { name: "Settings", action: "settings", icon: Settings },
  { name: "Log out", action: "logout", icon: LogOut },
];

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (item: typeof navigationItems[0] | typeof actionItems[0]) => {
    setOpen(false);
    
    if ("href" in item) {
      router.push(item.href);
    } else if (item.action === "logout") {
      clearAuth();
      router.push("/login");
    } else if (item.action === "settings") {
      router.push("/settings");
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.name}
              onSelect={() => handleSelect(item)}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {actionItems.map((item) => (
            <CommandItem
              key={item.name}
              onSelect={() => handleSelect(item)}
              className="cursor-pointer"
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = React.useState(false);
  return { open, setOpen };
}

