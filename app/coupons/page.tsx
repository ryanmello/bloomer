import CreateCouponForm from "@/components/ui/CreateCouponForm";
import CouponList from "@/components/ui/CouponList";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { getUserCoupons } from "@/actions/getCoupons";
import { redirect } from "next/navigation";

export default async function CouponsPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login"); // Change this to your login route
  }

  const result = await getUserCoupons();
  const coupons = result.success ? result.coupons : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">My Coupons</h1>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <CreateCouponForm />
          
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">📋 Instructions</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Create unique coupon codes for your customers</li>
              <li>• Set discount percentages (0-100%)</li>
              <li>• Choose expiration dates for time-limited offers</li>
              <li>• Manage all your coupons in one place</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Your Coupons ({coupons.length})</h2>
          <CouponList coupons={coupons} />
        </div>
      </div>
    </div>
  );
}