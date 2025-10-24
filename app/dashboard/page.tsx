// app/(app)/dashboard/page.tsx
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";


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
      <DashboardHeader connected={true} lastSyncIso={new Date().toISOString()} />

      {/* Metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={metrics.revenue.value}
          changePct={metrics.revenue.change}
          icon={<DollarSign className="h-5 w-5 text-gray-600" />}
        />
        <MetricCard
          title="Orders"
          value={metrics.orders.value}
          changePct={metrics.orders.change}
          icon={<ShoppingBag className="h-5 w-5 text-gray-600" />}
        />
        <MetricCard
          title="Customers"
          value={metrics.customers.value}
          changePct={metrics.customers.change}
          icon={<Users className="h-5 w-5 text-gray-600" />}
        />
        <MetricCard
          title="Inventory Items"
          value={metrics.inventory.value}
          changePct={metrics.inventory.change}
          icon={<Package className="h-5 w-5 text-gray-600" />}
        />
      </section>

      {/* ...rest of your dashboard sections (tables, charts, etc.) */}
    </main>
  );
}
