"use client";
import { useState } from "react";
import { CustomerGroupDropdown } from "./CustomerGroupDropdown";

type CustomerGroup = "VIP" | "Repeat" | "New" | "Potential";

/*
This Customer interface and mock customer data is intended to
mock customer entries, before we eventually import them from the square API
*/
interface Customer {
  name: string;
  email: string;
  group: CustomerGroup;
}

const mockCustomerData: Customer[] = [
  {
    name: "Customer 1",
    email: "customer1@gmail.com",
    group: "VIP",
  },
  {
    name: "Customer 2",
    email: "customer2@gmail.com",
    group: "Repeat",
  },
  {
    name: "Customer 3",
    email: "customer3@gmail.com",
    group: "New",
  },
  {
    name: "Customer 4",
    email: "customer4@gmail.com",
    group: "Potential",
  },
];

export default function Customers() {
  const [selectedGroups, setSelectedGroups] = useState<CustomerGroup[]>([]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-4">Customers</h1>
        <div className="flex items-center gap-4">
          <CustomerGroupDropdown
            selectedGroups={selectedGroups}
            onSelectionChange={setSelectedGroups}
          />
        </div>

        <div>
          {
          mockCustomerData.map((customer) =>
            <div key={customer.name}>
              <p>{customer.name}</p>
              <p>{customer.email}</p>
              <p>{customer.group}</p>
            </div>
          )
          }

        </div>
      </div>
    </div>
  );
}
