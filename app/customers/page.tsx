"use client";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerGroupDropdown } from "../../components/customers/CustomerGroupDropdown";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateCustomerForm from "@/components/customers/CreateCustomerForm";
import { Trash2 } from "lucide-react";
import EditCustomerForm from "@/components/customers/EditCustomerForm";
import { Download } from "lucide-react";
import CustomerFilter from "@/components/customers/CustomerFilter";

type CustomerGroup = "VIP" | "Repeat" | "New" | "Potential";

interface Address {
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export interface Customer {
  id: string;
  squareId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  address?: Address[];
  orderCount?: number;
  occasionsCount?: number;
  spendAmount?: number; 
  group?: CustomerGroup;
  createdAt?: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<CustomerGroup[]>([]);
  const [editingCustomerIds, setEditingCustomerIds] = useState<Set<string>>(new Set());

  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  //Filter customers algorithm to display selected groups
  const groupFiltered = useMemo(() => {
  if (selectedGroups.length === 0) return customers;
  return customers.filter((customer) =>
    selectedGroups.some(
      (group) => group?.toLowerCase() === customer.group?.toLowerCase()
    )
  );
}, [customers, selectedGroups]);
  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customer");
      const data: Customer[] = await res.json();
      setCustomers(data);
      setFilteredCustomers(data);
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


const handleDelete = async (id: string) => {
  const confirmed = confirm("Are you sure you want to delete this customer?");
  if (!confirmed) return;

  try {
    const res = await fetch(`/api/customer`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }), 
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error("Failed to delete customer");
    }

   alert(data.message);
    fetchCustomers();
  } catch (err) {
    console.error(err);
    alert("Error deleting customer.");
  }
};



  return (
    
    <div className="p-6 space-y-6">
      {/* Import From Square Button */}
      <div className="flex justify- gap-4">
      <h1 className="text-2xl font-semibold mr-auto">Customers</h1>
        <button
          onClick={handleImport}
          disabled={loading}
          className="px-4 py-2 rounded border border-gray-600 text-white bg-transparent cursor-pointer flex items-center justify-center gap-2">
          <Download size={20} />
          {loading ? "Importing..." : "Import Customers"}
        </button>

        {/* Add Customer Button */}
        <Dialog>
          <DialogTrigger asChild>
            <button className="px-4 py-2 rounded border border-gray-600 text-black bg-white cursor-pointer flex items-center justify-center gap-2">
              <Plus  /> Add Customer
            </button>
          </DialogTrigger>
          <CreateCustomerForm />
        </Dialog>
      </div>

    <div className="p-6 ">
        <div className="mb-6  ">
          <h1 className="text-2xl font-semibold mb-4">Customers</h1>
          <div className="flex items-center justify-between rounded border border-gray-600 p-4">
             <div className="flex items-center gap-4">
            <CustomerGroupDropdown
              selectedGroups={selectedGroups}
              onSelectionChange={setSelectedGroups}
            />
            <CustomerFilter
                customers={groupFiltered}
                onFiltered={(filtered) => setFilteredCustomers(filtered)}
              />
              </div>  
            <span className="px-4 py-2 text-white bg-transparent">
               {loading
                 ? "Loading..."
                 : `${customers.length} Customer${customers.length === 1 ? "" : "s"}`}
            </span>
          </div> 
        </div>
      </div>


      {customers.length === 0 && !loading && <p>No customers found.</p>}

     
  
     
        {/* Customer Cards */}
      {filteredCustomers.map((customer) => {
        const initials = `${customer.firstName?.[0] ?? ""}${customer.lastName?.[0] ?? ""}`.toUpperCase();

        return (
          <Card key={customer.id} className="w-full p-6 shadow-md">
            <div className="flex items-center gap-3 ">
              {/* LEFT: Profile Icon */}
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-muted/50 border border-gray-400 text-gray-200 flex items-center justify-center text-lg font-bold ">
                {initials || "?"}
              </div>

              {/* CENTER + RIGHT CONTENT */}
              <div className="flex-1 flex justify-between items-start gap-6">
                {/* LEFT SIDE: header + content */}
                <div className="flex-1">
                  <CardHeader>
                    <CardTitle className="w-full flex items-center gap-3 mb-4">
                      {`${customer.firstName} ${customer.lastName}`.trim()}
                      {customer.squareId && (
                        <div className="inline-flex items-center px-2 py-1.5 rounded-md border border-border bg-muted/50 text-muted-foreground text-sm font-medium">
                          Square
                        </div>
                      )}
                    </CardTitle>
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
                        {customer.address && customer.address.length > 0
                          ? customer.address
                              .map((addr) =>
                                [addr.line1, addr.line2, addr.city, addr.state, addr.zip, addr.country]
                                  .filter(Boolean)
                                  .join(" ")
                              )
                              .join(", ")
                          : "-"}
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* RIGHT SIDE: Stats + Buttons */}
                <div className="flex justify-between items-center gap-6 self-stretch">
                  {/* Stats */}
                  <div className="flex justify-between items-center gap-6">
                    {[
                      { label: "Orders", value: customer.orderCount ?? 0 },
                      {
                        label: "Spend",
                        value: new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(customer.spendAmount ?? 0),
                      },
                      { label: "Occasions", value: customer.occasionsCount ?? 0 },
                    ].map((stat, i) => (
                      <div key={i} className="flex flex-col items-center gap-4">
                        <span className="text-lg font-semibold text-white">{stat.value}</span>
                        <span className="text-sm text-gray-400 font-medium">{stat.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        const newSet = new Set(editingCustomerIds);
                        newSet.has(customer.id)
                          ? newSet.delete(customer.id)
                          : newSet.add(customer.id);
                        setEditingCustomerIds(newSet);
                      }}
                      className="p-2 rounded border border-gray-400 hover:bg-blue-200 bg-transparent cursor-pointer"
                      title="Edit Customer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 rounded border border-gray-400 hover:bg-red-200 bg-transparent cursor-pointer"
                      title="Delete Customer"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Inline Edit Form */}
            {editingCustomerIds.has(customer.id) && (
              <div className="mt-4 border-t pt-4">
                <EditCustomerForm
                  customer={customer}
                  onSave={() => {
                    const newSet = new Set(editingCustomerIds);
                    newSet.delete(customer.id);
                    setEditingCustomerIds(newSet);
                    fetchCustomers();
                  }}
                  onCancel={() => {
                    const newSet = new Set(editingCustomerIds);
                    newSet.delete(customer.id);
                    setEditingCustomerIds(newSet);
                  }}
                />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
