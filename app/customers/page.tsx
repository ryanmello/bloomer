"use client";
import {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {CustomerGroupDropdown} from "../../components/customers/CustomerGroupDropdown";
import CreateCustomerForm from "@/components/customers/CreateCustomerForm";
import {Button} from "@/components/ui/button";
import {Plus} from "lucide-react";
import {Dialog, DialogTrigger} from "@/components/ui/dialog";

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
  orderCount?: number;
  occasionsCount?: number;
  spendAmount?: number; 
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<CustomerGroup[]>([]);

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

  return (
    <div className="p-6 space-y-6">
      {/* Import From Square Button */}
      <div className="flex justify-end">
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

      {customers.length === 0 && !loading && <p>No customers found.</p>}

      {/* Customer Cards */}
      {customers.map((customer) => (
        <Card key={customer.id} className="w-full p-6 shadow-md">
          <CardHeader>
            <CardTitle className ="flex justify-between items-center w-full pr-9">
              {`${customer.firstName} ${customer.lastName}`.trim()}
          
               <div className="flex gap-17 text-lg font-semibold text-white">
                <span>{customer.orderCount ?? 0}</span>
                <span> {new Intl.NumberFormat("en-US", {
                       style: "currency",
                       currency: "USD",
                       }).format(customer.spendAmount ?? 0)}</span>
                <span>{customer.occasionsCount ?? 0}</span>
               </div>
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
              
             <div className="flex gap-10 text-gray-400 text-sm md:text-base font-semibold ml-auto">
              <div>Orders</div>
              <div>Spend</div>
             <div>Occasions</div>
            </div>

            </div>
          </CardContent>
         </Card>
        
      ))}

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-4">Customers</h1>
          <div className="flex items-center justify-between rounded border border-gray-600 p-4">
            <CustomerGroupDropdown
              selectedGroups={selectedGroups}
              onSelectionChange={setSelectedGroups}
            />
            <span className="px-4 py-2 text-white bg-transparent">
               {loading
                 ? "Loading..."
                 : `${customers.length} Customer${customers.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
