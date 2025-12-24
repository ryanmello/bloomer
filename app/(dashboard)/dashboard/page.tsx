import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MetricCard from "@/components/dashboard/MetricCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import TrendGraph from "@/components/dashboard/TrendGraph";
import InventoryStatus from "@/components/dashboard/InventoryStatus";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import CustomerOccasions from "@/components/dashboard/CustomerOccasions";
import axios from "axios";

async function fetchSquareOrders() {
  try {
    const res = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/square/orders`);
    return res.data;
  } catch (error) {
    console.error("Error fetching Square orders:", error);
    return null;
  }
}

export default async function DashboardPage() {
  // Fetch Square orders and monthly revenue
  const squareData = await fetchSquareOrders();

  // Log detailed order information to console
  if (squareData) {
    console.log("\n========================================");
    console.log("=== DASHBOARD: SQUARE DATA RECEIVED ===");
    console.log("========================================\n");
    
    console.log("Summary:");
    console.log(`  Total raw orders: ${squareData.totalOrders}`);
    console.log(`  Total completed orders: ${squareData.totalCompletedOrders}`);
    console.log(`  Skipped orders: ${squareData.skippedOrders?.length || 0}`);
    
    if (squareData.monthlyRevenue?.length > 0) {
      console.log("\n=== Monthly Revenue (Past Year) ===");
      squareData.monthlyRevenue.forEach(
        (m: { month: string; year: number; revenue: number; orders: number }) => {
          console.log(`  ${m.month} ${m.year}: $${m.revenue.toFixed(2)} (${m.orders} orders)`);
        }
      );
    } else {
      console.log("\nNo monthly revenue data (no completed orders found)");
    }

    if (squareData.completedOrders?.length > 0) {
      console.log("\n=== COMPLETED ORDER DETAILS ===");
      squareData.completedOrders.forEach(
        (order: { id: string; created_at: string; state: string; total_money?: { amount: number; currency: string } }) => {
          console.log(`\nOrder ID: ${order.id}`);
          console.log(`  Created: ${order.created_at}`);
          console.log(`  State: ${order.state}`);
          console.log(`  Amount: $${(order.total_money?.amount || 0) / 100}`);
          console.log(`  Currency: ${order.total_money?.currency || "N/A"}`);
        }
      );
    }

    if (squareData.skippedOrders?.length > 0) {
      console.log("\n=== SKIPPED ORDERS (NOT COUNTED) ===");
      squareData.skippedOrders.forEach(
        (item: { order: { id: string; created_at: string; state: string; total_money?: { amount: number } }; reason: string }) => {
          console.log(`\nOrder ID: ${item.order.id}`);
          console.log(`  Reason: ${item.reason}`);
          console.log(`  Created: ${item.order.created_at}`);
          console.log(`  Amount: $${(item.order.total_money?.amount || 0) / 100}`);
        }
      );
    }

    console.log("\n========================================");
    console.log("=== END DASHBOARD SQUARE DATA ===");
    console.log("========================================\n");
  } else {
    console.log("No Square data received!");
  }

  const metrics = {
    revenue: { value: "$42,380", change: 12.5 },
    orders: { value: 318, change: 4.2 },
    customers: { value: 1_842, change: 8.3 },
    inventory: { value: 2_913, change: -1.7 },
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
          value={metrics.inventory.value}
          changePct={metrics.inventory.change}
          icon={Package}
        />
      </section>
      <div className="w-full flex flex-col xl:flex-row gap-4 min-w-0">
        <TrendGraph />
        <RecentActivity />
      </div>

      <div className="w-full flex flex-col xl:flex-row gap-4 min-w-0">
        <UpcomingEvents />
        <InventoryStatus />
      </div>

      <CustomerOccasions />

      {/* ...rest of your dashboard sections (tables, charts, etc.) */}
    </main>
  );
}
