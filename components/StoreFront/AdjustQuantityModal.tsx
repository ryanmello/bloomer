"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AdjustQuantityModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function AdjustQuantityModal({
  product,
  onClose,
}: AdjustQuantityModalProps) {
  const [delta, setDelta] = useState("");
  const [type, setType] = useState<string>("adjustment");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isOpen = !!product;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const d = parseInt(delta, 10);
    if (isNaN(d) || d === 0) {
      toast.error("Enter a non-zero quantity change");
      return;
    }

    const newQty = product.quantity + d;
    if (newQty < 0) {
      toast.error(`Cannot reduce below 0. Current: ${product.quantity}`);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}/adjust`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          delta: d,
          type,
          reason: reason || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust inventory");
      }

      if (data.lowStockAlert) {
        toast.warning(
          `${product.name} is now low on stock (${data.movement.newInventory} units)`
        );
      }
      if (data.outOfStockAlert) {
        toast.error(`${product.name} is now out of stock`);
      }
      if (!data.lowStockAlert && !data.outOfStockAlert) {
        toast.success("Inventory updated");
      }

      setDelta("");
      setReason("");
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to adjust");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Inventory: {product?.name}</DialogTitle>
          <DialogDescription>
            Current quantity: {product?.quantity} units. Enter a positive number
            to add stock, negative to remove.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delta">Quantity change</Label>
              <Input
                id="delta"
                type="number"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
                placeholder="e.g., 10 or -5"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="sale">Sale</SelectItem>
                  <SelectItem value="waste">Waste</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Damaged, Restock, Customer order"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Apply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
