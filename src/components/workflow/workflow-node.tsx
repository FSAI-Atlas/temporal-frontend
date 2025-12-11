"use client";

import { cn } from "@/lib/utils";

export type NodeType = "trigger" | "action" | "condition" | "end";

interface WorkflowNodeProps {
  id: string;
  type: NodeType;
  label: string;
  description?: string;
  isSelected?: boolean;
  onClick?: () => void;
  badge?: string;
}

const nodeStyles: Record<NodeType, { bg: string; border: string; badge: string; badgeBg: string }> = {
  trigger: {
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-900/50",
    badge: "text-red-600 dark:text-red-400",
    badgeBg: "bg-red-100 dark:bg-red-900/30",
  },
  action: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/50",
    badge: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-100 dark:bg-amber-900/30",
  },
  condition: {
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-900/50",
    badge: "text-violet-600 dark:text-violet-400",
    badgeBg: "bg-violet-100 dark:bg-violet-900/30",
  },
  end: {
    bg: "bg-gray-50 dark:bg-gray-950/20",
    border: "border-gray-200 dark:border-gray-800",
    badge: "text-gray-600 dark:text-gray-400",
    badgeBg: "bg-gray-100 dark:bg-gray-800",
  },
};

const badgeLabels: Record<NodeType, string> = {
  trigger: "TRIGGER",
  action: "DO THIS",
  condition: "IF / ELSE",
  end: "END",
};

export function WorkflowNode({
  id,
  type,
  label,
  description,
  isSelected,
  onClick,
  badge,
}: WorkflowNodeProps) {
  const styles = nodeStyles[type];
  const badgeLabel = badge || badgeLabels[type];

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative w-64 rounded-lg border-2 p-4 cursor-pointer transition-all",
        styles.bg,
        styles.border,
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {/* Badge */}
      <div className={cn(
        "absolute -top-3 left-4 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider",
        styles.badgeBg,
        styles.badge
      )}>
        {badgeLabel}
      </div>

      {/* Content */}
      <div className="pt-2">
        <h4 className="font-medium text-sm">{label}</h4>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Data badge */}
      {type === "trigger" && (
        <div className="absolute top-4 right-4">
          <span className="text-[10px] px-2 py-1 rounded bg-white dark:bg-gray-800 border text-muted-foreground">
            Data
          </span>
        </div>
      )}

      {/* Conditions badge */}
      {(type === "action" || type === "condition") && (
        <div className="absolute top-4 right-4">
          <span className="text-[10px] px-2 py-1 rounded bg-white dark:bg-gray-800 border text-muted-foreground">
            Conditions
          </span>
        </div>
      )}
    </div>
  );
}

export function WorkflowConnector({ hasChildren = true }: { hasChildren?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-0.5 h-6 bg-gray-300 dark:bg-gray-700" />
      {hasChildren && (
        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
      )}
    </div>
  );
}

export function WorkflowBranch({ labels }: { labels: [string, string] }) {
  return (
    <div className="flex items-start justify-center gap-8 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-gray-300 dark:bg-gray-700" />
      <div className="absolute top-4 left-1/4 right-1/4 h-0.5 bg-gray-300 dark:bg-gray-700" />
      
      <div className="flex flex-col items-center pt-4">
        <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-700" />
        <span className="text-xs text-muted-foreground mb-2">{labels[0]}</span>
      </div>
      
      <div className="flex flex-col items-center pt-4">
        <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-700" />
        <span className="text-xs text-muted-foreground mb-2">{labels[1]}</span>
      </div>
    </div>
  );
}

