import { redirect } from 'next/navigation';
import db from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/actions/getCurrentUser';
import BroadcastsClient from '@/components/broadcasts/BroadcastsClient';

// Fetch campaigns for a shop
async function getCampaigns(shopId: string) {
  try {
    const campaigns = await db.campaign.findMany({
      where: { shopId },
      include: {
        recipients: {
          select: {
            id: true,
            status: true,
            customerId: true
          }
        },
        audience: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return campaigns;
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }
}

export default async function BroadcastsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Get user's primary shop
  const shop = await db.shop.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  if (!shop) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">No Shop Found</h2>
            <p className="text-muted-foreground mb-4">
              Please create a shop first to manage email campaigns.
            </p>
            <a
              href="/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Create Shop
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Fetch campaigns and audiences in parallel
  const [rawCampaigns, rawAudiences] = await Promise.all([
    getCampaigns(shop.id),
    db.audience.findMany({
      where: { shopId: shop.id }
    })
  ]);

  const audiences = rawAudiences.map(a => ({
    id: a.id,
    name: a.name,
    count: a.customerIds?.length ?? 0,
  }));

  // Transform campaigns to match the component interface
  const campaigns = rawCampaigns.map(campaign => ({
    id: campaign.id,
    campaignName: campaign.campaignName,
    status: campaign.status as "Draft" | "Scheduled" | "Sent" | "Failed",
    sentAt: campaign.sentAt ? new Date(campaign.sentAt).toISOString() : null,
    createdAt: new Date(campaign.createdAt).toISOString(),

    audience: campaign.audience
      ? {
        id: campaign.audience.id,
        name: campaign.audience.name
      }
      : null,

    recipients: campaign.recipients.map(r => ({
      id: r.id,
      status: r.status,
      customerId: r.customerId
    }))
  }));

  return (
    <BroadcastsClient
      campaigns={campaigns}
      audiences={audiences}
    />
  );
}