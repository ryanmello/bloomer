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
        }
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

// Get audience segments with counts
async function getAudiences(shopId: string) {
  try {
    const [
      allCustomers,
      vipCustomers,
      newCustomers,
      potentialCustomers,
      newsletterSubscribers
    ] = await Promise.all([
      db.customer.count({ 
        where: { shopId } 
      }),
      db.customer.count({ 
        where: { 
          shopId, 
          group: 'VIP' 
        } 
      }),
      db.customer.count({ 
        where: { 
          shopId, 
          group: 'New' 
        } 
      }),
      db.customer.count({ 
        where: { 
          shopId, 
          group: 'Potential' 
        } 
      }),
      // Newsletter subscribers count - feature not yet implemented
      Promise.resolve(0)
    ]);

    return [
      { id: 'single', name: 'Single customer (test)', count: 1 },
      { id: 'all', name: 'All Customers', count: allCustomers },
      { id: 'vip', name: 'VIP Customers', count: vipCustomers },
      { id: 'new', name: 'New Customers', count: newCustomers },
      { id: 'potential', name: 'Potential Customers', count: potentialCustomers },
      { id: 'newsletter', name: 'Newsletter Subscribers', count: newsletterSubscribers }
    ];
  } catch (error) {
    console.error('Error fetching audiences:', error);
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
  const [rawCampaigns, audiences] = await Promise.all([
    getCampaigns(shop.id),
    getAudiences(shop.id)
  ]);

  // Transform campaigns to match the component interface
  const campaigns = rawCampaigns.map(campaign => ({
    id: campaign.id,
    campaignName: campaign.campaignName,
    audienceType: campaign.audienceType,
    status: campaign.status as "Draft" | "Scheduled" | "Sent" | "Failed",
    sentAt: campaign.sentAt ? new Date(campaign.sentAt).toISOString() : null,
    createdAt: new Date(campaign.createdAt).toISOString(),
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