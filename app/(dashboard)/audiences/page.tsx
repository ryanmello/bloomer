"use client";

import MetricCard from "@/components/dashboard/MetricCard";
import AudienceCard from "@/components/audiences/AudienceCard";
import {Users, Target, Send, TrendingUp, Search, Plus} from "lucide-react";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {useEffect, useState} from "react";
import {Card, CardTitle, CardDescription} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import { Trash2 } from "lucide-react";
import {toast} from "sonner";
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


type Audiences = {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "draft";
  type: "custom" | "predefined";
  customerCount?: number;  
  campaignsSent?: number;   
  growthRate?: number;  
};

export default function Audiences() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [audiences, setAudiences] = useState<Audiences[]>([]);
  const [loading, setLoading] = useState(false);

  const [deleteMode, setDeleteMode] = useState(false); 
  const [selectedIds, setSelectedIds] = useState<string[]>([]); 
  
  const [exportOpen, setExportOpen] = useState(false);
  const [exportSummary, setExportSummary] = useState(true);
  const [exportCustomers, setExportCustomers] = useState(false);
  const [exportAudiences, setExportAudiences] = useState(true);

  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");

  // TODO: change to real metrics
  const metrics = {
    totalCustomers: {value: "1,842", change: 8.3},
    activeAudiences: {value: 12, change: 20.0},
    totalCampaigns: {value: 47, change: 15.5},
    avgGrowthRate: {value: "12.4%", change: 3.2},
  };

  /*
  const audiences = [
    {
      id: "new-customers",
      name: "New Customers",
      description:
        "Customers who made their first purchase in the last 30 days",
      customerCount: 287,
      campaignsSent: 8,
      growthRate: 24.5,
      lastCampaign: "2 days ago",
      status: "active" as const,
      engagementRate: 68.3,
      type: "predefined" as const,
    },
    {
      id: "high-spenders",
      name: "High Spenders",
      description:
        "Top 20% of customers by lifetime value and purchase frequency",
      customerCount: 156,
      campaignsSent: 15,
      growthRate: 12.8,
      lastCampaign: "5 days ago",
      status: "active" as const,
      engagementRate: 82.4,
      type: "predefined" as const,
    },
    {
      id: "inactive-customers",
      name: "Inactive Customers",
      description:
        "Haven't made a purchase in the last 90 days - win them back!",
      customerCount: 423,
      campaignsSent: 6,
      growthRate: -8.2,
      lastCampaign: "1 week ago",
      status: "inactive" as const,
      engagementRate: 34.2,
      type: "custom" as const,
    },
    {
      id: "birthday-club",
      name: "Birthday Club",
      description:
        "Customers with birthdays in the next 30 days for special offers",
      customerCount: 94,
      campaignsSent: 3,
      growthRate: 5.6,
      lastCampaign: "3 days ago",
      status: "active" as const,
      engagementRate: 91.5,
      type: "custom" as const,
    },
  ];
  */

  // get audiences from database
  const fetchAudiencesCard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audience");
      const data: Audiences[] = await res.json();
      if (res.ok) {
        setAudiences(data);
      }
    } catch (error) {
      console.error("Audiences load failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudiencesCard();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  // Filter audiences based on selected filter and search query
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

    return matchesFilter && matchesSearch;
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
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ids: selectedIds}),
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
  // If nothing is selected, alert the user
  if (!exportSummary && !exportAudiences && !exportCustomers) {
    toast("Please select at least one option to export.");
    return;
  }

  // Prepare audience rows only if exportAudiences is true
  const audienceRows = exportAudiences
    ? filteredAudiences.map(aud => ({
        Name: aud.name,
        Description: aud.description ?? "-",
        Status: aud.status ?? "-",
        Type: aud.type ?? "-",
        Customers: aud.customerCount ?? 0,
        Campaigns: aud.campaignsSent ?? 0,
        Growth: aud.growthRate ?? 0,
      }))
    : [];

  // Prepare summary rows
  const summaryRows = exportSummary
    ? [
        ["Summary Metrics"],
        ["Total Customers", metrics.totalCustomers.value],
        ["Active Audiences", metrics.activeAudiences.value],
        ["Total Campaigns", metrics.totalCampaigns.value],
        ["Average Growth Rate", metrics.avgGrowthRate.value],
        [], // blank row
      ]
    : [];

  // ---------- Export CSV ----------
  if (exportFormat === "csv") {
    let csvContent = "";

    // Add summary first
    summaryRows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    // Add audience table only if there is data
    if (audienceRows.length > 0) {
      // Header
      csvContent += Object.keys(audienceRows[0]).join(",") + "\n";
      // Rows
      audienceRows.forEach(row => {
        csvContent += Object.values(row).join(",") + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audiences_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---------- Export PDF ----------
  else if (exportFormat === "pdf") {
    const doc = new jsPDF();
    let startY = 15;

    // Add summary metrics first
    if (exportSummary) {
      doc.setFontSize(12);
      summaryRows.forEach(row => {
        doc.text(row.join(": "), 14, startY);
        startY += 7;
      });
      startY += 5;
    }

    // Add audience table only if there is data
    if (exportAudiences && audienceRows.length > 0) {
      autoTable(doc, {
        startY,
        head: [["Name", "Description", "Status", "Type", "Customers", "Campaigns", "Growth %"]],
        body: audienceRows.map(r => [
          r.Name, r.Description, r.Status, r.Type, r.Customers, r.Campaigns, r.Growth
        ]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 160, 133] },
        margin: { left: 14, right: 14 },
      });
    }

    doc.save("audiences_export.pdf");
  }

  // Close the export dialog
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

             {/* Summary */}
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

             {/* Customers */}
             <label className="flex items-start gap-2">
               <input
                 type="checkbox"
                 checked={exportCustomers}
                 onChange={(e) => setExportCustomers(e.target.checked)}
               />
               <div>
                 <p className="font-medium">Customers</p>
                 <p className="text-sm text-muted-foreground">
                   Export customers in selected audiences (large file)
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
