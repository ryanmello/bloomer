// app/storefront/page.tsx

// 1. Uncomment this import
import StorefrontTable from '@/components/StoreFront/Storefront';
// import SearchBar from '@/components/storefront/SearchBar';
// import AddProductButton from '@/components/storefront/AddProductButton';
// import UpdateInventoryButton from '@/components/storefront/UpdateInventoryButton';

// This is your static, hardcoded data for testing
const staticProducts = [
  {
    id: '1',
    name: 'Rose Bouquet',
    price: 49.99,
    description: 'A classic bouquet of red roses',
    inventoryCount: 20,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Tulip Arrangement',
    price: 39.99,
    description: 'An arrangement of colorful tulips',
    inventoryCount: 15,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Orchid Plant',
    price: 29.99,
    description: 'A potted orchid plant',
    inventoryCount: 10,
    lastUpdated: new Date().toISOString(),
  },
];

export default function StorefrontPage() {
  return (
    <div className="flex">
      <main className="flex-1 p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Storefront</h1>
          <div className="flex items-center gap-4">
            {/* UN-78: SearchBar will go here */}
            {/* <SearchBar /> */}

            {/* UN-75: AddProductButton will go here */}
            {/* <AddProductButton /> */}
          </div>
        </div>

        {/* UN-76: Storefront Table
          We pass the static data in as a prop
        */}

        <StorefrontTable products={staticProducts} />

        {/* UN-77: UpdateInventoryButton will go here */}
        <div className="mt-4">
          {/* <UpdateInventoryButton /> */}
        </div>
      </main>
    </div>
  );
}