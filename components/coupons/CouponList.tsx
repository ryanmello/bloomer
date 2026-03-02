"use client";

import { useState } from "react";
import { deleteCoupon } from "@/actions/getCoupons";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

type Coupon = {
  id: string;
  codeName: string;
  description: string | null;
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
      <div className="text-center py-12">
        <p className="text-muted-foreground">No coupons yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first one using the form above.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Table Header */}
      <div className="hidden sm:grid grid-cols-[1.5fr_1fr_1fr_1.5fr_48px] bg-muted/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <div>Code</div>
        <div>Discount</div>
        <div>Status</div>
        <div>Expires</div>
        <div></div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-border">
        {coupons.map((coupon) => {
          const isExpired = new Date(coupon.validUntil) < new Date();

          return (
            <div
              key={coupon.id}
              className={`grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_1.5fr_48px] px-4 py-3 items-center gap-2 sm:gap-0 hover:bg-muted/30 transition-colors ${
                isExpired ? "opacity-60" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{coupon.codeName}</p>
                {coupon.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {coupon.description}
                  </p>
                )}
              </div>

              <div>
                <span className="text-sm font-semibold tabular-nums">
                  {coupon.discount}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">off</span>
              </div>

              <div>
                {isExpired ? (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-700">
                    Expired
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700">
                    Active
                  </span>
                )}
              </div>

              <div className="text-sm text-muted-foreground truncate">
                {new Date(coupon.validUntil).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(coupon.id)}
                disabled={isDeleting === coupon.id}
                className="p-2 w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-destructive hover:text-destructive-foreground"
                title="Delete coupon"
              >
                {isDeleting === coupon.id ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
