"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerGroupDropdown } from "../../components/customers/CustomerGroupDropdown";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateCustomerForm from "@/components/customers/CreateCustomerForm";

type CustomerGroup = "VIP" | "Repeat" | "New" | "Potential";

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
  squareId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  address?: Address[];
  group?: CustomerGroup;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<CustomerGroup[]>([]);

  //Filter customers algorithm to display selected groups
  let filteredCustomers;
  if(selectedGroups.length === 0) {
    filteredCustomers = customers;
  } else {
    filteredCustomers = customers.filter((customer) => 
      selectedGroups.some(group => 
        group?.toLowerCase() === customer.group?.toLowerCase()
      )
    );
  }

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customer");
      const data: Customer[] = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Import customers from Square API
  const handleImport = async () => {
    setLoading(true);
    try {
      await fetch("/api/customer/import", {method: "POST"});
      await fetchCustomers();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  console.log(customers);
  return (
    <div className="p-6 space-y-6">
      {/* Import From Square Button */}
      <div className="flex justify-end">
      <h1 className="text-2xl font-semibold mr-auto">Customers</h1>
        <button
          onClick={handleImport}
          disabled={loading}
          className="px-4 py-2 rounded border border-gray-600 text-white bg-transparent cursor-pointer">
          {loading ? "Importing..." : "Import Customers"}
        </button>

        {/* Add Customer Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus /> Add Customer
            </Button>
          </DialogTrigger>
          <CreateCustomerForm />
        </Dialog>
      </div>

      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <CustomerGroupDropdown
              selectedGroups={selectedGroups}
              onSelectionChange={setSelectedGroups}
            />
          </div>
        </div>
      </div>


      {customers.length === 0 && !loading && <p>No customers found.</p>}

      {/* Customer Cards */}
      {customers.map((customer) => (
        <Card key={customer.id} className="w-full p-6 shadow-md">
          <CardHeader className="flex items-center">
            <CardTitle>
              {`${customer.firstName} ${customer.lastName}`.trim()}
            </CardTitle>
            {customer.squareId !== null && <div className="inline-flex items-center px-2 py-1.5 rounded-md border border-border bg-muted/50 text-muted-foreground text-sm font-medium">Square</div>}
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-gray-300 text-sm md:text-base">
              <div className="min-w-[150px]">
                <strong>Email:</strong> {customer.email || "-"}
              </div>
              <div className="min-w-[150px]">
                <strong>Phone:</strong> {customer.phoneNumber || "-"}
              </div>
              <div className="min-w-[150px]">
                <strong>Addresses:</strong>{" "}
                {customer.address && customer.address.length > 0 ? (
                  <>
                    {customer.address
                      .map((addr) =>
                        [
                          addr.line1,
                          addr.line2,
                          addr.city,
                          addr.state,
                          addr.zip,
                          addr.country,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      )
                      .join(", ")}
                  </>
                ) : (
                  "-"
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
