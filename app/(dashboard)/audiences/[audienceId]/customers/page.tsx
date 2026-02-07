"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {Card} from "@/components/ui/card";
import {CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {ArrowLeft, Plus, UserMinus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Search} from "lucide-react";

type Audience = {
  id: string;
  name: string;
  description?: string | null;
  type: "custom" | "predefined";
  status: "active" | "inactive" | "draft";
};

type Address = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
};

type Customer = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  squareId?: string | null;
  address?: Address[] | null;
  addresses?: Address[] | null;
  overallStatus?: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
};

export default function AudienceCustomersPage({
  params,
}: {
  params: Promise<{audienceId: string}>;
}) {
  const router = useRouter();
  const [audience, setAudience] = useState<Audience | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [addingCustomers, setAddingCustomers] = useState(false);

  const [resolvedAudienceId, setResolvedAudienceId] = useState<string | null>(
    null,
  );

  const isCustomAudience = audience?.type === "custom";
  const customerIdsInAudience = new Set(customers.map((c) => c.id));

  const getAddresses = (c: Customer) => c.addresses ?? c.address ?? [];

  const fetchAudiencesData = async () => {
    try {
      setLoading(true);
      const {audienceId: id} = await params;
      setResolvedAudienceId(id);

      const cusRes = await fetch(`/api/audience/${id}/customers`);
      const cusData = await cusRes.json();

      if (!cusRes.ok) {
        toast.error("Audience not found");
        router.push("/audiences");
        return;
      }

      setCustomers(cusData);

      const audRes = await fetch(`/api/audience/${id}`);
      const audData = await audRes.json();

      if (!audRes.ok) {
        toast.error("Audience not found");
        router.push("/audiences");
        return;
      }

      setAudience(audData);
    } catch (error) {
      console.error("Audiences customers data load failed", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCustomers = async () => {
    try {
      const res = await fetch("/api/customer");
      const data: Customer[] = await res.json();
      setAllCustomers(data);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed to fetch all customers", err);
      toast.error("Failed to load customers");
    }
  };

  useEffect(() => {
    fetchAudiencesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  useEffect(() => {
    if (addDialogOpen) {
      fetchAllCustomers();
    }
  }, [addDialogOpen]);

  const handleAddCustomers = async () => {
    if (!resolvedAudienceId || selectedIds.size === 0) return;
    setAddingCustomers(true);
    try {
      const res = await fetch(`/api/audience/${resolvedAudienceId}/customers`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({customerIds: Array.from(selectedIds)}),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? "Failed to add customers");
        return;
      }
      toast.success(`Added ${data.added ?? selectedIds.size} customer(s)`);
      setAddDialogOpen(false);
      setSelectedIds(new Set());
      fetchAudiencesData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add customers");
    } finally {
      setAddingCustomers(false);
    }
  };

  const handleRemoveCustomer = async (customerId: string) => {
    if (!resolvedAudienceId) return;
    try {
      const res = await fetch(
        `/api/audience/${resolvedAudienceId}/customers?customerId=${customerId}`,
        {method: "DELETE"},
      );
      if (!res.ok) {
        toast.error("Failed to remove customer");
        return;
      }
      toast.success("Customer removed from audience");
      fetchAudiencesData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove customer");
    }
  };

  const toggleSelect = (id: string) => {
    if (customerIdsInAudience.has(id)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredAllCustomers = allCustomers.filter((c) => {
    const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
    const query = addSearch.toLowerCase();
    if (!query) return true;
    return (
      fullName.includes(query) ||
      (c.email ?? "").toLowerCase().includes(query) ||
      (c.phoneNumber ?? "").toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const filteredCustomers = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
    const email = (c.email ?? "").toLowerCase();
    const phone = (c.phoneNumber ?? "").toLowerCase();

    return fullName.includes(q) || email.includes(q) || phone.includes(q);
  });

  return (
    <main className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/audiences")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {audience?.name ?? "Audience"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {audience?.description
                ? audience.description
                : `${filteredCustomers.length} Customer${filteredCustomers.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>

        {isCustomAudience && (
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add from all customers
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add customers to audience</DialogTitle>
                <DialogDescription>
                  Select customers from your all customers list to add to this
                  audience.
                </DialogDescription>
              </DialogHeader>
              <div className="relative flex-1 min-h-0 flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex-1 overflow-y-auto border rounded-lg p-2 space-y-2 min-h-[200px]">
                  {filteredAllCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No customers found.
                    </p>
                  ) : (
                    filteredAllCustomers.map((c) => {
                      const inAudience = customerIdsInAudience.has(c.id);
                      const selected = selectedIds.has(c.id);
                      const fullName =
                        `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() ||
                        "(No name)";
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            inAudience
                              ? "opacity-50 cursor-not-allowed bg-muted/30"
                              : selected
                                ? "bg-primary/10"
                                : "hover:bg-muted/50"
                          }`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={inAudience}
                            onChange={() => toggleSelect(c.id)}
                            className="h-4 w-4 rounded border-input"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{fullName}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {c.email ?? "-"}
                            </p>
                          </div>
                          {inAudience && (
                            <span className="text-xs text-muted-foreground">
                              Already in audience
                            </span>
                          )}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCustomers}
                  disabled={selectedIds.size === 0 || addingCustomers}>
                  {addingCustomers
                    ? "Adding..."
                    : `Add ${selectedIds.size} customer${selectedIds.size === 1 ? "" : "s"}`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search bar */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers in this audience..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {!loading && customers.length === 0 && (
        <p className="text-sm text-muted-foreground">No customers found.</p>
      )}

      {/* Customer Cards */}
      <div className="space-y-4">
        {filteredCustomers.map((customer) => {
          const initials =
            `${customer.firstName?.[0] ?? ""}${customer.lastName?.[0] ?? ""}`.toUpperCase();
          const fullName =
            `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();
          const overallStatus = customer.overallStatus;
          const addresses = getAddresses(customer);

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
                    <CardHeader className="p-0">
                      <CardTitle className="w-full flex items-center gap-3 mb-4">
                        {fullName || "(No name)"}

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

                    <CardContent className="p-0">
                      <div className="flex flex-wrap gap-6 text-gray-300 text-sm md:text-base">
                        <div className="min-w-[150px]">
                          <strong>Email:</strong> {customer.email || "-"}
                        </div>

                        <div className="min-w-[150px]">
                          <strong>Phone:</strong> {customer.phoneNumber || "-"}
                        </div>

                        <div className="min-w-[150px]">
                          <strong>Addresses:</strong>{" "}
                          {addresses.length > 0
                            ? addresses
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
                                    .join(" "),
                                )
                                .join(", ")
                            : "-"}
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {isCustomAudience && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveCustomer(customer.id)}>
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
