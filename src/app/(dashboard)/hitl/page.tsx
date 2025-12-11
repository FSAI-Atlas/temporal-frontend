"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ChevronLeft,
  X,
  Loader2,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hitlApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface HitlTask {
  _id: string;
  workflowId: string;
  workflowRunId: string;
  taskToken: string;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "expired";
  data: Record<string, unknown>;
  expiresAt: string;
  createdAt: string;
  decision?: {
    action: string;
    comment?: string;
    decidedBy?: string;
    decidedAt?: string;
  };
}

export default function HitlPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState<HitlTask | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decisionAction, setDecisionAction] = useState<"approve" | "reject">("approve");
  const [decisionComment, setDecisionComment] = useState("");
  
  const queryClient = useQueryClient();

  // Fetch pending tasks
  const { data: pendingData, isLoading: loadingPending } = useQuery({
    queryKey: ["hitl", "pending"],
    queryFn: async () => {
      try {
        const response = await hitlApi.getPending({ limit: 100 });
        return response.data.data.tasks;
      } catch {
        return [];
      }
    },
  });

  // Fetch all tasks
  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: ["hitl", "all"],
    queryFn: async () => {
      try {
        const response = await hitlApi.getTasks({ limit: 100 });
        return response.data.data.tasks;
      } catch {
        return [];
      }
    },
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ["hitl", "stats"],
    queryFn: async () => {
      try {
        const response = await hitlApi.getStats();
        return response.data.data.stats;
      } catch {
        return { pending: 0, approved: 0, rejected: 0, expired: 0 };
      }
    },
  });

  // Decision mutation
  const decisionMutation = useMutation({
    mutationFn: async ({ id, action, comment }: { id: string; action: "approve" | "reject"; comment?: string }) => {
      return hitlApi.decide(id, { action, comment });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hitl"] });
      setShowDecisionDialog(false);
      setSelectedTask(null);
      setDecisionComment("");
    },
  });

  const pendingTasks: HitlTask[] = pendingData || [];
  const allTasks: HitlTask[] = allData || [];
  const stats = statsData || { pending: 0, approved: 0, rejected: 0, expired: 0 };

  const displayedTasks = activeTab === "pending" ? pendingTasks : allTasks;
  const isLoading = activeTab === "pending" ? loadingPending : loadingAll;

  const filteredTasks = displayedTasks.filter((task) =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.workflowId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handleDecision = (action: "approve" | "reject") => {
    setDecisionAction(action);
    setShowDecisionDialog(true);
  };

  const confirmDecision = () => {
    if (!selectedTask) return;
    decisionMutation.mutate({
      id: selectedTask._id,
      action: decisionAction,
      comment: decisionComment || undefined,
    });
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Task List */}
      <div className={cn(
        "shrink-0 border-r border-border/40 flex flex-col transition-all",
        selectedTask ? "w-0 overflow-hidden md:w-80" : "w-full md:w-80"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-border/40">
          <h1 className="text-lg font-semibold mb-4">Approvals</h1>
          
          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">{stats.pending}</span>
              <span className="text-xs text-muted-foreground">pending</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">{stats.approved}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">{stats.rejected}</span>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted/30 rounded-lg mb-4">
            <button
              onClick={() => setActiveTab("pending")}
              className={cn(
                "flex-1 py-1.5 px-3 text-sm rounded-md transition-colors",
                activeTab === "pending" 
                  ? "bg-background shadow-sm font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "flex-1 py-1.5 px-3 text-sm rounded-md transition-colors",
                activeTab === "all" 
                  ? "bg-background shadow-sm font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 border-border/40 bg-muted/20"
            />
          </div>
        </div>

        {/* Task List */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="px-4 py-12 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <UserCheck className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground/50">No tasks found</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredTasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => setSelectedTask(task)}
                    className={cn(
                      "w-full rounded-lg px-3 py-3 text-left transition-colors",
                      selectedTask?._id === task._id
                        ? "bg-muted"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {task.status === "pending" && (
                            <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          )}
                          {task.status === "approved" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          )}
                          {task.status === "rejected" && (
                            <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          )}
                          {task.status === "expired" && (
                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <p className="text-sm font-medium truncate">{task.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground/50 mt-0.5 truncate">
                          {task.workflowId}
                        </p>
                      </div>
                      {task.status === "pending" && (
                        <span className="text-xs text-amber-600 shrink-0">
                          {getTimeRemaining(task.expiresAt)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Task Details */}
      {selectedTask ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                className="md:hidden"
                onClick={() => setSelectedTask(null)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <h2 className="font-semibold">{selectedTask.title}</h2>
                <p className="text-xs text-muted-foreground/60">
                  {selectedTask.workflowId}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              className="hidden md:flex"
              onClick={() => setSelectedTask(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-2xl">
              {/* Status Banner */}
              {selectedTask.status === "pending" && (
                <div className="flex items-center justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 mb-6">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Awaiting approval
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        Expires in {getTimeRemaining(selectedTask.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDecision("reject")}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleDecision("approve")}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              )}

              {/* Completed Status */}
              {selectedTask.status !== "pending" && (
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-lg mb-6",
                  selectedTask.status === "approved" && "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50",
                  selectedTask.status === "rejected" && "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50",
                  selectedTask.status === "expired" && "bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800"
                )}>
                  {selectedTask.status === "approved" && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                  {selectedTask.status === "rejected" && <XCircle className="h-5 w-5 text-red-600" />}
                  {selectedTask.status === "expired" && <AlertCircle className="h-5 w-5 text-gray-600" />}
                  <div>
                    <p className="text-sm font-medium capitalize">{selectedTask.status}</p>
                    {selectedTask.decision?.decidedAt && (
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(selectedTask.decision.decidedAt), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Description</h3>
                <p className="text-sm">{selectedTask.description || "No description provided"}</p>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Workflow</h3>
                  <p className="text-sm font-mono">{selectedTask.workflowId}</p>
                </div>
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Run ID</h3>
                  <p className="text-sm font-mono truncate">{selectedTask.workflowRunId}</p>
                </div>
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</h3>
                  <p className="text-sm">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expires</h3>
                  <p className="text-sm">{new Date(selectedTask.expiresAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Data */}
              <div className="mb-6">
                <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Task Data</h3>
                <pre className="rounded-lg bg-muted/30 p-4 text-xs font-mono overflow-auto max-h-64">
                  {JSON.stringify(selectedTask.data, null, 2)}
                </pre>
              </div>

              {/* Decision Comment */}
              {selectedTask.decision?.comment && (
                <div>
                  <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Decision Comment</h3>
                  <p className="text-sm p-3 rounded-lg bg-muted/30">{selectedTask.decision.comment}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 hidden md:flex items-center justify-center text-muted-foreground/30">
          <div className="text-center">
            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select a task to view details</p>
          </div>
        </div>
      )}

      {/* Decision Dialog */}
      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decisionAction === "approve" ? "Approve" : "Reject"} this task?
            </DialogTitle>
            <DialogDescription>
              This will {decisionAction} the task and notify the workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Comment (optional)</label>
            <Textarea
              placeholder="Add a comment..."
              value={decisionComment}
              onChange={(e) => setDecisionComment(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowDecisionDialog(false)}
              disabled={decisionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant={decisionAction === "approve" ? "default" : "destructive"}
              onClick={confirmDecision}
              disabled={decisionMutation.isPending}
            >
              {decisionMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {decisionAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
