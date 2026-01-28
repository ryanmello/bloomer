"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import { useState, useEffect } from "react";
import { Trash2, LogOut, User, Building2, Shield, Users, Settings as SettingsIcon, Palette } from "lucide-react";
import SecurityTile from "@/components/settings/SecurityTile";
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
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [staffUsers, setStaffUsers] = useState<
    { name?: string; email: string; role?: string }[]
  >([]);

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

  // Helper to combine first and last names
  const combineNames = (arr: any[]) =>
    arr.map((u: any) => ({
      ...u,
      name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null,
    }));

  // Prefill the form when page loads
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        // Fetch all shops for the user
        const shopResp = await axios.get("/api/shop");
        const shops = shopResp.data || [];

        // Try to get the active shop id
        const activeResp = await axios.get("/api/shop/active");
        const activeShopId = activeResp.data?.activeShopId;

        // Pick the active shop if possible, otherwise first shop
        let shop = null;
        if (Array.isArray(shops) && shops.length > 0) {
          if (activeShopId) {
            shop = shops.find((s: any) => s.id === activeShopId) || shops[0];
          } else {
            shop = shops[0];
          }
        } else if (shops && !Array.isArray(shops)) {
          // Safety in case API changed: handle single object
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
          // No shop yet, clear the form
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

    // Fetch staff users
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

  // Handler for Add User button
  const onRoleSubmit = async (data: RoleFormData) => {
    try {
      const response = await axios.post("/api/user", { email: data.email });
      toast.success(response.data.message);
      resetRole();
      setShowRoleModal(false);

      // Refresh staff list after adding new user
      const staffResponse = await axios.get("/api/user?staff=true");
      setStaffUsers(combineNames(staffResponse.data));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign role");
    }
  };

  // Handler to remove staff role from a user
  const removeStaffRole = async (email: string) => {
    try {
      await axios.delete("/api/user", { data: { email } });
      toast.success("Staff role removed!");
      // Refresh the staff list
      const response = await axios.get("/api/user?staff=true");
      setStaffUsers(combineNames(response.data));
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to remove staff role"
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Details Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Account Details</CardTitle>
            </div>
            <CardDescription>
              Your personal information and contact details
            </CardDescription>
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

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Preferences</CardTitle>
            </div>
            <CardDescription>
              Customize your application experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base font-medium mb-3 block">Theme</Label>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Information Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Business Information</CardTitle>
          </div>
          <CardDescription>
            Manage your shop details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <Label htmlFor="name" className="mb-2">
                  Shop Name
                </Label>
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
                  <p className="text-sm text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <Label htmlFor="email" className="mb-2">
                  Contact Email
                </Label>
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
                  <p className="text-sm text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <Label htmlFor="phone" className="mb-2">
                  Phone Number
                </Label>
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
                  <p className="text-sm text-destructive mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col">
                <Label htmlFor="address" className="mb-2">
                  Store Address
                </Label>
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
                  <p className="text-sm text-destructive mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Section */}
        <SecurityTile />

        {/* Team Management Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>Team Management</CardTitle>
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
                <Button 
                  onClick={() => setShowRoleModal(true)} 
                  size="sm"
                >
                  Add User
                </Button>
              </div>
            </div>
            <CardDescription>
              Manage staff members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Column Titles */}
            <div className="grid grid-cols-[2fr_1.2fr_2fr_40px] font-semibold mb-2 px-2 text-sm text-muted-foreground">
              <div className="truncate">Name</div>
              <div className="truncate pl-1">Role</div>
              <div className="truncate">Email</div>
              <div></div>
            </div>

            {/* Divider */}
            <hr className="border-t border-border mx-2 mb-3" />

            {/* Staff Rows */}
            <div className="space-y-2">
              {staffUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No staff members yet. Click "Add User" to get started.
                </p>
              ) : (
                staffUsers.map((user) => (
                  <div
                    key={user.email}
                    className="grid grid-cols-[2fr_1.2fr_2fr_40px] px-2 py-2 items-center hover:bg-muted/50 rounded-md transition-colors"
                  >
                    <div className="truncate font-medium">{user.name || "(No name)"}</div>
                    <div className="truncate pl-1 text-sm text-muted-foreground">
                      {user.role
                        ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                        : "(No role)"}
                    </div>
                    <div className="truncate text-sm">{user.email}</div>
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
          </CardContent>
        </Card>
      </div>

      {/* Account Actions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <CardTitle>Account Actions</CardTitle>
          </div>
          <CardDescription>
            Sign out of your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => signOut({ callbackUrl: "/" })}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Assign Role</CardTitle>
              <CardDescription>
                Enter the email address of the user you want to add as staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleRoleSubmit(onRoleSubmit)}
                className="space-y-4"
              >
                <div>
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
                    className="mt-2"
                  />
                  {roleErrors.email && (
                    <p className="text-sm text-destructive mt-1">
                      {roleErrors.email.message}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
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
    </div>
  );
}
