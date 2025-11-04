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

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ShopFormData>();

  // Prefill the form when page loads
  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const response = await axios.get("/api/shop");
        const data = response.data;

        // Only include fields that exist
        const defaultValues: Partial<ShopFormData> = {};
        if (data?.name) defaultValues.name = data.name;
        if (data?.email) defaultValues.email = data.email;
        if (data?.phone) defaultValues.phone = data.phone;
        if (data?.address) defaultValues.address = data.address;

        reset(defaultValues); // prefill the form
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to fetch shop info");
      }
    };

    fetchShopData();
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

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Theme</h2>
        <ThemeToggle />
      </div>

      <div className="border rounded-lg p-6">
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
            <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
