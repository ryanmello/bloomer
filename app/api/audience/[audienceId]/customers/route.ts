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
    }
    return NextResponse.json(customers, {status: 200});
  } catch (err) {
    console.error("Error fetching audience customer:", err);
    return NextResponse.json([]);
  }
}
