"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  namespace: string;
  taskQueue: string;
  version: string;
  status: "active" | "inactive";
  triggerType: "webhook" | "schedule" | "polling" | "manual";
  deployedAt: string;
  lastRun?: string;
}

const mockWorkflows: Workflow[] = [
  {
    id: "1",
    name: "orderProcessingWorkflow",
    namespace: "default",
    taskQueue: "order-processing-queue",
    version: "2024.01.15-001",
    status: "active",
    triggerType: "webhook",
    deployedAt: "2024-01-15T10:30:00Z",
    lastRun: "2024-01-15T14:22:00Z",
  },
  {
    id: "2",
    name: "customerOnboarding",
    namespace: "default",
    taskQueue: "onboarding-queue",
    version: "2024.01.14-002",
    status: "active",
    triggerType: "manual",
    deployedAt: "2024-01-14T09:15:00Z",
    lastRun: "2024-01-15T11:00:00Z",
  },
  {
    id: "3",
    name: "dailyReportGenerator",
    namespace: "reports",
    taskQueue: "reports-queue",
    version: "2024.01.10-001",
    status: "inactive",
    triggerType: "schedule",
    deployedAt: "2024-01-10T08:00:00Z",
  },
];

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const filteredWorkflows = mockWorkflows.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Workflow List */}
      <div className="w-80 shrink-0 border-r border-border/40 flex flex-col">
        <div className="p-4 border-b border-border/40">
          <h1 className="text-lg font-semibold mb-4">Workflows</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 border-border/40 bg-muted/20 focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {filteredWorkflows.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground/50">
              No workflows found
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredWorkflows.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => setSelectedWorkflow(workflow)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                    selectedWorkflow?.id === workflow.id
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium truncate">{workflow.name}</span>
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      workflow.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`} />
                  </div>
                  <p className="text-xs text-muted-foreground/50 mt-0.5 truncate">
                    {workflow.namespace}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* CLI Deploy Info */}
        <div className="p-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground/50 mb-2">Deploy via CLI</p>
          <code className="block rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground font-mono">
            workflow-cli deploy
          </code>
        </div>
      </div>

      {/* Workflow Details */}
      {selectedWorkflow ? (
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-semibold">{selectedWorkflow.name}</h2>
                  <Badge 
                    variant="outline" 
                    className={`text-xs font-normal ${
                      selectedWorkflow.status === "active" 
                        ? "border-emerald-500/30 text-emerald-600" 
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {selectedWorkflow.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground/60">
                  v{selectedWorkflow.version}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">Namespace</p>
                  <p className="text-sm">{selectedWorkflow.namespace}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">Task Queue</p>
                  <p className="text-sm">{selectedWorkflow.taskQueue}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">Trigger</p>
                  <p className="text-sm capitalize">{selectedWorkflow.triggerType}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">Deployed</p>
                  <p className="text-sm">{new Date(selectedWorkflow.deployedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Recent Executions */}
              <div className="pt-6 border-t border-border/40">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs text-muted-foreground/50 uppercase tracking-wider">Recent Executions</h3>
                  <button className="text-xs text-muted-foreground/50 hover:text-foreground flex items-center gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
                <div className="space-y-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-sm text-muted-foreground">
                          run-{Date.now() - i * 100000}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground/50">
                        {i}h ago
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground/30">
          <p className="text-sm">Select a workflow</p>
        </div>
      )}
    </div>
  );
}
