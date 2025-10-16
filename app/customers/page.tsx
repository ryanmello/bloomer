import { useState } from "react";
import { CustomerGroupDropdown } from "./CustomerGroupDropdown";

type CustomerGroup = "VIP" | "Repeat" | "New" | "Potential";

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
      </div>
    </div>
  );
}
