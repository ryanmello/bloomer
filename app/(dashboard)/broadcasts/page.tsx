import { redirect } from 'next/navigation';
import db from '@/lib/prisma';

export const dynamic = 'force-dynamic';
import { getCurrentUser } from '@/actions/getCurrentUser';
import BroadcastsClient from '@/components/broadcasts/BroadcastsClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import Link from 'next/link';

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
      <main className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 rounded-xl p-3 bg-muted w-fit">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-xl">No Shop Found</CardTitle>
              <CardDescription>
                Please create a shop first to manage email campaigns.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild>
                <Link href="/settings">Create Shop</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
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