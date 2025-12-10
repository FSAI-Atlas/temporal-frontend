"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Clock, CheckCircle2, XCircle } from "lucide-react";

interface HitlTask {
  id: string;
  workflowId: string;
  workflowRunId: string;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected" | "expired";
  data: Record<string, unknown>;
  expiresAt: string;
  createdAt: string;
  decision?: {
    action: string;
    comment?: string;
    decidedAt?: string;
  };
}

const mockTasks: HitlTask[] = [
  {
    id: "1",
    workflowId: "orderProcessingWorkflow",
    workflowRunId: "order-123-abc",
    title: "Approve Large Order",
    description: "Order exceeds $10,000 limit",
    status: "pending",
    data: { orderId: "ORD-001", amount: 15000, customer: "ACME Corp" },
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: "2",
    workflowId: "customerOnboarding",
    workflowRunId: "onboard-456-def",
    title: "Verify Customer Identity",
    description: "Documents require manual verification",
    status: "pending",
    data: { customerId: "CUST-002", documentType: "Passport" },
    expiresAt: new Date(Date.now() + 7200000).toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    workflowId: "refundProcessing",
    workflowRunId: "refund-789-ghi",
    title: "Approve Refund Request",
    description: "Customer requesting full refund",
    status: "approved",
    data: { orderId: "ORD-003", amount: 250, reason: "Damaged goods" },
    expiresAt: new Date(Date.now() - 1800000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    decision: {
      action: "approve",
      decidedAt: new Date(Date.now() - 82800000).toISOString(),
    },
  },
];

export default function HitlPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTask, setSelectedTask] = useState<HitlTask | null>(null);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [decisionAction, setDecisionAction] = useState<"approve" | "reject">("approve");

  const pendingTasks = mockTasks.filter((t) => t.status === "pending");
  const completedTasks = mockTasks.filter((t) => t.status !== "pending");
  const [activeTab, setActiveTab] = useState<"pending" | "completed">("pending");

  const displayedTasks = activeTab === "pending" ? pendingTasks : completedTasks;

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
    setShowDecisionDialog(false);
    setSelectedTask(null);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Task List */}
      <div className="w-96 shrink-0 border-r border-border/40 flex flex-col">
        <div className="p-4 border-b border-border/40">
          <h1 className="text-lg font-semibold mb-4">Approvals</h1>
          
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted/30 rounded-lg mb-4">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 py-1.5 px-3 text-sm rounded-md transition-colors ${
                activeTab === "pending" 
                  ? "bg-background shadow-sm font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending ({pendingTasks.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 py-1.5 px-3 text-sm rounded-md transition-colors ${
                activeTab === "completed" 
                  ? "bg-background shadow-sm font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Completed
            </button>
          </div>

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
          {displayedTasks.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground/50">
              No tasks
            </div>
          ) : (
            <div className="space-y-0.5">
              {displayedTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`w-full rounded-lg px-3 py-3 text-left transition-colors ${
                    selectedTask?.id === task.id
                      ? "bg-muted"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground/50 mt-0.5 truncate">
                        {task.workflowId}
                      </p>
                    </div>
                    {task.status === "pending" && (
                      <span className="text-xs text-amber-600 shrink-0">
                        {getTimeRemaining(task.expiresAt)}
                      </span>
                    )}
                    {task.status === "approved" && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                    {task.status === "rejected" && (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Details */}
      {selectedTask ? (
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-xl font-semibold mb-1">{selectedTask.title}</h2>
                <p className="text-sm text-muted-foreground/60">
                  {selectedTask.description}
                </p>
              </div>
              {selectedTask.status === "pending" && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDecision("reject")}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    Reject
                  </Button>
                  <Button size="sm" onClick={() => handleDecision("approve")}>
                    Approve
                  </Button>
                </div>
              )}
              {selectedTask.status !== "pending" && (
                <Badge 
                  variant="outline"
                  className={`${
                    selectedTask.status === "approved"
                      ? "border-emerald-500/30 text-emerald-600"
                      : "border-red-500/30 text-red-600"
                  }`}
                >
                  {selectedTask.status}
                </Badge>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">Workflow</p>
                  <p className="text-sm">{selectedTask.workflowId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">Run ID</p>
                  <p className="text-sm font-mono text-xs">{selectedTask.workflowRunId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">Created</p>
                  <p className="text-sm">{new Date(selectedTask.createdAt).toLocaleString()}</p>
                </div>
                {selectedTask.status === "pending" && (
                  <div>
                    <p className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-1">Expires</p>
                    <p className="text-sm text-amber-600 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTimeRemaining(selectedTask.expiresAt)}
                    </p>
                  </div>
                )}
              </div>

              {/* Task Data */}
              <div className="pt-6 border-t border-border/40">
                <h3 className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-3">Data</h3>
                <pre className="rounded-lg bg-muted/30 p-4 text-xs text-muted-foreground font-mono overflow-auto">
                  {JSON.stringify(selectedTask.data, null, 2)}
                </pre>
              </div>

              {selectedTask.decision && (
                <div className="pt-6 border-t border-border/40">
                  <h3 className="text-xs text-muted-foreground/50 uppercase tracking-wider mb-3">Decision</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground/50 mb-1">Action</p>
                      <p className="text-sm capitalize">{selectedTask.decision.action}</p>
                    </div>
                    {selectedTask.decision.decidedAt && (
                      <div>
                        <p className="text-xs text-muted-foreground/50 mb-1">Decided at</p>
                        <p className="text-sm">{new Date(selectedTask.decision.decidedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground/30">
          <p className="text-sm">Select a task</p>
        </div>
      )}

      {/* Decision Dialog */}
      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decisionAction === "approve" ? "Approve" : "Reject"} task?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDecisionDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={decisionAction === "approve" ? "default" : "destructive"}
              onClick={confirmDecision}
            >
              {decisionAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
