import StorefrontTable from '@/components/storefront-temp/Storefront';
import AddProduct from '@/components/storefront-temp/AddProduct';
import ShopSelector from '@/components/shop/ShopSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, AlertCircle, DollarSign, ShoppingBag } from 'lucide-react';
import db from '@/lib/prisma';
import { getCurrentUser } from '@/actions/getCurrentUser';
import { cookies } from 'next/headers';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export interface Product {
  id: string;
  name: string;
  retailPrice: number;
  costPrice: number;
  quantity: number;
  description: string | null;
  category: string;
  updatedAt: string;
  createdAt: string;
}

async function getProducts() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const cookieStore = await cookies();
    const activeShopId = cookieStore.get('activeShopId')?.value;

    let shop;
    if (activeShopId) {
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id
        }
      });
    }

    if (!shop) {
      shop = await db.shop.findFirst({
        where: {
          userId: user.id
        }
      });
    }

    if (!shop) {
      return { products: [], noShop: true };
    }

    const products = await db.product.findMany({
      where: {
        shopId: shop.id
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedProducts = products.map(p => ({
      ...p,
      updatedAt: p.updatedAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
      description: p.description || null,
      category: p.category || "General"
    }));

    return { products: formattedProducts, noShop: false };

  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}

function calculateStats(products: Product[]) {
  const totalProducts = products.length;
  const totalInventory = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + (p.retailPrice * p.quantity), 0);
  const lowStock = products.filter(p => p.quantity < 10 && p.quantity > 0).length;
  const outOfStock = products.filter(p => p.quantity === 0).length;
  return { totalProducts, totalInventory, totalValue, lowStock, outOfStock };
}

export default async function StorefrontPage() {
  const { products, noShop } = await getProducts();
  const stats = calculateStats(products);

  if (noShop) {
    return (
      <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 rounded-xl p-3 bg-muted w-fit">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">No Shop Found</CardTitle>
              <CardDescription>
                You need to create a shop before you can add products to your inventory.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/shop/create">Create Your Shop</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const statCards = [
    {
      title: "Total Products",
      value: stats.totalProducts,
      subtitle: "Active products",
      icon: Package,
    },
    {
      title: "Total Inventory",
      value: stats.totalInventory.toLocaleString(),
      subtitle: "Items in stock",
      icon: TrendingUp,
    },
    {
      title: "Inventory Value",
      value: `$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Total retail value",
      icon: DollarSign,
    },
    {
      title: "Stock Alerts",
      value: stats.lowStock + stats.outOfStock,
      subtitle:
        stats.lowStock === 0 && stats.outOfStock === 0
          ? "All stocked"
          : [
              stats.lowStock > 0 ? `${stats.lowStock} low` : "",
              stats.outOfStock > 0 ? `${stats.outOfStock} out` : "",
            ]
              .filter(Boolean)
              .join(", "),
      icon: AlertCircle,
    },
  ];

  return (
    <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Storefront</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your shop&apos;s products and inventory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ShopSelector />
          <AddProduct />
        </div>
      </div>

      {/* Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 w-full">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-2xl border shadow-sm h-44 p-4 bg-card border-border min-w-0 w-full"
            >
              <div className="flex items-start justify-between">
                <div className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </div>
                <div className="rounded-xl p-2 bg-muted">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                {stat.value}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {stat.subtitle}
              </p>
            </div>
          );
        })}
      </section>

      {/* Low Stock Alert */}
      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/30 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {stats.outOfStock > 0 && (
              <>You have <span className="font-semibold">{stats.outOfStock}</span> product{stats.outOfStock > 1 ? 's' : ''} out of stock. </>
            )}
            {stats.lowStock > 0 && (
              <>You have <span className="font-semibold">{stats.lowStock}</span> product{stats.lowStock > 1 ? 's' : ''} with low inventory. </>
            )}
            Consider restocking soon.
          </p>
        </div>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl p-2 bg-muted">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <CardTitle>Products</CardTitle>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset bg-muted text-muted-foreground ring-border">
                  {products.length}
                </span>
              </div>
              <CardDescription>
                Manage your inventory and track stock levels
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <StorefrontTable products={products} />
        </CardContent>
      </Card>
    </main>
  );
}
