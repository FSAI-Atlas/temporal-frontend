"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Play,
  Square,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Loader2,
  RefreshCw,
  ChevronRight,
  Timer,
  Zap,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workflowsApi, executionsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Execution {
  workflowId: string;
  runId: string;
  workflowType: string;
  status: string;
  startTime: string;
  closeTime?: string;
  executionTime?: number;
  taskQueue: string;
  historyLength?: number;
}

interface HistoryEvent {
  eventId: string;
  eventTime: string;
  eventType: string;
  taskId?: string;
  attributes: Record<string, any>;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
  Running: {
    icon: Play,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  Completed: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  Failed: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  Canceled: {
    icon: Square,
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  Terminated: {
    icon: AlertCircle,
    color: "text-red-600",
    bg: "bg-red-100 dark:bg-red-900/30",
  },
  TimedOut: {
    icon: Clock,
    color: "text-gray-600",
    bg: "bg-gray-100 dark:bg-gray-900/30",
  },
};

const eventTypeColors: Record<string, string> = {
  WorkflowExecutionStarted: "bg-blue-500",
  WorkflowExecutionCompleted: "bg-emerald-500",
  WorkflowExecutionFailed: "bg-red-500",
  ActivityTaskScheduled: "bg-amber-500",
  ActivityTaskStarted: "bg-amber-400",
  ActivityTaskCompleted: "bg-emerald-400",
  ActivityTaskFailed: "bg-red-400",
  TimerStarted: "bg-purple-500",
  TimerFired: "bg-purple-400",
};

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.workflowId as string;
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch workflow details
  const { data: workflow, isLoading: workflowLoading } = useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: async () => {
      try {
        const response = await workflowsApi.get(workflowId);
        return response.data.data.workflow;
      } catch {
        return null;
      }
    },
  });

  // Fetch executions for this workflow
  const { data: executionsData, isLoading: executionsLoading, refetch: refetchExecutions } = useQuery({
    queryKey: ["executions", workflowId],
    queryFn: async () => {
      try {
        const response = await executionsApi.list({
          workflowType: workflow?.name,
          pageSize: 50,
        });
        return response.data.data;
      } catch {
        return { executions: [], hasMore: false };
      }
    },
    enabled: !!workflow?.name,
  });

  const executions: Execution[] = executionsData?.executions || [];

  // Fetch execution history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["execution", "history", selectedExecution?.workflowId, selectedExecution?.runId],
    queryFn: async () => {
      if (!selectedExecution) return { events: [] };
      try {
        const response = await executionsApi.getHistory(
          selectedExecution.workflowId,
          selectedExecution.runId
        );
        return response.data.data;
      } catch {
        return { events: [] };
      }
    },
    enabled: !!selectedExecution,
  });

  const historyEvents: HistoryEvent[] = historyData?.events || [];

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedExecution) throw new Error("No execution selected");
      return executionsApi.cancel(selectedExecution.workflowId, selectedExecution.runId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executions"] });
      refetchExecutions();
    },
  });

  // Terminate mutation
  const terminateMutation = useMutation({
    mutationFn: async (reason?: string) => {
      if (!selectedExecution) throw new Error("No execution selected");
      return executionsApi.terminate(selectedExecution.workflowId, reason, selectedExecution.runId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["executions"] });
      refetchExecutions();
    },
  });

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.Running;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  if (workflowLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/workflows")}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{workflow?.name || workflowId}</h1>
            <p className="text-sm text-muted-foreground">
              {workflow?.namespace || "default"} • {workflow?.taskQueue}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchExecutions()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Executions List */}
        <div className="w-96 shrink-0 border-r border-border/40 flex flex-col">
          <div className="p-4 border-b border-border/40">
            <h2 className="font-medium">Executions</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {executions.length} execution{executions.length !== 1 ? "s" : ""}
            </p>
          </div>

          <ScrollArea className="flex-1">
            {executionsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : executions.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No executions found</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {executions.map((execution) => {
                  const config = getStatusConfig(execution.status);
                  const StatusIcon = config.icon;
                  const isSelected = selectedExecution?.runId === execution.runId;

                  return (
                    <button
                      key={execution.runId}
                      onClick={() => setSelectedExecution(execution)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-colors",
                        isSelected ? "bg-muted" : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn("p-1 rounded", config.bg)}>
                            <StatusIcon className={cn("h-3 w-3", config.color)} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {execution.workflowId}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {execution.runId.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(execution.startTime), { addSuffix: true })}</span>
                        {execution.executionTime && (
                          <span className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {formatDuration(execution.executionTime)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Execution Details */}
        {selectedExecution ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Execution Header */}
            <div className="p-4 border-b border-border/40">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{selectedExecution.workflowId}</h3>
                    <Badge className={cn(
                      getStatusConfig(selectedExecution.status).bg,
                      getStatusConfig(selectedExecution.status).color
                    )}>
                      {selectedExecution.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    Run ID: {selectedExecution.runId}
                  </p>
                </div>
                {selectedExecution.status === "Running" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => terminateMutation.mutate()}
                      disabled={terminateMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Terminate
                    </Button>
                  </div>
                )}
              </div>

              {/* Execution Stats */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Started</p>
                  <p className="text-sm font-medium">
                    {new Date(selectedExecution.startTime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">
                    {formatDuration(selectedExecution.executionTime)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Task Queue</p>
                  <p className="text-sm font-medium">{selectedExecution.taskQueue}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">History Events</p>
                  <p className="text-sm font-medium">{selectedExecution.historyLength || "-"}</p>
                </div>
              </div>
            </div>

            {/* History Timeline */}
            <Tabs defaultValue="timeline" className="flex-1 flex flex-col">
              <div className="px-4 border-b border-border/40">
                <TabsList className="h-10">
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="input">Input</TabsTrigger>
                  <TabsTrigger value="result">Result</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="timeline" className="flex-1 mt-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {historyLoading ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  ) : historyEvents.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-sm text-muted-foreground">No events</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="space-y-0">
                        {historyEvents.map((event, index) => {
                          const eventColor = eventTypeColors[event.eventType] || "bg-gray-400";
                          const isLast = index === historyEvents.length - 1;

                          return (
                            <div key={event.eventId} className="flex gap-4">
                              {/* Timeline line */}
                              <div className="flex flex-col items-center">
                                <div className={cn("w-3 h-3 rounded-full shrink-0", eventColor)} />
                                {!isLast && (
                                  <div className="w-0.5 flex-1 bg-border/40 min-h-[24px]" />
                                )}
                              </div>

                              {/* Event content */}
                              <div className="flex-1 pb-4 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {event.eventType.replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    #{event.eventId}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(event.eventTime).toLocaleTimeString()}
                                </p>

                                {/* Event attributes */}
                                {Object.keys(event.attributes).length > 0 && (
                                  <div className="mt-2 p-2 rounded bg-muted/30 text-xs">
                                    <pre className="overflow-auto">
                                      {JSON.stringify(event.attributes, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="input" className="flex-1 mt-0 p-4 overflow-auto">
                <pre className="text-sm bg-muted/30 p-4 rounded-lg overflow-auto">
                  {historyEvents.find(e => e.eventType === "WorkflowExecutionStarted")?.attributes?.input
                    ? JSON.stringify(
                        historyEvents.find(e => e.eventType === "WorkflowExecutionStarted")?.attributes?.input,
                        null,
                        2
                      )
                    : "No input data available"
                  }
                </pre>
              </TabsContent>

              <TabsContent value="result" className="flex-1 mt-0 p-4 overflow-auto">
                <pre className="text-sm bg-muted/30 p-4 rounded-lg overflow-auto">
                  {historyEvents.find(e => e.eventType === "WorkflowExecutionCompleted")?.attributes?.result
                    ? JSON.stringify(
                        historyEvents.find(e => e.eventType === "WorkflowExecutionCompleted")?.attributes?.result,
                        null,
                        2
                      )
                    : selectedExecution.status === "Failed"
                      ? JSON.stringify(
                          historyEvents.find(e => e.eventType === "WorkflowExecutionFailed")?.attributes?.failure,
                          null,
                          2
                        )
                      : "Execution not completed yet"
                  }
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground/30">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Select an execution to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

