import {NextResponse, NextRequest} from "next/server";
import {getCurrentUser} from "@/actions/getCurrentUser";
import db from "@/lib/prisma";
import {
  getAllCustomers,
  getNewCustomers,
  getVipCustomers,
  getHighSpenders,
  getBirthdayNextMonth,
  getInactiveCustomers,
} from "@/lib/audiences/predefined";

export async function GET(
  _req: NextRequest,
  // route [audienceId]
  // Next.js, audienceId = "abc123" as params
  // params = { audienceId: "abc123" }
  {params}: {params: Promise<{audienceId: string}>},
) {
  const {audienceId} = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const shop = await db.shop.findFirst({
      where: {userId: user.id},
    });

    if (!shop) {
      return NextResponse.json({message: "No shop found"}, {status: 404});
    }

    const audience = await db.audience.findFirst({
      where: {id: audienceId, userId: user.id, shopId: shop.id},
    });

    if (!audience)
      return NextResponse.json({message: "Audience not found"}, {status: 404});

    // any type empty array
    let customers: any[] = [];

    if (audience.type === "predefined") {
      switch (audience.name) {
        case "All Customers":
          customers = await getAllCustomers(shop.id);
          break;
        case "New Customers":
          customers = await getNewCustomers(shop.id);
          break;
        case "VIP Customers":
          customers = await getVipCustomers(shop.id);
          break;
        case "High Spenders":
          customers = await getHighSpenders(shop.id);
          break;
        case "Birthday Club":
          customers = await getBirthdayNextMonth(shop.id);
          break;
        case "Inactive Customers":
          customers = await getInactiveCustomers(shop.id);
          break;
        default:
          customers = [];
      }
    } else {
      // custom audience: return stored customers by customerIds array
      const customerIds = audience.customerIds ?? [];
      if (customerIds.length > 0) {
        customers = await db.customer.findMany({
          where: {id: {in: customerIds}},
          include: {addresses: true, orders: true},
        });
      }
    }
    return NextResponse.json(customers, {status: 200});
  } catch (err) {
    console.error("Error fetching audience customer:", err);
    return NextResponse.json([]);
  }
}

export async function POST(
  req: NextRequest,
  {params}: {params: Promise<{audienceId: string}>},
) {
  const {audienceId} = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const shop = await db.shop.findFirst({
      where: {userId: user.id},
    });

    if (!shop) {
      return NextResponse.json({message: "No shop found"}, {status: 404});
    }

    const audience = await db.audience.findFirst({
      where: {id: audienceId, userId: user.id, shopId: shop.id},
    });

    if (!audience) {
      return NextResponse.json({message: "Audience not found"}, {status: 404});
    }

    if (audience.type !== "custom") {
      return NextResponse.json(
        {message: "Can only add customers to custom audiences"},
        {status: 400},
      );
    }

    const body = await req.json();
    const {customerIds} = body as {customerIds: string[]};

    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json(
        {message: "customerIds array is required"},
        {status: 400},
      );
    }

    // Verify all customers belong to the shop
    const validCustomers = await db.customer.findMany({
      where: {id: {in: customerIds}, shopId: shop.id},
      select: {id: true},
    });
    const validIds = new Set(validCustomers.map((c) => c.id));

    const toAdd = customerIds.filter((id) => validIds.has(id));

    if (toAdd.length === 0) {
      return NextResponse.json(
        {message: "No valid customers to add"},
        {status: 400},
      );
    }

    const existingIds = audience.customerIds ?? [];
    const updatedIds = [...new Set([...existingIds, ...toAdd])];

    await db.audience.update({
      where: {id: audienceId},
      data: {customerIds: updatedIds},
    });

    return NextResponse.json({
      message: "Customers added successfully",
      added: toAdd.length,
    });
  } catch (err) {
    console.error("Error adding customers to audience:", err);
    return NextResponse.json(
      {error: "Failed to add customers"},
      {status: 500},
    );
  }
}

export async function DELETE(
  req: NextRequest,
  {params}: {params: Promise<{audienceId: string}>},
) {
  const {audienceId} = await params;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({message: "Not authenticated"}, {status: 401});
    }

    const audience = await db.audience.findFirst({
      where: {id: audienceId, userId: user.id},
    });

    if (!audience) {
      return NextResponse.json({message: "Audience not found"}, {status: 404});
    }

    const {searchParams} = new URL(req.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        {message: "customerId query param is required"},
        {status: 400},
      );
    }

    const updatedIds = (audience.customerIds ?? []).filter((id) => id !== customerId);
    await db.audience.update({
      where: {id: audienceId},
      data: {customerIds: updatedIds},
    });

    return NextResponse.json({
      message: "Customer removed from audience",
    });
  } catch (err) {
    console.error("Error removing customer from audience:", err);
    return NextResponse.json(
      {error: "Failed to remove customer"},
      {status: 500},
    );
  }
}
