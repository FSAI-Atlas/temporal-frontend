"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  User,
  Key,
  Shield,
  Trash2,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Check,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi, userApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

interface ApiKey {
  _id: string;
  name: string;
  apiKey: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "apikeys" | "security">("profile");
  
  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // API Key state
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [keyError, setKeyError] = useState("");
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [copied, setCopied] = useState(false);

  const queryClient = useQueryClient();
  const { user: authUser } = useAuthStore();

  // Fetch profile
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["settings", "profile"],
    queryFn: async () => {
      const response = await settingsApi.getProfile();
      return response.data.data.user;
    },
    onSuccess: (data: any) => {
      setName(data.name || "");
      setEmail(data.email || "");
    },
  });

  // Fetch API keys
  const { data: apiKeysData, isLoading: keysLoading } = useQuery({
    queryKey: ["user", "apikeys"],
    queryFn: async () => {
      try {
        const response = await userApi.getApiKeys();
        return response.data.data.apiKeys;
      } catch {
        return [];
      }
    },
  });

  const apiKeys: ApiKey[] = apiKeysData || [];

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string }) => {
      return settingsApi.updateProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "profile"] });
      setProfileSuccess("Profile updated successfully");
      setProfileError("");
      setTimeout(() => setProfileSuccess(""), 3000);
    },
    onError: (error: any) => {
      setProfileError(error.response?.data?.message || "Failed to update profile");
      setProfileSuccess("");
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return settingsApi.changePassword(data);
    },
    onSuccess: () => {
      setPasswordSuccess("Password changed successfully");
      setPasswordError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    },
    onError: (error: any) => {
      setPasswordError(error.response?.data?.message || "Failed to change password");
      setPasswordSuccess("");
    },
  });

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: async (name: string) => {
      return userApi.createApiKey(name);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["user", "apikeys"] });
      setShowCreateKeyDialog(false);
      setNewKeyName("");
      setKeyError("");
      
      // Show secret key
      const key = response.data.data.apiKey;
      if (key.secretKey) {
        setSecretKey(key.secretKey);
        setShowSecretDialog(true);
      }
    },
    onError: (error: any) => {
      setKeyError(error.response?.data?.message || "Failed to create API key");
    },
  });

  // Delete API key mutation
  const deleteKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      return userApi.deleteApiKey(keyId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "apikeys"] });
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name, email });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      setKeyError("Key name is required");
      return;
    }
    createKeyMutation.mutate(newKeyName.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "apikeys", label: "API Keys", icon: Key },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground/70 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <div className="w-48 shrink-0">
          <div className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  activeTab === tab.id
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Profile</h2>
              
              {profileLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  {profileError && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600">
                      {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-600">
                      {profileSuccess}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="px-3 py-2 rounded-md bg-muted/50 text-sm capitalize">
                      {profileData?.role || "member"}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save changes
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === "apikeys" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">API Keys</h2>
                <Button onClick={() => setShowCreateKeyDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create key
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                API keys are used to authenticate CLI commands and API requests.
              </p>

              {keysLoading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="border rounded-lg border-border/40 p-8 text-center">
                  <Key className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No API keys yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setShowCreateKeyDialog(true)}
                  >
                    Create your first API key
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg border-border/40 divide-y divide-border/40">
                  {apiKeys.map((key) => (
                    <div key={key._id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{key.name}</span>
                          <Badge variant={key.isActive ? "default" : "secondary"}>
                            {key.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                          {key.apiKey}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Created {new Date(key.createdAt).toLocaleDateString()}
                          {key.lastUsedAt && ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteKeyMutation.mutate(key._id)}
                        disabled={deleteKeyMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Security</h2>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <h3 className="font-medium">Change Password</h3>

                {passwordError && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3 text-sm text-emerald-600">
                    {passwordSuccess}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Change password
                </Button>
              </form>

              <Separator className="my-8" />

              <div>
                <h3 className="font-medium text-red-600 mb-2">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back.
                </p>
                <Button variant="destructive">
                  Delete account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create API Key Dialog */}
      <Dialog open={showCreateKeyDialog} onOpenChange={setShowCreateKeyDialog}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateKey}>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key for CLI authentication
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {keyError && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-600 mb-4">
                  {keyError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="keyName">Key name</Label>
                <Input
                  id="keyName"
                  placeholder="My CLI Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateKeyDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createKeyMutation.isPending}>
                {createKeyMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Secret Key Dialog */}
      <Dialog open={showSecretDialog} onOpenChange={setShowSecretDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy your secret key now. You won&apos;t be able to see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 rounded-lg bg-muted/50 font-mono text-sm break-all">
              {secretKey}
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => copyToClipboard(secretKey)}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to clipboard
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

