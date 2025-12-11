"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  GitBranch,
  Clock,
  Activity,
  ChevronRight,
  Loader2,
  RefreshCw,
  Webhook,
  Calendar,
  Repeat,
  PlayCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { workflowsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Workflow {
  _id: string;
  name: string;
  namespace: string;
  taskQueue: string;
  version: string;
  trigger: {
    type: "webhook" | "schedule" | "polling" | "manual";
    config?: Record<string, unknown>;
  };
  isActive: boolean;
  deployedAt: string;
}

const triggerIcons: Record<string, any> = {
  webhook: Webhook,
  schedule: Calendar,
  polling: Repeat,
  manual: PlayCircle,
};

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const { data: workflowsData, isLoading, refetch } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      try {
        const response = await workflowsApi.list({ limit: 100 });
        return response.data.data.workflows;
      } catch {
        return [];
      }
    },
  });

  const workflows: Workflow[] = workflowsData || [];
  
  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.namespace.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const workflowsByNamespace = filteredWorkflows.reduce((acc, workflow) => {
    const ns = workflow.namespace || "default";
    if (!acc[ns]) acc[ns] = [];
    acc[ns].push(workflow);
    return acc;
  }, {} as Record<string, Workflow[]>);

  const namespaces = Object.keys(workflowsByNamespace).sort();

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            {workflows.length} workflow{workflows.length !== 1 ? "s" : ""} deployed
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="px-6 py-4 border-b border-border/40">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <Input
            placeholder="Search workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 border-border/40"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <GitBranch className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-medium">No workflows found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              {searchTerm ? "Try adjusting your search" : "Deploy your first workflow using CLI"}
            </p>
            {!searchTerm && (
              <code className="mt-4 px-4 py-2 rounded-lg bg-muted text-sm font-mono">
                workflow-cli deploy
              </code>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {namespaces.map((namespace) => (
              <div key={namespace}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {namespace}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {workflowsByNamespace[namespace].length}
                  </Badge>
                </div>
                <div className="grid gap-3">
                  {workflowsByNamespace[namespace].map((workflow) => {
                    const TriggerIcon = triggerIcons[workflow.trigger.type] || GitBranch;
                    return (
                      <button
                        key={workflow._id}
                        onClick={() => router.push(`/workflows/${workflow._id}`)}
                        className="w-full p-4 rounded-lg border border-border/40 bg-card text-left transition-all hover:border-border hover:shadow-sm group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50">
                              <GitBranch className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{workflow.name}</h3>
                                <div className={cn(
                                  "h-2 w-2 rounded-full",
                                  workflow.isActive ? "bg-emerald-500" : "bg-muted-foreground/30"
                                )} />
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">{workflow.taskQueue}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TriggerIcon className="h-3.5 w-3.5" />
                            <span className="capitalize">{workflow.trigger.type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Activity className="h-3.5 w-3.5" />
                            <span>v{workflow.version}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{formatDistanceToNow(new Date(workflow.deployedAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="px-6 py-4 border-t border-border/40 bg-muted/20">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Deploy workflows using the CLI</p>
          <code className="px-2 py-1 rounded bg-muted text-xs font-mono">workflow-cli deploy</code>
        </div>
      </div>
    </div>
  );
}
