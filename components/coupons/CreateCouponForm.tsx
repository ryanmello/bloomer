"use client";

import { useState, useRef } from "react";
import { createCoupon } from "@/actions/getCoupons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function CreateCouponForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCoupon(formData);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Coupon created successfully!" });
      formRef.current?.reset();
    }

    setIsLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Coupon</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="codeName">Coupon Code</Label>
            <Input
              type="text"
              id="codeName"
              name="codeName"
              required
              placeholder="SUMMER2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="e.g. Summer sale for returning customers, 10% off first order"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount">Discount (%)</Label>
            <Input
              type="number"
              id="discount"
              name="discount"
              required
              min="0"
              max="100"
              step="0.01"
              placeholder="10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input
              type="datetime-local"
              id="validUntil"
              name="validUntil"
              required
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-md text-sm ${
                message.type === "error"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-emerald-50 text-emerald-800 border border-emerald-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Creating..." : "Create Coupon"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}