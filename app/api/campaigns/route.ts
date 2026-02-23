import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";
import { sendCampaignEmails } from "@/lib/resend-email";

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

    // Use same shop resolution as broadcasts page (most recent shop)
    const shop = await db.shop.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!shop) {
      return NextResponse.json(
        { message: "No shop found" },
        { status: 404 }
      );
    }

    const campaigns = await db.campaign.findMany({
      where: {
        shopId: shop.id
      },
      include: {
        recipients: {
          select: {
            id: true,
            status: true,
            customerId: true
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
    const { campaignName, subject, emailBody, audienceType, status, scheduledFor, sentAt, customerId } = body;

    console.log('[campaigns] POST body:', { campaignName, audienceType, customerId: customerId ?? '(none)' });

    if (!campaignName || !subject || !emailBody || !audienceType) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (audienceType === 'single' && !customerId) {
      return NextResponse.json(
        { message: "Please select a customer for the test email" },
        { status: 400 }
      );
    }

    // Get the user's shop (same resolution as GET and broadcasts page)
    const shop = await db.shop.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    if (!shop) {
      return NextResponse.json(
        { message: "No shop found" },
        { status: 404 }
      );
    }

    const shopId = shop.id;

    let targetCustomers: { id: string; email: string; firstName: string; lastName: string }[];

    // Single customer mode - for testing before scaling up
    if (audienceType === 'single' && customerId) {
      const customer = await db.customer.findFirst({
        where: { id: customerId, shopId },
        select: { id: true, email: true, firstName: true, lastName: true }
      });
      if (!customer) {
        console.log('[campaigns] Customer not found:', { customerId, shopId });
        return NextResponse.json(
          { message: "Customer not found or does not belong to your shop" },
          { status: 400 }
        );
      }
      targetCustomers = [customer];
    } else {
      // Get target customers based on audience type
      const whereClause: any = {
        shopId: shopId
      };

      // Handle audience type filtering (case-insensitive matching)
      if (audienceType === 'vip') {
        whereClause.group = { in: ['VIP', 'vip', 'Vip'] };
      } else if (audienceType === 'new') {
        whereClause.group = { in: ['New', 'new', 'NEW'] };
      } else if (audienceType === 'potential') {
        whereClause.group = { in: ['Potential', 'potential', 'POTENTIAL'] };
      }
      // If audienceType is 'all' or anything else, don't filter by group

      console.log(`Querying customers with whereClause:`, JSON.stringify(whereClause, null, 2));
      
      targetCustomers = await db.customer.findMany({
        where: whereClause,
        select: { 
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });
    }

    console.log(`Found ${targetCustomers.length} customers for audience type: ${audienceType}`);
    
    // If no customers found, return error
    if (targetCustomers.length === 0) {
      console.log('[campaigns] No customers for audience:', audienceType);
      return NextResponse.json(
        { 
          message: `No customers found for audience type: ${audienceType}`,
          error: "Cannot create campaign with no target customers"
        },
        { status: 400 }
      );
    }

    // Determine campaign status
    let campaignStatus = status || 'Draft';
    let scheduledDate: Date | null = null;
    
    if (scheduledFor) {
      campaignStatus = 'Scheduled';
      scheduledDate = new Date(scheduledFor);
      console.log(`📅 Creating scheduled campaign:`);
      console.log(`   Scheduled for: ${scheduledDate.toISOString()}`);
      console.log(`   Current time: ${new Date().toISOString()}`);
      console.log(`   Will be sent in: ${Math.round((scheduledDate.getTime() - new Date().getTime()) / 1000 / 60)} minutes`);
    }

    // Create the campaign
    const campaign = await db.campaign.create({
      data: {
        campaignName,
        subject,
        emailBody,
        audienceType,
        status: campaignStatus,
        scheduledFor: scheduledDate,
        sentAt: sentAt ? new Date(sentAt) : null,
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

    if (campaignStatus === 'Scheduled') {
      console.log(`✅ Campaign "${campaignName}" scheduled successfully`);
      console.log(`   It will be sent automatically when the scheduled time arrives.`);
      console.log(`   To test immediately, call: GET /api/campaigns/send-schedule`);
    }

    // If status is 'Sent', send emails immediately
    if (campaignStatus === 'Sent') {
      // Validate API key before starting background process
      if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing - cannot send emails');
        // Update campaign to Failed status
        await db.campaign.update({
          where: { id: campaign.id },
          data: { status: 'Failed' }
        });
      } else {
        // Send emails in the background (don't await to return response quickly)
        sendCampaignEmails(
          campaign.id, 
          targetCustomers, 
          subject, 
          emailBody, 
          shop.name || 'Your Store',
          shop.email
        ).catch(error => {
          console.error('Error sending campaign emails:', error);
          console.error('Error stack:', error?.stack);
        });
      }
    }

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
