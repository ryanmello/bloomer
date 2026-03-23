"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShoppingBag,
  UserPlus,
  AlertTriangle,
  Package,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import type { ActivityItem } from "@/app/api/dashboard/activity/route";

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60_000));
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const config = {
    order: {
      Icon: ShoppingBag,
      className: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    },
    customer: {
      Icon: UserPlus,
      className: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
    },
    low_stock: {
      Icon: AlertTriangle,
      className: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    },
    inventory_adjustment: {
      Icon: Package,
      className: "bg-slate-50 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400",
    },
  };
  const { Icon, className } = config[type];
  return (
    <div className={`rounded-lg p-2 ${className}`}>
      <Icon className="h-4 w-4" />
    </div>
  );
}

function ActivityContent({ item }: { item: ActivityItem }) {
  switch (item.type) {
    case "order":
      return (
        <>
          <p className="text-sm font-medium text-foreground truncate">
            Order #{item.id.slice(-6)}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {item.data.totalAmount != null
              ? formatCurrency(
                  item.data.totalAmount,
                  item.data.currency ?? "USD"
                )
              : "No total"}
            {" · "}
            {item.data.status}
            {item.data.customerName ? ` · ${item.data.customerName}` : ""}
          </p>
        </>
      );
    case "customer":
      return (
        <>
          <p className="text-sm font-medium text-foreground truncate">
            New customer
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {item.data.name}
            {item.data.email ? ` · ${item.data.email}` : ""}
          </p>
        </>
      );
    case "low_stock":
      return (
        <>
          <p className="text-sm font-medium text-foreground truncate">
            Low stock
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {item.data.productName} · {item.data.quantity} left (threshold:{" "}
            {item.data.threshold})
          </p>
        </>
      );
    case "inventory_adjustment":
      return (
        <>
          <p className="text-sm font-medium text-foreground truncate">
            Inventory {item.data.type}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {item.data.productName} · {item.data.quantity > 0 ? "+" : ""}
            {item.data.quantity}
            {item.data.reason ? ` · ${item.data.reason}` : ""}
          </p>
        </>
      );
  }
}

type ApiResponse = {
  items: ActivityItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export default function RecentActivity() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (cursor?: string | null) => {
    const url = new URL("/api/dashboard/activity", window.location.origin);
    url.searchParams.set("limit", "10");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error("Failed to load activity");
    }
    const data: ApiResponse = await res.json();
    return data;
  }, []);

  useEffect(() => {
    loadPage()
      .then((data) => {
        setItems(data.items);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [loadPage]);

  const loadMore = () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    loadPage(nextCursor)
      .then((data) => {
        setItems((prev) => [...prev, ...data.items]);
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      })
      .finally(() => setLoading(false));
  };

  const hasData = items.length > 0;

  if (loading && items.length === 0) {
    return (
      <div className="w-full xl:w-1/3 rounded-2xl border shadow-sm p-6 bg-card border-border min-w-0">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Latest updates from your store
          </p>
        </div>
        <div className="flex flex-col items-center justify-center text-center h-64">
          <Loader2 className="h-10 w-10 text-muted-foreground/40 mb-3 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading activity...
          </p>
        </div>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="w-full xl:w-1/3 rounded-2xl border shadow-sm p-6 bg-card border-border min-w-0">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Latest updates from your store
          </p>
        </div>
        <div className="flex flex-col items-center justify-center text-center h-64">
          <AlertTriangle className="h-10 w-10 text-destructive/60 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="w-full xl:w-1/3 rounded-2xl border shadow-sm p-6 bg-card border-border min-w-0">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Latest updates from your store
          </p>
        </div>
        <div className="flex flex-col items-center justify-center text-center h-64">
          <LinkIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No recent activity
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Orders, customers, inventory updates, and low stock alerts will appear
            here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full xl:w-1/3 rounded-2xl border shadow-sm p-6 bg-card border-border min-w-0">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Latest updates from your store
        </p>
      </div>

      <div className="space-y-4 overflow-y-auto max-h-80 pr-2 scrollbar-thin">
        {items.map((item) => (
          <div
            key={`${item.type}-${item.id}`}
            className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
          >
            <ActivityIcon type={item.type} />
            <div className="flex-1 min-w-0">
              <ActivityContent item={item} />
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(item.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="mt-4 w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
          ) : (
            "Load more"
          )}
        </button>
    )}
    </div>
  );
}
