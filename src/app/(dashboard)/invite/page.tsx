"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  UserPlus,
  Loader2,
  MoreHorizontal,
  Shield,
  User,
  Eye,
  Crown,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

interface Member {
  _id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  isActive: boolean;
  createdAt: string;
}

const roleIcons: Record<string, any> = {
  owner: Crown,
  admin: Shield,
  member: User,
  viewer: Eye,
};

const roleColors: Record<string, string> = {
  owner: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  member: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  viewer: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export default function InvitePage() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Fetch members
  const { data: membersData, isLoading } = useQuery({
    queryKey: ["tenant", "members"],
    queryFn: async () => {
      try {
        const response = await tenantApi.getMembers({ limit: 100 });
        return response.data.data;
      } catch {
        return { members: [], pagination: { total: 0 } };
      }
    },
  });

  const members: Member[] = membersData?.members || [];

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; name: string; role: "admin" | "member" | "viewer" }) => {
      return tenantApi.inviteMember(data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "members"] });
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
      setError("");
      
      // Show temp password in development
      if (response.data.data?.tempPassword) {
        setSuccessMessage(`Member invited! Temporary password: ${response.data.data.tempPassword}`);
      } else {
        setSuccessMessage("Invitation sent successfully!");
      }
      
      setTimeout(() => setSuccessMessage(""), 10000);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || "Failed to invite member");
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: "admin" | "member" | "viewer" }) => {
      return tenantApi.updateMemberRole(memberId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "members"] });
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      return tenantApi.removeMember(memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", "members"] });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!inviteEmail.trim() || !inviteName.trim()) {
      setError("Email and name are required");
      return;
    }

    inviteMutation.mutate({
      email: inviteEmail.trim(),
      name: inviteName.trim(),
      role: inviteRole,
    });
  };

  const canManageMembers = user?.role === "owner" || user?.role === "admin";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Members</h1>
          <p className="text-muted-foreground/70 mt-1">
            Manage your workspace members and their permissions
          </p>
        </div>
        {canManageMembers && (
          <Button onClick={() => setShowInviteDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite member
          </Button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          {successMessage}
        </div>
      )}

      {/* Members List */}
      <div className="border rounded-lg border-border/40">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No members yet</p>
            {canManageMembers && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowInviteDialog(true)}
              >
                Invite your first member
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {members.map((member) => {
              const RoleIcon = roleIcons[member.role] || User;
              const isCurrentUser = member._id === user?._id;

              return (
                <div
                  key={member._id}
                  className="flex items-center justify-between p-4 hover:bg-muted/20"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/10 text-foreground text-sm font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name}</span>
                        {isCurrentUser && (
                          <span className="text-xs text-muted-foreground">(you)</span>
                        )}
                        {!member.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge className={cn("gap-1", roleColors[member.role])}>
                      <RoleIcon className="h-3 w-3" />
                      {member.role}
                    </Badge>

                    {canManageMembers && !isCurrentUser && member.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              updateRoleMutation.mutate({
                                memberId: member._id,
                                role: "admin",
                              })
                            }
                            disabled={member.role === "admin"}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Make admin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateRoleMutation.mutate({
                                memberId: member._id,
                                role: "member",
                              })
                            }
                            disabled={member.role === "member"}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Make member
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateRoleMutation.mutate({
                                memberId: member._id,
                                role: "viewer",
                              })
                            }
                            disabled={member.role === "viewer"}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Make viewer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => removeMutation.mutate(member._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Role Legend */}
      <div className="mt-6 p-4 rounded-lg bg-muted/20">
        <h3 className="text-sm font-medium mb-3">Role Permissions</h3>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge className={cn("gap-1", roleColors.owner)}>
              <Crown className="h-3 w-3" />
              Owner
            </Badge>
            <span className="text-muted-foreground">Full access, can delete workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("gap-1", roleColors.admin)}>
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
            <span className="text-muted-foreground">Manage members, deploy workflows</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("gap-1", roleColors.member)}>
              <User className="h-3 w-3" />
              Member
            </Badge>
            <span className="text-muted-foreground">Deploy workflows, approve tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("gap-1", roleColors.viewer)}>
              <Eye className="h-3 w-3" />
              Viewer
            </Badge>
            <span className="text-muted-foreground">View only access</span>
          </div>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleInvite}>
            <DialogHeader>
              <DialogTitle>Invite team member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your workspace
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="inviteName">Name</Label>
                <Input
                  id="inviteName"
                  placeholder="John Doe"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteEmail">Email</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="inviteRole">Role</Label>
                <Select value={inviteRole} onValueChange={(v: any) => setInviteRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteDialog(false)}
                disabled={inviteMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

