"use client";
import { useState } from "react";

interface Address {
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  additionalNote?: string;
  squareId?: string;
  address?: Address[];
}

interface EditCustomerFormProps {
  customer: Customer;
  onSave: () => void;
  onCancel?: () => void; 
}

export default function EditCustomerForm({ customer, onSave, onCancel }: EditCustomerFormProps) {
  const [form, setForm] = useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email || "",
    phoneNumber: customer.phoneNumber || "",
    additionalNote: customer.additionalNote || "",
    addresses: customer.address || [{ line1: "", line2: "", city: "", state: "", zip: "", country: "" }],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index?: number) => {
    const { name, value } = e.target;
    if (typeof index === "number") {
      const updatedAddresses = [...form.addresses];
      updatedAddresses[index] = { ...updatedAddresses[index], [name]: value };
      setForm({ ...form, addresses: updatedAddresses });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/customer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update customer");
      alert(data.message);
      onSave();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error updating customer");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-gray-700 rounded bg-gray-900 text-gray-100 ">
      <input
        type="text"
        name="firstName"
        value={form.firstName}
        onChange={handleChange}
        placeholder="First Name"
        className="border rounded p-2 w-full"
        required
      />
      <input
        type="text"
        name="lastName"
        value={form.lastName}
        onChange={handleChange}
        placeholder="Last Name"
        className="border rounded p-2 w-full"
        required
      />
      <input
        type="email"
        name="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Email"
        className="border rounded p-2 w-full"
      />
      <input
        type="text"
        name="phoneNumber"
        value={form.phoneNumber}
        onChange={handleChange}
        placeholder="Phone Number"
        className="border rounded p-2 w-full"
      />
      <textarea
        name="additionalNote"
        value={form.additionalNote}
        onChange={handleChange}
        placeholder="Additional Note"
        className="border rounded p-2 w-full"
      />

      {form.addresses.map((addr, idx) => (
        <div key={idx} className="space-y-1">
          <input
            type="text"
            name="line1"
            value={addr.line1}
            onChange={(e) => handleChange(e, idx)}
            placeholder="Address Line 1"
            className="border rounded p-2 w-full"
          />
          <input
            type="text"
            name="line2"
            value={addr.line2}
            onChange={(e) => handleChange(e, idx)}
            placeholder="Address Line 2"
            className="border rounded p-2 w-full"
          />
          <input
            type="text"
            name="city"
            value={addr.city}
            onChange={(e) => handleChange(e, idx)}
            placeholder="City"
            className="border rounded p-2 w-full"
          />
          <input
            type="text"
            name="state"
            value={addr.state}
            onChange={(e) => handleChange(e, idx)}
            placeholder="State"
            className="border rounded p-2 w-full"
          />
          <input
            type="text"
            name="zip"
            value={addr.zip}
            onChange={(e) => handleChange(e, idx)}
            placeholder="ZIP"
            className="border rounded p-2 w-full"
          />
          <input
            type="text"
            name="country"
            value={addr.country}
            onChange={(e) => handleChange(e, idx)}
            placeholder="Country"
            className="border rounded p-2 w-full"
          />
        </div>
      ))}

      <div className="flex gap-2 mt-4">
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border rounded hover:bg-gray-200"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
