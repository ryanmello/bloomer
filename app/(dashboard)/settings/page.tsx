"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import axios from "axios";
import { useState, useEffect } from "react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [staffUsers, setStaffUsers] = useState<{ name?: string; email: string; role?: string }[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShopFormData>();
  const { register: registerRole, handleSubmit: handleRoleSubmit, reset: resetRole, formState: { errors: roleErrors } } = useForm<RoleFormData>();

  // Prefill the form when page loads
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await axios.get("/api/shop");
        const data = response.data;

        const defaultValues: Partial<ShopFormData> = {};
        if (data?.name) defaultValues.name = data.name;
        if (data?.email) defaultValues.email = data.email;
        if (data?.phone) defaultValues.phone = data.phone;
        if (data?.address) defaultValues.address = data.address;

        reset(defaultValues);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to fetch shop info");
      }
    };

    fetchShopData();

    // Fetch staff users
    const fetchStaff = async () => {
      try {
        const response = await axios.get("/api/user?staff=true");
        setStaffUsers(response.data);
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
      toast.error(error.response?.data?.message || "Failed to save business info");
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
      setStaffUsers(staffResponse.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to assign role");
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6 px-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Theme section */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Theme</h2>
        <ThemeToggle />
      </div>

      {/* Business Info Card */}
      <div className="border rounded-lg p-6 w-full">
        <h2 className="text-xl font-bold mb-4">Business Info</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <Label htmlFor="name" className="mb-2">Shop Name</Label>
              <Input
                id="name"
                placeholder="Enter shop name"
                {...register("name", { required: "Shop name is required", minLength: { value: 2, message: "Shop name must be at least 2 characters" } })}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="flex flex-col">
              <Label htmlFor="email" className="mb-2">Contact Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter contact email"
                {...register("email", { required: "Email is required", pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: "Please enter a valid email address" } })}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="flex flex-col">
              <Label htmlFor="phone" className="mb-2">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter phone number"
                {...register("phone", { required: "Phone number is required", pattern: { value: /^[0-9+\-\s()]+$/, message: "Please enter a valid phone number" } })}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="flex flex-col">
              <Label htmlFor="address" className="mb-2">Store Address</Label>
              <Input
                id="address"
                placeholder="Enter store address"
                {...register("address", { required: "Store address is required", minLength: { value: 5, message: "Address must be at least 5 characters" } })}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>

      {/* Staff Users Tile */}
      <div className="border rounded-lg p-6 mt-6 w-full">
        {/* Tile Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Staff Users</h2>
          <Button onClick={() => setShowRoleModal(true)} variant="default">Add User</Button>
        </div>

        {/* Column Titles */}
        <div className="grid grid-cols-3 font-semibold mb-2 px-2">
          <span>Name</span>
          <span>Role</span>
          <span>Email</span>
        </div>

        {/* Divider */}
        <hr className="border-t border-gray-300 mx-2 mb-2" />

        {/* Staff Rows */}
        {staffUsers.length === 0 && <p className="text-gray-500 px-2">No staff users yet</p>}
        {staffUsers.map((user) => (
          <div key={user.email} className="grid grid-cols-3 px-2 py-1">
            <span>{user.name || "(No name)"}</span>
            <span>{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "(No role)"}</span>
            <span>{user.email}</span>
          </div>
        ))}
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Assign Role</h2>
            <form onSubmit={handleRoleSubmit(onRoleSubmit)} className="flex flex-col space-y-4">
              <Input
                placeholder="Enter user email"
                {...registerRole("email", { required: "Email is required" })}
                className="bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => setShowRoleModal(false)}
                  className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  Cancel
                </Button>
                <Button type="submit">Set Role</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
