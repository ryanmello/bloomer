import CreateCouponForm from "@/components/coupons/CreateCouponForm";
import CouponList from "@/components/coupons/CouponList";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { getUserCoupons } from "@/actions/getCoupons";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Info, CheckCircle2 } from "lucide-react";

export default async function CouponsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const result = await getUserCoupons();
  const coupons = result.success ? result.coupons : [];

  const tips = [
    "Create unique coupon codes for your customers",
    "Add a description to track what each coupon is for",
    "Set discount percentages between 0\u2013100%",
    "Choose expiration dates for time-limited offers",
    "Manage and delete coupons from the list below",
  ];

  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coupons</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create and manage discount codes for your customers
        </p>
      </div>

      {/* Create Form + Quick Guide */}
      <div className="w-full flex flex-col lg:flex-row gap-4 min-w-0">
        <div className="flex-1 min-w-0">
          <CreateCouponForm />
        </div>

        <Card className="flex-1 min-w-0 bg-blue-50/50 border-blue-200/50 dark:bg-blue-950/20 dark:border-blue-800/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-2 bg-blue-100 dark:bg-blue-900/30">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Quick Guide</CardTitle>
                <CardDescription>
                  How to create and manage coupons
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-muted">
              <Tag className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-3">
              <CardTitle>Your Coupons</CardTitle>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-muted text-muted-foreground ring-border">
                {coupons.length}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CouponList coupons={coupons} />
        </CardContent>
      </Card>
    </main>
  );
}
