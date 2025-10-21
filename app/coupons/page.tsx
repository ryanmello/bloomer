
import CreateCouponForm from "@/components/coupons/CreateCouponForm";
import CouponList from "@/components/coupons/CouponList";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { getUserCoupons } from "@/actions/getCoupons";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function CouponsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  const result = await getUserCoupons();
  const coupons = result.success ? result.coupons : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">My Coupons</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage discount codes for your customers
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <CreateCouponForm />
        
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">📋 Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Create unique coupon codes for your customers</li>
              <li>• Set discount percentages (0-100%)</li>
              <li>• Choose expiration dates for time-limited offers</li>
              <li>• Manage all your coupons in one place</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Coupons ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <CouponList coupons={coupons} />
        </CardContent>
      </Card>
    </div>
  );
}