import MetricCard from "@/components/dashboard/MetricCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import TrendGraph from "@/components/dashboard/TrendGraph";
import InventoryStatus from "@/components/dashboard/InventoryStatus";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import CustomerOccasions from "@/components/dashboard/CustomerOccasions";
import { getProductsForDashboard, getStockStatus } from "@/lib/inventory";

// Force dynamic rendering - fetch fresh data on each request
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { products: inventoryProducts, noShop } =
    await getProductsForDashboard();

  const totalInventory = inventoryProducts.reduce(
    (sum, p) => sum + p.quantity,
    0
  );
  const lowStockCount = inventoryProducts.filter(
    (p) => getStockStatus(p.quantity, p.lowInventoryAlert) === "low-stock"
  ).length;
  const outOfStockCount = inventoryProducts.filter(
    (p) => getStockStatus(p.quantity, p.lowInventoryAlert) === "out-of-stock"
  ).length;

  const metrics = {
    revenue: { value: "$42,380", change: 12.5 },
    orders: { value: 318, change: 4.2 },
    customers: { value: 1_842, change: 8.3 },
    inventory: {
      value: noShop ? 0 : inventoryProducts.length,
      change: undefined,
      alertCount: lowStockCount + outOfStockCount,
    },
  };

  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top header with Square status + Sync All / Configure */}
      {/* <DashboardHeader
        connected={true}
        lastSyncIso={new Date().toISOString()}
      /> */}

      {/* Metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 w-full">
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
          value={String(metrics.inventory.value)}
          changePct={
            metrics.inventory.alertCount > 0 ? -1 : undefined
          }
          changeLabel={
            metrics.inventory.alertCount > 0
              ? `${metrics.inventory.alertCount} need attention`
              : undefined
          }
          caption="from last month"
          icon={Package}
        />
      </section>
      <div className="w-full flex flex-col xl:flex-row gap-4 min-w-0">
        <TrendGraph />
        <RecentActivity />
      </div>

      <div className="w-full flex flex-col xl:flex-row gap-4 min-w-0">
        <UpcomingEvents />
        <InventoryStatus products={inventoryProducts} />
      </div>

      <CustomerOccasions />

      {/* ...rest of your dashboard sections (tables, charts, etc.) */}
    </main>
  );
}
