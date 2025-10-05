"use client";

import MetricCard from "@/components/dashboard/MetricCard";
import AudienceCard from "@/components/audiences/AudienceCard";
import { Users, Target, Send, TrendingUp, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Audiences() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const metrics = {
    totalCustomers: { value: "1,842", change: 8.3 },
    activeAudiences: { value: 12, change: 20.0 },
    totalCampaigns: { value: 47, change: 15.5 },
    avgGrowthRate: { value: "12.4%", change: 3.2 },
  };

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

  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
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
            className="w-full sm:w-auto"
          >
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger
                value="all"
                className="text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="inactive"
                className="text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                Inactive
              </TabsTrigger>
              <TabsTrigger
                value="custom"
                className="text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                Custom
              </TabsTrigger>
              <TabsTrigger
                value="predefined"
                className="text-xs sm:text-sm flex-1 sm:flex-initial"
              >
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
