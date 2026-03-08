import MetricCard from "@/components/dashboard/MetricCard";
import RecentActivity from "@/components/dashboard/RecentActivity";
import TrendGraph from "@/components/dashboard/TrendGraph";
import InventoryStatus from "@/components/dashboard/InventoryStatus";
import UpcomingEvents from "@/components/dashboard/UpcomingEvents";
import { DollarSign, ShoppingBag, Users, Package } from "lucide-react";
import CustomerOccasions from "@/components/dashboard/CustomerOccasions";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { fetchSquareOrders, fetchSquareCustomerCount } from "@/lib/square";
import db from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  let squareConnected = false;
  let squareData = null;
  let customerData = null;

  if (user) {
    const integration = await db.squareIntegration.findUnique({
      where: { userId: user.id },
    });
    squareConnected = !!integration?.connected;

    if (squareConnected) {
      [squareData, customerData] = await Promise.all([
        fetchSquareOrders(user.id),
        fetchSquareCustomerCount(user.id),
      ]);
    }
  }

  const monthlyRevenue = squareData?.monthlyRevenue ?? [];
  const lastMonth =
    monthlyRevenue.length > 0 ? monthlyRevenue[monthlyRevenue.length - 1] : null;
  const prevMonth =
    monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 2] : null;

  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0);
  const revenueChange =
    prevMonth && lastMonth && prevMonth.revenue > 0
      ? ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue) * 100
      : undefined;

  const totalOrders = squareData?.totalCompletedOrders ?? 0;
  const ordersChange =
    prevMonth && lastMonth && prevMonth.orders > 0
      ? ((lastMonth.orders - prevMonth.orders) / prevMonth.orders) * 100
      : undefined;

  const totalCustomers = customerData?.totalCustomers ?? 0;
  const customersChange =
    customerData && customerData.newLastMonth > 0
      ? ((customerData.newThisMonth - customerData.newLastMonth) /
          customerData.newLastMonth) *
        100
      : undefined;

  const recentOrders = squareData
    ? [...squareData.completedOrders].reverse().slice(0, 10)
    : null;

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 w-full">
        <MetricCard
          title="Total Revenue"
          value={squareData ? formatCurrency(totalRevenue) : "--"}
          changePct={revenueChange}
          icon={DollarSign}
        />
        <MetricCard
          title="Orders"
          value={squareData ? totalOrders : "--"}
          changePct={ordersChange}
          icon={ShoppingBag}
        />
        <MetricCard
          title="Customers"
          value={customerData ? totalCustomers.toLocaleString() : "--"}
          changePct={customersChange}
          icon={Users}
        />
        <MetricCard
          title="Inventory Items"
          value={2_913}
          changePct={-1.7}
          icon={Package}
        />
      </section>

      <div className="w-full flex flex-col xl:flex-row gap-4 min-w-0">
        <TrendGraph monthlyRevenue={squareData ? monthlyRevenue : null} />
        <RecentActivity recentOrders={recentOrders} />
      </div>

      <div className="w-full flex flex-col xl:flex-row gap-4 min-w-0">
        <UpcomingEvents />
        <InventoryStatus />
      </div>

      <CustomerOccasions />
    </main>
  );
}
