import React from 'react';
import { ShoppingBag, Link as LinkIcon } from 'lucide-react';
import type { SquareOrder } from '@/lib/square';

type Props = {
  recentOrders?: SquareOrder[] | null;
  defaultCurrency?: string;
};

function formatRelativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60_000));
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

export default function RecentActivity({ recentOrders, defaultCurrency = "USD" }: Props) {
  const hasData = recentOrders && recentOrders.length > 0;

  if (!hasData) {
    return (
      <div className='w-full xl:w-1/3 rounded-2xl border shadow-sm p-6 bg-card border-border min-w-0'>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          <p className="text-sm text-muted-foreground mt-1">Latest updates from your store</p>
        </div>
        <div className="flex flex-col items-center justify-center text-center h-64">
          <LinkIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No recent orders</p>
          <p className="text-xs text-muted-foreground mt-1">
            Connect your Square account to see recent activity
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full xl:w-1/3 rounded-2xl border shadow-sm p-6 bg-card border-border min-w-0'>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <p className="text-sm text-muted-foreground mt-1">Latest updates from your store</p>
      </div>
      
      <div className="space-y-4 overflow-y-auto max-h-80 pr-2 scrollbar-thin">
        {recentOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
          >
            <div className="rounded-lg p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Order #{order.id.slice(-6)}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {order.total_money
                  ? formatCurrency(order.total_money.amount, defaultCurrency || order.total_money.currency)
                  : 'No total'}
                {' '}&middot; {order.state}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(order.created_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
