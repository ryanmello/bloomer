import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";

// GET - Fetch all campaigns for the user's shop
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get the user's shops
    const shops = await db.shop.findMany({
      where: { userId: user.id }
    });

    if (!shops || shops.length === 0) {
      return NextResponse.json(
        { message: "No shop found" },
        { status: 404 }
      );
    }

    // Get campaigns for the first shop
    const campaigns = await db.campaign.findMany({
      where: {
        shopId: shops[0].id
      },
      include: {
        recipients: {
          select: {
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST - Create a new campaign
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { campaignName, subject, emailBody, audienceType, scheduledFor } = body;

    if (!campaignName || !subject || !emailBody || !audienceType) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the user's shop
    const shops = await db.shop.findMany({
      where: { userId: user.id }
    });

    if (!shops || shops.length === 0) {
      return NextResponse.json(
        { message: "No shop found" },
        { status: 404 }
      );
    }

    const shopId = shops[0].id;

    // Get target customers based on audience type
    const whereClause: any = {
      shopId: shopId
    };

    if (audienceType === 'vip') {
      whereClause.group = 'VIP';
    } else if (audienceType === 'new') {
      whereClause.group = 'New';
    } else if (audienceType === 'potential') {
      whereClause.group = 'Potential';
    }
    // Newsletter feature not yet implemented, so it will return no customers
    // 'all' means no additional filter

    const targetCustomers = await db.customer.findMany({
      where: whereClause,
      select: { id: true }
    });

    // Create the campaign
    const campaign = await db.campaign.create({
      data: {
        campaignName,
        subject,
        emailBody,
        audienceType,
        status: scheduledFor ? 'Scheduled' : 'Draft',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        userId: user.id,
        shopId: shopId,
        recipients: {
          create: targetCustomers.map(customer => ({
            customerId: customer.id,
            status: 'Pending'
          }))
        }
      },
      include: {
        recipients: true
      }
    });

    return NextResponse.json(
      { message: "Campaign created successfully", campaign },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}