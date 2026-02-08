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
import { toast } from "sonner";
import {Select, SelectTrigger, SelectValue, SelectContent, SelectItem} from "@/components/ui/select";

// Defines the shape of an audience object and its properties for TypeScript type checking
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
  {value: "equals", label: "Equals"},
  {value: "greaterThan", label: "Greater Than"},
  {value: "lessThan", label: "Less Than"},
  {value: "contains", label: "Contains"},
  {value: "between", label: "Between"},
];

// Operator mapping per field
const fieldOperators: Record<string, string[]> = {
  name: ["equals","contains"],
  description: ["equals","contains"],
  customerCount: ["equals","greaterThan","lessThan","between"],
  campaignsSent: ["equals","greaterThan","lessThan","between"],
  growthRate: ["equals","greaterThan","lessThan","between"],
  engagementRate: ["equals","greaterThan","lessThan","between"],
  lastCampaign: ["equals","contains"],
  customerField: ["equals","contains"],
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

  // TODO: change to real metrics
  const metrics = {
    totalCustomers: {value: "1,842", change: 8.3},
    activeAudiences: {value: 12, change: 20.0},
    totalCampaigns: {value: 47, change: 15.5},
    avgGrowthRate: {value: "12.4%", change: 3.2},
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

          if (selectedOperator === "equals") matchesField = valStr === value;
          else if (selectedOperator === "contains") matchesField = valStr.includes(value);
          else if (selectedOperator === "greaterThan") matchesField = Number(fieldVal) > Number(filterValue);
          else if (selectedOperator === "lessThan") matchesField = Number(fieldVal) < Number(filterValue);
          else if (selectedOperator === "between") {
            const min = Number(filterValue);
            const max = Number(filterValueMax);
            matchesField = Number(fieldVal) >= min && Number(fieldVal) <= max;
          }
        }
      }
    }

    return matchesFilter && matchesSearch && matchesField;
  });

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
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
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
                  onChange={(e) => setFilterValue(e.target.value)}
                  className="h-11 w-1/2 sm:w-16 rounded-xl border-border/50 bg-muted/50 focus-visible:ring-ring"
                />
                <Input
                  placeholder="Max"
                  value={filterValueMax}
                  onChange={(e) => setFilterValueMax(e.target.value)}
                  className="h-11 w-1/2 sm:w-16 rounded-xl border-border/50 bg-muted/50 focus-visible:ring-ring"
                />
              </div>
            ) : (
              <Input
                placeholder="Enter filter value"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="h-11 w-full sm:w-32 rounded-xl border-border/50 bg-muted/50 focus-visible:ring-ring"
              />
            )}
          </div>

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
              <AudienceCard key={audience.id} {...audience} />
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
