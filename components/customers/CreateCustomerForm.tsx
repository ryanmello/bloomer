"use client";

import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {toast} from "sonner";
import {
  createCustomerSchema,
  US_STATES,
  type CreateCustomerFormValues,
} from "@/lib/validations/customer";

export default function CreateCustomerForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      dateOfBirth: "",
      additionalNote: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
        country: "US",
      },
    },
  });

  async function onSubmit(values: CreateCustomerFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      toast.success(data.message);
      form.reset();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast.error("Failed to create customer");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DialogPortal>
      <DialogOverlay />

      <DialogContent className="max-h-[90vh] max-w-lg flex flex-col p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Fill in the customer details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto space-y-4 py-2 -mx-1 px-1">
              <FormField
                control={form.control}
                name="firstName"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="First Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Last Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input type="email" placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="Phone Number (e.g., 555-123-4567)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Date of Birth"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalNote"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="Additional Note" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Label className="font-semibold">Address</Label>

              <FormField
                control={form.control}
                name="address.line1"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Line 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.line2"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Line 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.city"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="City" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.state"
                render={({field}) => (
                  <FormItem>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.zip"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="ZIP Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.country"
                render={({field}) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
              <DialogClose asChild>
                <Button variant="destructive" onClick={() => form.reset()}>
                  Cancel
                </Button>
              </DialogClose>
              <Button variant="default" type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Create Customer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </DialogPortal>
  );
}
