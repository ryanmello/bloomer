import { NextResponse } from "next/server";
import db from "@/lib/prisma";
import { getCurrentUser } from "@/actions/getCurrentUser";
import { startOfMonth, subMonths } from "date-fns";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const shop = await db.shop.findFirst({
            where: {
                userId: user.id,
            },
        });

        if (!shop) {
            return NextResponse.json(
                { error: "No shop found" },
                { status: 404 },
            );
        }

        // Basic Counts
        const totalCustomers = await db.customer.count({
            where: { shopId: shop.id },
        });

        const totalCampaigns = await db.campaign.count({
            where: { shopId: shop.id },
        });

        const activeAudiences = await db.audience.count({
            where: {
                shopId: shop.id,
                status: "active",
            },
        });

        // Average Growth Rate Per Audience
        const now = new Date();
        const startCurrentMonth = startOfMonth(now);
        const startLastMonth = startOfMonth(subMonths(now, 1));
        const startTwoMonthsAgo = startOfMonth(subMonths(now, 2));

        // Get audiences with customerIds
        const audiences = await db.audience.findMany({
            where: { shopId: shop.id },
            select: {
                id: true,
                customerIds: true,
            },
        });

        // Collect all unique customer IDs from all audiences
        const allCustomerIds = Array.from(
            new Set(audiences.flatMap((a) => a.customerIds || [])),
        );

        // Load customers once
        const customers =
            allCustomerIds.length > 0
                ? await db.customer.findMany({
                    where: { id: { in: allCustomerIds } },
                    select: {
                        id: true,
                        createdAt: true,
                    },
                })
                : [];

        const customerMap = new Map(customers.map((c) => [c.id, c]));

        let growthSum = 0;
        let growthSumLastMonth = 0;
        let growthCount = 0;

        for (const aud of audiences) {
            const definedCustomers = (aud.customerIds || [])
                .map((id) => customerMap.get(id))
                .filter(Boolean) as { id: string; createdAt: Date }[];

            const customerCount = definedCustomers.length;

            const customersBeforeCurrent = definedCustomers.filter(
                (c) => c.createdAt < startLastMonth,
            ).length;

            let growthRate = 0;

            if (customersBeforeCurrent > 0) {
                growthRate =
                    ((customerCount - customersBeforeCurrent) /
                        customersBeforeCurrent) *
                    100;
            }

            growthSum += growthRate;

            // Last Month Growth
            const customersAtStartOfLastMonth = definedCustomers.filter(
                (c) => c.createdAt < startLastMonth,
            ).length;

            const customersBeforeLastMonth = definedCustomers.filter(
                (c) => c.createdAt < startTwoMonthsAgo,
            ).length;

            let growthLastMonth = 0;

            if (customersBeforeLastMonth > 0) {
                growthLastMonth =
                    ((customersAtStartOfLastMonth -
                        customersBeforeLastMonth) /
                        customersBeforeLastMonth) *
                    100;
            }

            growthSumLastMonth += growthLastMonth;

            growthCount++;
        }

        const avgGrowthRate =
            growthCount > 0 ? growthSum / growthCount : 0;

        const avgGrowthRateLastMonth =
            growthCount > 0 ? growthSumLastMonth / growthCount : 0;

        const avgGrowthRateChange =
            avgGrowthRateLastMonth === 0
                ? avgGrowthRate > 0
                    ? 100
                    : 0
                : ((avgGrowthRate - avgGrowthRateLastMonth) /
                    Math.abs(avgGrowthRateLastMonth)) *
                100;

        // Month-over-Month Change %
        const totalCustomersLastMonth = await db.customer.count({
            where: {
                shopId: shop.id,
                createdAt: {
                    lt: startCurrentMonth,
                },
            },
        });

        const totalCustomersChange =
            totalCustomersLastMonth > 0
                ? ((totalCustomers - totalCustomersLastMonth) /
                    totalCustomersLastMonth) *
                100
                : 0;

        const totalCampaignsLastMonth = await db.campaign.count({
            where: {
                shopId: shop.id,
                createdAt: {
                    lt: startCurrentMonth,
                },
            },
        });

        const totalCampaignsChange =
            totalCampaignsLastMonth > 0
                ? ((totalCampaigns - totalCampaignsLastMonth) /
                    totalCampaignsLastMonth) *
                100
                : 0;

        const activeAudiencesLastMonth = await db.audience.count({
            where: {
                shopId: shop.id,
                status: "active",
                createdAt: {
                    lt: startCurrentMonth,
                },
            },
        });

        const activeAudiencesChange =
            activeAudiencesLastMonth > 0
                ? ((activeAudiences - activeAudiencesLastMonth) /
                    activeAudiencesLastMonth) *
                100
                : 0;

        return NextResponse.json({
            totalCustomers,
            totalCustomersChange,

            activeAudiences,
            activeAudiencesChange,

            totalCampaigns,
            totalCampaignsChange,

            avgGrowthRate: Number(avgGrowthRate.toFixed(2)),
            avgGrowthRateChange: Number(
                avgGrowthRateChange.toFixed(2),
            ),
        });
    } catch (error) {
        console.error("Audience stats error:", error);

        return NextResponse.json(
            { error: "Failed to fetch stats" },
            { status: 500 },
        );
    }
}