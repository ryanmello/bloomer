import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { sendCampaignEmails } from "@/lib/resend-email";

// This endpoint should be called by a cron job every minute
// You can set this up in Vercel using vercel.json or use an external service like cron-job.org
// Can also be called manually via GET or POST for testing
export async function GET(req: NextRequest) {
  return processScheduledCampaigns(req);
}

export async function POST(req: NextRequest) {
  // Allow manual triggering for testing
  return processScheduledCampaigns(req);
}

async function processScheduledCampaigns(req: NextRequest) {
  try {
    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'RESEND_API_KEY is missing from environment variables' },
        { status: 500 }
      );
    }

    // Optional: Add authentication to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    console.log('⏰ Checking for scheduled campaigns...');
    console.log(`   Current time: ${now.toISOString()}`);
    console.log(`   Current timestamp: ${now.getTime()}`);

    // Find campaigns scheduled for now or earlier that haven't been sent
    // Using lte (less than or equal) to catch campaigns that are due
    const scheduledCampaigns = await db.campaign.findMany({
      where: {
        status: 'Scheduled',
        scheduledFor: {
          lte: now
        }
      },
      include: {
        shop: true,
        recipients: {
          include: {
            customer: true
          }
        }
      }
    });

    console.log(`📋 Found ${scheduledCampaigns.length} campaign(s) ready to send`);

    // Log details of scheduled campaigns for debugging
    if (scheduledCampaigns.length > 0) {
      scheduledCampaigns.forEach(campaign => {
        console.log(`   - ${campaign.campaignName} (ID: ${campaign.id})`);
        console.log(`     Scheduled for: ${campaign.scheduledFor?.toISOString()}`);
        console.log(`     Recipients: ${campaign.recipients.length}`);
      });
    } else {
      // Also check if there are any scheduled campaigns that aren't ready yet
      const futureCampaigns = await db.campaign.findMany({
        where: {
          status: 'Scheduled',
          scheduledFor: {
            gt: now
          }
        },
        select: {
          id: true,
          campaignName: true,
          scheduledFor: true
        }
      });
      
      if (futureCampaigns.length > 0) {
        console.log(`📅 Found ${futureCampaigns.length} campaign(s) scheduled for the future:`);
        futureCampaigns.forEach(campaign => {
          console.log(`   - ${campaign.campaignName} scheduled for: ${campaign.scheduledFor?.toISOString()}`);
        });
      }
    }

    for (const campaign of scheduledCampaigns) {
      try {
        console.log(`\n🚀 Processing campaign: ${campaign.campaignName} (${campaign.id})`);
        console.log(`   Scheduled for: ${campaign.scheduledFor?.toISOString()}`);
        console.log(`   Shop: ${campaign.shop.name}`);

        // Get customers from recipients
        const customers = campaign.recipients.map(r => ({
          id: r.customer.id,
          email: r.customer.email,
          firstName: r.customer.firstName,
          lastName: r.customer.lastName
        }));

        console.log(`   Customers to send to: ${customers.length}`);

        if (customers.length === 0) {
          console.warn(`⚠️ No customers found for campaign ${campaign.id}. Marking as failed.`);
          await db.campaign.update({
            where: { id: campaign.id },
            data: { status: 'Failed' }
          });
          continue;
        }

        // Use the shared email sending function
        console.log(`📧 Starting to send emails...`);
        await sendCampaignEmails(
          campaign.id,
          customers,
          campaign.subject,
          campaign.emailBody,
          campaign.shop.name || 'Your Store',
          campaign.shop.email || ''
        );

        console.log(`✅ Campaign ${campaign.id} completed successfully`);
      } catch (error) {
        console.error(`❌ Error processing campaign ${campaign.id}:`, error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        
        // Mark campaign as failed
        await db.campaign.update({
          where: { id: campaign.id },
          data: { status: 'Failed' }
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: scheduledCampaigns.length,
      message: `Processed ${scheduledCampaigns.length} scheduled campaign(s)`
    });
  } catch (error) {
    console.error('Error in scheduled campaigns cron:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled campaigns' },
      { status: 500 }
    );
  }
}

