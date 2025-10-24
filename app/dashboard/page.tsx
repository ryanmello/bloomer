import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import TrendGraph from "@/components/dashboard/TrendGraph";
import { DollarSign, ShoppingBag, Users, Package, User } from "lucide-react";

export default async function DashboardPage() {
  const metrics = {
    revenue: { value: "$42,380", change: 12.5 },
    orders: { value: 318, change: 4.2 },
    customers: { value: 1_842, change: 8.3 },
    inventory: { value: 2_913, change: -1.7 },
  };

  return (
    <main className="space-y-6">
      {/* Top header with Square status + Sync All / Configure */}
      <DashboardHeader
        connected={true}
        lastSyncIso={new Date().toISOString()}
      />

      {/* Metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={metrics.revenue.value}
          changePct={metrics.revenue.change}
          icon={DollarSign}
        />
        <MetricCard
          title="Orders"
          value={metrics.orders.value}
          changePct={metrics.orders.change}
          icon={ShoppingBag}
        />
        <MetricCard
          title="Customers"
          value={metrics.customers.value}
          changePct={metrics.customers.change}
          icon={Users}
        />
        <MetricCard
          title="Inventory Items"
          value={metrics.inventory.value}
          changePct={metrics.inventory.change}
          icon={Package}
        />
      </section>
      <div className="w-full flex gap-4">
        <TrendGraph />
        <RecentActivity />
      </div>

      {/* ...rest of your dashboard sections (tables, charts, etc.) */}
    </main>
  );
}
