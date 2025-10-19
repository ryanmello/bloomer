"use client";

import { useState } from "react";
import { deleteCoupon } from "@/actions/getCoupons";
import { useRouter } from "next/navigation";

type Coupon = {
  id: string;
  codeName: string;
  discount: number;
  validUntil: Date;
  createdAt: Date;
};

export default function CouponList({ coupons }: { coupons: Coupon[] }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    setIsDeleting(id);
    const result = await deleteCoupon(id);

    if (result.error) {
      alert(result.error);
    } else {
      router.refresh();
    }
    setIsDeleting(null);
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No coupons yet. Create your first one above!
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {coupons.map((coupon) => {
        const isExpired = new Date(coupon.validUntil) < new Date();
        
        return (
          <div
            key={coupon.id}
            className={`border rounded-lg p-4 ${
              isExpired ? "bg-gray-50 opacity-60" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{coupon.codeName}</h3>
                  {isExpired && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Expired
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-xl font-semibold mt-1">
                  {coupon.discount}% off
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Valid until: {new Date(coupon.validUntil).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Created: {new Date(coupon.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(coupon.id)}
                  disabled={isDeleting === coupon.id}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting === coupon.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}