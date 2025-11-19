"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { User } from "@prisma/client";
import { Dispatch, SetStateAction } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useUser } from "@/context/AuthContext";

const isPhoneNumber = (value: string) => {
  if (!value) return true; // Allow empty phone
  const phoneRegex = /^\d{3}-?\d{3}-?\d{4}$/;
  return phoneRegex.test(value);
};

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  company: z.string().optional(),
  address1: z.string().min(1, { message: "Address is required." }),
  address2: z.string().optional(),
  city: z.string().min(1, { message: "City is required." }),
  state: z.string().min(2, { message: "State is required." }),
  country: z.string().min(1, { message: "Country is required." }),
  postal: z.string().min(5, {
    message: "Postal code must be at least 5 characters.",
  }).max(10, {
    message: "Postal code must be at most 10 characters.",
  }),
  phone: z.string().refine(isPhoneNumber, {
    message: "Invalid phone number format (e.g., 123-456-7890).",
  }),
});

interface AccountDetailsFormProps {
  user: User;
  setDisplayForm: Dispatch<SetStateAction<boolean>>;
}

const AccountDetailsForm: React.FC<AccountDetailsFormProps> = ({
  user,
  setDisplayForm,
}) => {
  const { refetchUser } = useUser();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      address1: user.address1 ?? "",
      address2: user.address2 ?? "",
      city: user.city ?? "",
      state: user.state ?? "",
      country: user.country ?? "",
      postal: user.postal ?? "",
      phone: user.phone ?? "",
    },
  });

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
    try {
      const {
        firstName,
        lastName,
        company,
        address1,
        address2,
        city,
        state,
        country,
        postal,
        phone,
      } = formData;

      await axios.post("/api/user/update", {
        firstName,
        lastName,
        company,
        address1,
        address2,
        city,
        state,
        country,
        postal,
        phone: phone.replace(/-/g, ""),
      });

      toast.success("Account details updated");
      
      // Refetch user data to update the context
      await refetchUser();
      
      setDisplayForm(false);
    } catch (error: any) {
      toast.error("Failed to update account details");
      console.log(error.message);
    }
  };

  return (
    <div className="w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="First Name" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Last Name" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="address1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address 1</FormLabel>
                <FormControl>
                  <Input placeholder="Street Address" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address 2 (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Apt, Suite, etc." {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input placeholder="State" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postal"
              render={({ field }) => (
                <FormItem className="w-1/2">
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Postal Code" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Country" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="123-456-7890" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="w-full flex justify-end pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisplayForm(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AccountDetailsForm;
