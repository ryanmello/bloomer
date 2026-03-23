"use client";

import {useState, useMemo, useEffect} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {Search, Plus, Filter, X, Loader2} from "lucide-react";
import {motion} from "framer-motion";
import axios from "axios";
import {toast} from "sonner";

type DisplayOrderStatus = "Completed" | "Pending" | "Shipped" | "Cancelled";
type OrderStatus = DisplayOrderStatus | "All";

interface Order {
  id: string;
  customer: string;
  date: string;
  total: string;
  status: DisplayOrderStatus;

  customerData?: {
    email?: string;
    phoneNumber?: string;
  };

  orderItems?: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: string;
    subPrice: string;
    currentStock: number;
    availableQty: number;
    neededQty: number;
  }[];
}

type CustomerOption = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  retailPrice: number;
  quantity: number;
  isActive: boolean;
  category?: string;
};

type OrderItem = {
  productId: string;
  name: string;
  retailPrice: number;
  quantity: number;
  availableQty: number;
  neededQty: number;
};

function mapSquareState(state: string): OrderStatus {
  switch (state) {
    case "COMPLETED":
      return "Completed";
    case "OPEN":
      return "Pending";
    case "CANCELED":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function mapDbStatus(status: string): Exclude<OrderStatus, "All"> {
  switch (status) {
    case "COMPLETED":
      return "Completed";
    case "PENDING":
      return "Pending";
    case "SHIPPED":
      return "Shipped";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function mapDisplayStatusToDb(
  status: DisplayOrderStatus,
): "PENDING" | "COMPLETED" | "SHIPPED" | "CANCELLED" {
  switch (status) {
    case "Completed":
      return "COMPLETED";
    case "Pending":
      return "PENDING";
    case "Shipped":
      return "SHIPPED";
    case "Cancelled":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(amountCents?: number, currency?: string): string {
  const dollars = (amountCents || 0) / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: currency || "USD",
  });
}

export default function OrdersPage() {
  // order
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus>("All");
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [deletingOrder, setDeletingOrder] = useState(false);

  // new order
  const [isNewOrderDialogOpen, setIsNewOrderDialogOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [newOrderTotalAmount, setNewOrderTotalAmount] = useState("");

  // new order customer
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [newOrderCustomerId, setNewOrderCustomerId] = useState("walk-in");
  const [customerSearch, setCustomerSearch] = useState("");

  // new order product
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);

  // update order
  const [newOrderStatus, setNewOrderStatus] = useState("PENDING");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const prefRes = await axios.get("/api/user/preferences");
        const preferredCurrency = prefRes.data?.defaultCurrency || "USD";

        setDefaultCurrency(preferredCurrency);
        await fetchOrders(preferredCurrency);
      } catch (error) {
        console.error("Failed to fetch user preferences:", error);
        setDefaultCurrency("USD");
        await fetchOrders("USD");
      }
    };

    loadData();
    fetchCustomers();
  }, []);

  const fetchOrders = async (currency: string) => {
    try {
      const [squareRes, localRes] = await Promise.allSettled([
        axios.get("/api/square/orders"),
        axios.get("/api/orders"),
      ]);

      let squareOrders: Order[] = [];
      let localOrders: Order[] = [];

      if (squareRes.status === "fulfilled") {
        const data = squareRes.value.data;

        squareOrders = Array.isArray(data.orders)
          ? data.orders.map((o: any) => ({
              id: o.id,
              customer: o.customer_id || "Walk-in",
              date: formatDate(o.created_at),
              total: formatMoney(
                o.total_money?.amount,
                currency || o.total_money?.currency || defaultCurrency,
              ),
              status: mapSquareState(o.state),
            }))
          : [];
      }

      if (localRes.status === "fulfilled") {
        const data = localRes.value.data;

        localOrders = Array.isArray(data)
          ? data.map((o: any) => ({
              id: o.id,
              customer: o.customer
                ? `${o.customer.firstName} ${o.customer.lastName}`.trim()
                : "Walk-in",
              date: formatDate(o.createdAt),
              total: formatMoney(
                (o.totalAmount ?? 0) * 100,
                currency || defaultCurrency,
              ),
              status: mapDbStatus(o.status),
            }))
          : [];
      }

      const combined = [...squareOrders, ...localOrders];
      setOrders(combined);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // get customers for fetch order
  const fetchCustomers = async () => {
    try {
      const res = await axios.get("/api/customer");
      setCustomers(res.data);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setCustomersLoading(false);
    }
  };

  // get customers for new order search customer
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setCustomersLoading(true);
        const res = await axios.get("/api/customer");
        setCustomers(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setCustomersLoading(false);
      }
    };

    if (isNewOrderDialogOpen) {
      fetchCustomers();
    }
  }, [isNewOrderDialogOpen]);

  // get products for new order search product
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const res = await axios.get("/api/products");
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setProductsLoading(false);
      }
    };

    if (isNewOrderDialogOpen) {
      fetchProducts();
    }
  }, [isNewOrderDialogOpen]);

  useEffect(() => {
    fetchOrders(defaultCurrency);
    fetchCustomers();
  }, []);

  // Filter orders based on search query and status
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Filter customer by search for new order
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;

    return customers.filter((c) => {
      const fullName = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
      const email = (c.email ?? "").toLowerCase();
      const phone = (c.phoneNumber ?? "").toLowerCase();

      return fullName.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [customers, customerSearch]);

  // Filter product by search for new order
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;

    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const category = (p.category ?? "").toLowerCase();
      return name.includes(q) || category.includes(q);
    });
  }, [products, productSearch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-700";
      case "Pending":
        return "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-700";
      case "Shipped":
        return "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-700";
      case "Cancelled":
        return "bg-red-50 text-red-700 ring-red-200 dark:bg-red-900/20 dark:text-red-300 dark:ring-red-700";
      default:
        return "bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:ring-gray-700";
    }
  };

  const handleNewOrder = async () => {
    try {
      setCreatingOrder(true);

      if (selectedItems.length === 0) {
        toast("Please add at least one product.");
        return;
      }

      const payload: any = {
        status: newOrderStatus || "PENDING",
        orderItems: selectedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      // only send customerId if NOT walk-in
      if (newOrderCustomerId && newOrderCustomerId !== "walk-in") {
        payload.customerId = newOrderCustomerId;
      }

      const res = await axios.post("/api/orders", payload);
      const created = res.data?.createdOrder;

      if (created) {
        const mappedOrder: Order = {
          id: created.id,
          customer: created.customer
            ? `${created.customer.firstName} ${created.customer.lastName}`.trim()
            : "Walk-in",
          date: formatDate(created.createdAt),
          total: formatMoney((created.totalAmount ?? 0) * 100, defaultCurrency),
          status: mapDbStatus(created.status),
        };

        setOrders((prev) => [mappedOrder, ...prev]);
        toast(res.data?.message || "Order created successfully!");
      }

      setIsNewOrderDialogOpen(false);
      setNewOrderCustomerId("walk-in");
      setNewOrderStatus("PENDING");
      setCustomerSearch("");
      setProductSearch("");
      setSelectedItems([]);
    } catch (error: any) {
      console.error("Failed to create order:", error);
      toast(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to create order.",
      );
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleAddProduct = (product: ProductOption) => {
    setSelectedItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);

      if (existing) {
        const newQty = existing.quantity + 1;

        const availableQty = Math.min(product.quantity, newQty);
        const neededQty = Math.max(newQty - product.quantity, 0);

        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: newQty,
                availableQty,
                neededQty,
              }
            : item,
        );
      }

      // first time adding product
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          retailPrice: product.retailPrice,
          quantity: 1,
          availableQty: Math.min(product.quantity, 1),
          neededQty: Math.max(1 - product.quantity, 0),
        },
      ];
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedItems((prev) =>
      prev.map((item) => {
        if (item.productId !== productId) return item;

        const product = products.find((p) => p.id === productId);
        if (!product) return item;

        const newQty = Math.max(quantity, 0);

        return {
          ...item,
          quantity: newQty,
          availableQty: Math.min(product.quantity, newQty),
          neededQty: Math.max(newQty - product.quantity, 0),
        };
      }),
    );
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) =>
      prev.filter((item) => item.productId !== productId),
    );
  };

  const computedOrderTotal = selectedItems.reduce(
    (sum, item) => sum + item.retailPrice * item.quantity,
    0,
  );

  const handleViewOrder = async (order: Order) => {
    try {
      const res = await axios.get(`/api/orders/${order.id}`);
      const fullOrder = res.data;

      const mappedOrder: Order = {
        id: fullOrder.id,
        customer: fullOrder.customer
          ? `${fullOrder.customer.firstName} ${fullOrder.customer.lastName}`.trim()
          : "Walk-in",
        date: formatDate(fullOrder.createdAt),
        total: formatMoney((fullOrder.totalAmount ?? 0) * 100, defaultCurrency),
        status: mapDbStatus(fullOrder.status),
        customerData: fullOrder.customer
          ? {
              email: fullOrder.customer.email,
              phoneNumber: fullOrder.customer.phoneNumber,
            }
          : undefined,
        orderItems: Array.isArray(fullOrder.orderItems)
          ? fullOrder.orderItems.map((item: any) => ({
              id: item.id,
              name: item.product?.name || "Unknown Product",
              quantity: item.quantity,
              currentStock: item.currentStock ?? 0,
              neededQty: item.neededQty ?? 0,
              unitPrice: formatMoney(
                (item.unitPrice ?? 0) * 100,
                defaultCurrency,
              ),
              subPrice: formatMoney(
                (item.subPrice ?? 0) * 100,
                defaultCurrency,
              ),
            }))
          : [],
      };

      setSelectedOrder(mappedOrder);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch order:", error);
      toast("Failed to fetch order details.");
    }
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: DisplayOrderStatus,
  ) => {
    try {
      setUpdatingOrderId(orderId);

      const res = await axios.patch(`/api/orders/${orderId}`, {
        status: mapDisplayStatusToDb(newStatus),
      });
      const message = res.data.message;
      toast(message);
      await fetchOrders(defaultCurrency);
    } catch (error: any) {
      console.error("Failed to update order status:", error);
      toast(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to update order status.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      setDeletingOrder(true);

      const res = await axios.delete(`/api/orders/${orderToDelete.id}`);
      const message = res.data.message;
      toast(message);
      await fetchOrders(defaultCurrency);

      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete order:", error);
      toast(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Failed to delete order.",
      );
    } finally {
      setDeletingOrder(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
  };

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "All";

  return (
    <motion.div
      initial={{opacity: 0, y: 10}}
      animate={{opacity: 1, y: 0}}
      transition={{duration: 0.3}}
      className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground">
            View, manage, and track customer orders
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={() => setIsNewOrderDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or order ID"
            className="pl-10 bg-background border-border text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as OrderStatus)}>
          <SelectTrigger className="w-[180px] bg-background border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Shipped">Shipped</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => setIsFilterDialogOpen(true)}>
          <Filter className="h-4 w-4" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground">
            Clear filters
          </Button>
        )}
      </div>

      {/* Orders Table */}
      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-foreground">Order ID</TableHead>
                  <TableHead className="text-foreground">Customer</TableHead>
                  <TableHead className="text-foreground">Date</TableHead>
                  <TableHead className="text-foreground">Total</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-right text-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading orders from Square...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground">
                      No orders found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="border-border hover:bg-muted/30">
                      <TableCell className="text-foreground">
                        {order.id}
                      </TableCell>
                      <TableCell className="text-foreground">
                        {order.customer}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.date}
                      </TableCell>
                      <TableCell className="text-foreground font-medium">
                        {order.total}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            handleStatusChange(
                              order.id,
                              value as DisplayOrderStatus,
                            )
                          }
                          disabled={updatingOrderId === order.id}>
                          <SelectTrigger
                            className={`w-[140px] h-8 text-xs ${getStatusColor(order.status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Shipped">Shipped</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrder(order)}>
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(order)}>
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Order Dialog */}
      <Dialog
        open={isNewOrderDialogOpen}
        onOpenChange={setIsNewOrderDialogOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>New Order</DialogTitle>
            <DialogDescription>
              Create a new order for a customer or as a walk-in order.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* LEFT */}
            <div className="space-y-6">
              {/* Customer search pick */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground block">
                  Customer
                </label>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search customer by name, email, or phone"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="border rounded-lg p-2 max-h-56 overflow-y-auto space-y-2">
                  <button
                    type="button"
                    onClick={() => setNewOrderCustomerId("walk-in")}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      newOrderCustomerId === "walk-in"
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted/50"
                    }`}>
                    <p className="font-medium">Walk-in</p>
                    <p className="text-sm text-muted-foreground">
                      No customer attached
                    </p>
                  </button>

                  {customersLoading ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Loading customers...
                    </p>
                  ) : filteredCustomers.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No customers found.
                    </p>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const fullName =
                        `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() ||
                        "(No name)";

                      const selected = newOrderCustomerId === customer.id;

                      return (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => setNewOrderCustomerId(customer.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selected
                              ? "bg-primary/10 border-primary"
                              : "hover:bg-muted/50"
                          }`}>
                          <p className="font-medium truncate">{fullName}</p>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Product search pick */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Products
                </label>

                <div className="rounded-lg border p-4 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search product by name"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {productsLoading ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        Loading products...
                      </p>
                    ) : filteredProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No products found.
                      </p>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleAddProduct(product)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-muted/50">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-medium truncate">
                              {product.name}
                            </p>
                            <p className="text-sm font-medium shrink-0">
                              {formatMoney(
                                product.retailPrice * 100,
                                defaultCurrency,
                              )}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">
              {/* Selected items */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Selected Items
                </label>

                <div className="rounded-lg border p-4 min-h-[320px]">
                  {selectedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No products selected.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No products selected.
                        </p>
                      ) : (
                        selectedItems.map((item) => (
                          <div
                            key={item.productId}
                            className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                            {/* LEFT: name + unit price */}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatMoney(
                                  item.retailPrice * 100,
                                  defaultCurrency,
                                )}
                                each
                              </p>
                              <p className="text-xs text-muted-foreground">
                                In stock: {item.availableQty}
                              </p>

                              {item.neededQty > 0 && (
                                <p className="text-xs text-red-500">
                                  Need to purchase {item.neededQty}
                                </p>
                              )}
                            </div>

                            {/* MIDDLE: quantity */}
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const value = e.target.value;

                                // don't do anything when temporarily empty
                                if (value === "") return;

                                const nextQty = Number(value);
                                if (Number.isNaN(nextQty)) return;

                                handleQuantityChange(item.productId, nextQty);
                              }}
                              className="w-16 h-8 text-sm"
                            />

                            {/* RIGHT: total + remove */}
                            <div className="flex items-center gap-2 shrink-0">
                              <p className="text-sm font-medium">
                                {formatMoney(
                                  item.retailPrice * item.quantity * 100,
                                  defaultCurrency,
                                )}
                              </p>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveItem(item.productId)
                                }>
                                ✕
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Order  */}
              <div className="rounded-lg border p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Status
                  </label>
                  <Select
                    value={newOrderStatus}
                    onValueChange={setNewOrderStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-semibold">
                    {formatMoney(computedOrderTotal * 100, defaultCurrency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewOrderDialogOpen(false);
                setNewOrderCustomerId("walk-in");
                setCustomerSearch("");
                setProductSearch("");
                setSelectedItems([]);
                setNewOrderStatus("PENDING");
              }}
              disabled={creatingOrder}>
              Cancel
            </Button>
            <Button onClick={handleNewOrder} disabled={creatingOrder}>
              {creatingOrder ? "Creating..." : "Create Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View detailed information about this order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Order ID
                  </p>
                  <p className="text-foreground">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Customer
                  </p>
                  <p className="text-foreground">{selectedOrder.customer}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Email
                  </p>
                  <p className="text-foreground">
                    {selectedOrder.customerData?.email || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-foreground">
                    {selectedOrder.customerData?.phoneNumber || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date
                  </p>
                  <p className="text-foreground">{selectedOrder.date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total
                  </p>
                  <p className="text-foreground font-semibold">
                    {selectedOrder.total}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${getStatusColor(
                      selectedOrder.status,
                    )}`}>
                    {selectedOrder.status}
                  </span>
                </div>
              </div>
              {/* Add more order details here as needed */}

              {/* View items */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Items
                </p>

                {selectedOrder.orderItems &&
                selectedOrder.orderItems.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrder.orderItems.map((orderItems) => (
                      <div
                        key={orderItems.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {orderItems.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {orderItems.unitPrice} each
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Current stock: {orderItems.currentStock}
                          </p>

                          {orderItems.neededQty > 0 && (
                            <p className="text-xs text-red-500">
                              Need to purchase {orderItems.neededQty}
                            </p>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground w-16 text-center">
                          x{orderItems.quantity}
                        </div>

                        <div className="text-sm font-medium w-24 text-right">
                          {orderItems.subPrice}
                        </div>
                        <p className="text-xs text-muted-foreground"></p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No items found.
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete order{" "}
              <span className="font-semibold text-foreground">
                {orderToDelete?.id}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrderToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Orders</DialogTitle>
            <DialogDescription>
              Apply filters to narrow down your order list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as OrderStatus)
                }>
                <SelectTrigger className="w-full bg-background border-border">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Shipped">Shipped</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Search
              </label>
              <Input
                placeholder="Search by customer or order ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
            <Button onClick={() => setIsFilterDialogOpen(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
