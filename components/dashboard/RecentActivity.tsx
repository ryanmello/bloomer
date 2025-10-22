import React from 'react';
import { ShoppingBag, User, Package, TrendingUp } from 'lucide-react';

type Activity = {
  id: string;
  type: 'order' | 'customer' | 'inventory' | 'sale';
  title: string;
  description: string;
  time: string;
  icon: any;
};

export default function RecentActivity() {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'order',
      title: 'New Order #1847',
      description: '12 Red Roses, Wedding Bouquet',
      time: '2 min ago',
      icon: ShoppingBag,
    },
    {
      id: '2',
      type: 'customer',
      title: 'New Customer',
      description: 'Sarah Mitchell signed up',
      time: '15 min ago',
      icon: User,
    },
    {
      id: '3',
      type: 'order',
      title: 'New Order #1846',
      description: 'Sympathy Arrangement - Lilies',
      time: '32 min ago',
      icon: ShoppingBag,
    },
    {
      id: '4',
      type: 'inventory',
      title: 'Low Stock Alert',
      description: 'Tulips (Yellow) - 15 remaining',
      time: '1 hour ago',
      icon: Package,
    },
    {
      id: '5',
      type: 'sale',
      title: 'Best Seller',
      description: 'Spring Garden Mix - 8 sold today',
      time: '2 hours ago',
      icon: TrendingUp,
    },
    {
      id: '6',
      type: 'order',
      title: 'New Order #1845',
      description: 'Birthday Bouquet - Sunflowers',
      time: '3 hours ago',
      icon: ShoppingBag,
    },
  ];

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'order':
        return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      case 'customer':
        return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'inventory':
        return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
      case 'sale':
        return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className='w-full lg:w-1/3 rounded-2xl border shadow-sm p-6 bg-card border-border'>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <p className="text-sm text-muted-foreground mt-1">Latest updates from your store</p>
      </div>
      
      <div className="space-y-4 overflow-y-auto max-h-80 pr-2 scrollbar-thin">
        {activities.map((activity) => {
          const IconComponent = activity.icon;
          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0"
            >
              <div className={`rounded-lg p-2 ${getActivityColor(activity.type)}`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.title}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
