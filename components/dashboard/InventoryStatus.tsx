import { AlertCircle, CheckCircle, XCircle } from "lucide-react";
import {
  getStockStatus,
  type InventoryProduct,
  type StockStatus,
} from "@/lib/inventory";

interface InventoryStatusProps {
  products: InventoryProduct[];
}

export default function InventoryStatus({ products }: InventoryStatusProps) {
  const getStatusIcon = (status: StockStatus) => {
    switch (status) {
      case "in-stock":
        return <CheckCircle className="h-4 w-4" />;
      case "low-stock":
        return <AlertCircle className="h-4 w-4" />;
      case "out-of-stock":
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: StockStatus) => {
    switch (status) {
      case "in-stock":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700";
      case "low-stock":
        return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700";
      case "out-of-stock":
        return "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-700";
    }
  };

  const getStatusText = (status: StockStatus) => {
    switch (status) {
      case "in-stock":
        return "In Stock";
      case "low-stock":
        return "Low Stock";
      case "out-of-stock":
        return "Out of Stock";
    }
  };

  return (
    <div className="w-full xl:w-1/2 rounded-2xl border shadow-sm p-6 bg-card border-border h-[550px] flex flex-col min-w-0">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Inventory Status
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Current stock levels
        </p>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-2 scrollbar-thin">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No inventory items yet. Add products in the Storefront to see stock
            status here.
          </p>
        ) : (
          products.map((item) => {
            const status = getStockStatus(
              item.quantity,
              item.lowInventoryAlert
            );
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.quantity} units
                    {item.lowInventoryAlert > 0 && (
                      <span className="ml-1">
                        (threshold: {item.lowInventoryAlert})
                      </span>
                    )}
                  </p>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(status)}`}
                >
                  {getStatusIcon(status)}
                  {getStatusText(status)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
