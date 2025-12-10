"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth";
import { GitBranch, Clock, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { user, tenant } = useAuthStore();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {user?.name}
        </h1>
        <p className="text-muted-foreground/70 mt-1">
          {tenant?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-12">
        <Card className="border-border/40 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold">12</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Active workflows</p>
              </div>
              <GitBranch className="h-5 w-5 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold">4</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Pending approvals</p>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-none">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-semibold">23</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Executions today</p>
              </div>
              <Activity className="h-5 w-5 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground/70 uppercase tracking-wider">Recent Activity</h2>
          <Link href="/workflows" className="text-sm text-muted-foreground/70 hover:text-foreground flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="space-y-1">
          {[
            { name: "orderProcessingWorkflow", status: "completed", time: "2m ago" },
            { name: "customerOnboarding", status: "completed", time: "15m ago" },
            { name: "dailyReportGenerator", status: "running", time: "1h ago" },
          ].map((item, i) => (
            <div 
              key={i} 
              className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`h-1.5 w-1.5 rounded-full ${
                  item.status === "completed" ? "bg-emerald-500" : "bg-amber-500"
                }`} />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-xs text-muted-foreground/50">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground/70 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <Link
            href="/hitl"
            className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:border-border hover:bg-muted/20 transition-all"
          >
            <span className="text-sm">Review pending approvals</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
          </Link>
          <Link
            href="/workflows"
            className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:border-border hover:bg-muted/20 transition-all"
          >
            <span className="text-sm">View all workflows</span>
            <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
          </Link>
        </div>
      </div>
    </div>
  );
}
