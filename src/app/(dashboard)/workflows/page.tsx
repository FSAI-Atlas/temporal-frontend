"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  ChevronLeft, 
  X, 
  ZoomIn, 
  ZoomOut,
  Play,
  Clock,
  CheckCircle2,
  Circle,
  GitBranch,
  AlertCircle,
} from "lucide-react";
import { WorkflowNode, WorkflowConnector } from "@/components/workflow/workflow-node";
import { useQuery } from "@tanstack/react-query";
import { workflowsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  name: string;
  type: "trigger" | "action" | "condition" | "end";
  description?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  status?: "completed" | "running" | "pending" | "failed";
  duration?: string;
  children?: Activity[];
  branches?: {
    condition: string;
    children: Activity[];
  }[];
}

interface Workflow {
  _id: string;
  name: string;
  namespace: string;
  taskQueue: string;
  version: string;
  status: "active" | "inactive";
  trigger: {
    type: "webhook" | "schedule" | "polling" | "manual";
    config?: Record<string, unknown>;
  };
  deployedAt: string;
  activities?: Activity[];
}

// Mock activity tree for demonstration
const mockActivities: Activity[] = [
  {
    id: "1",
    name: "Starting point",
    type: "trigger",
    description: "Record ID in companies updated",
    status: "completed",
  },
  {
    id: "2",
    name: "Instance",
    type: "action",
    description: "No description",
    status: "completed",
    children: [
      {
        id: "3",
        name: "If / else",
        type: "condition",
        description: "No description",
        status: "completed",
        branches: [
          {
            condition: "Is true",
            children: [
              {
                id: "4",
                name: "Create Task",
                type: "action",
                description: "No description",
                status: "completed",
              },
            ],
          },
          {
            condition: "Is false",
            children: [
              {
                id: "5",
                name: "Instance",
                type: "action",
                description: "No description",
                status: "pending",
              },
            ],
          },
        ],
      },
    ],
  },
];

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [zoom, setZoom] = useState(100);

  const { data: workflowsData, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      try {
        const response = await workflowsApi.list();
        return response.data.data.workflows;
      } catch {
        return [];
      }
    },
  });

  const workflows: Workflow[] = workflowsData || [];
  
  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "running":
        return <Play className="h-4 w-4 text-blue-500 animate-pulse" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground/30" />;
    }
  };

  const renderActivityTree = (activities: Activity[], depth = 0) => {
    return activities.map((activity, index) => (
      <div key={activity.id} className="flex flex-col items-center">
        {index > 0 && <WorkflowConnector />}
        
        <WorkflowNode
          id={activity.id}
          type={activity.type}
          label={activity.name}
          description={activity.description}
          isSelected={selectedActivity?.id === activity.id}
          onClick={() => setSelectedActivity(activity)}
        />

        {activity.branches && activity.branches.length > 0 && (
          <div className="mt-4">
            <div className="flex items-start justify-center gap-16 relative">
              {/* Connecting lines */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-300 dark:bg-gray-700" />
              <div 
                className="absolute top-6 h-0.5 bg-gray-300 dark:bg-gray-700"
                style={{ 
                  left: `calc(50% - ${(activity.branches.length - 1) * 8}rem)`,
                  right: `calc(50% - ${(activity.branches.length - 1) * 8}rem)`,
                }}
              />
              
              {activity.branches.map((branch, branchIndex) => (
                <div key={branchIndex} className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-gray-300 dark:bg-gray-700 mt-6" />
                  <span className="text-xs text-muted-foreground my-2">{branch.condition}</span>
                  {renderActivityTree(branch.children, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}

        {activity.children && activity.children.length > 0 && (
          <div className="mt-2">
            {renderActivityTree(activity.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Workflow List */}
      <div className={cn(
        "shrink-0 border-r border-border/40 flex flex-col transition-all",
        selectedWorkflow ? "w-0 overflow-hidden" : "w-72"
      )}>
        <div className="p-4 border-b border-border/40">
          <h1 className="text-lg font-semibold mb-4">Workflows</h1>
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

        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoading ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground/50">
                Loading...
              </div>
            ) : filteredWorkflows.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground/50">
                No workflows found
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredWorkflows.map((workflow) => (
                  <button
                    key={workflow._id}
                    onClick={() => {
                      setSelectedWorkflow(workflow);
                      setSelectedActivity(null);
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{workflow.name}</span>
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        workflow.status === "active" ? "bg-emerald-500" : "bg-muted-foreground/30"
                      )} />
                    </div>
                    <p className="text-xs text-muted-foreground/50 mt-0.5 truncate">
                      {workflow.namespace} • {workflow.trigger.type}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/40">
          <p className="text-xs text-muted-foreground/50 mb-2">Deploy via CLI</p>
          <code className="block rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground font-mono">
            workflow-cli deploy
          </code>
        </div>
      </div>

      {/* Workflow Graph View */}
      {selectedWorkflow ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setSelectedWorkflow(null);
                  setSelectedActivity(null);
                }}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">{selectedWorkflow.name}</h2>
                  <Badge variant="outline" className={cn(
                    "text-xs",
                    selectedWorkflow.status === "active" 
                      ? "border-emerald-500/30 text-emerald-600" 
                      : "border-muted-foreground/30 text-muted-foreground"
                  )}>
                    {selectedWorkflow.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground/60">
                  {selectedWorkflow.namespace} • v{selectedWorkflow.version}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" />
                {new Date(selectedWorkflow.deployedAt).toLocaleDateString()}
              </Badge>
            </div>
          </div>

          {/* Graph Content */}
          <div className="flex-1 flex">
            {/* Canvas */}
            <div className="flex-1 overflow-auto bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px]">
              <div 
                className="min-h-full p-8 flex justify-center"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              >
                <div className="flex flex-col items-center">
                  {renderActivityTree(mockActivities)}
                  
                  {/* Add more button */}
                  <WorkflowConnector hasChildren={false} />
                  <button className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground/30 hover:border-muted-foreground/50 hover:text-muted-foreground/50 transition-colors">
                    <span className="text-lg">+</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Details Sidebar */}
            {selectedActivity && (
              <div className="w-80 border-l border-border/40 flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border/40">
                  <button 
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                    onClick={() => setSelectedActivity(null)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    back
                  </button>
                  <button 
                    onClick={() => setSelectedActivity(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6">
                    {/* Activity Header */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                        <GitBranch className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Conditions
                          </span>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            Change
                          </Button>
                        </div>
                        <h3 className="font-semibold mt-1">{selectedActivity.name}</h3>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Descriptions
                      </label>
                      <div className="mt-2 p-3 rounded-lg border border-border/40 min-h-[80px]">
                        <p className="text-sm text-muted-foreground">
                          {selectedActivity.description || "Add a description.."}
                        </p>
                      </div>
                    </div>

                    {/* Condition Type */}
                    {selectedActivity.type === "condition" && (
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wider">
                          Condition type
                        </label>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Add the next block in this workflow
                        </p>
                        <div className="mt-2 p-3 rounded-lg border border-border/40 flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">If, else</span>
                        </div>

                        {/* Branches */}
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-muted-foreground/20" />
                            <span className="text-xs text-muted-foreground">Is true</span>
                          </div>
                          <div className="ml-4 p-3 rounded-lg border border-border/40">
                            <p className="text-sm text-muted-foreground">Add a description...</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="w-8 h-0.5 bg-muted-foreground/20" />
                            <span className="text-xs text-muted-foreground">Is false</span>
                          </div>
                          <div className="ml-4 p-3 rounded-lg border border-border/40">
                            <p className="text-sm text-muted-foreground">Add a description...</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div>
                      <label className="text-xs text-muted-foreground uppercase tracking-wider">
                        Status
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        {getStatusIcon(selectedActivity.status)}
                        <span className="text-sm capitalize">{selectedActivity.status || "Pending"}</span>
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                {/* Actions */}
                <div className="p-4 border-t border-border/40 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Refresh block
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-red-500 hover:text-red-600">
                    Delete block
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 bg-background"
              onClick={() => setZoom(z => Math.min(150, z + 10))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 bg-background"
              onClick={() => setZoom(z => Math.max(50, z - 10))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground/30">
          <div className="text-center">
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select a workflow to view details</p>
          </div>
        </div>
      )}
    </div>
  );
}
