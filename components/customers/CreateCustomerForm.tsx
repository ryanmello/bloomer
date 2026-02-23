"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {toast} from "sonner";
import {Plus} from "lucide-react";

export interface AddressProps {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface FormCustomerProps {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  additionalNote?: string;
  squareId?: string;
  address: AddressProps;
  dateOfBirth?: string;
}

export default function CreateCustomerForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormCustomerProps>({
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
      country: "",
    },
  });

  // https://www.meje.dev/blog/handle-change-in-ts
  // (handleChange in TypeScript)
  // handle change for normal inputs
  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const {name, value} = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAddressChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const {name, value} = e.target;
    setFormData((prev) => ({
      ...prev,
      address: {
        // keep other address fields
        ...prev.address,
        // update the specific field
        [name]: value,
      },
    }));
  }

  // handle reset form
  function handleResetForm() {
    setFormData({
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
        country: "",
      },
    });
  }

  // handle submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          // Prisma expects an array
          address: [formData.address],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Something went wrong");
        return;
      }

      if (response.ok) {
        toast.success(data.message);
        handleResetForm();
      } else {
        toast.error("Failed to create customer");
      }
    } catch (error) {
      console.error("Error creating customer:", error);
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 py-2 -mx-1 px-1">
          <Input
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={handleInputChange}
            required
          />
          <Input
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={handleInputChange}
            required
          />
          <Input
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <Input
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            required
          />
          <Input
            name="dateOfBirth"
            placeholder="Date of Birth (YYYY-MM-DD)"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            required
          />
          <Textarea
            name="additionalNote"
            placeholder="Additional Note"
            value={formData.additionalNote}
            onChange={handleInputChange}
          />

          <Label>Address</Label>
          <Input
            name="line1"
            placeholder="Line 1"
            value={formData.address.line1}
            onChange={handleAddressChange}
            required
          />
          <Input
            name="line2"
            placeholder="Line 2"
            value={formData.address.line2}
            onChange={handleAddressChange}
          />
          <Input
            name="city"
            placeholder="City"
            value={formData.address.city}
            onChange={handleAddressChange}
            required
          />
          <Input
            name="state"
            placeholder="State"
            value={formData.address.state}
            onChange={handleAddressChange}
            required
          />
          <Input
            name="zip"
            placeholder="ZIP"
            value={formData.address.zip}
            onChange={handleAddressChange}
            required
          />
          <Input
            name="country"
            placeholder="Country"
            value={formData.address.country}
            onChange={handleAddressChange}
            required
          />
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t mt-4">
            <DialogClose asChild>
              <Button variant="destructive" onClick={handleResetForm}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="default" type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </DialogPortal>
  );
}
