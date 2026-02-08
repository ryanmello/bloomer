"use client";

import { useState } from "react";
import { deleteCoupon } from "@/actions/getCoupons";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
      <div className="text-center py-12 text-muted-foreground">
        No coupons yet. Create your first one above!
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {coupons.map((coupon) => {
        const isExpired = new Date(coupon.validUntil) < new Date();
        
        return (
          <Card key={coupon.id} className={isExpired ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle>{coupon.codeName}</CardTitle>
                    {isExpired ? (
                      <Badge variant="danger">Expired</Badge>
                    ) : (
                      <Badge variant="success">Active</Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {coupon.discount}% off
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(coupon.id)}
                  disabled={isDeleting === coupon.id}
                >
                  {isDeleting === coupon.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {coupon.description && (
                <p className="text-sm text-muted-foreground mb-3 pb-3 border-b">
                  {coupon.description}
                </p>
              )}
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Valid until: {new Date(coupon.validUntil).toLocaleString()}
                </p>
                <p>
                  Created: {new Date(coupon.createdAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}