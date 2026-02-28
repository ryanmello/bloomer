"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { Trash2, LogOut, User, Building2, Users, Palette, Store, Link2, Unlink, CheckCircle2, Loader2, Sun, Moon, Monitor } from "lucide-react";
import SecurityTile from "@/components/settings/SecurityTile";
import PreferencesTile from "@/components/settings/PreferencesTile";
import ShopList from "@/components/settings/ShopList";
import { signOut } from "next-auth/react";
import AccountDetails from "@/components/settings/AccountDetails";
import { useUser } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

type ShopFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

type RoleFormData = {
  email: string;
};

export default function Settings() {
  const { user, isLoading: userLoading } = useUser();
  const { setTheme, theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [staffUsers, setStaffUsers] = useState<
    { name?: string; email: string; role?: string }[]
  >([]);

  const [squareConnected, setSquareConnected] = useState(false);
  const [squareMerchantId, setSquareMerchantId] = useState<string | null>(null);
  const [squareLoading, setSquareLoading] = useState(true);
  const [squareActionLoading, setSquareActionLoading] = useState(false);

  const fetchTwoFactorStatus = useCallback(async () => {
    try {
      const response = await axios.get("/api/user/2fa/status");
      setTwoFactorEnabled(response.data.enabled);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchTwoFactorStatus();
  }, [fetchTwoFactorStatus]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ShopFormData>();
  const {
    register: registerRole,
    handleSubmit: handleRoleSubmit,
    reset: resetRole,
    formState: { errors: roleErrors },
  } = useForm<RoleFormData>();

  const combineNames = (arr: any[]) =>
    arr.map((u: any) => ({
      ...u,
      name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null,
    }));

  useEffect(() => {
    const fetchSquareStatus = async () => {
      try {
        const res = await axios.get("/api/integrations/square/status");
        setSquareConnected(res.data.connected);
        setSquareMerchantId(res.data.merchantId || null);
      } catch {
        setSquareConnected(false);
      } finally {
        setSquareLoading(false);
      }
    };
    fetchSquareStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "square") {
      toast.success("Square account connected successfully!");
      setSquareConnected(true);
      window.history.replaceState({}, "", "/settings");
    }

    const errorParam = params.get("error");
    if (errorParam) {
      toast.error(`Square connection failed: ${errorParam}`);
      window.history.replaceState({}, "", "/settings");
    }
  }, []);

  const handleConnectSquare = async () => {
    setSquareActionLoading(true);
    try {
      const res = await axios.get("/api/integrations/square/oauth");
      window.location.href = res.data.authUrl;
    } catch {
      toast.error("Failed to start Square connection");
      setSquareActionLoading(false);
    }
  };

  const handleDisconnectSquare = async () => {
    setSquareActionLoading(true);
    try {
      await axios.post("/api/integrations/square/disconnect");
      setSquareConnected(false);
      setSquareMerchantId(null);
      toast.success("Square account disconnected");
    } catch {
      toast.error("Failed to disconnect Square");
    } finally {
      setSquareActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const shopResp = await axios.get("/api/shop");
        const shops = shopResp.data || [];

        const activeResp = await axios.get("/api/shop/active");
        const activeShopId = activeResp.data?.activeShopId;

        let shop = null;
        if (Array.isArray(shops) && shops.length > 0) {
          if (activeShopId) {
            shop = shops.find((s: any) => s.id === activeShopId) || shops[0];
          } else {
            shop = shops[0];
          }
        } else if (shops && !Array.isArray(shops)) {
          shop = shops;
        }

        if (shop) {
          reset({
            name: shop.name || "",
            email: shop.email || "",
            phone: shop.phone || "",
            address: shop.address || "",
          });
        } else {
          reset({
            name: "",
            email: "",
            phone: "",
            address: "",
          });
        }
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to fetch shop info"
        );
      }
    };

    fetchShopData();

    const fetchStaff = async () => {
      try {
        const response = await axios.get("/api/user?staff=true");
        setStaffUsers(combineNames(response.data));
      } catch (error: any) {
        toast.error("Failed to fetch staff users");
      }
    };

    fetchStaff();
  }, [reset]);

  const onSubmit = async (data: ShopFormData) => {
    setIsLoading(true);
    try {
      await axios.post("/api/shop", data);
      toast.success("Business info saved successfully!");
      reset(data);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to save business info"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onRoleSubmit = async (data: RoleFormData) => {
    try {
      const response = await axios.post("/api/user", { email: data.email });
      toast.success(response.data.message);
      resetRole();
      setShowRoleModal(false);

      const staffResponse = await axios.get("/api/user?staff=true");
      setStaffUsers(combineNames(staffResponse.data));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign role");
    }
  };

  const removeStaffRole = async (email: string) => {
    try {
      await axios.delete("/api/user", { data: { email } });
      toast.success("Staff role removed!");
      const response = await axios.get("/api/user?staff=true");
      setStaffUsers(combineNames(response.data));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to remove staff role"
      );
    }
  };

  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, business, and preferences
        </p>
      </div>

      {/* Account Details + Appearance */}
      <div className="w-full flex flex-col lg:flex-row gap-4 min-w-0">
        <Card className="flex-1 min-w-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-2 bg-muted">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>
                  Your personal information and contact details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {userLoading ? (
              <Skeleton className="w-full h-24" />
            ) : user ? (
              <AccountDetails user={user} />
            ) : (
              <p className="text-muted-foreground">No user data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-2 bg-muted">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the app looks and feels
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { value: "light", label: "Light", desc: "Clean and bright", icon: Sun },
              { value: "dark", label: "Dark", desc: "Easy on the eyes", icon: Moon },
              { value: "system", label: "System", desc: "Match your device", icon: Monitor },
            ] as const).map((option) => {
              const Icon = option.icon;
              const isActive = theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isActive
                      ? "border-primary/40 bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:bg-muted/50 hover:border-border"
                  }`}
                >
                  <div className={`rounded-lg p-2 ${isActive ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                  </div>
                  {isActive && (
                    <CheckCircle2 className="h-4 w-4 text-primary ml-auto shrink-0" />
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-muted">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Manage your shop details and contact information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Shop Name</Label>
                <Input
                  id="name"
                  placeholder="Enter shop name"
                  {...register("name", {
                    required: "Shop name is required",
                    minLength: {
                      value: 2,
                      message: "Shop name must be at least 2 characters",
                    },
                  })}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Contact Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter contact email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Please enter a valid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  {...register("phone", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: "Please enter a valid phone number",
                    },
                  })}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Store Address</Label>
                <Input
                  id="address"
                  placeholder="Enter store address"
                  {...register("address", {
                    required: "Store address is required",
                    minLength: {
                      value: 5,
                      message: "Address must be at least 5 characters",
                    },
                  })}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Your Shops */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-muted">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Your Shops</CardTitle>
              <CardDescription>Manage your shops and locations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ShopList />
        </CardContent>
      </Card>

      {/* Notifications & Security */}
      <div className="w-full flex flex-col lg:flex-row gap-4 min-w-0">
        <div className="flex-1 min-w-0">
          <PreferencesTile
            twoFactorEnabled={twoFactorEnabled}
            onTwoFactorChange={fetchTwoFactorStatus}
          />
        </div>
        <div className="flex-1 min-w-0">
          <SecurityTile
            twoFactorEnabled={twoFactorEnabled}
            onTwoFactorChange={fetchTwoFactorStatus}
          />
        </div>
      </div>

      {/* Team Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-2 bg-muted">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Team Management</CardTitle>
                <CardDescription>
                  Manage staff members and their roles
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  try {
                    const response = await axios.get("/api/user?staff=true");
                    setStaffUsers(combineNames(response.data));
                    toast.success("Staff list refreshed!");
                  } catch (error: any) {
                    toast.error("Failed to refresh staff users");
                  }
                }}
                variant="outline"
                size="sm"
              >
                Refresh
              </Button>
              <Button onClick={() => setShowRoleModal(true)} size="sm">
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_2fr_48px] bg-muted/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <div>Name</div>
              <div>Role</div>
              <div>Email</div>
              <div></div>
            </div>
            <div className="divide-y divide-border">
              {staffUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No staff members yet. Click &quot;Add User&quot; to get
                  started.
                </p>
              ) : (
                staffUsers.map((user) => (
                  <div
                    key={user.email}
                    className="grid grid-cols-[2fr_1fr_2fr_48px] px-4 py-3 items-center hover:bg-muted/30 transition-colors"
                  >
                    <div className="truncate font-medium text-sm">
                      {user.name || "(No name)"}
                    </div>
                    <div>
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-700">
                        {user.role
                          ? user.role.charAt(0).toUpperCase() +
                            user.role.slice(1)
                          : "None"}
                      </span>
                    </div>
                    <div className="truncate text-sm text-muted-foreground">
                      {user.email}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStaffRole(user.email)}
                      className="p-2 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-destructive hover:text-destructive-foreground"
                      title="Remove staff role"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-muted">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect third-party services to your account
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
                  <path d="M4.01 0C1.8 0 0 1.8 0 4.01v15.98C0 22.2 1.8 24 4.01 24h15.98C22.2 24 24 22.2 24 19.99V4.01C24 1.8 22.2 0 19.99 0H4.01zm8.34 4.8h3.3c.66 0 1.26.27 1.7.7.43.44.7 1.04.7 1.7v3.3c0 .66-.27 1.26-.7 1.7l-3.3 3.3c-.44.43-1.04.7-1.7.7h-3.3c-.66 0-1.26-.27-1.7-.7l-3.3-3.3c-.43-.44-.7-1.04-.7-1.7V7.2c0-.66.27-1.26.7-1.7.44-.43 1.04-.7 1.7-.7h3.3z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-foreground">Square</p>
                {squareLoading ? (
                  <Skeleton className="h-4 w-32 mt-1" />
                ) : squareConnected ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-sm text-muted-foreground">
                      Connected{squareMerchantId ? ` (${squareMerchantId})` : ""}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Sync orders and customers from Square
                  </p>
                )}
              </div>
            </div>
            <div>
              {squareLoading ? (
                <Skeleton className="h-9 w-24" />
              ) : squareConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnectSquare}
                  disabled={squareActionLoading}
                  className="flex items-center gap-2"
                >
                  {squareActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                  Disconnect
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleConnectSquare}
                  disabled={squareActionLoading}
                  className="flex items-center gap-2"
                >
                  {squareActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Connect
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-destructive/10">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Irreversible account actions
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <p className="font-medium text-sm">Sign out of your account</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                You will be redirected to the home page
              </p>
            </div>
            <Button
              onClick={() => signOut({ callbackUrl: "/" })}
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <Card className="w-full max-w-md mx-4 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl p-2 bg-muted">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Add Staff Member</CardTitle>
                  <CardDescription>
                    Enter the email address of the user you want to add as staff
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleRoleSubmit(onRoleSubmit)}
                className="space-y-4"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="role-email">Email Address</Label>
                  <Input
                    id="role-email"
                    type="email"
                    placeholder="Enter user email"
                    {...registerRole("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Please enter a valid email address",
                      },
                    })}
                  />
                  {roleErrors.email && (
                    <p className="text-sm text-destructive">
                      {roleErrors.email.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRoleModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Add User</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
