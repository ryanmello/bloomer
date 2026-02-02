import StorefrontTable from '@/components/StoreFront/Storefront';
import AddProduct from '@/components/StoreFront/AddProduct';
import ShopSelector from '@/components/shop/ShopSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import db from '@/lib/prisma';
import { getCurrentUser } from '@/actions/getCurrentUser';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';


// Define the Product type based on your schema
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

// Fetch products from our API route
async function getProducts() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get active shop from cookie
    const cookieStore = await cookies();
    const activeShopId = cookieStore.get('activeShopId')?.value;

    let shop;
    if (activeShopId) {
      // Try to get the active shop
      shop = await db.shop.findFirst({
        where: {
          id: activeShopId,
          userId: user.id  // Security: ensure shop belongs to user
        }
      });
    }

    // Fallback to first shop if no active shop or shop not found
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

    // Get products for this specific shop only
    const products = await db.product.findMany({
      where: {
        shopId: shop.id
      },
      orderBy: { createdAt: 'desc' },
    });

    // Format products to match the expected interface
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

// Update calculateStats function
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

  // If user has no shop yet
  if (noShop) {
    return (
      <div className="flex min-h-screen">
        <main className="flex-1 p-6">
          <Card className="max-w-2xl mx-auto mt-12">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">No Shop Found</CardTitle>
              <CardDescription>
                You need to create a shop before you can add products to your inventory.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <a
                href="/shop/create"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              >
                Create Your Shop
              </a>
            </CardContent>
          </Card>
        </main>
      </div >
    );
  }

  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Storefront</h1>
            <p className="text-muted-foreground">
              Manage your shop&apos;s products and inventory
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ShopSelector />
            <AddProduct />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Active products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInventory}</div>
              <p className="text-xs text-muted-foreground">Items in stock</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Total value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStock + stats.outOfStock}</div>
              <p className="text-xs text-muted-foreground">
                {stats.lowStock > 0 && `${stats.lowStock} low`}
                {stats.lowStock > 0 && stats.outOfStock > 0 && ', '}
                {stats.outOfStock > 0 && `${stats.outOfStock} out`}
                {stats.lowStock === 0 && stats.outOfStock === 0 && 'All stocked'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {(stats.lowStock > 0 || stats.outOfStock > 0) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {stats.outOfStock > 0 && (
                <>You have {stats.outOfStock} product{stats.outOfStock > 1 ? 's' : ''} out of stock. </>
              )}
              {stats.lowStock > 0 && (
                <>You have {stats.lowStock} product{stats.lowStock > 1 ? 's' : ''} with low inventory. </>
              )}
              Consider restocking soon.
            </AlertDescription>
          </Alert>
        )}

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage your inventory and track stock levels
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <StorefrontTable products={products} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}