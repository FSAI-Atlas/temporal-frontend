"use client";

import * as React from "react";
import {
  LayoutDashboard,
  GitBranch,
  UserPlus,
  ChevronDown,
  Search,
  Command,
  UserCheck,
  LogOut,
  Settings,
  Plus,
  Check,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog";

const mainNavItems = [
  { title: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { title: "Workflows", icon: GitBranch, href: "/workflows" },
  { title: "Approvals", icon: UserCheck, href: "/hitl" },
];

const mockWorkspaces = [
  { id: "1", name: "Acme Corp", tenantId: "tenant_abc123xyz" },
  { id: "2", name: "Startup Inc", tenantId: "tenant_def456uvw" },
  { id: "3", name: "Enterprise Co", tenantId: "tenant_ghi789rst" },
];

interface AppSidebarProps {
  onOpenSearch?: () => void;
}

export function AppSidebar({ onOpenSearch }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant, clearAuth } = useAuthStore();
  const [showCreateWorkspace, setShowCreateWorkspace] = React.useState(false);

  const currentWorkspace = tenant || mockWorkspaces[0];

  const handleSearchClick = () => {
    if (onOpenSearch) {
      onOpenSearch();
    } else {
      const event = new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <>
      <Sidebar className="border-r border-border/40 overflow-x-hidden">
        {/* Quick Actions */}
        <SidebarHeader className="p-3">
          <Button 
            variant="ghost" 
            onClick={handleSearchClick}
            className="w-full justify-start gap-2 text-muted-foreground/70 h-9 px-3 hover:text-foreground hover:bg-muted/50"
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1 text-left text-sm font-normal">Search</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-muted/30 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 shrink-0">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>
        </SidebarHeader>

        <SidebarContent className="overflow-x-hidden px-2">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="h-9 px-3"
                      >
                        <Link href={item.href} className={isActive ? "font-medium" : "font-normal text-muted-foreground/80"}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer with Workspace and Invite */}
        <SidebarFooter className="p-2 space-y-1">
          {/* Invite teammates */}
          <Button
            variant="ghost"
            asChild
            className="w-full justify-start gap-2 h-9 px-3 text-muted-foreground/70 hover:text-foreground font-normal"
          >
            <Link href="/invite">
              <UserPlus className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">Invite teammates</span>
            </Link>
          </Button>

          <SidebarSeparator className="my-2" />

          {/* Workspace Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between px-3 h-auto py-2.5 hover:bg-muted/50"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/10 text-foreground text-xs font-medium shrink-0">
                    {currentWorkspace?.name?.charAt(0)?.toUpperCase() || "W"}
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <span className="text-sm font-medium truncate max-w-[130px]">
                      {currentWorkspace?.name || "Workspace"}
                    </span>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-64">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Workspaces
              </div>
              {mockWorkspaces.map((workspace) => (
                <DropdownMenuItem 
                  key={workspace.id} 
                  className="flex items-center gap-2 py-2 cursor-pointer"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/10 text-foreground text-xs font-medium shrink-0">
                    {workspace.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm truncate">{workspace.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{workspace.tenantId}</span>
                  </div>
                  {currentWorkspace?.tenantId === workspace.tenantId && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="flex items-center gap-2 py-2 cursor-pointer"
                onClick={() => setShowCreateWorkspace(true)}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-muted-foreground/30 text-muted-foreground shrink-0">
                  <Plus className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm">Create workspace</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="py-2 cursor-pointer"
                onClick={() => router.push("/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="text-red-500 py-2 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <CreateWorkspaceDialog 
        open={showCreateWorkspace} 
        onOpenChange={setShowCreateWorkspace} 
      />
    </>
  );
}
