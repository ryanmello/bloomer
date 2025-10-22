import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
};

export default function InventoryStatus() {
  const inventoryItems: InventoryItem[] = [
    {
      id: '1',
      name: 'Red Roses',
      quantity: 245,
      unit: 'stems',
      lowStockThreshold: 50,
      status: 'in-stock',
    },
    {
      id: '2',
      name: 'White Lilies',
      quantity: 82,
      unit: 'stems',
      lowStockThreshold: 40,
      status: 'in-stock',
    },
    {
      id: '3',
      name: 'Yellow Tulips',
      quantity: 18,
      unit: 'stems',
      lowStockThreshold: 30,
      status: 'low-stock',
    },
    {
      id: '4',
      name: 'Sunflowers',
      quantity: 156,
      unit: 'stems',
      lowStockThreshold: 40,
      status: 'in-stock',
    },
    {
      id: '5',
      name: 'Baby\'s Breath',
      quantity: 0,
      unit: 'bunches',
      lowStockThreshold: 20,
      status: 'out-of-stock',
    },
    {
      id: '6',
      name: 'Carnations (Pink)',
      quantity: 203,
      unit: 'stems',
      lowStockThreshold: 60,
      status: 'in-stock',
    },
    {
      id: '7',
      name: 'Orchids (Purple)',
      quantity: 12,
      unit: 'plants',
      lowStockThreshold: 15,
      status: 'low-stock',
    },
    {
      id: '8',
      name: 'Eucalyptus',
      quantity: 45,
      unit: 'bunches',
      lowStockThreshold: 25,
      status: 'in-stock',
    },
  ];

  const getStatusIcon = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock':
        return <CheckCircle className="h-4 w-4" />;
      case 'low-stock':
        return <AlertCircle className="h-4 w-4" />;
      case 'out-of-stock':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700';
      case 'low-stock':
        return 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700';
      case 'out-of-stock':
        return 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-700';
    }
  };

  const getStatusText = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in-stock':
        return 'In Stock';
      case 'low-stock':
        return 'Low Stock';
      case 'out-of-stock':
        return 'Out of Stock';
    }
  };

  return (
    <div className='w-full lg:w-1/2 rounded-2xl border shadow-sm p-6 bg-card border-border h-[550px] flex flex-col'>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Inventory Status</h3>
        <p className="text-sm text-muted-foreground mt-1">Current stock levels</p>
      </div>
      
      <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin">
        {inventoryItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.quantity} {item.unit}
              </p>
            </div>
            <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(item.status)}`}>
              {getStatusIcon(item.status)}
              {getStatusText(item.status)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
