"use client";
import {useEffect, useState, useMemo} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {CustomerGroupDropdown} from "@/components/customers/CustomerGroupDropdown";
import {Dialog, DialogTrigger} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Plus, Search} from "lucide-react";
import CreateCustomerForm from "@/components/customers/CreateCustomerForm";
import {Trash2} from "lucide-react";
import EditCustomerForm from "@/components/customers/EditCustomerForm";
import {Download} from "lucide-react";
import CustomerFilter from "@/components/customers/CustomerFilter";
import {Input} from "@/components/ui/input";

type CustomerGroup = "VIP" | "Repeat" | "New" | "Potential";

interface Address {
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface Order {
  id: string;
  name: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes?: string;
  totalAmount: number;
}

export interface Customer {
  id: string;
  squareId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: Address[];
  orders?: Order[];
  orderCount?: number;
  occasionsCount?: number;
  spendAmount?: number;
  additionalNote?: string;
  group?: CustomerGroup;
  createdAt?: string;

  overallStatus?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<CustomerGroup[]>([]);
  const [editingCustomerIds, setEditingCustomerIds] = useState<Set<string>>(
    new Set()
  );
  const [detailsOpen, setDetailsOpen] = useState<Set<string>>(new Set());
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const groupFiltered = useMemo(() => {
    if (selectedGroups.length === 0) return customers;
    return customers.filter((customer) =>
      selectedGroups.some(
        (group) => group?.toLowerCase() === customer.group?.toLowerCase()
      )
    );
  }, [customers, selectedGroups]);

  // compute overall status
  const getOverallStatus = (customer: Customer): Customer["overallStatus"] => {
    if (!customer.orders || customer.orders.length === 0) return undefined;
    const statuses = customer.orders.map((o) => o.status.toLowerCase());
    if (statuses.includes("pending")) return "PENDING";
    if (statuses.includes("active")) return "ACTIVE";
    if (statuses.includes("cancelled")) return "CANCELLED";
    if (statuses.every((s) => s === "completed")) return "COMPLETED";
    return undefined;
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customer");
      const data: Customer[] = await res.json();

      const withStats = data.map((customer) => {
        const overallStatus = getOverallStatus(customer);

        const orderCount = customer.orders?.length ?? 0;
        const occasionsCount = customer.occasionsCount ?? orderCount;

        // Compute spendAmount excluding cancelled orders
        const spendAmount =
          customer.orders?.reduce((sum, order) => {
            if (order.status === "CANCELLED") return sum;
            return sum + (order.totalAmount ?? 0);
          }, 0) ?? 0;

        return {
          ...customer,
          overallStatus,
          orderCount,
          spendAmount,
          occasionsCount,
        };
      });

      setCustomers(withStats);
      setFilteredCustomers(withStats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this customer?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/customer`, {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("Failed to delete customer");
      alert(data.message);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Error deleting customer.");
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    // Combine group + search filters
    const filtered = groupFiltered.filter((customer) => {
      const fullName =
        `${customer.firstName} ${customer.lastName}`.toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        query === "" ||
        fullName.includes(query) ||
        customer.firstName.toLowerCase().includes(query) ||
        customer.lastName.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phoneNumber.toLowerCase().includes(query);

      return matchesSearch;
    });
    setFilteredCustomers(filtered);
  }, [searchQuery, groupFiltered]);

  return (
    <div className="p-6 space-y-6">
      {/* Header and Import/Add Buttons */}
      <div className="flex justify- gap-4">
        <h1 className="text-2xl font-semibold mr-auto">Customers</h1>
        <Button onClick={handleImport} disabled={loading} className="outline">
          <Download size={20} />
          {loading ? "Importing..." : "Import Customers"}
        </Button>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default">
              <Plus /> Add Customer
            </Button>
          </DialogTrigger>
          <CreateCustomerForm />
        </Dialog>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-card/50 border-border p-4 flex flex-col gap-3">
        <div className="relative w-full">
          <Search className="z-1 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-border/50 bg-muted/50 backdrop-blur-sm focus-visible:ring-ring"
          />
        </div>
        <div className="flex items gap-4">
          <CustomerGroupDropdown
            selectedGroups={selectedGroups}
            onSelectionChange={setSelectedGroups}
          />
          <CustomerFilter
            customers={groupFiltered}
            onFiltered={setFilteredCustomers}
          />
        </div>

        <span className="text-sm text-muted-foreground mb-4">
          {loading
            ? "Loading..."
            : `${customers.length} Customer${
                customers.length === 1 ? "" : "s"
              }`}
        </span>
      </div>

      {customers.length === 0 && !loading && <p>No customers found.</p>}

      {/* Customer Cards */}
      {filteredCustomers.map((customer) => {
        const initials = `${customer.firstName?.[0] ?? ""}${
          customer.lastName?.[0] ?? ""
        }`.toUpperCase();

        const overallStatus = customer.overallStatus;

        return (
          <Card key={customer.id} className="w-full p-6 shadow-md">
            <div className="flex items-center gap-3">
              {/* Profile Icon */}
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-muted/50 border border-gray-400 text-gray-200 flex items-center justify-center text-lg font-bold">
                {initials || "?"}
              </div>

              <div className="flex-1 flex justify-between items-start gap-6">
                {/* LEFT SIDE: Header + Content */}
                <div className="flex-1">
                  <CardHeader>
                    <CardTitle className="w-full flex items-center gap-3 mb-4">
                      {`${customer.firstName} ${customer.lastName}`.trim()}
                      {customer.squareId && (
                        <div className="inline-flex items-center px-2 py-1.5 rounded-md border border-border bg-muted/50 text-muted-foreground text-sm font-medium">
                          Square
                        </div>
                      )}
                      {overallStatus && (
                        <div
                          className={`inline-flex items-center px-2 py-1.5 rounded-md text-white text-sm font-medium ${
                            overallStatus === "COMPLETED"
                              ? "bg-green-600"
                              : overallStatus === "ACTIVE"
                              ? "bg-blue-600"
                              : overallStatus === "PENDING"
                              ? "bg-yellow-500"
                              : "bg-gray-500"
                          }`}>
                          {overallStatus}
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
                              .join(", ")
                          : "-"}
                      </div>
                    </div>
                  </CardContent>
                </div>

                {/* RIGHT SIDE: Stats + Buttons */}
                <div className="flex justify-between items-center gap-6 self-stretch">
                  <div className="flex justify-between items-center gap-6">
                    {[
                      {label: "Orders", value: customer.orderCount ?? 0},
                      {
                        label: "Spend",
                        value: new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(customer.spendAmount ?? 0),
                      },
                      {label: "Occasions", value: customer.occasionsCount ?? 0},
                    ].map((stat, i) => (
                      <div key={i} className="flex flex-col items-center gap-4">
                        <span className="text-lg font-semibold text-white">
                          {stat.value}
                        </span>
                        <span className="text-sm text-gray-400 font-medium">
                          {stat.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => {
                        const newSet = new Set(detailsOpen);
                        newSet.has(customer.id)
                          ? newSet.delete(customer.id)
                          : newSet.add(customer.id);
                        setDetailsOpen(newSet);
                      }}
                      className="p-2 rounded border border-gray-400 hover:bg-gray-200 bg-transparent cursor-pointer">
                      View Details
                    </button>

                    <button
                      onClick={() => {
                        const newSet = new Set(editingCustomerIds);
                        newSet.has(customer.id)
                          ? newSet.delete(customer.id)
                          : newSet.add(customer.id);
                        setEditingCustomerIds(newSet);
                      }}
                      className="p-2 rounded border border-gray-400 hover:bg-blue-200 bg-transparent cursor-pointer">
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="p-2 rounded border border-gray-400 hover:bg-red-200 bg-transparent cursor-pointer">
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* VIEW DETAILS: Notes + Orders */}
            {detailsOpen.has(customer.id) && (
              <div className="mt-4 border-t pt-4 text-sm text-gray-300 space-y-2">
                {customer.additionalNote ? (
                  <div>
                    <strong>Notes:</strong> {customer.additionalNote}
                  </div>
                ) : (
                  <div>No notes available</div>
                )}

                {customer.orders?.length ? (
                  <div>
                    <strong>Orders:</strong>
                    <ul className="mt-1 space-y-2">
                      {customer.orders.map((order) => (
                        <li
                          key={order.id}
                          className="flex flex-col border border-gray-700 rounded-lg p-2">
                          <div className="flex justify-between items-center">
                            <span>Order #{order.id}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                order.status === "COMPLETED"
                                  ? "bg-green-600 text-white"
                                  : order.status === "ACTIVE"
                                  ? "bg-blue-600 text-white"
                                  : order.status === "PENDING"
                                  ? "bg-yellow-500 text-white"
                                  : "bg-gray-500 text-white"
                              }`}>
                              {order.status}
                            </span>
                          </div>
                          {order.notes && (
                            <div className="mt-1 text-sm text-gray-400">
                              <strong>Notes:</strong> {order.notes}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>No orders available</div>
                )}
              </div>
            )}

            {/* EDIT FORM */}
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
