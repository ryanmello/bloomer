"use client";

import {use, useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {Card} from "@/components/ui/card";
import {CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {ArrowLeft} from "lucide-react";
import {Button} from "@/components/ui/button";

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

  // get audiences from database
  const fetchAudiencesData = async () => {
    try {
      setLoading(true);
      const {audienceId} = await params;
      const cusRes = await fetch(`/api/audience/${audienceId}/customers`);
      const cusData = await cusRes.json();

      if (!cusRes.ok) {
        toast.error("Audience not found");
        router.push("/audiences");
        return;
      }

      setCustomers(cusData);

      const audRes = await fetch(`/api/audience/${audienceId}`);
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

  useEffect(() => {
    fetchAudiencesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // grab from custom page
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
                : `${customers.length} Customer${customers.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
      </div>

      {!loading && customers.length === 0 && (
        <p className="text-sm text-muted-foreground">No customers found.</p>
      )}

      {/* Customer Cards */}
      <div className="space-y-4">
        {customers.map((customer) => {
          const initials =
            `${customer.firstName?.[0] ?? ""}${customer.lastName?.[0] ?? ""}`.toUpperCase();
          const fullName =
            `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim();

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
                                    .join(" "),
                                )
                                .join(", ")
                            : "-"}
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
