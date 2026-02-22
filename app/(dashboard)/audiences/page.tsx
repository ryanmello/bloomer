"use client";

import MetricCard from "@/components/dashboard/MetricCard";
import AudienceCard from "@/components/audiences/AudienceCard";
import { Users, Target, Send, TrendingUp, Search, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type AudienceData = {
  id: string;
  name: string;
  description: string;
  customerCount?: number;
  campaignsSent?: number;
  growthRate?: number;
  lastCampaign?: string;
  status: "active" | "inactive" | "draft";
  engagementRate?: number;
  type: "custom" | "predefined";
  field?: string;
  customerIds: string[];
  customers?: CustomerData[];
};

type CustomerData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  additionalNote?: string;
  orderCount?: number;
  spendAmount?: number;
  occasionsCount?: number;
  addresses?: AddressData[];
};

type AddressData = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

// Available fields for filtering
const audienceFields = [
  { value: "name", label: "Name" },
  { value: "description", label: "Description" },
  { value: "customerCount", label: "Customer Count" },
  { value: "campaignsSent", label: "Campaigns Sent" },
  { value: "growthRate", label: "Growth Rate" },
  { value: "engagementRate", label: "Engagement Rate" },
  { value: "lastCampaign", label: "Last Campaign" },
  { value: "customerField", label: "Customer Field" }, // NEW
];

// Full operator set
const operators = [
  { value: "equals", label: "Equals" },
  { value: "greaterThan", label: "Greater Than" },
  { value: "lessThan", label: "Less Than" },
  { value: "contains", label: "Contains" },
  { value: "between", label: "Between" },
];

// Operator mapping per field
const fieldOperators: Record<string, string[]> = {
  name: ["equals", "contains"],
  description: ["equals", "contains"],
  customerCount: ["equals", "greaterThan", "lessThan", "between"],
  campaignsSent: ["equals", "greaterThan", "lessThan", "between"],
  growthRate: ["equals", "greaterThan", "lessThan", "between"],
  engagementRate: ["equals", "greaterThan", "lessThan", "between"],
  lastCampaign: ["equals", "contains"],
  customerField: ["equals", "contains"],
};

export default function Audiences() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [audiences, setAudiences] = useState<AudienceData[]>([]);
  const [loading, setLoading] = useState(true);

  // Field + operator + value for filtering
  const [selectedField, setSelectedField] = useState("name");
  const [selectedOperator, setSelectedOperator] = useState("equals");
  const [filterValue, setFilterValue] = useState("");
  const [filterValueMax, setFilterValueMax] = useState(""); // For "between" upper bound
  const [filterError, setFilterError] = useState("");

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportSummary, setExportSummary] = useState(true);
  const [exportCustomers, setExportCustomers] = useState(false);
  const [exportAudiences, setExportAudiences] = useState(true);

  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");

  // TODO: change to real metrics
  const metrics = {
    totalCustomers: { value: "1,842", change: 8.3 },
    activeAudiences: { value: 12, change: 20.0 },
    totalCampaigns: { value: 47, change: 15.5 },
    avgGrowthRate: { value: "12.4%", change: 3.2 },
  };

  // Loads audience data from the API when the page mounts
  useEffect(() => {
    const fetchAudiences = async () => {
      try {
        const res = await fetch("/api/audience");
        if (!res.ok) throw new Error("Failed to fetch audiences");
        const data: AudienceData[] = await res.json();
        setAudiences(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load audiences");
      } finally {
        setLoading(false);
      }
    };

    fetchAudiences();
  }, []);

  if (loading) {
    return <p className="text-center mt-20 text-muted-foreground">Loading audiences...</p>;
  }

  // get audiences from database
  const fetchAudiencesCard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audience");
      const data: AudienceData[] = await res.json();
      if (res.ok) {
        setAudiences(data);
      }
    } catch (error) {
      console.error("Audiences load failed", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter audiences based on selected filter, search query, and operator
  const filteredAudiences = audiences.filter((audience) => {
    // Filter by selected tab
    let matchesFilter = true;
    if (selectedFilter === "active")
      matchesFilter = audience.status === "active";
    else if (selectedFilter === "inactive")
      matchesFilter = audience.status === "inactive";
    else if (selectedFilter === "custom")
      matchesFilter = audience.type === "custom";
    else if (selectedFilter === "predefined")
      matchesFilter = audience.type === "predefined";

    // Filter by search query
    const matchesSearch =
      searchQuery === "" ||
      audience.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audience.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Field + operator + value filter
    let matchesField = true;
    if (filterValue !== "") {
      if (selectedField === "customerField") {
        // Match against the audience.field property
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
        matchesField = normalize(audience.field ?? "") === normalize(filterValue);
      } else {
        const fieldVal = (audience as any)[selectedField];
        if (fieldVal !== undefined) {
          const valStr = String(fieldVal).toLowerCase();
          const value = filterValue.toLowerCase();

          // Guardrails
          const numericFields = ["customerCount", "campaignsSent"];
          const percentFields = ["growthRate", "engagementRate"];

          if (numericFields.includes(selectedField)) {
            if (!/^\d*$/.test(filterValue)) matchesField = false;
            else if (selectedOperator === "equals") matchesField = Number(fieldVal) === Number(filterValue);
            else if (selectedOperator === "greaterThan") matchesField = Number(fieldVal) > Number(filterValue);
            else if (selectedOperator === "lessThan") matchesField = Number(fieldVal) < Number(filterValue);
            else if (selectedOperator === "between") {
              const min = Number(filterValue);
              const max = Number(filterValueMax);
              matchesField = Number(fieldVal) >= min && Number(fieldVal) <= max;
            }
          } else if (percentFields.includes(selectedField)) {
            const cleanVal = filterValue.replace("%", "");
            const cleanValMax = filterValueMax.replace("%", "");
            if (!/^\d*\.?\d*$/.test(cleanVal)) matchesField = false;
            else if (selectedOperator === "equals") matchesField = Number(fieldVal) === Number(cleanVal);
            else if (selectedOperator === "greaterThan") matchesField = Number(fieldVal) > Number(cleanVal);
            else if (selectedOperator === "lessThan") matchesField = Number(fieldVal) < Number(cleanVal);
            else if (selectedOperator === "between") {
              const min = Number(cleanVal);
              const max = Number(cleanValMax);
              matchesField = Number(fieldVal) >= min && Number(fieldVal) <= max;
            }
          } else {
            // Text fields
            if (selectedOperator === "equals") matchesField = valStr === value;
            else if (selectedOperator === "contains") matchesField = valStr.includes(value);
          }
        }
      }
    }

    return matchesFilter && matchesSearch && matchesField;
  });

  const toggleDeleteMode = () => {
    setDeleteMode(!deleteMode);
    setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      const res = await fetch("/api/audience", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to delete audiences");
        return;
      }

      toast.success(
        selectedIds.length === 1
          ? "Audience deleted successfully!"
          : `${selectedIds.length} audiences deleted successfully!`
      );

      fetchAudiencesCard();
      setSelectedIds([]);
      setDeleteMode(false);
    } catch (err) {
      console.error("Bulk delete error", err);
    }
  };

  const allSelected =
    filteredAudiences.length > 0 &&
    selectedIds.length === filteredAudiences.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAudiences.map((aud) => aud.id));
    }
  };


  const handleExport = () => {
    // Ensure at least one option is selected
    if (!exportSummary && !exportAudiences && !exportCustomers) {
      toast("Please select at least one option to export.");
      return;
    }


    const audienceRows = exportAudiences
      ? filteredAudiences.map(aud => ({
        Audience: aud.name,
        Description: aud.description ?? "-",
        Status: aud.status ?? "-",
        Type: aud.type ?? "-",
        Customers: aud.customerCount ?? "-",
        Campaigns: aud.campaignsSent ?? "-",
        Growth: aud.growthRate ?? "-",
      }))
      : [];

    const customerRows = exportCustomers
      ? filteredAudiences.flatMap(aud =>
        (aud.customers || []).map(cust => ({
          Audience: aud.name,
          "Customer Name": `${cust.firstName} ${cust.lastName}`,
          Email: cust.email,
          Phone: cust.phoneNumber ?? "-",
          Orders: cust.orderCount ?? "-",
          Spend: cust.spendAmount ?? "-",
          Occasions: cust.occasionsCount ?? "-",
          Address: cust.addresses
            ?.map(a => `${a.line1}${a.line2 ? ", " + a.line2 : ""}, ${a.city}, ${a.state} ${a.zip}, ${a.country}`).join(" | ") ?? "-",
        }))
      )
      : [];

    const summaryRows = exportSummary
      ? [
        ["Summary Metrics"],
        ["Total Customers", metrics.totalCustomers.value],
        ["Active Audiences", metrics.activeAudiences.value],
        ["Total Campaigns", metrics.totalCampaigns.value],
        ["Average Growth Rate", metrics.avgGrowthRate.value],
        [],
      ]
      : [];

    // Export CSV 
    if (exportFormat === "csv") {
      let csvContent = "";

      // Summary
      summaryRows.forEach(row => {
        csvContent += row.join(",") + "\n";
      });

      // Audience table
      if (audienceRows.length > 0) {
        csvContent += Object.keys(audienceRows[0]).join(",") + "\n";
        audienceRows.forEach(row => {
          csvContent += Object.values(row).join(",") + "\n";
        });
        csvContent += "\n";
      }

      // Customer table
      if (customerRows.length > 0) {
        csvContent += Object.keys(customerRows[0]).join(",") + "\n";
        customerRows.forEach(row => {
          csvContent += Object.values(row).join(",") + "\n";
        });
      }

      // Trigger download
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audiences_export.csv";
      a.click();
      URL.revokeObjectURL(url);
    }

    // Export PDF 
    else if (exportFormat === "pdf") {
      const doc = new jsPDF();
      let startY = 15;

      // Summary
      if (exportSummary) {
        doc.setFontSize(12);
        summaryRows.forEach(row => {
          doc.text(row.join(": "), 14, startY);
          startY += 7;
        });
        startY += 5;
      }

      // Audience table
      if (exportAudiences && audienceRows.length > 0) {
        autoTable(doc, {
          startY,
          head: [["Audience", "Description", "Status", "Type", "Customers", "Campaigns", "Growth %"]],
          body: audienceRows.map(r => [
            r.Audience, r.Description, r.Status, r.Type, r.Customers, r.Campaigns, r.Growth
          ]),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [255, 0, 0] },
          margin: { left: 14, right: 14 },
        });

        startY = (doc as any).lastAutoTable?.finalY ?? startY + 10;
      }

      // Customer table
      if (exportCustomers && customerRows.length > 0) {
        startY += 5;
        autoTable(doc, {
          startY,
          head: [["Audience", "Customer Name", "Email", "Phone", "Orders", "Spend", "Occasions", "Address"]],
          body: customerRows.map(r => [
            r.Audience, r["Customer Name"], r.Email, r.Phone, r.Orders, r.Spend, r.Occasions, r.Address
          ]),
          styles: { fontSize: 10 },
          headStyles: { fillColor: [255, 0, 0] },
          margin: { left: 14, right: 14 },
        });
      }

      doc.save("audiences_export.pdf");
    }


    setExportOpen(false);
  };


  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top Panel */}
      <Card className="flex flex-row justify-between items-center p-6 bg-card">
        <div className="flex-1">
          <CardTitle className="text-2xl font-bold">Audiences</CardTitle>
          <CardDescription>
            Create and manage customer segments for targeted marketing and
            automation
          </CardDescription>
        </div>

        <Button
          variant={deleteMode ? "destructive" : "outline"}
          onClick={toggleDeleteMode}
          className="flex items-center gap-2"
        >
          {deleteMode ? "Cancel Selection" : "Select to Delete"}
        </Button>

        {deleteMode && filteredAudiences.length > 0 && (
          <Button
            variant="outline"
            onClick={toggleSelectAll}
            className="flex items-center gap-2"
          >
            {allSelected ? "Deselect All" : "Select All"}
          </Button>
        )}

        {deleteMode && selectedIds.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedIds.length})
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete audiences?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">
                    {selectedIds.length}
                  </span> {" "}
                  selected audiences? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete Audiences
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}


        <Button
          variant="outline"
          onClick={() => setExportOpen(true)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </Button>

        <AlertDialog open={exportOpen} onOpenChange={setExportOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Export Audiences</AlertDialogTitle>
              <AlertDialogDescription>
                Choose what data you want to export.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4 py-2">

              <label className="flex items-start gap-2">
                <input type="checkbox"
                  checked={exportAudiences}
                  onChange={(e) => setExportAudiences(e.target.checked)}
                />
                <div>
                  <p className="font-medium">Audiences</p>
                  <p className="text-sm text-muted-foreground">
                    Name, status, type, customer counts
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={exportSummary}
                  onChange={(e) => setExportSummary(e.target.checked)}
                />
                <div>
                  <p className="font-medium">Summary metrics</p>
                  <p className="text-sm text-muted-foreground">
                    Total customers, active audiences, campaigns
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={exportCustomers}
                  onChange={(e) => setExportCustomers(e.target.checked)}
                />
                <div>
                  <p className="font-medium">Customers</p>
                  <p className="text-sm text-muted-foreground">
                    Export customers in selected audiences (may be a large file)
                  </p>
                </div>
              </label>
            </div>

            <div className="space-y-2 py-2 pl-[14ch]">
              <p className="font-medium">Export format:</p>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="exportFormat"
                  value="csv"
                  checked={exportFormat === "csv"}
                  onChange={() => setExportFormat("csv")}
                />
                CSV
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="exportFormat"
                  value="pdf"
                  checked={exportFormat === "pdf"}
                  onChange={() => setExportFormat("pdf")}
                />
                PDF
              </label>
            </div>


            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button onClick={handleExport} variant="default">
                Export
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>



        <Button variant="default" onClick={() => router.push("/audiences/new")}>
          <Plus /> Add Audience
        </Button>
      </Card>

      {/* Metric cards */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 w-full">
        <MetricCard
          title="Total Customers"
          value={metrics.totalCustomers.value}
          changePct={metrics.totalCustomers.change}
          icon={Users}
        />
        <MetricCard
          title="Active Audiences"
          value={metrics.activeAudiences.value}
          changePct={metrics.activeAudiences.change}
          icon={Target}
        />
        <MetricCard
          title="Total Campaigns"
          value={metrics.totalCampaigns.value}
          changePct={metrics.totalCampaigns.change}
          icon={Send}
        />
        <MetricCard
          title="Average Growth Rate"
          value={metrics.avgGrowthRate.value}
          changePct={metrics.avgGrowthRate.change}
          icon={TrendingUp}
        />
      </section>

      {/* Audience Cards */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* Filter Tabs - Left */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <Tabs
              value={selectedFilter}
              onValueChange={setSelectedFilter}
              className="w-full sm:w-auto">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger
                  value="all"
                  className="text-xs sm:text-sm flex-1 sm:flex-initial">
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="text-xs sm:text-sm flex-1 sm:flex-initial">
                  Active
                </TabsTrigger>
                <TabsTrigger
                  value="inactive"
                  className="text-xs sm:text-sm flex-1 sm:flex-initial">
                  Inactive
                </TabsTrigger>
                <TabsTrigger
                  value="custom"
                  className="text-xs sm:text-sm flex-1 sm:flex-initial">
                  Custom
                </TabsTrigger>
                <TabsTrigger
                  value="predefined"
                  className="text-xs sm:text-sm flex-1 sm:flex-initial">
                  Predefined
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Field dropdown */}
            <Select value={selectedField} onValueChange={(val) => {
              setSelectedField(val);
              setFilterError(""); // clear error when field changes
              setFilterValue("");
              setFilterValueMax("");
              // Update operator if current operator not allowed
              const allowedOps = fieldOperators[val];
              if (!allowedOps.includes(selectedOperator)) {
                setSelectedOperator(allowedOps[0]);
              }
            }}>
              <SelectTrigger className="h-11 w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {audienceFields.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Operator Dropdown */}
            <Select value={selectedOperator} onValueChange={(val) => {
              setSelectedOperator(val);
              setFilterError(""); // clear error when operator changes
            }}>
              <SelectTrigger className="h-11 w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators
                  .filter(op => fieldOperators[selectedField].includes(op.value))
                  .map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Filter Value Input*/}
            {selectedOperator === "between" ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Min"
                  value={filterValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    const numericFields = ["customerCount", "campaignsSent"];
                    const percentFields = ["growthRate", "engagementRate"];
                    if (numericFields.includes(selectedField) && !/^\d*$/.test(val)) return;
                    if (percentFields.includes(selectedField) && !/^\d*\.?\d*%?$/.test(val)) return;
                    setFilterValue(val);
                  }}
                  className="h-11 w-1/2 sm:w-16 rounded-xl border-border/50 bg-muted/50 focus-visible:ring-ring"
                />
                <Input
                  placeholder="Max"
                  value={filterValueMax}
                  onChange={(e) => {
                    const val = e.target.value;
                    const numericFields = ["customerCount", "campaignsSent"];
                    const percentFields = ["growthRate", "engagementRate"];
                    if (numericFields.includes(selectedField) && !/^\d*$/.test(val)) return;
                    if (percentFields.includes(selectedField) && !/^\d*\.?\d*%?$/.test(val)) return;
                    setFilterValueMax(val);
                  }}
                  className="h-11 w-1/2 sm:w-16 rounded-xl border-border/50 bg-muted/50 focus-visible:ring-ring"
                />
              </div>
            ) : (
              <div className="relative w-full sm:w-auto">
                <Input
                  placeholder="Enter filter value"
                  value={filterValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    const numericFields = ["customerCount", "campaignsSent"];
                    const percentFields = ["growthRate", "engagementRate"];

                    setFilterError("");

                    if (numericFields.includes(selectedField) && !/^\d*$/.test(val)) {
                      setFilterError("Numbers only allowed");
                      return;
                    }

                    if (percentFields.includes(selectedField) && !/^\d*\.?\d*%?$/.test(val)) {
                      setFilterError("Invalid percentage format");
                      return;
                    }

                    setFilterValue(val);
                  }}
                  className={`h-11 w-full sm:w-32 rounded-xl border-border/50 bg-muted/50 focus-visible:ring-ring ${filterError ? "border-red-500 text-red-500" : ""
                    }`}
                />

                {/* This formats the input field and error message correctly, horizontally and vertically */}
                {filterError && (
                  <p className="absolute left-0 top-full mt-1 text-xs text-red-500 whitespace-nowrap">
                    {filterError}
                  </p>
                )}
              </div>
            )}
            {/* Search Bar - Right */}
            <div className="relative w-full sm:w-80">
              <Search className="z-1 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search audiences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl border-border/50 bg-muted/50 backdrop-blur-sm focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredAudiences.length}{" "}
          {filteredAudiences.length === 1 ? "audience" : "audiences"}
        </p>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-4">
          {filteredAudiences.length > 0 ? (
            filteredAudiences.map((audience) => (
              <AudienceCard key={audience.id} {...audience}
                selectable={deleteMode}
                selected={selectedIds.includes(audience.id)}
                onSelect={() => toggleSelect(audience.id)}
              />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No audiences found
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                There are no {selectedFilter === "all" ? "" : selectedFilter}{" "}
                audiences to display. Try adjusting your filter.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
