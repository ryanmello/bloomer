import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/getCurrentUser";
import db from "@/lib/prisma";
import { Resend } from "resend";

// Helper to get Resend client with validation
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set in environment variables');
  }
  return new Resend(apiKey);
}

// GET - Fetch a single campaign
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        recipients: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

// PATCH - Update campaign (e.g., mark as sent)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { status, sentAt } = body;

    // Get the campaign with all necessary data
    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        shop: true,
        recipients: {
          include: {
            customer: true
          }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update campaign status
    const updatedCampaign = await db.campaign.update({
      where: { id },
      data: {
        status,
        sentAt: sentAt ? new Date(sentAt) : null
      }
    });

    // If status is being set to 'Sent', trigger email sending
    if (status === 'Sent' && campaign.status !== 'Sent') {
      // Validate API key
      if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is missing - cannot send emails');
        await db.campaign.update({
          where: { id },
          data: { status: 'Failed' }
        });
        return NextResponse.json(
          {
            message: "Campaign updated but emails failed to send - RESEND_API_KEY is missing",
            campaign: { ...updatedCampaign, status: 'Failed' }
          },
          { status: 200 }
        );
      }

      // Get customers from recipients
      const customers = campaign.recipients.map(r => ({
        id: r.customer.id,
        email: r.customer.email,
        firstName: r.customer.firstName,
        lastName: r.customer.lastName
      }));

      // Import and call sendCampaignEmails function
      const { sendCampaignEmails } = await import('@/lib/resend-email');

      // Send emails in the background
      sendCampaignEmails(
        campaign.id,
        customers,
        campaign.subject,
        campaign.emailBody,
        campaign.shop.name || 'Your Store',
        campaign.shop.email || ''
      ).catch(error => {
        console.error('Error sending campaign emails from PATCH:', error);
        console.error('Error stack:', error?.stack);
      });
    }

    return NextResponse.json(
      { message: "Campaign updated successfully", campaign: updatedCampaign },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE - Delete campaign
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const campaign = await db.campaign.findUnique({
      where: { id }
    });

    if (!campaign) {
      return NextResponse.json(
        { message: "Campaign not found" },
        { status: 404 }
      );
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    await db.campaign.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Campaign deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}